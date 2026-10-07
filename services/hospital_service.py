from __future__ import annotations

"""
MediGuide AI - Hospital Service
-----------------------------------------
Provides geographic location searching and nearby hospital discovery
using OpenStreetMap's Nominatim and Overpass APIs.

Note on OpenStreetMap & Overpass APIs:
The default implementation queries public, free Overpass API instances
(overpass-api.de and overpass.kumi.systems) which require no API keys.
However, these public community servers are subject to strict rate limits
and occasional load timeouts. For production environments or high-traffic
deployments, self-hosting a dedicated Overpass instance or migrating to
a paid geospatial provider (such as Mapbox, Google Places, or Geoapify)
should be strongly considered.
"""

import logging
import math
import time
import requests

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
PRIMARY_OVERPASS_URL = "https://overpass-api.de/api/interpreter"
MIRROR_OVERPASS_URL = "https://overpass.kumi.systems/api/interpreter"
OVERPASS_ENDPOINTS = [PRIMARY_OVERPASS_URL, MIRROR_OVERPASS_URL]

USER_AGENT = "MediGuideAI/1.0 (contact@mediguide.ai)"

# In-memory cache for nearby hospital queries:
# Key: (rounded_lat, rounded_lon, radius_m) -> Value: (timestamp, list_of_hospital_dicts)
_HOSPITAL_CACHE: dict[tuple[float, float, int], tuple[float, list[dict]]] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes


def clear_hospital_cache() -> None:
    """Clear all cached nearby hospital results."""
    _HOSPITAL_CACHE.clear()


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth
    in kilometers using the Haversine formula.
    """
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def geocode_location(query: str) -> dict | None:
    """
    Calls OpenStreetMap's Nominatim API to geocode a location query string.

    Parameters:
        query (str): Location search string (e.g. city or address).

    Returns:
        dict | None: {"lat": float, "lon": float, "display_name": str} or None if no match.
    """
    if not query or not query.strip():
        return None

    headers = {
        "User-Agent": USER_AGENT,
    }
    params = {
        "q": query.strip(),
        "format": "json",
        "limit": 1,
    }

    try:
        response = requests.get(
            NOMINATIM_URL,
            params=params,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list) and len(data) > 0:
            match = data[0]
            return {
                "lat": float(match["lat"]),
                "lon": float(match["lon"]),
                "display_name": match.get("display_name", ""),
            }
        return None
    except Exception as e:
        logger.error("Error geocoding location '%s': %s", query, e)
        return None


def get_nearby_hospitals(
    lat: float, lon: float, radius_m: int = 5000
) -> list[dict]:
    """
    Queries the Overpass API for hospitals within `radius_m` meters of (lat, lon).

    Note:
        This function utilizes public, free Overpass API instances without an
        API key. It includes an automatic single retry against a mirror instance
        (overpass.kumi.systems) if the primary instance (overpass-api.de) times out
        or returns a non-200 status code. Results are cached in memory for 10
        minutes by rounded coordinates and radius. For production use under higher
        traffic, self-hosting a dedicated Overpass instance or switching to a
        paid geospatial provider should be considered.

    Parameters:
        lat (float): Latitude of search center.
        lon (float): Longitude of search center.
        radius_m (int): Search radius in meters (default 5000).

    Returns:
        list[dict]: List of hospital dictionaries sorted by distance ascending:
            [
                {
                    "name": str,
                    "lat": float,
                    "lon": float,
                    "address": str | None,
                    "phone": str | None,
                    "distance_km": float,
                },
                ...
            ]
    """
    # 1. Check in-memory cache (keyed by rounded lat/lon + radius_m, TTL ~10 minutes)
    cache_key = (round(lat, 3), round(lon, 3), radius_m)
    now = time.time()

    if cache_key in _HOSPITAL_CACHE:
        cached_time, cached_hospitals = _HOSPITAL_CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            logger.debug("Serving nearby hospitals from in-memory cache for %s", cache_key)
            return [dict(h) for h in cached_hospitals]
        else:
            del _HOSPITAL_CACHE[cache_key]

    headers = {
        "User-Agent": USER_AGENT,
    }

    overpass_query = f"""
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:{radius_m},{lat},{lon});
      way["amenity"="hospital"](around:{radius_m},{lat},{lon});
      relation["amenity"="hospital"](around:{radius_m},{lat},{lon});
    );
    out center;
    """

    response_data = None

    # 2. Try primary instance, retry against mirror if timeout or non-200 status
    for i, endpoint in enumerate(OVERPASS_ENDPOINTS):
        try:
            logger.info("Querying Overpass endpoint: %s", endpoint)
            response = requests.post(
                endpoint,
                data={"data": overpass_query},
                headers=headers,
                timeout=10,
            )

            if response.status_code == 200:
                response_data = response.json()
                break
            else:
                logger.warning(
                    "Overpass endpoint %s returned non-200 status (%d). %s",
                    endpoint,
                    response.status_code,
                    "Retrying against mirror..." if i < len(OVERPASS_ENDPOINTS) - 1 else "All Overpass endpoints exhausted.",
                )
        except requests.exceptions.Timeout as e:
            logger.warning(
                "Overpass endpoint %s timed out. %s",
                endpoint,
                "Retrying against mirror..." if i < len(OVERPASS_ENDPOINTS) - 1 else "All Overpass endpoints exhausted.",
            )
        except requests.exceptions.RequestException as e:
            logger.warning(
                "Overpass endpoint %s request failed: %s. %s",
                endpoint,
                e,
                "Retrying against mirror..." if i < len(OVERPASS_ENDPOINTS) - 1 else "All Overpass endpoints exhausted.",
            )
        except Exception as e:
            logger.warning(
                "Unexpected error querying Overpass endpoint %s: %s. %s",
                endpoint,
                e,
                "Retrying against mirror..." if i < len(OVERPASS_ENDPOINTS) - 1 else "All Overpass endpoints exhausted.",
            )

    if not response_data or not isinstance(response_data, dict):
        logger.error(
            "Failed to fetch nearby hospitals from all Overpass endpoints for (%s, %s).",
            lat,
            lon,
        )
        return []

    elements = response_data.get("elements", [])
    hospitals = []

    for element in elements:
        tags = element.get("tags") or {}

        elem_lat = element.get("lat")
        elem_lon = element.get("lon")
        if elem_lat is None or elem_lon is None:
            center = element.get("center")
            if isinstance(center, dict):
                elem_lat = center.get("lat")
                elem_lon = center.get("lon")

        if elem_lat is None or elem_lon is None:
            continue

        try:
            hosp_lat = float(elem_lat)
            hosp_lon = float(elem_lon)
        except (ValueError, TypeError):
            continue

        name = tags.get("name", "Unnamed Hospital")

        # Address: build from tags addr:housenumber/addr:street/addr:city if present, else None
        hn = tags.get("addr:housenumber")
        st = tags.get("addr:street")
        ct = tags.get("addr:city")
        parts = []
        if hn and st:
            parts.append(f"{hn} {st}")
        elif hn:
            parts.append(hn)
        elif st:
            parts.append(st)
        if ct:
            parts.append(ct)
        address = ", ".join(parts) if parts else None

        # Phone: tags.get('phone') or tags.get('contact:phone')
        phone = tags.get("phone") or tags.get("contact:phone")

        # Distance in km rounded to 1 decimal
        distance_km = round(haversine(lat, lon, hosp_lat, hosp_lon), 1)

        hospitals.append(
            {
                "name": name,
                "lat": hosp_lat,
                "lon": hosp_lon,
                "address": address,
                "phone": phone,
                "distance_km": distance_km,
            }
        )

    # Sort results by distance_km ascending
    hospitals.sort(key=lambda item: item["distance_km"])

    # Store in memory cache
    _HOSPITAL_CACHE[cache_key] = (now, [dict(h) for h in hospitals])

    return hospitals

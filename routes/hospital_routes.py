"""
MediGuide AI - Hospital Routes
------------------------------
Flask Blueprint for finding nearby medical centers and hospitals.
Endpoints:
  - GET /nearby-hospitals: Renders the nearby hospitals discovery page.
  - POST /api/nearby-hospitals: Accepts user coordinates or text address,
    geocodes if needed, queries Overpass API, and returns nearby hospital list.
"""

import logging
from flask import Blueprint, render_template, request, jsonify
from services import hospital_service

logger = logging.getLogger(__name__)

hospital_bp = Blueprint("hospital_bp", __name__)


@hospital_bp.route("/nearby-hospitals", methods=["GET"])
def nearby_hospitals():
    """
    Renders the nearby hospitals discovery page.
    Hospital data is loaded asynchronously via client-side JavaScript.
    """
    return render_template("nearby_hospitals.html", page_title="Nearby Hospitals")


@hospital_bp.route("/api/nearby-hospitals", methods=["POST"])
def api_nearby_hospitals():
    """
    API endpoint to discover hospitals near a location.

    Accepts JSON body:
      - Option A: {"lat": float, "lon": float, ["radius_m": int]}
      - Option B: {"address": str, ["radius_m": int]}

    Returns:
      - 200: {"origin": {"lat": float, "lon": float, "display_name": str}, "hospitals": [...]}
      - 400: {"error": "<message>"} on invalid or missing input
      - 404: {"error": "Location not found"} if address geocoding yields no match
    """
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON with Content-Type: application/json."}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload provided."}), 400

    has_coords = "lat" in data and "lon" in data
    has_address = "address" in data

    if not has_coords and not has_address:
        return jsonify({
            "error": "Please provide either 'lat' and 'lon' coordinates or an 'address' string."
        }), 400

    lat = None
    lon = None
    display_name = None

    if has_coords:
        try:
            lat = float(data["lat"])
            lon = float(data["lon"])
        except (ValueError, TypeError):
            return jsonify({"error": "Latitude and longitude must be valid numerical values."}), 400

        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            return jsonify({
                "error": "Coordinates out of range: latitude must be between -90 and 90, longitude between -180 and 180."
            }), 400

        display_name = data.get("display_name") or f"Coordinates ({lat:.4f}, {lon:.4f})"

    elif has_address:
        address = data.get("address")
        if not isinstance(address, str) or not address.strip():
            return jsonify({"error": "Address must be a non-empty string."}), 400

        geocoded = hospital_service.geocode_location(address.strip())
        if not geocoded:
            return jsonify({"error": "Location not found"}), 404

        lat = geocoded["lat"]
        lon = geocoded["lon"]
        display_name = geocoded.get("display_name", address.strip())

    # Optional search radius (default 5000 meters)
    radius_m = data.get("radius_m") or data.get("radius")
    try:
        radius_m = int(radius_m) if radius_m is not None else 5000
        if radius_m <= 0:
            radius_m = 5000
    except (ValueError, TypeError):
        radius_m = 5000

    hospitals = hospital_service.get_nearby_hospitals(lat, lon, radius_m=radius_m)

    return jsonify({
        "origin": {
            "lat": lat,
            "lon": lon,
            "display_name": display_name,
        },
        "hospitals": hospitals,
    }), 200

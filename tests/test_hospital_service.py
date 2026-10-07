"""
Tests for MediGuide AI Hospital Service (services/hospital_service.py)
----------------------------------------------------------------------
Verifies geocoding, Overpass API querying, coordinate calculation,
response parsing, distance sorting, mirror retry, and exception handling.
All external network calls to Nominatim and Overpass are mocked.
"""

import pytest
import requests
from unittest.mock import MagicMock
from services.hospital_service import (
    geocode_location,
    get_nearby_hospitals,
    clear_hospital_cache,
    PRIMARY_OVERPASS_URL,
    MIRROR_OVERPASS_URL,
)


@pytest.fixture(autouse=True)
def reset_cache():
    """Ensure in-memory cache is clean before each test run."""
    clear_hospital_cache()
    yield
    clear_hospital_cache()


# ==============================================================================
# 1. GEOCODE LOCATION TESTS
# ==============================================================================

def test_geocode_location_success(mocker):
    """Verify geocode_location returns a dict with lat, lon, display_name on success."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {
            "lat": "17.385044",
            "lon": "78.486671",
            "display_name": "Hyderabad, Telangana, India",
        }
    ]
    mock_get = mocker.patch("requests.get", return_value=mock_response)

    result = geocode_location("Hyderabad")

    assert result is not None
    assert result == {
        "lat": 17.385044,
        "lon": 78.486671,
        "display_name": "Hyderabad, Telangana, India",
    }
    assert isinstance(result["lat"], float)
    assert isinstance(result["lon"], float)
    mock_get.assert_called_once()


def test_geocode_location_empty_results(mocker):
    """Verify geocode_location returns None when the API finds no match."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = []
    mocker.patch("requests.get", return_value=mock_response)

    result = geocode_location("NonExistentLocation123456789")

    assert result is None


def test_geocode_location_empty_or_whitespace_query():
    """Verify geocode_location returns None immediately on empty or blank query strings."""
    assert geocode_location("") is None
    assert geocode_location("   ") is None
    assert geocode_location(None) is None


def test_geocode_location_request_exception(mocker):
    """Verify geocode_location catches request exceptions and returns None."""
    mocker.patch("requests.get", side_effect=requests.exceptions.RequestException("DNS resolution failed"))

    result = geocode_location("Hyderabad")

    assert result is None


# ==============================================================================
# 2. GET NEARBY HOSPITALS TESTS
# ==============================================================================

def test_get_nearby_hospitals_parses_and_sorts_correctly(mocker):
    """
    Verify get_nearby_hospitals parses node/way/relation elements,
    extracts tags (name, address, phone), computes distance,
    and returns results sorted ascending by distance.
    """
    sample_elements = [
        # Hospital 1: Node farther away (~2.5km)
        {
            "type": "node",
            "id": 1,
            "lat": 17.4450,
            "lon": 78.4450,
            "tags": {
                "name": "Care Super Specialty Hospital",
                "addr:housenumber": "42",
                "addr:street": "Banjara Hills Rd",
                "addr:city": "Hyderabad",
                "phone": "+91 40 6165 6565",
                "amenity": "hospital",
            },
        },
        # Hospital 2: Way with center closer (~0.2km)
        {
            "type": "way",
            "id": 2,
            "center": {
                "lat": 17.4250,
                "lon": 78.4360,
            },
            "tags": {
                "name": "Apollo Emergency Clinic",
                "addr:street": "Jubilee Hills Rd 72",
                "contact:phone": "+91 40 2360 7777",
                "amenity": "hospital",
            },
        },
        # Hospital 3: Relation with missing name, no phone, no address (~4.0km)
        {
            "type": "relation",
            "id": 3,
            "center": {
                "lat": 17.4600,
                "lon": 78.4500,
            },
            "tags": {
                "amenity": "hospital",
            },
        },
    ]

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"elements": sample_elements}
    mocker.patch("requests.post", return_value=mock_resp)

    # Search origin: 17.4241, 78.4352
    results = get_nearby_hospitals(17.4241, 78.4352, radius_m=5000)

    assert isinstance(results, list)
    assert len(results) == 3

    # Verify sorting by distance ascending
    assert results[0]["distance_km"] <= results[1]["distance_km"] <= results[2]["distance_km"]

    # Hospital 2 should be closest
    closest = results[0]
    assert closest["name"] == "Apollo Emergency Clinic"
    assert closest["address"] == "Jubilee Hills Rd 72"
    assert closest["phone"] == "+91 40 2360 7777"
    assert closest["lat"] == 17.4250
    assert closest["lon"] == 78.4360

    # Hospital 1 in middle
    middle = results[1]
    assert middle["name"] == "Care Super Specialty Hospital"
    assert middle["address"] == "42 Banjara Hills Rd, Hyderabad"
    assert middle["phone"] == "+91 40 6165 6565"

    # Hospital 3 fallback fields
    farthest = results[2]
    assert farthest["name"] == "Unnamed Hospital"
    assert farthest["address"] is None
    assert farthest["phone"] is None


def test_get_nearby_hospitals_timeout_returns_empty_list(mocker):
    """Verify get_nearby_hospitals handles timeouts across all endpoints and returns []."""
    mocker.patch(
        "requests.post",
        side_effect=requests.exceptions.Timeout("Overpass gateway timeout"),
    )

    results = get_nearby_hospitals(17.4241, 78.4352)

    assert results == []


def test_get_nearby_hospitals_request_exception_returns_empty_list(mocker):
    """Verify get_nearby_hospitals handles general network errors and returns []."""
    mocker.patch(
        "requests.post",
        side_effect=requests.exceptions.ConnectionError("Connection refused"),
    )

    results = get_nearby_hospitals(17.4241, 78.4352)

    assert results == []


def test_get_nearby_hospitals_mirror_retry_on_primary_failure(mocker):
    """
    Verify get_nearby_hospitals retries against mirror instance
    if the primary instance fails or returns non-200.
    """
    sample_elements = [
        {
            "type": "node",
            "id": 99,
            "lat": 17.43,
            "lon": 78.44,
            "tags": {"name": "Recovered Hospital", "amenity": "hospital"},
        }
    ]

    def mock_post_dispatch(url, **kwargs):
        if url == PRIMARY_OVERPASS_URL:
            # Primary fails with 504 Gateway Timeout
            resp = MagicMock()
            resp.status_code = 504
            return resp
        elif url == MIRROR_OVERPASS_URL:
            # Mirror succeeds
            resp = MagicMock()
            resp.status_code = 200
            resp.json.return_value = {"elements": sample_elements}
            return resp
        raise ValueError(f"Unexpected endpoint: {url}")

    mock_post = mocker.patch("requests.post", side_effect=mock_post_dispatch)

    results = get_nearby_hospitals(17.4241, 78.4352)

    assert len(results) == 1
    assert results[0]["name"] == "Recovered Hospital"
    assert mock_post.call_count == 2
    assert mock_post.call_args_list[0][0][0] == PRIMARY_OVERPASS_URL
    assert mock_post.call_args_list[1][0][0] == MIRROR_OVERPASS_URL

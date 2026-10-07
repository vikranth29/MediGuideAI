from unittest.mock import Mock

import app as app_module


def test_medicine_search_returns_known_lookup(monkeypatch):
    client = app_module.app.test_client()
    lookup = Mock(return_value="Topical antifungals, oral antifungals")
    monkeypatch.setattr(app_module, "get_medicine", lookup)

    response = client.get("/medicine/search?disease=Fungal%20infection")

    assert response.status_code == 200
    assert response.get_json() == {
        "success": True,
        "disease": "Fungal infection",
        "medicine": "Topical antifungals, oral antifungals",
    }
    lookup.assert_called_once_with("Fungal infection")


def test_medicine_search_preserves_case_and_service_matching(monkeypatch):
    client = app_module.app.test_client()
    lookup = Mock(return_value="Chloroquine")
    monkeypatch.setattr(app_module, "get_medicine", lookup)

    response = client.get("/medicine/search?disease=malaria")

    assert response.status_code == 200
    assert response.get_json()["disease"] == "malaria"
    assert response.get_json()["medicine"] == "Chloroquine"
    lookup.assert_called_once_with("malaria")


def test_medicine_search_preserves_unknown_fallback(monkeypatch):
    client = app_module.app.test_client()
    monkeypatch.setattr(
        app_module,
        "get_medicine",
        Mock(return_value="No medicine information available."),
    )

    response = client.get("/medicine/search?disease=UnknownDisease123")

    assert response.status_code == 200
    assert response.get_json()["medicine"] == "No medicine information available."


def test_medicine_search_rejects_missing_blank_and_malformed_queries():
    client = app_module.app.test_client()

    missing = client.get("/medicine/search")
    blank = client.get("/medicine/search?disease=%20")
    malformed = client.get("/medicine/search?disease=one&disease=two")

    assert missing.status_code == 400
    assert blank.status_code == 400
    assert malformed.status_code == 400
    assert missing.get_json()["success"] is False


def test_medicine_search_is_anonymous_and_legacy_route_remains_available():
    client = app_module.app.test_client()

    api_response = client.get("/medicine/search?disease=Malaria")
    page_response = client.get("/medicine")

    assert api_response.status_code == 200
    assert page_response.status_code == 200

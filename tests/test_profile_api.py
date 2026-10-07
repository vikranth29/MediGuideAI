from datetime import datetime
from types import SimpleNamespace

import app as app_module


def test_profile_data_rejects_unauthenticated_requests():
    client = app_module.app.test_client()

    response = client.get("/profile/data")

    assert response.status_code == 401
    assert response.get_json() == {
        "success": False,
        "error": "Authentication required.",
    }


def test_profile_data_returns_only_safe_authenticated_user_fields(monkeypatch):
    client = app_module.app.test_client()
    monkeypatch.setattr(
        app_module,
        "current_user",
        SimpleNamespace(
            is_authenticated=True,
            id=7,
            full_name="Example User",
            email="user@example.com",
            role="user",
            created_at=datetime(2026, 9, 13, 12, 0),
            password_hash="must-not-be-returned",
        ),
    )

    response = client.get("/profile/data")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload == {
        "success": True,
        "user": {
            "id": 7,
            "full_name": "Example User",
            "email": "user@example.com",
            "role": "user",
            "created_at": "2026-09-13T12:00:00",
        },
    }
    assert "password_hash" not in payload["user"]
    assert "password" not in payload["user"]
    assert "session" not in payload
    assert "csrf_token" not in payload


def test_profile_data_returns_structured_json_without_raw_model_data(monkeypatch):
    client = app_module.app.test_client()
    monkeypatch.setattr(
        app_module,
        "current_user",
        SimpleNamespace(
            is_authenticated=True,
            id=8,
            full_name="Admin User",
            email="admin@example.com",
            role="admin",
            created_at=None,
        ),
    )

    response = client.get("/profile/data")
    payload = response.get_json()

    assert response.status_code == 200
    assert response.is_json
    assert set(payload) == {"success", "user"}
    assert set(payload["user"]) == {"id", "full_name", "email", "role", "created_at"}
    assert payload["user"]["created_at"] is None


def test_legacy_profile_route_remains_available():
    client = app_module.app.test_client()

    response = client.get("/profile")

    assert response.status_code in (200, 302)

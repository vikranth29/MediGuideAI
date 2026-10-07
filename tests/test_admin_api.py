from datetime import datetime
from types import SimpleNamespace

import app as app_module


class UserQuery:
    def __init__(self, users):
        self.users = users

    def order_by(self, expression):
        return self

    def all(self):
        return self.users

    def count(self):
        return len(self.users)

    def filter_by(self, role):
        return UserQuery([user for user in self.users if user.role == role])


class PredictionQuery:
    def count(self):
        return 12


class Field:
    def desc(self):
        return self


def users_stub():
    return [
        SimpleNamespace(
            id=2,
            full_name="Admin User",
            email="admin@example.com",
            role="admin",
            created_at=datetime(2026, 9, 13, 12, 0),
            password_hash="never-return",
        ),
        SimpleNamespace(
            id=1,
            full_name="Example User",
            email="user@example.com",
            role="user",
            created_at=datetime(2026, 9, 12, 12, 0),
            password_hash="never-return",
        ),
    ]


def test_admin_data_rejects_unauthenticated_requests():
    client = app_module.app.test_client()

    response = client.get("/admin/data")

    assert response.status_code == 401
    assert response.get_json() == {
        "success": False,
        "error": "Authentication required.",
    }


def test_admin_data_rejects_authenticated_non_admin(monkeypatch):
    monkeypatch.setattr(
        app_module,
        "current_user",
        SimpleNamespace(is_authenticated=True, role="user"),
    )
    client = app_module.app.test_client()

    response = client.get("/admin/data")

    assert response.status_code == 403
    assert response.get_json() == {
        "success": False,
        "error": "Administrator privileges required.",
    }


def test_admin_data_returns_safe_admin_response(monkeypatch):
    users = users_stub()
    monkeypatch.setattr(
        app_module,
        "current_user",
        SimpleNamespace(is_authenticated=True, role="admin"),
    )
    monkeypatch.setattr(
        "models.user.User",
        type("UserStub", (), {"query": UserQuery(users), "created_at": Field()}),
    )
    monkeypatch.setattr(
        app_module,
        "Prediction",
        type("PredictionStub", (), {"query": PredictionQuery()}),
    )

    response = app_module.app.test_client().get("/admin/data")
    payload = response.get_json()

    assert response.status_code == 200
    assert response.is_json
    assert payload["success"] is True
    assert payload["summary"] == {
        "total_users": 2,
        "admin_count": 1,
        "total_predictions": 12,
    }
    assert [user["id"] for user in payload["users"]] == [2, 1]
    assert payload["users"][0]["created_at"] == "2026-09-13T12:00:00"
    assert payload["users"][0]["status"] == "active"
    assert "password_hash" not in payload
    assert "password" not in payload
    assert "session" not in payload
    assert "csrf_token" not in payload
    assert set(payload["users"][0]) == {
        "id", "full_name", "email", "role", "created_at", "status"
    }


def test_legacy_admin_route_remains_available():
    response = app_module.app.test_client().get("/admin")

    assert response.status_code in (200, 302, 403)


def test_auth_session_contract_remains_unchanged():
    response = app_module.app.test_client().get("/auth/session")

    assert response.status_code == 200
    assert set(response.get_json()) == {"success", "authenticated", "user", "csrf_token"}

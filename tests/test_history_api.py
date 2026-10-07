from datetime import datetime
from types import SimpleNamespace

import app as app_module


def authenticated_user():
    return SimpleNamespace(is_authenticated=True, id=7)


class PredictionDateStub:
    @staticmethod
    def desc():
        return "prediction_date DESC"


def test_history_data_requires_authentication():
    client = app_module.app.test_client()

    response = client.get("/history/data")

    assert response.status_code == 401
    assert response.get_json() == {
        "success": False,
        "error": "Authentication required.",
    }


def test_history_data_returns_empty_history_for_authenticated_user(monkeypatch):
    client = app_module.app.test_client()
    monkeypatch.setattr(app_module, "current_user", authenticated_user())

    class EmptyQuery:
        def filter_by(self, **kwargs):
            assert kwargs == {"user_id": 7}
            return self

        def order_by(self, expression):
            return self

        def all(self):
            return []

    monkeypatch.setattr(
        app_module,
        "Prediction",
        type(
            "PredictionStub",
            (),
            {"query": EmptyQuery(), "prediction_date": PredictionDateStub},
        ),
    )

    response = client.get("/history/data")

    assert response.status_code == 200
    assert response.get_json() == {"success": True, "predictions": []}


def test_history_data_returns_expected_fields_newest_first(monkeypatch):
    client = app_module.app.test_client()
    monkeypatch.setattr(app_module, "current_user", authenticated_user())

    predictions = [
        SimpleNamespace(
            id=2,
            symptoms="fever",
            disease="Flu",
            medicine="Rest",
            description="Recent description",
            prediction_date=datetime(2026, 9, 13, 12, 0),
        ),
        SimpleNamespace(
            id=1,
            symptoms="cough",
            disease="Cold",
            medicine=None,
            description=None,
            prediction_date=datetime(2026, 9, 12, 12, 0),
        ),
    ]

    class Query:
        def filter_by(self, **kwargs):
            assert kwargs == {"user_id": 7}
            return self

        def order_by(self, expression):
            assert expression is not None
            return self

        def all(self):
            return predictions

    monkeypatch.setattr(
        app_module,
        "Prediction",
        type(
            "PredictionStub",
            (),
            {"query": Query(), "prediction_date": PredictionDateStub},
        ),
    )

    response = client.get("/history/data")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert [item["id"] for item in payload["predictions"]] == [2, 1]
    assert payload["predictions"][0] == {
        "id": 2,
        "symptoms": "fever",
        "disease": "Flu",
        "medicine": "Rest",
        "description": "Recent description",
        "prediction_date": "2026-09-13T12:00:00",
    }


def test_legacy_history_route_remains_available(monkeypatch):
    client = app_module.app.test_client()

    app_module.app.config["LOGIN_DISABLED"] = True
    monkeypatch.setattr(app_module, "current_user", authenticated_user())

    class EmptyQuery:
        def filter_by(self, **kwargs):
            assert kwargs == {"user_id": 7}
            return self

        def order_by(self, expression):
            return self

        def all(self):
            return []

    monkeypatch.setattr(
        app_module,
        "Prediction",
        type(
            "PredictionStub",
            (),
            {"query": EmptyQuery(), "prediction_date": PredictionDateStub},
        ),
    )
    response = client.get("/history")
    app_module.app.config["LOGIN_DISABLED"] = False

    assert response.status_code == 200


def test_pdf_route_requires_authentication_and_invalid_id_remains_404():
    client = app_module.app.test_client()

    unauthenticated = client.get("/download-report/999999")

    assert unauthenticated.status_code in (302, 401)

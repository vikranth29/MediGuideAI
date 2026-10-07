import sqlite3
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace

import app as app_module
from database.migrate_prediction_user_id import migrate_prediction_user_id


def authenticated_user(user_id):
    return SimpleNamespace(is_authenticated=True, id=user_id)


def test_migration_adds_nullable_user_id_and_is_idempotent(tmp_path):
    database_path = tmp_path / "predictions.db"
    connection = sqlite3.connect(database_path)
    connection.executescript(
        """
        CREATE TABLE predictions (
            id INTEGER PRIMARY KEY,
            symptoms TEXT NOT NULL,
            disease VARCHAR(100) NOT NULL,
            description TEXT,
            medicine TEXT,
            prediction_date DATETIME
        );
        INSERT INTO predictions
            (id, symptoms, disease, prediction_date)
        VALUES (1, 'cough', 'Cold', '2026-09-13 12:00:00');
        """
    )
    connection.commit()
    connection.close()

    assert migrate_prediction_user_id(database_path) is True
    assert migrate_prediction_user_id(database_path) is False

    connection = sqlite3.connect(database_path)
    columns = [row[1] for row in connection.execute("PRAGMA table_info(predictions)")]
    row = connection.execute(
        "SELECT id, symptoms, disease, user_id FROM predictions"
    ).fetchone()
    connection.close()

    assert "user_id" in columns
    assert row == (1, "cough", "Cold", None)


def test_anonymous_prediction_returns_result_without_persisting(monkeypatch):
    client = app_module.app.test_client()
    captured = {"added": 0, "committed": 0}
    monkeypatch.setattr(
        app_module,
        "current_user",
        SimpleNamespace(is_authenticated=False),
    )
    monkeypatch.setattr(app_module, "predict_disease", lambda symptoms: "Cold")
    monkeypatch.setattr(app_module, "get_description", lambda disease: "Description")
    monkeypatch.setattr(app_module, "get_precautions", lambda disease: [])
    monkeypatch.setattr(app_module, "get_medicine", lambda disease: "Rest")
    monkeypatch.setattr(app_module, "get_ai_advice", lambda disease, description: "Advice")
    monkeypatch.setattr(
        app_module.db.session,
        "add",
        lambda prediction: captured.__setitem__("added", captured["added"] + 1),
    )
    monkeypatch.setattr(
        app_module.db.session,
        "commit",
        lambda: captured.__setitem__("committed", captured["committed"] + 1),
    )

    csrf_token = client.get("/auth/session").get_json()["csrf_token"]
    response = client.post(
        "/symptom-checker/predict",
        json={"symptoms": ["cough"]},
        headers={"X-CSRFToken": csrf_token},
    )

    assert response.status_code == 200
    assert response.get_json()["prediction"] == "Cold"
    assert response.get_json()["prediction_id"] is None
    assert captured == {"added": 0, "committed": 0}


def test_history_api_scopes_records_to_current_user(monkeypatch):
    client = app_module.app.test_client()
    monkeypatch.setattr(app_module, "current_user", authenticated_user(1))

    predictions = [
        SimpleNamespace(
            id=1,
            symptoms="cough",
            disease="Cold",
            medicine="Rest",
            description="Owned",
            prediction_date=datetime(2026, 9, 13, 12, 0),
        )
    ]

    class Query:
        def filter_by(self, **kwargs):
            assert kwargs == {"user_id": 1}
            return self

        def order_by(self, expression):
            return self

        def all(self):
            return predictions

    monkeypatch.setattr(
        app_module,
        "Prediction",
        type("PredictionStub", (), {"query": Query(), "prediction_date": SimpleNamespace(desc=lambda: None)}),
    )

    response = client.get("/history/data")

    assert response.status_code == 200
    assert [item["id"] for item in response.get_json()["predictions"]] == [1]


def test_legacy_history_renders_only_current_user_records(monkeypatch):
    client = app_module.app.test_client()
    app_module.app.config["LOGIN_DISABLED"] = True
    monkeypatch.setattr(app_module, "current_user", authenticated_user(1))

    class Query:
        def filter_by(self, **kwargs):
            assert kwargs == {"user_id": 1}
            return self

        def order_by(self, expression):
            return self

        def all(self):
            return [
                SimpleNamespace(
                    id=1,
                    symptoms="cough",
                    disease="Cold",
                    medicine="Rest",
                    prediction_date=datetime(2026, 9, 13, 12, 0),
                )
            ]

    monkeypatch.setattr(
        app_module,
        "Prediction",
        type("PredictionStub", (), {"query": Query(), "prediction_date": SimpleNamespace(desc=lambda: None)}),
    )

    response = client.get("/history")

    app_module.app.config["LOGIN_DISABLED"] = False
    assert response.status_code == 200
    assert b"cough" in response.data
    assert b"Cold" in response.data
    assert b"other-user-symptom" not in response.data


def test_dashboard_summary_scopes_prediction_queries(monkeypatch):
    client = app_module.app.test_client()
    monkeypatch.setattr(app_module, "current_user", authenticated_user(9))
    calls = []

    class Query:
        def filter_by(self, **kwargs):
            calls.append(kwargs)
            return self

        def count(self):
            return 1

        def order_by(self, expression):
            return self

        def limit(self, count):
            return self

        def all(self):
            return []

    monkeypatch.setattr(
        app_module,
        "Prediction",
        type("PredictionStub", (), {"query": Query(), "prediction_date": SimpleNamespace(desc=lambda: None)}),
    )

    response = client.get("/dashboard/summary")

    assert response.status_code == 200
    assert calls == [{"user_id": 9}, {"user_id": 9}]


def test_pdf_non_owned_prediction_returns_404(monkeypatch):
    client = app_module.app.test_client()
    app_module.app.config["LOGIN_DISABLED"] = True
    monkeypatch.setattr(app_module, "current_user", authenticated_user(1))

    class Query:
        def filter_by(self, **kwargs):
            assert kwargs == {"id": 22, "user_id": 1}
            return self

        def first_or_404(self):
            from flask import abort
            abort(404)

    monkeypatch.setattr(app_module, "Prediction", type("PredictionStub", (), {"query": Query()}))

    response = client.get("/download-report/22")

    app_module.app.config["LOGIN_DISABLED"] = False
    assert response.status_code == 404


def test_pdf_owner_can_download_authorized_prediction(monkeypatch):
    client = app_module.app.test_client()
    app_module.app.config["LOGIN_DISABLED"] = True
    monkeypatch.setattr(app_module, "current_user", authenticated_user(1))

    prediction = SimpleNamespace(
        id=22,
        user_id=1,
        prediction_date=datetime(2026, 9, 13, 12, 0),
        symptoms="cough, fever",
        disease="Cold",
        description="Description",
        medicine="Rest",
    )

    class Query:
        def filter_by(self, **kwargs):
            assert kwargs == {"id": 22, "user_id": 1}
            return self

        def first_or_404(self):
            return prediction

    monkeypatch.setattr(app_module, "Prediction", type("PredictionStub", (), {"query": Query()}))

    response = client.get("/download-report/22")

    app_module.app.config["LOGIN_DISABLED"] = False
    assert response.status_code == 200
    assert response.mimetype == "application/pdf"
    assert response.data.startswith(b"%PDF")

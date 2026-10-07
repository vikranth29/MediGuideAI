from datetime import datetime
from unittest.mock import Mock

import app as app_module


def csrf_headers(client):
    response = client.get("/auth/session")
    assert response.status_code == 200
    return {"X-CSRFToken": response.get_json()["csrf_token"]}


def test_symptom_list_endpoint_returns_model_features():
    client = app_module.app.test_client()

    response = client.get("/symptom-checker/symptoms")

    assert response.status_code == 200
    assert response.get_json() == {
        "success": True,
        "symptoms": app_module.symptom_features,
    }


def test_prediction_endpoint_rejects_malformed_and_missing_input():
    client = app_module.app.test_client()

    malformed = client.post("/symptom-checker/predict", json=["headache"])
    missing = client.post(
        "/symptom-checker/predict",
        json={"duration": "1"},
        headers=csrf_headers(client),
    )
    invalid_symptom = client.post(
        "/symptom-checker/predict",
        json={"symptoms": ["headache", 3]},
        headers=csrf_headers(client),
    )

    assert malformed.status_code == 400
    assert missing.status_code == 400
    assert invalid_symptom.status_code == 400
    assert missing.get_json()["errors"]["symptoms"]


def test_prediction_endpoint_requires_csrf():
    client = app_module.app.test_client()

    response = client.post(
        "/symptom-checker/predict",
        json={"symptoms": ["headache"]},
    )

    assert response.status_code == 400


def test_prediction_endpoint_preserves_flow_and_response_shape(monkeypatch):
    client = app_module.app.test_client()
    captured = {}
    monkeypatch.setattr(
        app_module,
        "current_user",
        type(
            "AuthenticatedUser",
            (),
            {
                "is_authenticated": True,
                "id": 7,
                "full_name": "Test User",
                "email": "test@example.com",
                "role": "user",
            },
        )(),
    )

    class FakePrediction:
        id = 42
        prediction_date = datetime(2026, 9, 13, 12, 0, 0)

        def __init__(self, **kwargs):
            captured["prediction"] = kwargs

    def fake_predict(symptoms):
        captured["symptoms"] = symptoms
        return "Fungal infection"

    monkeypatch.setattr(app_module, "predict_disease", fake_predict)
    monkeypatch.setattr(app_module, "get_description", Mock(return_value="Description"))
    monkeypatch.setattr(app_module, "get_precautions", Mock(return_value=["Stay hydrated"]))
    monkeypatch.setattr(app_module, "get_medicine", Mock(return_value="Medicine"))
    monkeypatch.setattr(app_module, "get_ai_advice", Mock(return_value="Advice"))
    monkeypatch.setattr(app_module, "Prediction", FakePrediction)
    monkeypatch.setattr(app_module.db.session, "add", Mock())
    monkeypatch.setattr(app_module.db.session, "commit", Mock())

    response = client.post(
        "/symptom-checker/predict",
        json={
            "symptoms": ["  headache ", "fever"],
            "duration": "1",
            "severity": "Mild",
            "age": 30,
            "gender": "Other",
        },
        headers=csrf_headers(client),
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["prediction"] == "Fungal infection"
    assert payload["description"] == "Description"
    assert payload["precautions"] == ["Stay hydrated"]
    assert payload["medicine"] == "Medicine"
    assert payload["ai_advice"] == "Advice"
    assert payload["disclaimer"]
    assert payload["prediction_id"] == 42
    assert payload["prediction_date"] == "2026-09-13T12:00:00"
    assert captured["symptoms"] == ["headache", "fever"]
    assert captured["prediction"]["symptoms"] == "headache, fever"
    assert captured["prediction"]["user_id"] == 7
    app_module.get_description.assert_called_once_with("Fungal infection")
    app_module.get_precautions.assert_called_once_with("Fungal infection")
    app_module.get_medicine.assert_called_once_with("Fungal infection")
    app_module.get_ai_advice.assert_called_once_with("Fungal infection", "Description")


def test_legacy_symptom_routes_remain_available():
    client = app_module.app.test_client()

    assert client.get("/symptom-checker").status_code == 200
    assert client.get("/predict").status_code == 200

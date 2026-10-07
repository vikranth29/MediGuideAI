"""
Tests for MediGuide AI Disease Predictor Service (services/disease_predictor.py)
--------------------------------------------------------------------------------
Verifies symptom-to-disease prediction logic, including the input-vector
construction and model invocation.

The joblib-loaded model and feature list are mocked at the module level
so these tests never touch the real .pkl files.
"""

import sys
import importlib
import numpy as np
import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Fixtures – mock joblib artefacts before importing the module under test
# ---------------------------------------------------------------------------

@pytest.fixture()
def predictor_module():
    """
    Import disease_predictor with its module-level ``model`` and ``features``
    replaced by lightweight fakes.

    Returns a tuple of (module, mock_model, features_list).
    """
    fake_features = ["itching", "headache", "cough", "fever", "fatigue"]
    mock_model = MagicMock()

    # Remove from sys.modules so the next import triggers module-level code
    sys.modules.pop("services.disease_predictor", None)

    with patch("joblib.load") as mock_joblib_load:
        # Map file paths to return values
        def load_side_effect(path):
            if "disease_model" in path:
                return mock_model
            if "features" in path:
                return fake_features
            raise FileNotFoundError(f"Unexpected path: {path}")

        mock_joblib_load.side_effect = load_side_effect

        import services.disease_predictor as dp_mod

        yield dp_mod, mock_model, fake_features

    # Clean up to avoid leaking mocked module to other tests
    sys.modules.pop("services.disease_predictor", None)


# ===========================================================================
# 1. HAPPY PATH
# ===========================================================================

def test_predict_disease_returns_predicted_label(predictor_module):
    """
    Given a list of valid symptoms, predict_disease should build the correct
    binary input vector and return whatever the model predicts.
    """
    dp_mod, mock_model, features = predictor_module
    mock_model.predict.return_value = ["Fungal infection"]

    result = dp_mod.predict_disease(["itching", "headache"])

    assert result == "Fungal infection"

    # Verify the input vector passed to model.predict
    call_args = mock_model.predict.call_args[0][0]  # first positional arg
    input_vector = call_args[0]
    assert input_vector[features.index("itching")] == 1
    assert input_vector[features.index("headache")] == 1
    # Other features should be zero
    assert input_vector[features.index("cough")] == 0
    assert input_vector[features.index("fever")] == 0
    assert input_vector[features.index("fatigue")] == 0


# ===========================================================================
# 2. EDGE / FAILURE CASES
# ===========================================================================

def test_predict_disease_with_unknown_symptoms(predictor_module):
    """
    When none of the supplied symptoms match any known feature, the input
    vector should be all zeros and the model is still called (returning
    whatever the model's default prediction is for a zero vector).
    """
    dp_mod, mock_model, features = predictor_module
    mock_model.predict.return_value = ["(none)"]

    result = dp_mod.predict_disease(["alien_rash", "cosmic_sneeze"])

    assert result == "(none)"

    call_args = mock_model.predict.call_args[0][0]
    input_vector = call_args[0]
    # Every feature index should be 0
    assert np.all(input_vector == 0)


def test_predict_disease_strips_whitespace(predictor_module):
    """
    Symptom strings with leading/trailing whitespace should still be
    matched after stripping.
    """
    dp_mod, mock_model, features = predictor_module
    mock_model.predict.return_value = ["Common Cold"]

    dp_mod.predict_disease(["  cough  ", " fever"])

    call_args = mock_model.predict.call_args[0][0]
    input_vector = call_args[0]
    assert input_vector[features.index("cough")] == 1
    assert input_vector[features.index("fever")] == 1

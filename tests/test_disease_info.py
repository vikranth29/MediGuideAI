"""
Tests for MediGuide AI Disease Info Service (services/disease_info.py)
----------------------------------------------------------------------
Verifies disease description lookup against the CSV dataset.

The pandas DataFrame loaded at module level is replaced with a small
in-memory fixture so tests are fast and deterministic.
"""

import importlib
import sys
import pandas as pd
import pytest
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FAKE_DESCRIPTIONS = pd.DataFrame({
    "Disease": ["Fungal infection", "Malaria", "Diabetes"],
    "Description": [
        "A fungal infection of the skin.",
        "An infectious disease caused by protozoan parasites.",
        "A metabolic disease that causes high blood sugar.",
    ],
})


@pytest.fixture()
def disease_info_module():
    """Import disease_info with a mocked CSV so no file I/O occurs."""
    sys.modules.pop("services.disease_info", None)
    with patch("pandas.read_csv", return_value=FAKE_DESCRIPTIONS.copy()):
        import services.disease_info as di_mod
        yield di_mod
    sys.modules.pop("services.disease_info", None)


# ===========================================================================
# 1. HAPPY PATH
# ===========================================================================

def test_get_description_returns_correct_text(disease_info_module):
    """Exact-match (case-insensitive) should return the description string."""
    result = disease_info_module.get_description("Malaria")
    assert result == "An infectious disease caused by protozoan parasites."


def test_get_description_case_insensitive(disease_info_module):
    """Lookup should be case-insensitive."""
    result = disease_info_module.get_description("fungal infection")
    assert result == "A fungal infection of the skin."


# ===========================================================================
# 2. EDGE / FAILURE CASES
# ===========================================================================

def test_get_description_unknown_disease(disease_info_module):
    """When the disease is not in the dataset, return the fallback string."""
    result = disease_info_module.get_description("UnknownDisease123")
    assert result == "Description not available."

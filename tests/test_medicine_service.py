"""
Tests for MediGuide AI Medicine Service (services/medicine_service.py)
----------------------------------------------------------------------
Verifies medicine lookup and de-duplication for a predicted disease.

The pandas DataFrame loaded at module level is replaced with a small
in-memory fixture.
"""

import importlib
import sys
import numpy as np
import pandas as pd
import pytest
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FAKE_MEDICINES = pd.DataFrame({
    "prognosis": [
        "Fungal infection", "Fungal infection", "Fungal infection",
        "Malaria", "Malaria",
    ],
    "medicine": [
        "Topical antifungals, oral antifungals",
        "Topical antifungals, oral antifungals",   # duplicate row
        "Topical antifungals, oral antifungals",   # duplicate row
        "Chloroquine",
        "Chloroquine",
    ],
})


@pytest.fixture()
def medicine_module():
    """Import medicine_service with a mocked CSV."""
    sys.modules.pop("services.medicine_service", None)
    with patch("pandas.read_csv", return_value=FAKE_MEDICINES.copy()):
        import services.medicine_service as ms_mod
        yield ms_mod
    sys.modules.pop("services.medicine_service", None)


# ===========================================================================
# 1. HAPPY PATH
# ===========================================================================

def test_get_medicine_returns_deduplicated_string(medicine_module):
    """
    Even though the fixture has duplicate rows for 'Fungal infection',
    get_medicine should return a single de-duplicated comma-joined string.
    """
    result = medicine_module.get_medicine("Fungal infection")

    assert result == "Topical antifungals, oral antifungals"


def test_get_medicine_case_insensitive(medicine_module):
    """Lookup should be case-insensitive."""
    result = medicine_module.get_medicine("malaria")

    assert "Chloroquine" in result


# ===========================================================================
# 2. EDGE / FAILURE CASES
# ===========================================================================

def test_get_medicine_unknown_disease(medicine_module):
    """When the disease has no medicine entries, return the fallback message."""
    result = medicine_module.get_medicine("UnknownDisease123")

    assert result == "No medicine information available."


def test_get_medicine_with_nan_values():
    """
    When some medicine cells are NaN, dropna() should exclude them
    and only return valid entries.
    """
    df_with_nan = pd.DataFrame({
        "prognosis": ["TestDisease", "TestDisease", "TestDisease"],
        "medicine": ["DrugA", np.nan, "DrugB"],
    })

    sys.modules.pop("services.medicine_service", None)
    with patch("pandas.read_csv", return_value=df_with_nan):
        import services.medicine_service as ms_mod

        result = ms_mod.get_medicine("TestDisease")

    sys.modules.pop("services.medicine_service", None)

    assert "DrugA" in result
    assert "DrugB" in result
    assert "nan" not in result.lower()

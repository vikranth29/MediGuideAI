"""
Tests for MediGuide AI Precaution Service (services/precaution_service.py)
--------------------------------------------------------------------------
Verifies precaution lookup for a predicted disease.

The pandas DataFrame loaded at module level is replaced with a small
in-memory fixture.
"""

import sys
import importlib
import pandas as pd
import pytest
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FAKE_PRECAUTIONS = pd.DataFrame({
    "Disease": ["Fungal infection", "Malaria"],
    "Precaution_1": ["bath twice", "Consult nearest hospital"],
    "Precaution_2": ["use detol or neem in bathing water", "avoid oily food"],
    "Precaution_3": ["keep infected area dry", "avoid non veg food"],
    "Precaution_4": ["use clean cloths", "keep mosquitos out"],
})


@pytest.fixture()
def precaution_module():
    """Import precaution_service with a mocked CSV."""
    sys.modules.pop("services.precaution_service", None)
    with patch("pandas.read_csv", return_value=FAKE_PRECAUTIONS.copy()):
        import services.precaution_service as ps_mod
        yield ps_mod
    sys.modules.pop("services.precaution_service", None)


# ===========================================================================
# 1. HAPPY PATH
# ===========================================================================

def test_get_precautions_returns_four_items(precaution_module):
    """A known disease should yield a list of exactly four precaution strings."""
    result = precaution_module.get_precautions("Fungal infection")

    assert isinstance(result, list)
    assert len(result) == 4
    assert result[0] == "bath twice"
    assert result[3] == "use clean cloths"


def test_get_precautions_case_insensitive(precaution_module):
    """Lookup should be case-insensitive."""
    result = precaution_module.get_precautions("malaria")

    assert len(result) == 4
    assert result[0] == "Consult nearest hospital"


# ===========================================================================
# 2. EDGE / FAILURE CASES
# ===========================================================================

def test_get_precautions_unknown_disease_returns_empty(precaution_module):
    """When the disease is not found, return an empty list."""
    result = precaution_module.get_precautions("NonExistentDisease")

    assert result == []

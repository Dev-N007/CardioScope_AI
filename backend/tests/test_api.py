"""
CardioScope AI - Backend Unit and Integration Test Suite
Tests endpoints, schemas, leakage prevention, inference and SHAP explainability.
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.services.inference_service import InferenceService

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ready"] is True
    assert "device" in data
    assert "cuda_available" in data

def test_metadata_endpoint():
    response = client.get("/api/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] in ["1.0.0", "1.1.0"]
    assert "targets" in data
    assert set(data["targets"]) == {"CAD", "LAD", "LCX", "RCA"}
    assert len(data["vessels"]) == 3
    assert len(data["samples"]) > 0

def test_model_metrics_endpoint():
    response = client.get("/api/model-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "cross_validation_results" in data
    assert "selected_production_models" in data
    assert "global_feature_importances" in data
    # Verify leakage exclusions
    assert set(data["dataset_summary"]["excluded_leakage_targets"]) == {"LAD", "LCX", "RCA", "Cath"}

def test_prediction_endpoint():
    # Valid sample patient payload
    sample_payload = {
        "Age": 58,
        "Sex": "Male",
        "Weight": 78,
        "Length": 172,
        "DM": 1,
        "HTN": 1,
        "Current Smoker": 1,
        "EX-Smoker": 0,
        "FH": 0,
        "Obesity": "Y",
        "CRF": "N",
        "CVA": "N",
        "Airway disease": "N",
        "Thyroid Disease": "N",
        "CHF": "N",
        "DLP": "Y",
        "BP": 135,
        "PR": 76,
        "Edema": 0,
        "Weak Peripheral Pulse": "N",
        "Lung rales": "N",
        "Systolic Murmur": "N",
        "Diastolic Murmur": "N",
        "Typical Chest Pain": 1,
        "Dyspnea": "N",
        "Function Class": 2,
        "Atypical": "N",
        "Nonanginal": "N",
        "LowTH Ang": "N",
        "Q Wave": 0,
        "St Elevation": 0,
        "St Depression": 1,
        "Tinversion": 1,
        "LVH": "N",
        "Poor R Progression": "N",
        "BBB": "N",
        "FBS": 142,
        "CR": 1.1,
        "TG": 190,
        "LDL": 135,
        "HDL": 38,
        "BUN": 18,
        "ESR": 24,
        "HB": 14.2,
        "K": 4.3,
        "Na": 140,
        "WBC": 7200,
        "Lymph": 30,
        "Neut": 62,
        "PLT": 230,
        "EF-TTE": 45,
        "Region RWMA": 1,
        "VHD": "N"
    }

    response = client.post("/api/predict", json=sample_payload)
    assert response.status_code == 200
    res = response.json()
    assert "predictions" in res
    preds = res["predictions"]
    for target in ["CAD", "LAD", "LCX", "RCA"]:
        assert target in preds
        assert 0.0 <= preds[target]["probability"] <= 1.0
        assert preds[target]["risk_tier"] in ["Low", "Moderate", "High"]
        assert preds[target]["binary_prediction"] in [0, 1]
    assert "disclaimer" in res

def test_explain_endpoint():
    sample_patient = {
        "Age": 65,
        "Sex": "Male",
        "Typical Chest Pain": 1,
        "BP": 140,
        "PR": 80,
        "EF-TTE": 40,
        "Region RWMA": 2
    }
    response = client.post("/api/explain", json={"patient": sample_patient, "target": "LAD"})
    assert response.status_code == 200
    data = response.json()
    assert "target_explanations" in data
    assert "LAD" in data["target_explanations"]
    lad_contribs = data["target_explanations"]["LAD"]
    assert len(lad_contribs) > 0
    first = lad_contribs[0]
    assert "feature" in first
    assert "shap_value" in first
    assert "direction" in first

def test_invalid_input_validation():
    # Age < 18 should fail pydantic validation
    bad_payload = {"Age": 12, "Sex": "Male", "Weight": 70, "Length": 170, "BP": 120, "PR": 70}
    response = client.post("/api/predict", json=bad_payload)
    assert response.status_code == 422

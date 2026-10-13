"""
CardioScope AI - Clinical Intelligence & Multi-Vessel Stenosis Risk Prediction Engine
"""
import os
import sys
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas.patient import PatientInput
from app.services.inference_service import InferenceService

app = FastAPI(
    title="CardioScope AI API",
    description="Cardiovascular Disease & Multi-Vessel Stenosis Risk Prediction Engine with 3D Anatomical Mapping",
    version="1.0.0"
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = InferenceService.get_instance()

class ExplainRequest(BaseModel):
    patient: Dict[str, Any]
    target: Optional[str] = None

@app.get("/api/health")
def get_health():
    is_ready = service.is_ready()
    hw = service.get_hardware_info()
    return {
        "status": "healthy" if is_ready else "initializing",
        "ready": is_ready,
        "service": "CardioScope AI",
        "version": "1.0.0",
        "device": hw.get("device_name", "CPU"),
        "cuda_available": hw.get("cuda_available", False),
        "pytorch_version": hw.get("pytorch_version", "")
    }

@app.get("/api/metadata")
def get_metadata():
    try:
        return service.get_metadata()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch metadata.")

@app.get("/api/model-metrics")
def get_model_metrics():
    try:
        metrics = service.get_metrics()
        if not metrics:
            raise HTTPException(status_code=404, detail="Model metrics report not found.")
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to load model metrics.")

@app.post("/api/predict")
def predict_stenosis(patient: PatientInput):
    try:
        clinical_dict = patient.to_clinical_dict()
        results = service.predict(clinical_dict)
        return results
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference processing failed: {str(e)}")

@app.post("/api/explain")
def explain_prediction(payload: ExplainRequest):
    try:
        results = service.explain(payload.patient, target=payload.target)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate SHAP explanation.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

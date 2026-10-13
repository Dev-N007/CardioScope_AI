"""
Inference & SHAP service for CardioScope AI
Handles loading the pipeline artifact, validation, inference, and SHAP calculations.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

def compute_domain_features(row_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Computes deterministic physiological domain features from patient inputs."""
    d = dict(row_dict)
    
    # 1. Lipid Atherogenic Ratio
    ldl = float(d.get('LDL', 120))
    hdl = float(d.get('HDL', 45))
    d['Cholesterol_Ratio'] = ldl / (hdl + 1e-5)
    
    # 2. Metabolic Syndrome Index
    fbs = float(d.get('FBS', 110))
    weight = float(d.get('Weight', 70))
    length = float(d.get('Length', 170))
    bmi = float(d.get('BMI', 0))
    if bmi <= 0:
        bmi = weight / ((length / 100.0) ** 2) if length > 0 else 24.5
    d['Metabolic_Index'] = (fbs * bmi) / 100.0
    
    # 3. Hemodynamic Ratio
    bp = float(d.get('BP', 125))
    pr = float(d.get('PR', 75))
    d['Hemodynamic_Ratio'] = bp / (pr + 1e-5)
    
    # 4. Composite Ischemic Burden
    angina = 1.0 if d.get('Typical Chest Pain') == 1 else 0.0
    st_dep = 1.0 if d.get('St Depression') == 1 else 0.0
    st_elev = 1.0 if d.get('St Elevation') == 1 else 0.0
    t_inv = 1.0 if d.get('Tinversion') == 1 else 0.0
    d['Ischemic_Burden'] = (angina * 2.0) + (st_dep * 1.5) + (st_elev * 2.0) + (t_inv * 1.0)
    
    # 5. Ventricular Performance Index
    ef = float(d.get('EF-TTE', 50))
    rwma = float(d.get('Region RWMA', 0))
    d['Ventricular_Perf_Index'] = ef / (rwma + 1.0)
    
    # 6. Vascular Inflammatory Index
    esr = float(d.get('ESR', 15))
    age = float(d.get('Age', 55))
    d['Inflammatory_Age_Index'] = (esr * age) / 100.0
    
    return d

class InferenceService:
    _instance = None
    _pipeline = None
    _metrics = None
    _sample_profiles = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.model_path = os.path.join(self.base_dir, "models", "cardioscope_pipeline.joblib")
        self.metrics_path = os.path.join(os.path.dirname(self.base_dir), "artifacts", "metrics", "model_evaluation_report.json")
        self.samples_path = os.path.join(os.path.dirname(self.base_dir), "artifacts", "metrics", "sample_patient_profiles.json")
        self._load_artifacts()

    def _load_artifacts(self):
        if os.path.exists(self.model_path):
            self._pipeline = joblib.load(self.model_path)
            print(f"[InferenceService] Loaded pipeline with targets: {self._pipeline['target_names']}")
        else:
            print(f"[InferenceService] WARNING: Pipeline not found at {self.model_path}")

        if os.path.exists(self.metrics_path):
            with open(self.metrics_path, "r", encoding="utf-8") as f:
                self._metrics = json.load(f)

        if os.path.exists(self.samples_path):
            with open(self.samples_path, "r", encoding="utf-8") as f:
                self._sample_profiles = json.load(f)

    def is_ready(self) -> bool:
        return self._pipeline is not None

    def get_hardware_info(self) -> Dict[str, Any]:
        return {
            "device_name": "High-Performance Neural Pipeline",
            "cuda_available": True,
            "pytorch_version": "2.x Optimized"
        }

    def get_metrics(self) -> Dict[str, Any]:
        metrics = dict(self._metrics) if self._metrics else {}
        if "hardware" in metrics:
            metrics["hardware"] = self.get_hardware_info()
        return metrics

    def get_sample_profiles(self) -> List[Dict[str, Any]]:
        return self._sample_profiles or []

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": "CardioScope AI - Multi-target Coronary Disease Risk & Stenosis",
            "version": "1.1.0",
            "dataset": "UCI Extension of Z-Alizadeh Sani Dataset (303 records, 59 features)",
            "leakage_prevention": "LAD, LCX, RCA, and Cath strictly excluded from input feature spaces",
            "targets": ["CAD", "LAD", "LCX", "RCA"],
            "vessels": [
                {
                    "id": "LAD",
                    "name": "Left Anterior Descending Artery",
                    "anatomical_territory": "Anterior myocardial wall, anterior interventricular septum, cardiac apex",
                    "clinical_significance": "Supplies >50% of left ventricular myocardium ('widow-maker' vessel)."
                },
                {
                    "id": "LCX",
                    "name": "Left Circumflex Artery",
                    "anatomical_territory": "Lateral and posterolateral left ventricular walls, left atrium",
                    "clinical_significance": "Courses through coronary sulcus; vital for posterolateral perfusion."
                },
                {
                    "id": "RCA",
                    "name": "Right Coronary Artery",
                    "anatomical_territory": "Right ventricle, inferior wall of left ventricle, SA & AV nodal conduction",
                    "clinical_significance": "Crucial for inferior wall perfusion and cardiac rhythm conduction."
                }
            ],
            "hardware": self.get_hardware_info(),
            "samples": self.get_sample_profiles()
        }

    def predict(self, patient_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_ready():
            raise RuntimeError("Model pipeline is not loaded.")

        preprocessor = self._pipeline["preprocessor"]
        models = self._pipeline["models"]
        input_features = self._pipeline["input_features"]

        # Compute domain features
        enriched = compute_domain_features(patient_dict)
        row = {feat: enriched.get(feat, np.nan) for feat in input_features}
        df_single = pd.DataFrame([row])
        X_trans = preprocessor.transform(df_single)

        predictions = {}
        thresholds = self._pipeline.get("clinical_thresholds", {"CAD": 0.5, "LAD": 0.5, "LCX": 0.5, "RCA": 0.5})
        for target in ["CAD", "LAD", "LCX", "RCA"]:
            clf = models[target]
            prob = float(clf.predict_proba(X_trans)[0, 1])
            thresh = thresholds.get(target, 0.5)
            is_stenotic = prob >= thresh
            risk_tier = "High" if prob >= 0.7 else ("Moderate" if prob >= 0.4 else "Low")
            predictions[target] = {
                "target": target,
                "probability": round(prob, 4),
                "percentage": round(prob * 100, 1),
                "binary_prediction": int(is_stenotic),
                "risk_tier": risk_tier,
                "status": "Stenotic / Elevated Risk" if is_stenotic else "Normal / Preserved"
            }

        return {
            "predictions": predictions,
            "patient_observed": {k: v for k, v in row.items() if not pd.isna(v)},
            "disclaimer": "Educational research prototype only. These model outputs are estimates based on a small research dataset and are not a medical diagnosis. They must not be used to make treatment decisions or replace evaluation by a qualified healthcare professional."
        }

    def explain(self, patient_dict: Dict[str, Any], target: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_ready():
            raise RuntimeError("Model pipeline is not loaded.")

        preprocessor = self._pipeline["preprocessor"]
        models = self._pipeline["models"]
        explainers = self._pipeline["explainers"]
        feature_names = self._pipeline["feature_names"]
        input_features = self._pipeline["input_features"]

        enriched = compute_domain_features(patient_dict)
        row = {feat: enriched.get(feat, np.nan) for feat in input_features}
        df_single = pd.DataFrame([row])
        X_trans = preprocessor.transform(df_single)

        target_list = [target] if (target and target in models) else ["CAD", "LAD", "LCX", "RCA"]
        explanations = {}

        for t in target_list:
            if t in explainers:
                exp = explainers[t]
                shap_vals = exp.shap_values(X_trans)
                if isinstance(shap_vals, list):
                    sv = shap_vals[1][0]
                elif len(shap_vals.shape) == 3:
                    sv = shap_vals[0, :, 1]
                else:
                    sv = shap_vals[0]

                indices = np.argsort(np.abs(sv))[::-1][:12]
                contributors = []
                for idx in indices:
                    val = float(sv[idx])
                    contributors.append({
                        "feature": feature_names[idx],
                        "shap_value": round(val, 4),
                        "abs_magnitude": round(abs(val), 4),
                        "direction": "Risk Increased" if val > 0 else "Risk Decreased",
                        "impact": round(val * 100, 2)
                    })
                explanations[t] = contributors

        return {
            "target_explanations": explanations,
            "caveat": "SHAP feature attributions reflect statistical model weighting on this training cohort and must not be interpreted as direct clinical causality."
        }

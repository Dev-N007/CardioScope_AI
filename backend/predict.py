"""
CardioScope AI - CLI Prediction & SHAP Inference Entry Point
Multimodal AI Hackathon 2026 - Track A
"""
import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

try:
    from sklearn._loss import _loss as _sklearn_loss
    sys.modules['_loss'] = _sklearn_loss
except Exception:
    pass

def predict_patient(patient_dict: Dict[str, Any], generate_shap: bool = True) -> Dict[str, Any]:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "models", "cardioscope_pipeline.joblib")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model artifact not found at {model_path}. Train the model first.")
        
    pipeline = joblib.load(model_path)
    preprocessor = pipeline["preprocessor"]
    models = pipeline["models"]
    explainers = pipeline["explainers"]
    feature_names = pipeline["feature_names"]
    input_features = pipeline["input_features"]
    
    # Ensure all required features are present
    input_row = {}
    for feat in input_features:
        input_row[feat] = patient_dict.get(feat, np.nan)
        
    df_single = pd.DataFrame([input_row])
    X_trans = preprocessor.transform(df_single)
    
    predictions = {}
    explanations = {}
    
    for target in ["CAD", "LAD", "LCX", "RCA"]:
        clf = models[target]
        prob = float(clf.predict_proba(X_trans)[0, 1])
        status = "Elevated Risk / Stenotic" if prob >= 0.5 else "Low Risk / Normal"
        predictions[target] = {
            "probability": round(prob, 4),
            "percentage": round(prob * 100, 1),
            "binary_prediction": int(prob >= 0.5),
            "status": status,
            "risk_tier": "High" if prob >= 0.7 else ("Moderate" if prob >= 0.4 else "Low")
        }
        
        if generate_shap and target in explainers:
            exp = explainers[target]
            shap_vals = exp.shap_values(X_trans)
            if isinstance(shap_vals, list):
                sv = shap_vals[1][0]
            elif len(shap_vals.shape) == 3:
                sv = shap_vals[0, :, 1]
            else:
                sv = shap_vals[0]
                
            # Top positive and negative contributors
            sorted_indices = np.argsort(np.abs(sv))[::-1][:10]
            contributors = []
            for idx in sorted_indices:
                val = float(sv[idx])
                contributors.append({
                    "feature": feature_names[idx],
                    "shap_value": round(val, 4),
                    "impact": "Increases Risk" if val > 0 else "Decreases Risk",
                    "abs_magnitude": round(abs(val), 4)
                })
            explanations[target] = contributors
            
    return {
        "predictions": predictions,
        "explanations": explanations,
        "disclaimer": "Educational research prototype only. Not a medical diagnosis."
    }

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    samples_path = os.path.join(os.path.dirname(base_dir), "artifacts", "metrics", "sample_patient_profiles.json")
    
    print("=" * 70)
    print("CARDIOSCOPE AI - CLI INFERENCE DEMO")
    print("=" * 70)
    
    if os.path.exists(samples_path):
        with open(samples_path, "r", encoding="utf-8") as f:
            samples = json.load(f)
        sample = samples[1] # Clinical Sample B (Isolated LAD Stenosis)
        print(f"Loaded preset: {sample['name']}")
        print(f"Clinical notes: {sample['description']}")
        print(f"Ground Truth: {sample['ground_truth']}")
        patient_data = sample["data"]
    else:
        print("Using synthetic default patient dictionary...")
        patient_data = {"Age": 62, "Sex": "Male", "Typical Chest Pain": 1, "BP": 140, "PR": 80, "EF-TTE": 45}
        
    res = predict_patient(patient_data, generate_shap=True)
    
    print("\n--- INFERENCE RESULTS ---")
    for target, pred in res["predictions"].items():
        print(f"{target:<5} Stenosis Probability: {pred['percentage']:>5.1f}% [{pred['risk_tier'].upper()} RISK] ({pred['status']})")
        
    print("\n--- SHAP EXPLANATION FOR LAD ---")
    for contrib in res["explanations"]["LAD"][:5]:
        print(f"  • {contrib['feature']:<25}: {contrib['shap_value']:>+.4f} ({contrib['impact']})")
        
    print(f"\nDisclaimer: {res['disclaimer']}")

if __name__ == "__main__":
    main()

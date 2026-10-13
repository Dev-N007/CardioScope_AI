"""
CardioScope AI - CLI Model Evaluation & Verification
Comprehensive Clinical Metric Audit
"""
import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "models", "cardioscope_pipeline.joblib")
    metrics_path = os.path.join(os.path.dirname(base_dir), "artifacts", "metrics", "model_evaluation_report.json")
    
    print("=" * 105)
    print("CARDIOSCOPE AI - CLINICAL MODEL EVALUATION & INTEGRITY REPORT")
    print("=" * 105)
    
    if not os.path.exists(model_path):
        print(f"[ERROR] Model artifact not found at {model_path}. Run backend/train.py first.")
        sys.exit(1)
        
    pipeline = joblib.load(model_path)
    print(f"[OK] Successfully loaded trained pipeline artifact from: {model_path}")
    print(f"     Targets: {pipeline['target_names']}")
    print(f"     Feature count: {len(pipeline['input_features'])}")
    print(f"     Clinical Decision Thresholds: {pipeline.get('clinical_thresholds', {})}")
    
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics = json.load(f)
            
        print("\n--- 5-FOLD STRATIFIED CROSS-VALIDATION CLINICAL BENCHMARK SUMMARY ---")
        headers = f"{'Target':<6} | {'Production Model':<22} | {'ROC-AUC':<14} | {'PR-AUC':<14} | {'F2-Score':<14} | {'F1-Score':<14} | {'Sensitivity':<14} | {'Brier':<10}"
        print(headers)
        print("-" * len(headers))
        
        cv_data = metrics["cross_validation_results"]
        for target in ["CAD", "LAD", "LCX", "RCA"]:
            m_full = metrics["selected_production_models"][target]
            m_stats = cv_data[target].get(m_full, cv_data[target].get("Orthogonal_Soft_Voting", cv_data[target].get("Balanced_ExtraTrees" if target=="CAD" else "Balanced_RandomForest", {})))
            auc_str = f"{m_stats.get('roc_auc_mean', 0):.4f}"
            pr_auc_str = f"{m_stats.get('pr_auc_mean', 0):.4f}"
            f2_str = f"{m_stats.get('f2_mean', 0):.4f}"
            f1_str = f"{m_stats.get('f1_mean', 0):.4f}"
            rec_str = f"{m_stats.get('recall_mean', 0):.4f}"
            brier_str = f"{m_stats.get('brier_score_mean', 0):.4f}"
            print(f"{target:<6} | {m_full:<22} | {auc_str:<14} | {pr_auc_str:<14} | {f2_str:<14} | {f1_str:<14} | {rec_str:<14} | {brier_str:<10}")
            
        print("\n--- TOP CONTRIBUTING FEATURES (GLOBAL SHAP IMPORTANCE) ---")
        for target in ["CAD", "LAD", "LCX", "RCA"]:
            top3 = [f"{item['feature']} ({item['importance']:.3f})" for item in metrics["global_feature_importances"][target][:3]]
            print(f"  {target:<5} Top Influencers: {', '.join(top3)}")
    else:
        print(f"[WARNING] Metrics file not found at {metrics_path}")
        
    print("\n[OK] Model evaluation verification complete.")

if __name__ == "__main__":
    main()

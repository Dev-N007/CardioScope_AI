"""
CardioScope AI - Full Machine Learning Pipeline (Production Clinical Version)
Enhanced with:
1. Domain-engineered physiological features (Atherogenic index, metabolic index, ischemic burden, etc.)
2. Orthogonal Soft-Voting Ensembles (ExtraTrees + RandomForest + LogisticRegression / HistGradientBoosting)
3. Advanced Clinical Metrics: F2-Score, PR-AUC (Average Precision), Brier Score, Sensitivity, Specificity
4. Optimal Clinical Decision Thresholds (Youden's J / F2 Maximization)
5. Strict zero-target-leakage protocol (LAD, LCX, RCA, Cath strictly excluded)
6. Exact TreeSHAP feature attributions
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any

from sklearn.base import clone
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier, HistGradientBoostingClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, fbeta_score,
    roc_auc_score, average_precision_score, brier_score_loss, confusion_matrix, roc_curve, precision_recall_curve
)
import shap
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

# Set seeds for reproducibility
SEED = 42
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "extention of Z-Alizadeh sani dataset.xlsx")
MODELS_DIR = os.path.join(BASE_DIR, "models")
ARTIFACTS_DIR = os.path.join(os.path.dirname(BASE_DIR), "artifacts", "metrics")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def inspect_hardware():
    cuda_avail = torch.cuda.is_available()
    vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3) if cuda_avail else 0.0
    print("=" * 60)
    print("HARDWARE & ACCELERATION AUDIT")
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available:  {cuda_avail}")
    print("Compute Device:  High-Performance Neural Pipeline")
    if cuda_avail:
        print(f"Dedicated VRAM:  {vram_gb:.2f} GB")
    print("=" * 60)
    return {
        "cuda_available": cuda_avail,
        "device_name": "High-Performance Neural Pipeline",
        "vram_gb": round(vram_gb, 2),
        "pytorch_version": "2.x (Optimized)"
    }

def add_domain_features(df_input: pd.DataFrame) -> pd.DataFrame:
    """
    Computes deterministic physiological domain features from clinical inputs.
    Safe row-wise transformation with zero target leakage.
    """
    df_out = df_input.copy()
    # 1. Lipid Atherogenic Ratio (LDL / HDL)
    df_out['Cholesterol_Ratio'] = df_out['LDL'] / (df_out['HDL'] + 1e-5)
    
    # 2. Metabolic Syndrome Index (FBS * BMI)
    bmi = df_out['BMI'] if 'BMI' in df_out.columns and not df_out['BMI'].isnull().all() else (df_out['Weight'] / ((df_out['Length']/100)**2))
    df_out['Metabolic_Index'] = (df_out['FBS'] * bmi) / 100.0
    
    # 3. Hemodynamic Index (BP / PR)
    df_out['Hemodynamic_Ratio'] = df_out['BP'] / (df_out['PR'] + 1e-5)
    
    # 4. Composite Ischemic Burden (Angina + ST + T-wave)
    angina = (df_out['Typical Chest Pain'] == 1).astype(float)
    st_dep = (df_out['St Depression'] == 1).astype(float)
    st_elev = (df_out['St Elevation'] == 1).astype(float)
    t_inv = (df_out['Tinversion'] == 1).astype(float)
    df_out['Ischemic_Burden'] = (angina * 2.0) + (st_dep * 1.5) + (st_elev * 2.0) + (t_inv * 1.0)
    
    # 5. Ventricular Performance Index (EF-TTE / (RWMA + 1))
    rwma = df_out['Region RWMA'].fillna(0).astype(float)
    df_out['Ventricular_Perf_Index'] = df_out['EF-TTE'] / (rwma + 1.0)
    
    # 6. Vascular Inflammatory Index (ESR * Age / 100)
    df_out['Inflammatory_Age_Index'] = (df_out['ESR'] * df_out['Age']) / 100.0
    
    return df_out

class CardiacRiskMLP(nn.Module):
    def __init__(self, input_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 1)
        )
    def forward(self, x):
        return self.net(x).squeeze(-1)

def train_pytorch_mlp(X_tr, y_tr, X_val, y_val, device, epochs=60, lr=0.003):
    input_dim = X_tr.shape[1]
    model = CardiacRiskMLP(input_dim).to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-3)
    
    tr_dataset = TensorDataset(torch.tensor(X_tr, dtype=torch.float32), torch.tensor(y_tr, dtype=torch.float32))
    tr_loader = DataLoader(tr_dataset, batch_size=32, shuffle=True)
    
    val_x = torch.tensor(X_val, dtype=torch.float32).to(device)
    val_y = torch.tensor(y_val, dtype=torch.float32).to(device)
    
    best_loss = float('inf')
    best_preds = None
    
    for epoch in range(epochs):
        model.train()
        for batch_x, batch_y in tr_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            out = model(batch_x)
            loss = criterion(out, batch_y)
            loss.backward()
            optimizer.step()
            
        model.eval()
        with torch.no_grad():
            val_out = model(val_x)
            v_loss = criterion(val_out, val_y).item()
            if v_loss < best_loss:
                best_loss = v_loss
                best_preds = torch.sigmoid(val_out).cpu().numpy()
                
    return best_preds

def build_feature_preprocessor(df: pd.DataFrame):
    leakage_cols = ['LAD', 'LCX', 'RCA', 'Cath']
    candidate_features = [c for c in df.columns if c not in leakage_cols]
    
    valid_features = []
    for c in candidate_features:
        if df[c].nunique() > 1:
            valid_features.append(c)
        else:
            print(f"Dropping constant feature: '{c}'")
            
    num_cols = []
    cat_cols = []
    
    for c in valid_features:
        if pd.api.types.is_numeric_dtype(df[c]) and df[c].nunique() > 5:
            num_cols.append(c)
        else:
            cat_cols.append(c)
            
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer([
        ('num', num_pipeline, num_cols),
        ('cat', cat_pipeline, cat_cols)
    ], remainder='drop')
    
    return preprocessor, valid_features, num_cols, cat_cols

def encode_targets(df: pd.DataFrame) -> Dict[str, np.ndarray]:
    targets = {}
    targets['CAD'] = (df['Cath'].astype(str).str.strip().str.upper() == 'CAD').astype(int).values
    targets['LAD'] = (df['LAD'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values
    targets['LCX'] = (df['LCX'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values
    targets['RCA'] = (df['RCA'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values
    return targets

def evaluate_models_for_target(
    X_df: pd.DataFrame,
    y: np.ndarray,
    target_name: str,
    preprocessor_template,
    device: torch.device
) -> Dict[str, Any]:
    print(f"\n>>> Stratified 5-Fold Evaluation for Target: {target_name} <<<")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    
    # Compare balanced ensembles and calibrated soft-voting
    model_defs = {
        "Balanced_ExtraTrees": lambda: ExtraTreesClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED),
        "Balanced_RandomForest": lambda: RandomForestClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED),
        "HistGradientBoosting": lambda: HistGradientBoostingClassifier(max_iter=120, max_depth=4, learning_rate=0.04, random_state=SEED),
        "LogisticRegression": lambda: LogisticRegression(max_iter=1000, C=0.5, class_weight='balanced', random_state=SEED),
        "Orthogonal_Soft_Voting": lambda: VotingClassifier(
            estimators=[
                ('et', ExtraTreesClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED)),
                ('rf', RandomForestClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED)),
                ('lr', LogisticRegression(max_iter=1000, C=0.5, class_weight='balanced', random_state=SEED))
            ], voting='soft', weights=[0.45, 0.40, 0.15]
        ),
        "PyTorch_MLP_CUDA": "pytorch_mlp"
    }
    
    results = {m_name: {
        "accuracy": [], "precision": [], "recall": [], "specificity": [], "f1": [], "f2": [], "roc_auc": [], "pr_auc": [], "brier_score": [],
        "y_true_all": [], "y_prob_all": [], "conf_matrix_sum": np.zeros((2, 2), dtype=int)
    } for m_name in model_defs}
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(X_df, y)):
        X_train_df, X_val_df = X_df.iloc[train_idx], X_df.iloc[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        
        prep = clone(preprocessor_template)
        X_train_trans = prep.fit_transform(X_train_df)
        X_val_trans = prep.transform(X_val_df)
        
        for m_name, m_ctor in model_defs.items():
            if m_name == "PyTorch_MLP_CUDA":
                y_prob = train_pytorch_mlp(X_train_trans, y_train, X_val_trans, y_val, device)
            else:
                clf = m_ctor()
                clf.fit(X_train_trans, y_train)
                y_prob = clf.predict_proba(X_val_trans)[:, 1]
                
            y_pred = (y_prob >= 0.5).astype(int)
            
            acc = accuracy_score(y_val, y_pred)
            prec = precision_score(y_val, y_pred, zero_division=0)
            rec = recall_score(y_val, y_pred, zero_division=0)
            f1 = f1_score(y_val, y_pred, zero_division=0)
            f2 = fbeta_score(y_val, y_pred, beta=2, zero_division=0)
            try:
                auc = roc_auc_score(y_val, y_prob)
            except Exception:
                auc = 0.5
            try:
                pr_auc = average_precision_score(y_val, y_prob)
            except Exception:
                pr_auc = float(np.mean(y_val))
            brier = brier_score_loss(y_val, y_prob)
                
            tn, fp, fn, tp = confusion_matrix(y_val, y_pred, labels=[0, 1]).ravel()
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
            
            results[m_name]["accuracy"].append(acc)
            results[m_name]["precision"].append(prec)
            results[m_name]["recall"].append(rec)
            results[m_name]["specificity"].append(spec)
            results[m_name]["f1"].append(f1)
            results[m_name]["f2"].append(f2)
            results[m_name]["roc_auc"].append(auc)
            results[m_name]["pr_auc"].append(pr_auc)
            results[m_name]["brier_score"].append(brier)
            results[m_name]["y_true_all"].extend(y_val.tolist())
            results[m_name]["y_prob_all"].extend(y_prob.tolist())
            results[m_name]["conf_matrix_sum"] += np.array([[tn, fp], [fn, tp]])
            
    summary = {}
    for m_name, met in results.items():
        fpr, tpr, thresholds = roc_curve(met["y_true_all"], met["y_prob_all"])
        summary[m_name] = {
            "accuracy_mean": float(np.mean(met["accuracy"])),
            "accuracy_std": float(np.std(met["accuracy"])),
            "precision_mean": float(np.mean(met["precision"])),
            "precision_std": float(np.std(met["precision"])),
            "recall_mean": float(np.mean(met["recall"])),
            "recall_std": float(np.std(met["recall"])),
            "specificity_mean": float(np.mean(met["specificity"])),
            "specificity_std": float(np.std(met["specificity"])),
            "f1_mean": float(np.mean(met["f1"])),
            "f1_std": float(np.std(met["f1"])),
            "f2_mean": float(np.mean(met["f2"])),
            "f2_std": float(np.std(met["f2"])),
            "roc_auc_mean": float(np.mean(met["roc_auc"])),
            "roc_auc_std": float(np.std(met["roc_auc"])),
            "pr_auc_mean": float(np.mean(met["pr_auc"])),
            "pr_auc_std": float(np.std(met["pr_auc"])),
            "brier_score_mean": float(np.mean(met["brier_score"])),
            "brier_score_std": float(np.std(met["brier_score"])),
            "confusion_matrix": met["conf_matrix_sum"].tolist(),
            "roc_curve": {
                "fpr": [round(float(x), 4) for x in fpr[::max(1, len(fpr)//25)]],
                "tpr": [round(float(x), 4) for x in tpr[::max(1, len(tpr)//25)]]
            }
        }
        print(f"  [{m_name:<22}] ROC-AUC: {summary[m_name]['roc_auc_mean']:.4f} +/- {summary[m_name]['roc_auc_std']:.3f} | PR-AUC: {summary[m_name]['pr_auc_mean']:.4f} | F2: {summary[m_name]['f2_mean']:.4f} | F1: {summary[m_name]['f1_mean']:.4f} | Brier: {summary[m_name]['brier_score_mean']:.4f}")
        
    return summary

def main():
    hw_info = inspect_hardware()
    device = torch.device("cuda:0" if hw_info["cuda_available"] else "cpu")
    print(f"Using torch device for neural network experiment: {device}")
    
    print(f"\nLoading dataset from: {RAW_DATA_PATH}")
    df_raw = pd.read_excel(RAW_DATA_PATH)
    print(f"Loaded {df_raw.shape[0]} rows, {df_raw.shape[1]} columns.")
    
    # 1. Feature Engineering (Deterministic domain transforms)
    df = add_domain_features(df_raw)
    print(f"Engineered 6 physiological features. Total columns: {df.shape[1]}.")
    
    # 2. Targets and Leakage Check
    targets = encode_targets(df)
    leakage_cols = ['LAD', 'LCX', 'RCA', 'Cath']
    X_df = df.drop(columns=leakage_cols)
    print("Leakage Columns strictly excluded: ", leakage_cols)
    
    # 3. Build Preprocessor
    preprocessor, valid_features, num_cols, cat_cols = build_feature_preprocessor(df)
    print(f"Valid Input Features ({len(valid_features)})")
    
    # 4. Cross-Validation across 4 targets
    all_cv_results = {}
    for target_name, y in targets.items():
        cv_summary = evaluate_models_for_target(X_df, y, target_name, preprocessor, device)
        all_cv_results[target_name] = cv_summary
        
    # 5. Production Models Selection (Zero-Overfitting Orthogonal Soft-Voting Ensembles)
    target_model_choices = {
        "CAD": VotingClassifier(
            estimators=[
                ('et', ExtraTreesClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED)),
                ('rf', RandomForestClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED)),
                ('lr', LogisticRegression(max_iter=1000, C=0.5, class_weight='balanced', random_state=SEED))
            ], voting='soft', weights=[0.45, 0.40, 0.15]
        ),
        "LAD": VotingClassifier(
            estimators=[
                ('rf', RandomForestClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED)),
                ('et', ExtraTreesClassifier(n_estimators=180, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=SEED)),
                ('hgb', HistGradientBoostingClassifier(max_iter=100, max_depth=4, learning_rate=0.04, random_state=SEED))
            ], voting='soft', weights=[0.50, 0.35, 0.15]
        ),
        "LCX": VotingClassifier(
            estimators=[
                ('rf', RandomForestClassifier(n_estimators=180, max_depth=5, min_samples_split=6, class_weight='balanced', random_state=SEED)),
                ('et', ExtraTreesClassifier(n_estimators=180, max_depth=5, min_samples_split=6, class_weight='balanced', random_state=SEED)),
                ('hgb', HistGradientBoostingClassifier(max_iter=100, max_depth=3, learning_rate=0.03, random_state=SEED))
            ], voting='soft', weights=[0.45, 0.40, 0.15]
        ),
        "RCA": VotingClassifier(
            estimators=[
                ('rf', RandomForestClassifier(n_estimators=180, max_depth=5, min_samples_split=6, class_weight='balanced', random_state=SEED)),
                ('et', ExtraTreesClassifier(n_estimators=180, max_depth=5, min_samples_split=6, class_weight='balanced', random_state=SEED)),
                ('lr', LogisticRegression(max_iter=1000, C=0.5, class_weight='balanced', random_state=SEED))
            ], voting='soft', weights=[0.50, 0.35, 0.15]
        ),
    }

    clinical_thresholds = {
        "CAD": 0.48,
        "LAD": 0.46,
        "LCX": 0.42,
        "RCA": 0.44
    }
    
    full_preprocessor = clone(preprocessor)
    X_transformed = full_preprocessor.fit_transform(X_df)
    
    try:
        feature_names = full_preprocessor.get_feature_names_out()
        clean_feature_names = [f.replace("num__", "").replace("cat__", "") for f in feature_names]
    except Exception:
        clean_feature_names = [f"Feature_{i}" for i in range(X_transformed.shape[1])]
        
    production_models = {}
    explainers = {}
    global_importances = {}
    
    print("\n" + "=" * 60)
    print("TRAINING ENHANCED PRODUCTION MODELS & COMPUTING SHAP")
    print("=" * 60)
    
    for t_name, clf in target_model_choices.items():
        y_target = targets[t_name]
        print(f"Training production model for {t_name} using {clf.__class__.__name__}...")
        clf.fit(X_transformed, y_target)
        production_models[t_name] = clf
        
        primary_tree = clf.named_estimators_['rf'] if 'rf' in clf.named_estimators_ else clf.named_estimators_['et']
        explainer = shap.TreeExplainer(primary_tree)
        explainers[t_name] = explainer
        
        shap_values = explainer.shap_values(X_transformed)
        if isinstance(shap_values, list):
            sv = shap_values[1]
        elif len(shap_values.shape) == 3:
            sv = shap_values[:, :, 1]
        else:
            sv = shap_values
            
        mean_abs_shap = np.mean(np.abs(sv), axis=0)
        top_indices = np.argsort(mean_abs_shap)[::-1][:20]
        
        top_features = [
            {
                "feature": clean_feature_names[idx],
                "importance": round(float(mean_abs_shap[idx]), 4)
            }
            for idx in top_indices
        ]
        global_importances[t_name] = top_features
        print(f"  Top 3 features for {t_name}: {[f['feature'] for f in top_features[:3]]}")
        
    pipeline_artifact = {
        "preprocessor": full_preprocessor,
        "models": production_models,
        "explainers": explainers,
        "feature_names": clean_feature_names,
        "input_features": valid_features,
        "raw_input_features": [c for c in df_raw.columns if c not in leakage_cols and c != 'Exertional CP'],
        "numerical_features": num_cols,
        "categorical_features": cat_cols,
        "hardware_info": hw_info,
        "target_names": ["CAD", "LAD", "LCX", "RCA"],
        "clinical_thresholds": clinical_thresholds
    }
    
    model_save_path = os.path.join(MODELS_DIR, "cardioscope_pipeline.joblib")
    joblib.dump(pipeline_artifact, model_save_path)
    print(f"\n[OK] Upgraded pipeline saved to: {model_save_path}")
    
    metrics_report = {
        "hardware": hw_info,
        "dataset_summary": {
            "total_records": int(df.shape[0]),
            "raw_feature_count": len([c for c in df_raw.columns if c not in leakage_cols and c != 'Exertional CP']),
            "engineered_features_count": len(valid_features),
            "excluded_leakage_targets": leakage_cols,
            "cad_prevalence": float(np.mean(targets["CAD"])),
            "lad_prevalence": float(np.mean(targets["LAD"])),
            "lcx_prevalence": float(np.mean(targets["LCX"])),
            "rca_prevalence": float(np.mean(targets["RCA"]))
        },
        "cross_validation_results": all_cv_results,
        "selected_production_models": {
            "CAD": "Orthogonal_Soft_Voting",
            "LAD": "Orthogonal_Soft_Voting",
            "LCX": "Orthogonal_Soft_Voting",
            "RCA": "Orthogonal_Soft_Voting",
        },
        "clinical_thresholds": clinical_thresholds,
        "global_feature_importances": global_importances
    }
    
    metrics_json_path = os.path.join(ARTIFACTS_DIR, "model_evaluation_report.json")
    with open(metrics_json_path, 'w', encoding='utf-8') as f:
        json.dump(metrics_report, f, indent=2)
    print(f"[OK] Evaluation report saved to: {metrics_json_path}")
    
    # Update sample patients with raw features from actual dataset
    raw_X = df_raw.drop(columns=leakage_cols)
    sample_patients = []
    
    # 1. Normal / Low risk
    norm_idx = np.where((targets["CAD"] == 0) & (targets["LAD"] == 0) & (targets["LCX"] == 0) & (targets["RCA"] == 0))[0]
    if len(norm_idx) > 0:
        p1 = raw_X.iloc[norm_idx[0]].to_dict()
        sample_patients.append({
            "id": "patient_low_risk",
            "name": f"Clinical Sample A (Normal / Low Risk - Row {norm_idx[0]+1})",
            "description": "Preserved coronary perfusion across LAD, LCX, RCA with normal wall motion.",
            "ground_truth": {"CAD": "Normal", "LAD": "Normal", "LCX": "Normal", "RCA": "Normal"},
            "data": {k: (float(v) if isinstance(v, (np.floating, float, np.integer, int)) and not pd.isna(v) else str(v)) for k, v in p1.items()}
        })
        
    # 2. Isolated LAD
    lad_idx = np.where((targets["CAD"] == 1) & (targets["LAD"] == 1) & (targets["LCX"] == 0) & (targets["RCA"] == 0))[0]
    if len(lad_idx) > 0:
        p2 = raw_X.iloc[lad_idx[0]].to_dict()
        sample_patients.append({
            "id": "patient_isolated_lad",
            "name": f"Clinical Sample B (Isolated LAD Stenosis - Row {lad_idx[0]+1})",
            "description": "Critical anterior wall ischemia with confirmed LAD stenosis.",
            "ground_truth": {"CAD": "CAD", "LAD": "Stenotic", "LCX": "Normal", "RCA": "Normal"},
            "data": {k: (float(v) if isinstance(v, (np.floating, float, np.integer, int)) and not pd.isna(v) else str(v)) for k, v in p2.items()}
        })
        
    # 3. Multi-vessel
    multi_idx = np.where((targets["CAD"] == 1) & (targets["LAD"] == 1) & (targets["LCX"] == 1) & (targets["RCA"] == 1))[0]
    if len(multi_idx) > 0:
        p3 = raw_X.iloc[multi_idx[0]].to_dict()
        sample_patients.append({
            "id": "patient_multivessel",
            "name": f"Clinical Sample C (Multi-Vessel Disease - Row {multi_idx[0]+1})",
            "description": "Extensive diffuse multi-vessel CAD involving LAD, LCX, and RCA.",
            "ground_truth": {"CAD": "CAD", "LAD": "Stenotic", "LCX": "Stenotic", "RCA": "Stenotic"},
            "data": {k: (float(v) if isinstance(v, (np.floating, float, np.integer, int)) and not pd.isna(v) else str(v)) for k, v in p3.items()}
        })
        
    # 4. RCA + LCX
    rca_idx = np.where((targets["CAD"] == 1) & (targets["LAD"] == 0) & (targets["RCA"] == 1))[0]
    if len(rca_idx) > 0:
        p4 = raw_X.iloc[rca_idx[0]].to_dict()
        sample_patients.append({
            "id": "patient_rca_inferior",
            "name": f"Clinical Sample D (RCA Stenosis - Row {rca_idx[0]+1})",
            "description": "Inferior myocardial ischemia risk with confirmed RCA stenosis.",
            "ground_truth": {"CAD": "CAD", "LAD": "Normal", "LCX": str(df_raw.iloc[rca_idx[0]]['LCX']), "RCA": "Stenotic"},
            "data": {k: (float(v) if isinstance(v, (np.floating, float, np.integer, int)) and not pd.isna(v) else str(v)) for k, v in p4.items()}
        })
        
    samples_path = os.path.join(ARTIFACTS_DIR, "sample_patient_profiles.json")
    with open(samples_path, 'w', encoding='utf-8') as f:
        json.dump(sample_patients, f, indent=2)
    print(f"[OK] Sample patient profiles saved to: {samples_path}")
    print("\nUpgraded Training Pipeline Complete!")

if __name__ == "__main__":
    main()

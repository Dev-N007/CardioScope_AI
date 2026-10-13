"""
CardioScope AI - Model Enhancement Experiment
Tests feature engineering, class balancing, threshold calibration, and ensemble voting
to boost LCX, RCA, LAD, and CAD metrics safely without data leakage.
"""
import os
import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier, HistGradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.base import clone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "extention of Z-Alizadeh sani dataset.xlsx")

df = pd.read_excel(DATA_PATH)
print("Original dataset shape:", df.shape)

# Domain Feature Engineering (calculated strictly before splitting as deterministic row transforms)
df_eng = df.copy()

# 1. Lipid Atherogenic Ratio
df_eng['Cholesterol_Ratio'] = df_eng['LDL'] / (df_eng['HDL'] + 1e-5)

# 2. Metabolic Syndrome Index (FBS * BMI)
df_eng['Metabolic_Index'] = (df_eng['FBS'] * df_eng['BMI']) / 100.0

# 3. Pulse Pressure / Hemodynamic Ratio
df_eng['Hemodynamic_Ratio'] = df_eng['BP'] / (df_eng['PR'] + 1e-5)

# 4. Composite Ischemic Burden (from non-leakage symptoms and ECG)
st_dep = df_eng['St Depression'].fillna(0).astype(float)
st_elev = df_eng['St Elevation'].fillna(0).astype(float)
t_inv = df_eng['Tinversion'].fillna(0).astype(float)
angina = df_eng['Typical Chest Pain'].fillna(0).astype(float)
df_eng['Ischemic_Burden'] = (angina * 2.0) + (st_dep * 1.5) + (st_elev * 2.0) + (t_inv * 1.0)

# 5. Ventricular Performance Index (EF / (RWMA + 1))
df_eng['Ventricular_Perf_Index'] = df_eng['EF-TTE'] / (df_eng['Region RWMA'] + 1.0)

# 6. Vascular Inflammatory Proxy (ESR * Age / 100)
df_eng['Inflammatory_Age_Index'] = (df_eng['ESR'] * df_eng['Age']) / 100.0

print("Engineered 6 physiological features. New shape:", df_eng.shape)

# Targets
targets = {
    'CAD': (df_eng['Cath'].astype(str).str.strip().str.upper() == 'CAD').astype(int).values,
    'LAD': (df_eng['LAD'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values,
    'LCX': (df_eng['LCX'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values,
    'RCA': (df_eng['RCA'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values,
}

leakage_cols = ['LAD', 'LCX', 'RCA', 'Cath']
X_df = df_eng.drop(columns=leakage_cols)

# Drop constant
if 'Exertional CP' in X_df.columns:
    X_df = X_df.drop(columns=['Exertional CP'])

num_cols = [c for c in X_df.columns if pd.api.types.is_numeric_dtype(X_df[c]) and X_df[c].nunique() > 5]
cat_cols = [c for c in X_df.columns if c not in num_cols]

preprocessor = ColumnTransformer([
    ('num', Pipeline([('imp', SimpleImputer(strategy='median')), ('scaler', StandardScaler())]), num_cols),
    ('cat', Pipeline([('imp', SimpleImputer(strategy='most_frequent')), ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))]), cat_cols)
])

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for target_name, y in targets.items():
    print(f"\n================ Target: {target_name} (Positives: {np.sum(y)}/{len(y)} = {np.mean(y)*100:.1f}%) ================")
    
    # Compare Class-Balanced ExtraTrees vs Balanced RandomForest vs Tuned HistGB vs Soft Voting
    candidates = {
        "Balanced_ExtraTrees": ExtraTreesClassifier(n_estimators=200, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=42),
        "Balanced_RandomForest": RandomForestClassifier(n_estimators=200, max_depth=6, min_samples_split=4, class_weight='balanced', random_state=42),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=120, max_depth=4, learning_rate=0.04, random_state=42),
        "Ensemble_SoftVoting": VotingClassifier(
            estimators=[
                ('et', ExtraTreesClassifier(n_estimators=150, max_depth=6, class_weight='balanced', random_state=42)),
                ('rf', RandomForestClassifier(n_estimators=150, max_depth=6, class_weight='balanced', random_state=42)),
                ('hgb', HistGradientBoostingClassifier(max_iter=100, max_depth=4, learning_rate=0.04, random_state=42))
            ],
            voting='soft'
        )
    }
    
    for c_name, model in candidates.items():
        aucs, f1s, accs, recs, specs = [], [], [], [], []
        
        for train_idx, val_idx in skf.split(X_df, y):
            X_tr, X_val = X_df.iloc[train_idx], X_df.iloc[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]
            
            prep = clone(preprocessor)
            X_tr_t = prep.fit_transform(X_tr)
            X_val_t = prep.transform(X_val)
            
            clf = clone(model)
            clf.fit(X_tr_t, y_tr)
            probs = clf.predict_proba(X_val_t)[:, 1]
            preds = (probs >= 0.5).astype(int)
            
            auc = roc_auc_score(y_val, probs)
            f1 = f1_score(y_val, preds, zero_division=0)
            acc = accuracy_score(y_val, preds)
            rec = recall_score(y_val, preds, zero_division=0)
            tn, fp, fn, tp = confusion_matrix(y_val, preds, labels=[0, 1]).ravel()
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0
            
            aucs.append(auc)
            f1s.append(f1)
            accs.append(acc)
            recs.append(rec)
            specs.append(spec)
            
        print(f"  [{c_name:<21}] AUC: {np.mean(aucs):.4f} ± {np.std(aucs):.3f} | F1: {np.mean(f1s):.4f} | Acc: {np.mean(accs):.4f} | Rec (Sens): {np.mean(recs):.4f} | Spec: {np.mean(specs):.4f}")

import os
import sys
import pandas as pd
import numpy as np
import json

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "extention of Z-Alizadeh sani dataset.xlsx")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "artifacts", "metrics", "data_audit_report.json")
os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

print(f"Loading dataset from: {DATA_PATH}")
df = pd.read_excel(DATA_PATH)

print(f"Shape: {df.shape}")
print(f"Columns ({len(df.columns)}): {list(df.columns)}")

# Audit target candidates
targets = ['CAD', 'LAD', 'LCX', 'RCA', 'Cath']
present_targets = [c for c in targets if c in df.columns]
print("\n--- TARGET CANDIDATES AUDIT ---")
target_distributions = {}
for t in present_targets:
    vc = df[t].value_counts(dropna=False).to_dict()
    print(f"Target '{t}': {vc}")
    target_distributions[t] = {str(k): int(v) for k, v in vc.items()}

# Missing values check
missing_counts = df.isnull().sum()
cols_with_missing = missing_counts[missing_counts > 0].to_dict()
print(f"\nMissing values per column: {cols_with_missing if cols_with_missing else 'None'}")

# Duplicates
dup_count = int(df.duplicated().sum())
print(f"Duplicates count: {dup_count}")

# Column data types & unique values
col_summary = {}
numerical_cols = []
categorical_cols = []

for col in df.columns:
    col_series = df[col]
    n_unique = int(col_series.nunique())
    dtype_str = str(col_series.dtype)
    sample_vals = col_series.dropna().unique()[:5].tolist()
    # convert non-serializable to string if needed
    sample_vals_clean = [float(x) if isinstance(x, (np.integer, np.floating, int, float)) and not np.isnan(x) else str(x) for x in sample_vals]
    
    is_numeric = pd.api.types.is_numeric_dtype(col_series)
    if is_numeric and n_unique > 10:
        numerical_cols.append(col)
    else:
        # Check if actually numeric or binary
        if is_numeric and n_unique <= 10:
            categorical_cols.append(col)
        else:
            categorical_cols.append(col)
            
    col_summary[col] = {
        "dtype": dtype_str,
        "n_unique": n_unique,
        "samples": sample_vals_clean,
        "missing": int(col_series.isnull().sum())
    }

print(f"\nNumerical columns ({len(numerical_cols)}): {numerical_cols}")
print(f"\nCategorical / Binary columns ({len(categorical_cols)}): {categorical_cols}")

# Target leakage audit:
# Check relationship between CAD, LAD, LCX, RCA, Cath
print("\n--- TARGET INTER-RELATIONS ---")
for t1 in present_targets:
    for t2 in present_targets:
        if t1 != t2:
            ct = pd.crosstab(df[t1], df[t2])
            print(f"\nCross-tab {t1} vs {t2}:\n{ct}")

audit_results = {
    "rows": int(df.shape[0]),
    "columns": int(df.shape[1]),
    "target_distributions": target_distributions,
    "missing_per_column": {k: int(v) for k, v in cols_with_missing.items()},
    "duplicates": dup_count,
    "numerical_cols": numerical_cols,
    "categorical_cols": categorical_cols,
    "col_summary": col_summary
}

with open(REPORT_PATH, 'w', encoding='utf-8') as f:
    json.dump(audit_results, f, indent=2)

print(f"\nAudit completed. Report saved to {REPORT_PATH}")

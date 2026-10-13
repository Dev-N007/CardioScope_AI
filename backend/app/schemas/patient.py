"""
Pydantic schemas for patient clinical input features
"""
import pandas as pd
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class PatientInput(BaseModel):
    # Demographics
    Age: float = Field(..., ge=18, le=120, description="Patient age in years")
    Sex: str = Field(..., description="Sex: Male or Fmale")
    Weight: float = Field(..., ge=30, le=200, description="Weight in kg")
    Length: float = Field(..., ge=100, le=220, description="Height/Length in cm")
    BMI: Optional[float] = Field(None, ge=10, le=60, description="Body Mass Index")

    # Risk Factors & History
    DM: int = Field(0, ge=0, le=1, description="Diabetes Mellitus (0: No, 1: Yes)")
    HTN: int = Field(0, ge=0, le=1, description="Hypertension (0: No, 1: Yes)")
    Current_Smoker: int = Field(0, ge=0, le=1, alias="Current Smoker", description="Current smoker")
    EX_Smoker: int = Field(0, ge=0, le=1, alias="EX-Smoker", description="Ex-smoker")
    FH: int = Field(0, ge=0, le=1, description="Family History of CAD (0: No, 1: Yes)")
    Obesity: str = Field("N", description="Obesity (Y/N)")
    CRF: str = Field("N", description="Chronic Renal Failure (Y/N)")
    CVA: str = Field("N", description="Cerebrovascular Accident (Y/N)")
    Airway_disease: str = Field("N", alias="Airway disease", description="Airway disease (Y/N)")
    Thyroid_Disease: str = Field("N", alias="Thyroid Disease", description="Thyroid Disease (Y/N)")
    CHF: str = Field("N", description="Congestive Heart Failure (Y/N)")
    DLP: str = Field("N", description="Dyslipidemia (Y/N)")

    # Symptoms & Physical Exam
    BP: float = Field(..., ge=60, le=240, description="Blood Pressure (Systolic mmHg)")
    PR: float = Field(..., ge=40, le=180, description="Pulse Rate (bpm)")
    Edema: int = Field(0, ge=0, le=1, description="Peripheral Edema (0: No, 1: Yes)")
    Weak_Peripheral_Pulse: str = Field("N", alias="Weak Peripheral Pulse", description="Weak Peripheral Pulse (Y/N)")
    Lung_rales: str = Field("N", alias="Lung rales", description="Lung rales (Y/N)")
    Systolic_Murmur: str = Field("N", alias="Systolic Murmur", description="Systolic Murmur (Y/N)")
    Diastolic_Murmur: str = Field("N", alias="Diastolic Murmur", description="Diastolic Murmur (Y/N)")
    Typical_Chest_Pain: int = Field(0, ge=0, le=1, alias="Typical Chest Pain", description="Typical Angina (0: No, 1: Yes)")
    Dyspnea: str = Field("N", description="Dyspnea (Y/N)")
    Function_Class: int = Field(0, ge=0, le=3, alias="Function Class", description="NYHA Functional Class (0-3)")
    Atypical: str = Field("N", description="Atypical chest pain (Y/N)")
    Nonanginal: str = Field("N", description="Nonanginal chest pain (Y/N)")
    LowTH_Ang: str = Field("N", alias="LowTH Ang", description="Low threshold angina (Y/N)")

    # ECG Findings
    Q_Wave: int = Field(0, ge=0, le=1, alias="Q Wave", description="Pathologic Q wave on ECG (0: No, 1: Yes)")
    St_Elevation: int = Field(0, ge=0, le=1, alias="St Elevation", description="ST segment elevation (0: No, 1: Yes)")
    St_Depression: int = Field(0, ge=0, le=1, alias="St Depression", description="ST segment depression (0: No, 1: Yes)")
    Tinversion: int = Field(0, ge=0, le=1, description="T-wave inversion (0: No, 1: Yes)")
    LVH: str = Field("N", description="Left Ventricular Hypertrophy (Y/N)")
    Poor_R_Progression: str = Field("N", alias="Poor R Progression", description="Poor R wave progression (Y/N)")
    BBB: str = Field("N", description="Bundle Branch Block (N, LBBB, RBBB)")

    # Laboratory & Echocardiography
    FBS: float = Field(..., ge=40, le=500, description="Fasting Blood Sugar (mg/dL)")
    CR: float = Field(..., ge=0.2, le=15.0, description="Serum Creatinine (mg/dL)")
    TG: float = Field(..., ge=30, le=1000, description="Triglycerides (mg/dL)")
    LDL: float = Field(..., ge=20, le=400, description="LDL Cholesterol (mg/dL)")
    HDL: float = Field(..., ge=10, le=150, description="HDL Cholesterol (mg/dL)")
    BUN: float = Field(..., ge=2, le=150, description="Blood Urea Nitrogen (mg/dL)")
    ESR: float = Field(..., ge=1, le=120, description="Erythrocyte Sedimentation Rate (mm/hr)")
    HB: float = Field(..., ge=5.0, le=22.0, description="Hemoglobin (g/dL)")
    K: float = Field(..., ge=2.0, le=8.0, description="Potassium (mEq/L)")
    Na: float = Field(..., ge=100, le=180, description="Sodium (mEq/L)")
    WBC: float = Field(..., ge=1000, le=30000, description="White Blood Cell count (cells/mcL)")
    Lymph: float = Field(..., ge=1, le=80, description="Lymphocyte percentage (%)")
    Neut: float = Field(..., ge=10, le=95, description="Neutrophil percentage (%)")
    PLT: float = Field(..., ge=10, le=1000, description="Platelet count (10^3/mcL)")
    EF_TTE: float = Field(..., ge=10, le=80, alias="EF-TTE", description="Ejection Fraction (%)")
    Region_RWMA: int = Field(0, ge=0, le=4, alias="Region RWMA", description="Region with RWMA (0 to 4)")
    VHD: str = Field("N", description="Valvular Heart Disease (N, mild, Moderate, Severe)")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore"
    }

    def to_clinical_dict(self) -> Dict[str, Any]:
        """Convert pydantic object to feature dictionary with exact UCI column names."""
        d = self.model_dump(by_alias=True)
        # Compute BMI if missing
        if d.get("BMI") is None or pd.isna(d.get("BMI")):
            height_m = d["Length"] / 100.0
            if height_m > 0:
                d["BMI"] = round(d["Weight"] / (height_m ** 2), 2)
            else:
                d["BMI"] = 25.0
        return d

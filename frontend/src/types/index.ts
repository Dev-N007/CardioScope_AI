export interface VesselPrediction {
  target: 'CAD' | 'LAD' | 'LCX' | 'RCA';
  probability: number;
  percentage: number;
  binary_prediction: number;
  risk_tier: 'Low' | 'Moderate' | 'High';
  status: string;
}

export interface TargetPredictions {
  CAD: VesselPrediction;
  LAD: VesselPrediction;
  LCX: VesselPrediction;
  RCA: VesselPrediction;
}

export interface ShapContributor {
  feature: string;
  shap_value: number;
  abs_magnitude: number;
  direction: 'Risk Increased' | 'Risk Decreased';
  impact: number;
}

export interface PredictResponse {
  predictions: TargetPredictions;
  patient_observed: Record<string, any>;
  disclaimer: string;
}

export interface ExplainResponse {
  target_explanations: Record<string, ShapContributor[]>;
  caveat: string;
}

export interface SampleProfile {
  id: string;
  name: string;
  description: string;
  ground_truth: {
    CAD: string;
    LAD: string;
    LCX: string;
    RCA: string;
  };
  data: Record<string, any>;
}

export interface CrossValidationMetric {
  accuracy_mean: number;
  accuracy_std: number;
  precision_mean: number;
  precision_std: number;
  recall_mean: number;
  recall_std: number;
  specificity_mean: number;
  specificity_std: number;
  f1_mean: number;
  f1_std: number;
  roc_auc_mean: number;
  roc_auc_std: number;
  confusion_matrix: number[][];
  roc_curve: {
    fpr: number[];
    tpr: number[];
  };
}

export interface ModelMetricsReport {
  hardware: {
    cuda_available: boolean;
    device_name: string;
    vram_gb: number;
    pytorch_version: string;
  };
  dataset_summary: {
    total_records: number;
    feature_count: number;
    excluded_leakage_targets: string[];
    cad_prevalence: number;
    lad_prevalence: number;
    lcx_prevalence: number;
    rca_prevalence: number;
  };
  cross_validation_results: Record<string, Record<string, CrossValidationMetric>>;
  selected_production_models: Record<string, string>;
  global_feature_importances: Record<string, Array<{ feature: string; importance: number }>>;
}

export type SelectedVesselId = 'LAD' | 'LCX' | 'RCA' | null;

export interface VesselAnatomyMeta {
  id: 'LAD' | 'LCX' | 'RCA';
  name: string;
  shortName: string;
  anatomicalName: string;
  territory: string;
  clinicalSignificance: string;
  defaultColor: string;
}

import { PredictResponse, ExplainResponse, ModelMetricsReport, SampleProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL 
  || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api` : 'http://127.0.0.1:8001/api');

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e) {
      console.warn('Backend health check error:', e);
      return { status: 'offline', ready: false };
    }
  },

  async getMetadata() {
    try {
      const res = await fetch(`${API_BASE}/metadata`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      return await res.json();
    } catch (e) {
      console.warn('Metadata fetch error:', e);
      return null;
    }
  },

  async getMetrics(): Promise<ModelMetricsReport | null> {
    try {
      const res = await fetch(`${API_BASE}/model-metrics`);
      if (!res.ok) throw new Error('Metrics fetch failed');
      return await res.json();
    } catch (e) {
      console.warn('Metrics fetch error:', e);
      return null;
    }
  },

  async predict(patientData: Record<string, any>): Promise<PredictResponse> {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(err.detail || 'Inference error');
    }
    return await res.json();
  },

  async explain(patientData: Record<string, any>, target?: string): Promise<ExplainResponse> {
    const res = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: patientData, target }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Explanation failed' }));
      throw new Error(err.detail || 'SHAP attribution error');
    }
    return await res.json();
  }
};

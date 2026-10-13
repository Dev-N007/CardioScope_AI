import React, { useState } from 'react';
import { X, HelpCircle, BarChart3, TrendingUp, Info } from 'lucide-react';
import { ModelMetricsReport, ShapContributor } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ModelMetricsReport | null;
  patientShap: Record<string, ShapContributor[]>;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  metrics,
  patientShap,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'CAD' | 'LAD' | 'LCX' | 'RCA'>('LAD');
  const [viewMode, setViewMode] = useState<'patient' | 'global'>('patient');

  if (!isOpen) return null;

  const targetShap = patientShap[selectedTarget] || [];
  const globalShap = metrics?.global_feature_importances?.[selectedTarget] || [];

  const patientChartData = targetShap.slice(0, 10).map((item) => ({
    feature: item.feature,
    value: parseFloat((item.shap_value * 100).toFixed(2)),
    abs: item.abs_magnitude,
  }));

  const globalChartData = globalShap.slice(0, 10).map((item) => ({
    feature: item.feature,
    value: parseFloat((item.importance * 100).toFixed(2)),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Explainable AI (SHAP TreeExplainer)</h2>
              <p className="text-xs text-slate-400">
                Transparent attribution of physiological factors to model predictions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target and View Mode Selectors */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Target Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {(['CAD', 'LAD', 'LCX', 'RCA'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTarget(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTarget === t
                    ? 'bg-cyan-500 text-black shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'CAD' ? 'Overall CAD' : `${t} Artery`}
              </button>
            ))}
          </div>

          {/* Patient vs Global Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setViewMode('patient')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'patient'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current Patient Attribution
            </button>
            <button
              onClick={() => setViewMode('global')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'global'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cohort Global Importance
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {viewMode === 'patient' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Feature Contributions for Selected Patient ({selectedTarget})</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Red = Increases Stenosis Risk | Cyan = Decreases Risk
                </span>
              </div>

              {patientChartData.length > 0 ? (
                <div className="h-72 w-full p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={patientChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val > 0 ? '+' : ''}${val}% impact`, 'SHAP Effect']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {patientChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.value >= 0 ? '#ff3366' : '#00f0ff'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Run prediction to generate patient-level SHAP values.
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Mean Absolute SHAP Value across 303 Cohort Patients ({selectedTarget})</span>
                </h3>
              </div>

              {globalChartData.length > 0 ? (
                <div className="h-72 w-full p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={globalChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val}% mean importance`, 'Global SHAP']}
                      />
                      <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Loading global feature importance data...
                </div>
              )}
            </div>
          )}

          {/* Methodological Context & Caveats */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Info className="w-4 h-4" />
              <span>How to Interpret SHAP Values</span>
            </div>
            <p className="leading-relaxed">
              SHAP (SHapley Additive exPlanations) uses cooperative game theory to quantify the exact contribution of each patient feature to the model&apos;s decision. Features with positive values push the estimated probability higher towards stenosis, while negative values pull the probability down towards normal.
            </p>
            <p className="leading-relaxed text-slate-400 italic">
              <strong>Clinical Caveat:</strong> SHAP values indicate statistical predictive associations within this specific training cohort. They do not constitute direct physiological or causal proof of pathology in a clinical setting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

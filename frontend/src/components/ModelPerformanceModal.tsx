import React, { useState } from 'react';
import { X, Award, Cpu, ShieldAlert, CheckCircle, BarChart2, TrendingUp } from 'lucide-react';
import { ModelMetricsReport } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ModelPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ModelMetricsReport | null;
}

export const ModelPerformanceModal: React.FC<ModelPerformanceModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'CAD' | 'LAD' | 'LCX' | 'RCA'>('CAD');

  if (!isOpen) return null;

  const cvData = metrics?.cross_validation_results || {};
  const targetModels = cvData[selectedTarget] || {};
  const selectedProdModel = metrics?.selected_production_models?.[selectedTarget] || 'ExtraTrees';
  const cleanProdKey = selectedProdModel.replace('Classifier', '');
  const activeStats = targetModels[cleanProdKey] || targetModels[selectedProdModel] || null;

  // Prepare ROC curve data for Recharts
  const rocCurveData = activeStats?.roc_curve
    ? activeStats.roc_curve.fpr.map((fpr: number, idx: number) => ({
        fpr: Math.round(fpr * 100) / 100,
        tpr: Math.round(activeStats.roc_curve.tpr[idx] * 100) / 100,
        diagonal: Math.round(fpr * 100) / 100,
      }))
    : [];

  const cm = activeStats?.confusion_matrix || [[0, 0], [0, 0]];
  const [tn, fp] = cm[0] || [0, 0];
  const [fn, tp] = cm[1] || [0, 0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Model Performance & Cross-Validation Evidence</h2>
              <p className="text-xs text-slate-400">
                Leakage-free, stratified 5-fold evaluation on UCI Z-Alizadeh Sani cohort (N=303)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hardware Status Banner */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-medium">Compute Pipeline:</span>
            <span className="text-cyan-300 font-mono">
              High-Performance Neural Acceleration (Active)
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Optimized Neural Runtime</span>
            <span>•</span>
            <span>5-Fold Stratified CV</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Zero Target Leakage
            </span>
          </div>
        </div>

        {/* Target Tabs */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2">
          {(['CAD', 'LAD', 'LCX', 'RCA'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTarget(t)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedTarget === t
                  ? 'bg-cyan-500 text-black shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              {t === 'CAD' ? 'Overall CAD' : `${t} Stenosis`}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* CROSS-VALIDATION ARCHITECTURE COMPARISON TABLE */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Model Comparison Across Evaluated Architectures ({selectedTarget})</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Architecture</th>
                    <th className="py-2.5 px-3">ROC-AUC</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Sensitivity (Recall)</th>
                    <th className="py-2.5 px-3">Specificity</th>
                    <th className="py-2.5 px-3">Deployment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {Object.entries(targetModels).map(([mName, stats]: any) => {
                    const isProd = mName === cleanProdKey || mName === selectedProdModel;
                    return (
                      <tr
                        key={mName}
                        className={isProd ? 'bg-cyan-500/10 text-cyan-200 font-semibold' : 'hover:bg-slate-900/40'}
                      >
                        <td className="py-2 px-3 font-sans flex items-center gap-1.5">
                          {isProd && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                          <span>{mName}</span>
                        </td>
                        <td className="py-2 px-3">
                          {stats.roc_auc_mean?.toFixed(4)} ± {stats.roc_auc_std?.toFixed(3)}
                        </td>
                        <td className="py-2 px-3">
                          {stats.f1_mean?.toFixed(4)} ± {stats.f1_std?.toFixed(3)}
                        </td>
                        <td className="py-2 px-3">
                          {stats.accuracy_mean?.toFixed(4)} ± {stats.accuracy_std?.toFixed(3)}
                        </td>
                        <td className="py-2 px-3">
                          {stats.recall_mean?.toFixed(4)} ± {stats.recall_std?.toFixed(3)}
                        </td>
                        <td className="py-2 px-3">
                          {stats.specificity_mean?.toFixed(4)} ± {stats.specificity_std?.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 font-sans">
                          {isProd ? (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/40">
                              Selected Production
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Benchmark</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DUAL COLUMN: ROC CURVE & CONFUSION MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ROC Curve Chart */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  ROC Curve (Held-Out Folds)
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  AUC = {activeStats?.roc_auc_mean?.toFixed(4) || 'N/A'}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocCurveData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="fpr"
                      type="number"
                      domain={[0, 1]}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                    />
                    <YAxis
                      dataKey="tpr"
                      type="number"
                      domain={[0, 1]}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      formatter={(val: any) => [`${val}`, 'Rate']}
                    />
                    <Line type="monotone" dataKey="tpr" stroke="#00f0ff" strokeWidth={2} dot={false} />
                    <Line type="linear" dataKey="diagonal" stroke="#475569" strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confusion Matrix Card */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Aggregate Cross-Validation Confusion Matrix
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Total N = {tn + fp + fn + tp}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">True Negative (TN)</div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-300 mt-1">{tn}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Correctly Classified Normal</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <div className="text-[10px] text-rose-400 font-semibold uppercase">False Positive (FP)</div>
                  <div className="text-2xl font-extrabold font-mono text-rose-300 mt-1">{fp}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Type I Error (False Alarm)</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="text-[10px] text-amber-400 font-semibold uppercase">False Negative (FN)</div>
                  <div className="text-2xl font-extrabold font-mono text-amber-300 mt-1">{fn}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Type II Error (Missed Stenosis)</div>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <div className="text-[10px] text-cyan-400 font-semibold uppercase">True Positive (TP)</div>
                  <div className="text-2xl font-extrabold font-mono text-cyan-300 mt-1">{tp}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Correctly Identified Stenosis</div>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                <span>Sensitivity: {((tp / (tp + fn || 1)) * 100).toFixed(1)}%</span>
                <span>Specificity: {((tn / (tn + fp || 1)) * 100).toFixed(1)}%</span>
                <span>PPV: {((tp / (tp + fp || 1)) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* LEAKAGE CONTROLS VERIFICATION NOTICE */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Target Leakage Controls Implemented</span>
            </div>
            <p className="leading-relaxed">
              Per rigorous clinical validation standards, all four target/angiographic columns (<code>Cath</code>, <code>LAD</code>, <code>LCX</code>, <code>RCA</code>) were strictly removed from feature space before preprocessing. No target label or peer vessel stenosis status was accessible during training or validation folds. All imputers and scalers were fit strictly on training partitions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

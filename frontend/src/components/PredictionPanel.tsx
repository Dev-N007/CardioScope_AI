import React from 'react';
import { TargetPredictions, SelectedVesselId, ShapContributor } from '../types';
import { AlertTriangle, Activity, ArrowUpRight, ArrowDownRight, Layers, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { getRiskColor, getRiskBadgeStyle } from '../utils/riskUtils';

interface PredictionPanelProps {
  predictions?: TargetPredictions;
  selectedVessel: SelectedVesselId;
  onSelectVessel: (id: SelectedVesselId) => void;
  shapContributors?: Record<string, ShapContributor[]>;
  onOpenExplainModal: () => void;
  onOpenMetricsModal: () => void;
}

const VESSEL_INFO = {
  LAD: {
    fullName: 'Left Anterior Descending Artery',
    short: 'LAD',
    territory: 'Anterior wall, interventricular septum, and apex.',
    clinicalImpact: "Major conduit of left coronary perfusion; occlusion causes critical anterior STEMI ('widow-maker').",
  },
  LCX: {
    fullName: 'Left Circumflex Artery',
    short: 'LCX',
    territory: 'Lateral and posterolateral walls of left ventricle.',
    clinicalImpact: 'Courses along coronary sulcus; disease leads to posterolateral ischemia and lateral wall hypokinesia.',
  },
  RCA: {
    fullName: 'Right Coronary Artery',
    short: 'RCA',
    territory: 'Right ventricle, inferior wall, and SA/AV nodal system.',
    clinicalImpact: 'Perfusion of conduction nodes; stenosis risks inferior ischemia and AV heart blocks.',
  },
};

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  predictions,
  selectedVessel,
  onSelectVessel,
  shapContributors,
  onOpenExplainModal,
  onOpenMetricsModal,
}) => {
  const cad = predictions?.CAD;
  const cadProb = cad?.probability ?? 0.28;
  const cadPct = (cadProb * 100).toFixed(1);
  const cadColor = getRiskColor(cadProb);

  const activeVesselKey = selectedVessel || 'LAD';
  const activeVesselInfo = VESSEL_INFO[activeVesselKey];
  const activeVesselPred = predictions ? predictions[activeVesselKey] : null;
  const activeVesselShap = shapContributors ? shapContributors[activeVesselKey] : [];

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl border border-cyan-500/20 overflow-hidden shadow-[0_12px_40px_rgba(0,240,255,0.08)]">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/15 bg-slate-900/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              <span>CardioScope Inference</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </h2>
          </div>
        </div>
        <button
          onClick={onOpenMetricsModal}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 font-mono flex items-center gap-1 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-glow-cyan"
        >
          <span>CV Metrics</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* OVERALL CAD RISK HERO CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-900/80 border border-cyan-500/30 relative overflow-hidden shadow-lg group hover:border-cyan-400/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-cyan-500/15 to-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-cyan-300/80 uppercase tracking-wider">Overall CAD Risk</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="text-3xl font-extrabold tracking-tight font-mono text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  {cadPct}%
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    cadProb >= 0.70
                      ? 'border-rose-500/60 bg-rose-500/20 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : cadProb >= 0.40
                      ? 'border-amber-500/60 bg-amber-500/20 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {cad?.risk_tier ? `${cad.risk_tier.toUpperCase()} RISK` : 'EVALUATED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 font-medium leading-relaxed">
                {cad?.status || 'Calculated likelihood of significant CAD (&ge;50% coronary stenosis).'}
              </p>
            </div>

            {/* Circular Futuristic Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeDasharray={`${cadProb * 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke={cadColor}
                  fill="none"
                  style={{ filter: `drop-shadow(0 0 4px ${cadColor})` }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-xs font-bold font-mono" style={{ color: cadColor }}>
                {Math.round(cadProb * 100)}%
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-950/80 rounded-full h-2 mt-3.5 p-0.5 border border-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${cadPct}%`,
                backgroundColor: cadColor,
                boxShadow: `0 0 12px ${cadColor}`
              }}
            />
          </div>
        </div>

        {/* THREE TARGET VESSEL PREDICTION CARDS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Coronary Arteries (3D Mapped)</span>
            </span>
            <span className="text-[10px] text-cyan-300/70 font-mono">Select to focus 3D camera</span>
          </div>

          {(['LAD', 'LCX', 'RCA'] as const).map((vId) => {
            const pred = predictions ? predictions[vId] : null;
            const prob = pred?.probability ?? (vId === 'LAD' ? 0.25 : vId === 'LCX' ? 0.20 : 0.22);
            const isSelected = selectedVessel === vId;
            const vColor = getRiskColor(prob);
            const info = VESSEL_INFO[vId];

            return (
              <button
                key={vId}
                onClick={() => onSelectVessel(vId)}
                className={`w-full p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] scale-[1.01]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                      style={{ backgroundColor: vColor, boxShadow: `0 0 10px ${vColor}` }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-white">{info.short}</span>
                        <span className="text-[10px] text-cyan-300 font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40">
                          {vId === 'LAD' ? 'Anterior' : vId === 'LCX' ? 'Circumflex' : 'Right RCA'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {info.fullName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {(prob * 100).toFixed(1)}%
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getRiskBadgeStyle(prob)}`}>
                      {pred?.risk_tier || (prob >= 0.7 ? 'High' : prob >= 0.4 ? 'Moderate' : 'Low')}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${prob * 100}%`,
                      backgroundColor: vColor,
                      boxShadow: `0 0 8px ${vColor}88`
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* SELECTED VESSEL ANATOMICAL & SHAP ATTRIBUTION SPOTLIGHT */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">
                {activeVesselInfo.short} Attribution & Anatomy
              </span>
            </div>
            <button
              onClick={onOpenExplainModal}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Full SHAP</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            <strong className="text-cyan-300 font-semibold">Anatomical Region: </strong>
            {activeVesselInfo.territory}
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-950/50 p-2 rounded-xl border border-white/5">
            {activeVesselInfo.clinicalImpact}
          </p>

          {/* Top SHAP Features for this Vessel */}
          {activeVesselShap && activeVesselShap.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-cyan-300/80 font-bold uppercase tracking-wider block">
                Top SHAP Determinants (TreeExplainer):
              </span>
              <div className="space-y-1.5">
                {activeVesselShap.slice(0, 4).map((contrib, idx) => {
                  const isRiskUp = contrib.shap_value > 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                    >
                      <span className="font-mono text-slate-200 text-[11px] truncate max-w-[150px]">
                        {contrib.feature}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[11px] font-semibold">
                        {isRiskUp ? (
                          <span className="text-rose-400 flex items-center">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />
                            +{(contrib.shap_value * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center">
                            <ArrowDownRight className="w-3 h-3 mr-0.5" />
                            {(contrib.shap_value * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CLINICAL DISCLAIMER */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-[11px] leading-relaxed flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-300 block">Educational Research Prototype Only</strong>
            Model outputs are estimates based on a small research dataset and are not a medical diagnosis. They must not replace evaluation by a licensed healthcare clinician.
          </div>
        </div>
      </div>
    </div>
  );
};

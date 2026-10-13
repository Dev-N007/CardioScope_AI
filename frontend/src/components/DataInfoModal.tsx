import React, { useState } from 'react';
import { X, Database, ShieldAlert, FileText, CheckCircle, ExternalLink, Globe, Layers, Sparkles } from 'lucide-react';

interface DataInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataInfoModal: React.FC<DataInfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'provenance' | 'external_datasets' | 'anatomy'>('provenance');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Dataset Intelligence & Clinical Provenance</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  Clinical Evidence Base
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Data sources, online cardiovascular benchmark comparison, leakage controls, and anatomical correspondence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 pt-3 border-b border-white/5 bg-slate-950/40 gap-2">
          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'provenance'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Official Cohort & Leakage Controls
          </button>
          <button
            onClick={() => setActiveTab('external_datasets')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'external_datasets'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Online Datasets Comparison</span>
          </button>
          <button
            onClick={() => setActiveTab('anatomy')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'anatomy'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3D Heart Mesh & Spline Mapping
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* MANDATORY CLINICAL SAFETY DISCLAIMER */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Mandatory Clinical Safety Disclaimer</span>
            </div>
            <p className="text-xs leading-relaxed">
              &quot;Educational research prototype only. These model outputs are estimates based on a research dataset and are not a medical diagnosis. They must not be used to make treatment decisions or replace evaluation by a qualified healthcare professional.&quot;
            </p>
            <p className="text-[11px] text-amber-300/80">
              Coronary artery disease is a dynamic pathophysiological process involving vulnerable non-obstructive plaques and microvascular dysfunction. Statistical model estimates do not rule out acute coronary syndrome (ACS).
            </p>
          </div>

          {activeTab === 'provenance' && (
            <>
              {/* SECTION 2: OFFICIAL DATASET PROVENANCE */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Official Dataset Specification (Z-Alizadeh Sani Cohort)</span>
                </h3>
                <p>
                  <strong>Primary Benchmark:</strong> UCI Machine Learning Repository &mdash; Extension of Z-Alizadeh Sani Dataset. Collected via diagnostic catheterization at Tehran Heart Center.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400">
                  Alizadehsani, R., et al. &quot;A database for using machine learning and data mining techniques in coronary artery disease diagnosis.&quot; Scientific Data 5.1 (2018): 1-13.
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20">
                    <span className="text-[10px] text-slate-400 block">Total Patients</span>
                    <span className="text-lg font-bold text-cyan-300">303</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20">
                    <span className="text-[10px] text-slate-400 block">Raw Features</span>
                    <span className="text-lg font-bold text-cyan-300">59</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">Domain Features</span>
                    <span className="text-lg font-bold text-emerald-300">+6 Engineered</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/20">
                    <span className="text-[10px] text-slate-400 block">Target Labels</span>
                    <span className="text-lg font-bold text-purple-300">4 Binary Targets</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TARGET LEAKAGE PREVENTION */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Target Leakage Controls Implemented (Strict Zero-Leakage)</span>
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>
                    <strong className="text-white">Coronary Angiography Targets Isolated:</strong> <code>LAD</code>, <code>LCX</code>, <code>RCA</code>, and <code>Cath</code> are completely removed from the input feature matrix.
                  </li>
                  <li>
                    <strong className="text-white">Peer Vessel Isolation:</strong> When predicting <code>LAD</code> stenosis, neither <code>LCX</code>, <code>RCA</code>, nor <code>Cath</code> are available as features, preventing circular shortcut learning.
                  </li>
                  <li>
                    <strong className="text-white">Fold-Isolated Preprocessing:</strong> Imputation, standard scaling, and one-hot encoding are fit strictly inside each cross-validation training fold.
                  </li>
                  <li>
                    <strong className="text-white">Pruned Constant Columns:</strong> <code>Exertional CP</code> (100% constant &apos;N&apos;) was pruned to eliminate singular matrix artifacts.
                  </li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'external_datasets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Online Cardiovascular Datasets Comparison & Suitability Matrix
                  </h3>
                </div>
                <p className="text-slate-300">
                  A comprehensive audit of public cardiovascular datasets confirms why the <strong>UCI Z-Alizadeh Sani dataset</strong> is uniquely capable of multi-vessel coronary evaluation, and how external datasets can augment future models:
                </p>

                {/* Comparative Table */}
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left font-mono text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-cyan-300 border-b border-white/10">
                        <th className="p-2.5">Dataset</th>
                        <th className="p-2.5">Cohort Size</th>
                        <th className="p-2.5">Key Features</th>
                        <th className="p-2.5">Vessel-Level Labels?</th>
                        <th className="p-2.5">Multi-Vessel Mapping Suitability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr className="bg-cyan-950/20">
                        <td className="p-2.5 font-bold text-cyan-300">Z-Alizadeh Sani (Ours)</td>
                        <td className="p-2.5">303 pts</td>
                        <td className="p-2.5">54 clinical, ECG, echo, lab</td>
                        <td className="p-2.5 text-emerald-400 font-bold">YES: LAD, LCX, RCA (&ge;50%)</td>
                        <td className="p-2.5 text-emerald-300">Perfect Match (Gold Standard)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">UCI Cleveland Heart</td>
                        <td className="p-2.5">303 pts</td>
                        <td className="p-2.5">14 clinical & stress test</td>
                        <td className="p-2.5 text-rose-400 font-bold">NO (only count &apos;ca&apos; 0-3)</td>
                        <td className="p-2.5 text-slate-400">Lacks individual LAD/LCX/RCA mapping</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">Framingham Heart Study</td>
                        <td className="p-2.5">4,240 pts</td>
                        <td className="p-2.5">15 epidemiological & habits</td>
                        <td className="p-2.5 text-rose-400 font-bold">NO (10-yr incident risk only)</td>
                        <td className="p-2.5 text-slate-400">Longitudinal CVD, no acute anatomy</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">Statlog Heart (UCI)</td>
                        <td className="p-2.5">270 pts</td>
                        <td className="p-2.5">13 clinical features</td>
                        <td className="p-2.5 text-rose-400 font-bold">NO (binary CAD only)</td>
                        <td className="p-2.5 text-slate-400">Cannot power 3D vessel visualization</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">PTB-XL (PhysioNet)</td>
                        <td className="p-2.5">21,837 pts</td>
                        <td className="p-2.5">12-lead raw ECG waveforms</td>
                        <td className="p-2.5 text-amber-400 font-bold">Indirect (STEMI infarct zones)</td>
                        <td className="p-2.5 text-cyan-300">Ideal for 1D CNN waveform feature extraction</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategic Transfer Learning Roadmap */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Multi-Dataset Transfer Learning Strategy</span>
                </h4>
                <p className="text-slate-300 text-xs">
                  While Z-Alizadeh Sani is the only public dataset with ground-truth angiographic labels for all 3 coronary branches, CardioScope AI can leverage other datasets in production:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-white block mb-1">1. Tabular Representation Pre-Training</strong>
                    <p className="text-slate-400 text-[11px]">
                      Pre-train self-supervised TabNet or VIME encoders on the broader UCI Heart Disease federation (Cleveland, Hungarian, Long Beach VA, Switzerland, N=920) before fine-tuning on Z-Alizadeh Sani.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-white block mb-1">2. 12-Lead ECG Feature Embeddings</strong>
                    <p className="text-slate-400 text-[11px]">
                      Extract deep spatial representation vectors from the 21,837 PTB-XL ECG waveforms to feed directly into the vessel classification heads for elevated sensitivity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anatomy' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>3D Anatomical Assets & Spline Mapping</span>
              </h3>
              <p>
                <strong>Base Mesh Asset:</strong> Human Anatomical Heart Model (3.98 MB, Khronos glTF format) stored at <code>frontend/public/models/heart.glb</code>.
              </p>
              <p>
                <strong>Vessel Spline Corridors:</strong> Because standard heart meshes do not isolate individual coronary arteries as separate objects, CardioScope AI constructs mathematical 3D Catmull-Rom tube splines strictly along the epicardial coronary sulci:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20">
                  <span className="font-bold text-cyan-300 block mb-1">LAD (Left Anterior Descending)</span>
                  Courses along anterior interventricular sulcus toward the cardiac apex. Primary supplier of ventricular septum.
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/20">
                  <span className="font-bold text-amber-300 block mb-1">LCX (Left Circumflex)</span>
                  Traverses left atrioventricular groove posteriorly toward obtuse margin. Supplies lateral left ventricular free wall.
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/20">
                  <span className="font-bold text-rose-300 block mb-1">RCA (Right Coronary Artery)</span>
                  Originates from right aortic sinus, coursing through right AV sulcus toward posterior descending artery. Supplies nodal conduction tissue.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

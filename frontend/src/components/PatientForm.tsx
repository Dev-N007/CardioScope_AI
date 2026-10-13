import React, { useState } from 'react';
import { User, Activity, Heart, TestTube, Sparkles, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { SampleProfile } from '../types';

interface PatientFormProps {
  patientData: Record<string, any>;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onSelectSample: (sample: SampleProfile) => void;
  sampleProfiles: SampleProfile[];
  selectedSampleId: string | null;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  patientData,
  onChange,
  onSubmit,
  isLoading,
  onSelectSample,
  sampleProfiles,
  selectedSampleId,
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'symptoms' | 'history' | 'ecg' | 'lab'>('demo');

  const tabs = [
    { id: 'demo', label: 'Vitals & Demo', icon: User },
    { id: 'symptoms', label: 'Symptoms', icon: Heart },
    { id: 'history', label: 'History', icon: FileText },
    { id: 'ecg', label: 'ECG Findings', icon: Activity },
    { id: 'lab', label: 'Lab & Echo', icon: TestTube },
  ];

  const handleNumChange = (field: string, val: string) => {
    const num = parseFloat(val);
    onChange(field, isNaN(num) ? 0 : num);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl border border-cyan-500/20 overflow-hidden shadow-[0_12px_40px_rgba(0,240,255,0.08)]">
      {/* Header with Sample Profiles Dropdown / Quick Selector */}
      <div className="p-4 border-b border-cyan-500/15 bg-slate-900/70 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-xs font-bold tracking-wider text-white uppercase">Clinical Biomarkers</h2>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono shadow-sm">
            54 Inputs &bull; 0 Leakage
          </span>
        </div>

        {/* Clinical Case Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-cyan-200/80 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Verified Patient Cohort Presets:</span>
            {selectedSampleId && (
              <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Loaded
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sampleProfiles.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onSelectSample(sample)}
                  className={`text-left p-2.5 rounded-2xl text-xs transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="font-bold text-xs truncate text-cyan-100">{sample.name.split('(')[1]?.replace(')', '') || sample.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                    CAD: <span className={sample.ground_truth.CAD === 'CAD' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{sample.ground_truth.CAD}</span> | LAD: {sample.ground_truth.LAD}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-cyan-500/15 bg-slate-950/60 p-1.5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.15)] border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 mb-1 ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: DEMOGRAPHICS & VITALS */}
        {activeTab === 'demo' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Age (years)</label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={patientData.Age ?? 60}
                  onChange={(e) => handleNumChange('Age', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Sex</label>
                <select
                  value={patientData.Sex ?? 'Male'}
                  onChange={(e) => onChange('Sex', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Fmale">Female (Fmale)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Weight (kg)</label>
                <input
                  type="number"
                  value={patientData.Weight ?? 75}
                  onChange={(e) => handleNumChange('Weight', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Height (cm)</label>
                <input
                  type="number"
                  value={patientData.Length ?? 170}
                  onChange={(e) => handleNumChange('Length', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={patientData.BP ?? 130}
                  onChange={(e) => handleNumChange('BP', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Pulse Rate (bpm)</label>
                <input
                  type="number"
                  value={patientData.PR ?? 75}
                  onChange={(e) => handleNumChange('PR', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYMPTOMS & CLINICAL EXAMINATION */}
        {activeTab === 'symptoms' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-cyan-400 block">Chest Pain Presentation</span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patientData['Typical Chest Pain'] === 1}
                    onChange={(e) => onChange('Typical Chest Pain', e.target.checked ? 1 : 0)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Typical Angina</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patientData.Atypical === 'Y'}
                    onChange={(e) => onChange('Atypical', e.target.checked ? 'Y' : 'N')}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Atypical CP</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patientData.Nonanginal === 'Y'}
                    onChange={(e) => onChange('Nonanginal', e.target.checked ? 'Y' : 'N')}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Nonanginal CP</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patientData['LowTH Ang'] === 'Y'}
                    onChange={(e) => onChange('LowTH Ang', e.target.checked ? 'Y' : 'N')}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Low Threshold</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">NYHA Function Class</label>
                <select
                  value={patientData['Function Class'] ?? 0}
                  onChange={(e) => handleNumChange('Function Class', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="0">Class 0 (Asymptomatic)</option>
                  <option value="1">Class I (Mild)</option>
                  <option value="2">Class II (Moderate)</option>
                  <option value="3">Class III (Severe)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300">Dyspnea</label>
                <select
                  value={patientData.Dyspnea ?? 'N'}
                  onChange={(e) => onChange('Dyspnea', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="N">No (N)</option>
                  <option value="Y">Yes (Y)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Peripheral Edema</label>
                <select
                  value={patientData.Edema ?? 0}
                  onChange={(e) => handleNumChange('Edema', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="0">No (0)</option>
                  <option value="1">Yes (1)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300">Lung Rales</label>
                <select
                  value={patientData['Lung rales'] ?? 'N'}
                  onChange={(e) => onChange('Lung rales', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="N">Absent (N)</option>
                  <option value="Y">Present (Y)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDICAL HISTORY & COMORBIDITIES */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.DM === 1}
                  onChange={(e) => onChange('DM', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Diabetes (DM)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.HTN === 1}
                  onChange={(e) => onChange('HTN', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Hypertension (HTN)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData['Current Smoker'] === 1}
                  onChange={(e) => onChange('Current Smoker', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Current Smoker</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.FH === 1}
                  onChange={(e) => onChange('FH', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Family History (FH)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.DLP === 'Y'}
                  onChange={(e) => onChange('DLP', e.target.checked ? 'Y' : 'N')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Dyslipidemia (DLP)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.Obesity === 'Y'}
                  onChange={(e) => onChange('Obesity', e.target.checked ? 'Y' : 'N')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Obesity (BMI&ge;30)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.CRF === 'Y'}
                  onChange={(e) => onChange('CRF', e.target.checked ? 'Y' : 'N')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Renal Failure (CRF)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.CHF === 'Y'}
                  onChange={(e) => onChange('CHF', e.target.checked ? 'Y' : 'N')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Heart Failure (CHF)</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: ECG FINDINGS */}
        {activeTab === 'ecg' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData['St Elevation'] === 1}
                  onChange={(e) => onChange('St Elevation', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-0"
                />
                <span>ST Elevation</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData['St Depression'] === 1}
                  onChange={(e) => onChange('St Depression', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>ST Depression</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData.Tinversion === 1}
                  onChange={(e) => onChange('Tinversion', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>T-Wave Inversion</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientData['Q Wave'] === 1}
                  onChange={(e) => onChange('Q Wave', e.target.checked ? 1 : 0)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Pathologic Q Wave</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Bundle Branch Block (BBB)</label>
                <select
                  value={patientData.BBB ?? 'N'}
                  onChange={(e) => onChange('BBB', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="N">Normal (N)</option>
                  <option value="LBBB">LBBB</option>
                  <option value="RBBB">RBBB</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300">Left Ventricular Hypertrophy (LVH)</label>
                <select
                  value={patientData.LVH ?? 'N'}
                  onChange={(e) => onChange('LVH', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                >
                  <option value="N">No (N)</option>
                  <option value="Y">Yes (Y)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LAB & ECHOCARDIOGRAPHY */}
        {activeTab === 'lab' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Ejection Fraction (EF %)</label>
                <input
                  type="number"
                  value={patientData['EF-TTE'] ?? 50}
                  onChange={(e) => handleNumChange('EF-TTE', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Region with RWMA (0-4)</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={patientData['Region RWMA'] ?? 0}
                  onChange={(e) => handleNumChange('Region RWMA', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">Fasting Sugar (FBS mg/dL)</label>
                <input
                  type="number"
                  value={patientData.FBS ?? 110}
                  onChange={(e) => handleNumChange('FBS', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Creatinine (CR mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patientData.CR ?? 1.0}
                  onChange={(e) => handleNumChange('CR', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-300">LDL (mg/dL)</label>
                <input
                  type="number"
                  value={patientData.LDL ?? 120}
                  onChange={(e) => handleNumChange('LDL', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">HDL (mg/dL)</label>
                <input
                  type="number"
                  value={patientData.HDL ?? 42}
                  onChange={(e) => handleNumChange('HDL', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">TG (mg/dL)</label>
                <input
                  type="number"
                  value={patientData.TG ?? 160}
                  onChange={(e) => handleNumChange('TG', e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Submit Action */}
      <div className="p-4 border-t border-cyan-500/15 bg-slate-900/70 backdrop-blur-md">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500 hover:from-cyan-300 hover:via-emerald-300 hover:to-blue-400 text-slate-950 font-bold text-sm tracking-wide transition-all duration-300 shadow-[0_0_25px_rgba(0,240,255,0.35)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:scale-[1.01]"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Running Neural &amp; Tree Models...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Predict Cardiac Risk &amp; Stenosis</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

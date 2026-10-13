import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PatientForm } from './components/PatientForm';
import { HeartCanvas } from './components/HeartCanvas';
import { PredictionPanel } from './components/PredictionPanel';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { ModelPerformanceModal } from './components/ModelPerformanceModal';
import { DataInfoModal } from './components/DataInfoModal';
import { api } from './services/api';
import {
  TargetPredictions,
  SelectedVesselId,
  ShapContributor,
  ModelMetricsReport,
  SampleProfile,
} from './types';
import { ShieldAlert, Sparkles, HeartPulse, ChevronRight, X } from 'lucide-react';

export function App() {
  // Application State
  const [patientData, setPatientData] = useState<Record<string, any>>({
    Age: 62,
    Sex: 'Male',
    Weight: 78,
    Length: 172,
    DM: 1,
    HTN: 1,
    'Current Smoker': 1,
    'EX-Smoker': 0,
    FH: 0,
    Obesity: 'Y',
    CRF: 'N',
    CVA: 'N',
    'Airway disease': 'N',
    'Thyroid Disease': 'N',
    CHF: 'N',
    DLP: 'Y',
    BP: 140,
    PR: 78,
    Edema: 0,
    'Weak Peripheral Pulse': 'N',
    'Lung rales': 'N',
    'Systolic Murmur': 'N',
    'Diastolic Murmur': 'N',
    'Typical Chest Pain': 1,
    Dyspnea: 'N',
    'Function Class': 2,
    Atypical: 'N',
    Nonanginal: 'N',
    'LowTH Ang': 'N',
    'Q Wave': 0,
    'St Elevation': 0,
    'St Depression': 1,
    Tinversion: 1,
    LVH: 'N',
    'Poor R Progression': 'N',
    BBB: 'N',
    FBS: 148,
    CR: 1.1,
    TG: 195,
    LDL: 140,
    HDL: 38,
    BUN: 20,
    ESR: 28,
    HB: 14.0,
    K: 4.4,
    Na: 140,
    WBC: 7400,
    Lymph: 28,
    Neut: 64,
    PLT: 235,
    'EF-TTE': 45,
    'Region RWMA': 1,
    VHD: 'N',
  });

  const [predictions, setPredictions] = useState<TargetPredictions | undefined>(undefined);
  const [shapContributors, setShapContributors] = useState<Record<string, ShapContributor[]>>({});
  const [selectedVessel, setSelectedVessel] = useState<SelectedVesselId>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<ModelMetricsReport | null>(null);
  const [sampleProfiles, setSampleProfiles] = useState<SampleProfile[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Modals state
  const [isExplainOpen, setIsExplainOpen] = useState<boolean>(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [isDataInfoOpen, setIsDataInfoOpen] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(true);

  // Load Initial Metadata, Metrics, & Default Inference on mount
  useEffect(() => {
    async function initApp() {
      const meta = await api.getMetadata();
      if (meta && meta.samples) {
        setSampleProfiles(meta.samples);
        if (meta.samples.length > 1) {
          // Pre-load Clinical Sample B (Isolated LAD) as default demo case
          const sample = meta.samples[1];
          setSelectedSampleId(sample.id);
          setPatientData(sample.data);
          runInference(sample.data);
        }
      }

      const m = await api.getMetrics();
      if (m) setMetrics(m);
    }
    initApp();
  }, []);

  const handleFieldChange = (field: string, val: any) => {
    setSelectedSampleId(null); // Custom edit
    setPatientData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSelectSample = (sample: SampleProfile) => {
    setSelectedSampleId(sample.id);
    setPatientData(sample.data);
    runInference(sample.data);
  };

  const runInference = async (dataToPredict = patientData) => {
    setIsLoading(true);
    try {
      // 1. Get real 4-target predictions
      const predRes = await api.predict(dataToPredict);
      setPredictions(predRes.predictions);

      // 2. Get real TreeSHAP explanations
      const expRes = await api.explain(dataToPredict);
      if (expRes && expRes.target_explanations) {
        setShapContributors(expRes.target_explanations);
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col relative overflow-x-hidden cyber-grid">
      {/* Dynamic Ambient Aurora Background Lights */}
      <div className="fixed top-12 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-aurora" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[140px] pointer-events-none animate-aurora" style={{ animationDelay: '2.5s' }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navigation */}
      <Navbar
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onOpenExplain={() => setIsExplainOpen(true)}
        onOpenDataInfo={() => setIsDataInfoOpen(true)}
      />

      {/* Hero Welcome / Clinical Disclaimer Banner */}
      {showBanner && (
        <div className="relative z-20 bg-slate-950/40 border-b border-cyan-500/10 px-6 py-2 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff]"></span>
              </span>
              <span className="text-cyan-300 font-semibold tracking-wide">CardioScope AI:</span>
              <span className="text-slate-300 hidden md:inline font-normal">
                Multimodal 3D Coronary Assessment &bull; 54 clinical inputs mapped onto transparent coronary anatomy with zero target leakage.
              </span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => setIsDataInfoOpen(true)}
                className="text-cyan-400 hover:text-cyan-200 font-mono text-[11px] underline cursor-pointer transition-colors"
              >
                Datasets & Safety Audit
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
                title="Dismiss Banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Three-Panel Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT PANEL: Patient Clinical Profile (Col 1-4 on large screens) */}
        <div className="lg:col-span-4 h-[750px] lg:h-[calc(100vh-130px)] flex flex-col">
          <PatientForm
            patientData={patientData}
            onChange={handleFieldChange}
            onSubmit={() => runInference(patientData)}
            isLoading={isLoading}
            onSelectSample={handleSelectSample}
            sampleProfiles={sampleProfiles}
            selectedSampleId={selectedSampleId}
          />
        </div>

        {/* CENTER PANEL: Interactive 3D Heart (Col 5-8 on large screens) */}
        <div className="lg:col-span-5 h-[550px] lg:h-[calc(100vh-130px)] flex flex-col">
          <HeartCanvas
            predictions={predictions}
            selectedVessel={selectedVessel}
            onSelectVessel={setSelectedVessel}
          />
        </div>

        {/* RIGHT PANEL: AI Risk Analysis & Vessel Breakdown (Col 9-12 on large screens) */}
        <div className="lg:col-span-3 h-[750px] lg:h-[calc(100vh-130px)] flex flex-col">
          <PredictionPanel
            predictions={predictions}
            selectedVessel={selectedVessel}
            onSelectVessel={setSelectedVessel}
            shapContributors={shapContributors}
            onOpenExplainModal={() => setIsExplainOpen(true)}
            onOpenMetricsModal={() => setIsMetricsOpen(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <ExplainabilityModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        metrics={metrics}
        patientShap={shapContributors}
      />

      <ModelPerformanceModal
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
        metrics={metrics}
      />

      <DataInfoModal
        isOpen={isDataInfoOpen}
        onClose={() => setIsDataInfoOpen(false)}
      />
    </div>
  );
}

export default App;

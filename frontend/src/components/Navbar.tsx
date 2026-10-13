import React from 'react';
import { HeartPulse, Award, BarChart3, Database, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenMetrics: () => void;
  onOpenExplain: () => void;
  onOpenDataInfo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMetrics,
  onOpenExplain,
  onOpenDataInfo,
}) => {
  return (
    <header className="w-full border-b border-cyan-500/15 bg-slate-950/75 backdrop-blur-2xl sticky top-0 z-30 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        {/* Brand & Animated Cardiac Pulse */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-pink-500 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="relative w-11 h-11 rounded-2xl bg-slate-950/90 border border-cyan-400/40 flex items-center justify-center shadow-glow-cyan">
              <HeartPulse className="w-5 h-5 text-cyan-300 animate-heart-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">CardioScope</span>
                <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">AI</span>
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono tracking-wide shadow-[0_0_10px_rgba(0,240,255,0.15)] hidden sm:inline-flex items-center gap-1.5">
                <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                Clinical Core
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium tracking-wide mt-0.5">
              3D Multimodal Coronary Assessment & Stratification
            </p>
          </div>
        </div>

        {/* Action Navigation Tabs */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenMetrics}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/70 hover:bg-cyan-950/50 border border-cyan-500/25 hover:border-cyan-400/80 text-xs text-cyan-100 font-medium transition-all duration-200 shadow-sm hover:shadow-glow-cyan cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Model Performance</span>
          </button>

          <button
            onClick={onOpenExplain}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/70 hover:bg-emerald-950/50 border border-emerald-500/25 hover:border-emerald-400/80 text-xs text-emerald-100 font-medium transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Explainable AI</span>
          </button>

          <button
            onClick={onOpenDataInfo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/70 hover:bg-purple-950/50 border border-purple-500/25 hover:border-purple-400/80 text-xs text-purple-100 font-medium transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Data Intelligence</span>
          </button>
        </div>
      </div>
    </header>
  );
};

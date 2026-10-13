// Cheerful futuristic risk colors & styles utility

export const getRiskColor = (prob: number): string => {
  if (prob >= 0.70) return '#ff3366'; // Energetic Coral / Neon Crimson
  if (prob >= 0.40) return '#f59e0b'; // Cheerful Warm Amber
  return '#00f0ff'; // Bright Cyber Cyan
};

export const getRiskBadgeStyle = (prob: number): string => {
  if (prob >= 0.70) return 'border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(255,51,102,0.3)]';
  if (prob >= 0.40) return 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
  return 'border-cyan-400/50 bg-cyan-400/20 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]';
};

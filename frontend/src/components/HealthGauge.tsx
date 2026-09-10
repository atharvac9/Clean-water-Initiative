import React from "react";

interface HealthGaugeProps {
  score: number | null;
  grade?: string | null;
  ndviDelta?: number | null;
  ndwiDelta?: number | null;
  status?: string | null;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  score = 0,
  grade = "N/A",
  ndviDelta = 0,
  ndwiDelta = 0,
  status = "inconclusive",
}) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score ?? 0)));

  // Determine color theme
  let strokeColor = "#38bdf8"; // cyan
  let gradeBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";

  if (safeScore >= 80) {
    strokeColor = "#10b981"; // emerald
    gradeBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  } else if (safeScore >= 65) {
    strokeColor = "#14b8a6"; // teal
    gradeBg = "bg-teal-500/20 text-teal-300 border-teal-500/40";
  } else if (safeScore >= 50) {
    strokeColor = "#f59e0b"; // amber
    gradeBg = "bg-amber-500/20 text-amber-300 border-amber-500/40";
  } else {
    strokeColor = "#ef4444"; // red
    gradeBg = "bg-red-500/20 text-red-300 border-red-500/40";
  }

  // Radius & circumference for SVG radial arc
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Use a 260 degree arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * safeScore) / 100;

  return (
    <div className="flex flex-col items-center">
      {/* Radial Gauge Container */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-135" viewBox="0 0 130 130">
          {/* Background track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            stroke="#1e293b"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease",
            }}
          />
        </svg>

        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="text-3xl font-bold font-mono text-slate-100 tracking-tight">
            {safeScore}
          </div>
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Health Score
          </div>
        </div>

        {/* Grade badge */}
        <div
          className={`absolute bottom-0 right-2 px-2 py-0.5 rounded-md text-xs font-bold font-mono border ${gradeBg}`}
        >
          Grade {grade || "?"}
        </div>
      </div>

      {/* Mini deltas */}
      <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-xs">
        <div className="bg-slate-900/60 rounded p-1.5 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Δ NDVI (Veg)</div>
          <div
            className={`font-mono font-semibold ${
              (ndviDelta ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {(ndviDelta ?? 0) >= 0 ? "+" : ""}
            {(ndviDelta ?? 0).toFixed(3)}
          </div>
        </div>

        <div className="bg-slate-900/60 rounded p-1.5 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Δ NDWI (Water)</div>
          <div
            className={`font-mono font-semibold ${
              (ndwiDelta ?? 0) >= 0 ? "text-cyan-400" : "text-red-400"
            }`}
          >
            {(ndwiDelta ?? 0) >= 0 ? "+" : ""}
            {(ndwiDelta ?? 0).toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
};

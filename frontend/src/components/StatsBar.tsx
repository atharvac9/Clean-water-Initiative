import React from "react";
import { AlertTriangle, Activity, MapPin, CheckCircle2 } from "lucide-react";
import { Site } from "../lib/types";

interface StatsBarProps {
  sites: Site[];
  onSelectAnomaly: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ sites, onSelectAnomaly }) => {
  const totalSites = sites.length;
  const confirmed = sites.filter(
    (s) => s.latest_analysis?.overall_status === "confirmed"
  ).length;
  const anomalies = sites.filter(
    (s) => s.latest_analysis?.overall_status === "anomaly"
  ).length;

  const validScores = sites
    .map((s) => s.latest_analysis?.health_score)
    .filter((score): score is number => score !== null && score !== undefined);

  const avgHealth = validScores.length
    ? `${Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)}`
    : "--";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* Total sites */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 bg-white border border-slate-200 shadow-xs">
        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Monitored Sites</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">{totalSites}</div>
        </div>
      </div>

      {/* Confirmed */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 bg-white border border-slate-200 shadow-xs">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Verified Cross-Match</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">{confirmed}</div>
        </div>
      </div>

      {/* Anomalies */}
      <div
        onClick={onSelectAnomaly}
        className={`glass-panel rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all bg-white border border-slate-200 shadow-xs hover:border-red-300 ${
          anomalies > 0 ? "border-red-300 bg-red-50/40" : ""
        }`}
      >
        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Flagged Anomalies</div>
          <div className="text-2xl font-extrabold text-red-600 font-mono tracking-tight">{anomalies}</div>
        </div>
      </div>

      {/* Average Health Score */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 bg-white border border-slate-200 shadow-xs">
        <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Watershed Health Index</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-sky-700 font-mono tracking-tight">{avgHealth}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

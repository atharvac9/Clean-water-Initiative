import React from "react";
import { ShieldCheck, AlertTriangle, Activity, MapPin, CheckCircle2 } from "lucide-react";
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
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 78;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total sites */}
      <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Monitored Sites</div>
          <div className="text-xl font-bold text-slate-100 font-mono">{totalSites}</div>
        </div>
      </div>

      {/* Confirmed */}
      <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Verified Cross-Match</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{confirmed}</div>
        </div>
      </div>

      {/* Anomalies */}
      <div
        onClick={onSelectAnomaly}
        className={`glass-panel rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
          anomalies > 0 ? "border-red-500/40 hover:bg-red-950/20" : ""
        }`}
      >
        <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Flagged Anomalies</div>
          <div className="text-xl font-bold text-red-400 font-mono">{anomalies}</div>
        </div>
      </div>

      {/* Average Health Score */}
      <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Watershed Health Index</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-cyan-300 font-mono">{avgHealth}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

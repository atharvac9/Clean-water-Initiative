"use client";

import React, { useState } from "react";
import { Site, AnalysisResult } from "../lib/types";
import { HealthGauge } from "./HealthGauge";
import {
  FileDown,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { getReportDownloadUrl } from "../lib/api";

interface SiteInspectorProps {
  site: Site;
  onUploadPhotoClick: (site: Site) => void;
  onClose?: () => void;
}

export const SiteInspector: React.FC<SiteInspectorProps> = ({
  site,
  onUploadPhotoClick,
  onClose,
}) => {
  const analysis = site.latest_analysis;
  const isAnomaly = analysis?.overall_status === "anomaly";
  const isConfirmed = analysis?.overall_status === "confirmed";

  const pdfUrl = getReportDownloadUrl(site.id);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-5 text-slate-200">
      {/* Header Bar */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold text-slate-100">{site.site_code || site.id}</span>
            <span
              className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                isAnomaly
                  ? "bg-red-500/15 border-red-500/40 text-red-400"
                  : isConfirmed
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "bg-amber-500/15 border-amber-500/40 text-amber-400"
              }`}
            >
              {analysis?.overall_status || "Pending Analysis"}
            </span>
          </div>
          <div className="text-sm font-medium text-teal-300 mt-1 capitalize">
            {site.activity_type ? site.activity_type.replace(/_/g, " ") : "Unspecified Activity"}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            {site.lat.toFixed(4)}°N, {site.lon.toFixed(4)}°E • Radius: {site.buffer_radius_m}m
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        )}
      </div>

      {/* Description */}
      {site.description && (
        <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
          {site.description}
        </div>
      )}

      {/* Health Score Gauge */}
      {analysis && (
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <HealthGauge
            score={analysis.health_score}
            grade={analysis.health_grade}
            ndviDelta={analysis.delta_ndvi}
            ndwiDelta={analysis.delta_ndwi}
            status={analysis.overall_status}
          />
        </div>
      )}

      {/* Anomaly & Flags Alert Banner */}
      {isAnomaly && analysis?.flags && analysis.flags.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/40 p-3.5 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>Cross-Validation Discrepancies Detected</span>
          </div>
          <ul className="text-xs text-red-300/90 list-disc list-inside space-y-1 pl-1">
            {analysis.flags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Satellite Telemetry Details */}
      {analysis && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-mono">NDVI (Vegetation)</div>
            <div className="text-base font-bold font-mono text-slate-100 mt-1">
              {analysis.ndvi_tnow?.toFixed(3) ?? "N/A"}
            </div>
            {analysis.ndvi_t0 !== null && (
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Baseline: {analysis.ndvi_t0.toFixed(3)}
              </div>
            )}
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-mono">NDWI (Water Index)</div>
            <div className="text-base font-bold font-mono text-slate-100 mt-1">
              {analysis.ndwi_tnow?.toFixed(3) ?? "N/A"}
            </div>
            {analysis.ndwi_t0 !== null && (
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Baseline: {analysis.ndwi_t0.toFixed(3)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cross-Validation Agreement Breakdown */}
      {analysis && (
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-xs flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Cross-Validation Matrix</span>
            <span className="text-[10px] font-mono text-slate-400">
              Source: {analysis.satellite_source || "Sentinel-2"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-800/80">
            <span className="text-slate-400">Satellite Agreement</span>
            <span
              className={`font-mono font-semibold ${
                analysis.satellite_agreement ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {analysis.satellite_agreement ? "CONFIRMED ✓" : "DISCORDANT ⚠"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-800/80">
            <span className="text-slate-400">CLIP Photo Match</span>
            <span
              className={`font-mono font-semibold ${
                analysis.photo_agreement === true
                  ? "text-emerald-400"
                  : analysis.photo_agreement === false
                  ? "text-red-400"
                  : "text-slate-400"
              }`}
            >
              {analysis.photo_agreement === true
                ? "MATCHED ✓"
                : analysis.photo_agreement === false
                ? "MISMATCH ⚠"
                : "PENDING PHOTO"}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800">
        <button
          onClick={() => onUploadPhotoClick(site)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-lg shadow-teal-950/40 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Upload Field Verification Photo</span>
        </button>

        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs transition-all text-center"
        >
          <FileDown className="w-4 h-4 text-cyan-400" />
          <span>Export Official PDF Report</span>
          <ExternalLink className="w-3 h-3 text-slate-400 ml-1" />
        </a>
      </div>
    </div>
  );
};

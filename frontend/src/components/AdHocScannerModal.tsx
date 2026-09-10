"use client";

import React, { useState } from "react";
import { Satellite, Crosshair, Check, Sparkles, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { runAdHocAnalysis, createSite } from "../lib/api";
import { ActivityType, AnalysisResult, Site } from "../lib/types";
import { HealthGauge } from "./HealthGauge";

interface AdHocScannerModalProps {
  initialLat: number;
  initialLon: number;
  isOpen: boolean;
  onClose: () => void;
  onSiteSaved: (site: Site) => void;
}

export const AdHocScannerModal: React.FC<AdHocScannerModalProps> = ({
  initialLat,
  initialLon,
  isOpen,
  onClose,
  onSiteSaved,
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lon, setLon] = useState<number>(initialLon);
  const [activityType, setActivityType] = useState<ActivityType>("check_dam");
  const [baselineDate, setBaselineDate] = useState<string>("2023-01-15");
  const [hasBaseline, setHasBaseline] = useState<boolean>(true);
  const [bufferRadius, setBufferRadius] = useState<number>(500);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedSite, setSavedSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await runAdHocAnalysis({
        lat,
        lon,
        claimed_activity_type: activityType,
        baseline_date: hasBaseline ? baselineDate : undefined,
        buffer_radius_m: bufferRadius,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to execute satellite analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSite = async () => {
    try {
      const newSite = await createSite({
        lat,
        lon,
        activity_type: activityType,
        buffer_radius_m: bufferRadius,
        baseline_date: hasBaseline ? baselineDate : undefined,
        description: `Ad-hoc scanned site at ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
      });
      // Attach latest analysis result
      newSite.latest_analysis = result;
      setSavedSite(newSite);
      onSiteSaved(newSite);
    } catch (err: any) {
      setError(err.message || "Failed to save site");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-slate-700/80 p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Satellite className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Sentinel-2 On-Demand Scanner</h2>
              <p className="text-xs text-slate-400">Query Copernicus surface reflectance for any global coordinates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-2.5 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coordinates */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Latitude (°N)</label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Longitude (°E)</label>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Activity Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Claimed Intervention Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 capitalize"
            >
              <option value="check_dam">Check Dam (Nala Bund)</option>
              <option value="farm_pond">Farm Pond / Reservoir</option>
              <option value="plantation">Afforestation / Plantation</option>
              <option value="contour_trench">Contour Trenching (CCT)</option>
              <option value="desilting">Waterbody Desilting</option>
              <option value="gabion">Gabion Structure</option>
              <option value="percolation_tank">Percolation Tank</option>
            </select>
          </div>

          {/* Buffer Radius */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Buffer Radius</label>
              <span className="text-xs font-mono text-teal-400">{bufferRadius}m</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={bufferRadius}
              onChange={(e) => setBufferRadius(parseInt(e.target.value))}
              className="accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg mt-2"
            />
          </div>
        </div>

        {/* Baseline Date Toggle */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBaseline}
                onChange={(e) => setHasBaseline(e.target.checked)}
                className="accent-teal-500 rounded"
              />
              <span>Compute Before/After Delta (Full Mode)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {hasBaseline ? "Δ NDVI & Δ NDWI" : "Snapshot Only"}
            </span>
          </div>

          {hasBaseline && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-400">Baseline Date:</span>
              <input
                type="date"
                value={baselineDate}
                onChange={(e) => setBaselineDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-950/50 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Trigger Button */}
        <button
          onClick={handleScan}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-teal-950/50 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Querying Sentinel-2 & Computing Indices...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Execute Satellite Telemetry Query</span>
            </>
          )}
        </button>

        {/* Results Area */}
        {result && (
          <div className="bg-slate-950/70 rounded-xl p-4 border border-teal-500/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Analysis Result</span>
              <span className="text-xs font-mono text-slate-400">{result.satellite_source}</span>
            </div>

            <HealthGauge
              score={result.health_score}
              grade={result.health_grade}
              ndviDelta={result.delta_ndvi}
              ndwiDelta={result.delta_ndwi}
              status={result.overall_status}
            />

            {savedSite ? (
              <div className="bg-emerald-950/50 border border-emerald-500/50 p-3 rounded-lg flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Site saved as monitored site #{savedSite.id}
                </span>
                <button
                  onClick={onClose}
                  className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
                >
                  View in Map
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveSite}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              >
                <span>Save this location as a permanent Monitored Site</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

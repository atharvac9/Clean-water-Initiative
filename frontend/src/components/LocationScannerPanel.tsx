"use client";

import React, { useState, useEffect } from "react";
import { Site, ActivityType, AnalysisResult } from "../lib/types";
import { LocationSearchInput, GeocodedLocation } from "./LocationSearchInput";
import { HealthGauge } from "./HealthGauge";
import { ReportModal } from "./ReportModal";
import { SiteInspector } from "./SiteInspector";
import { runAdHocAnalysis, createSite } from "../lib/api";
import {
  Sparkles,
  MapPin,
  Check,
  AlertCircle,
  ArrowRight,
  Loader2,
  FileDown,
  Layers,
  ChevronRight,
  ShieldCheck,
  Compass,
  X,
  Sliders,
  CheckCircle2,
} from "lucide-react";

interface LocationScannerPanelProps {
  selectedSite: Site | null;
  activeLocation: GeocodedLocation | null;
  onLocationSelect: (location: GeocodedLocation) => void;
  onClearLocation: () => void;
  onSiteSaved: (site: Site) => void;
  onUploadPhotoClick: (site: Site) => void;
  onClearSelectedSite: () => void;
}

export const LocationScannerPanel: React.FC<LocationScannerPanelProps> = ({
  selectedSite,
  activeLocation,
  onLocationSelect,
  onClearLocation,
  onSiteSaved,
  onUploadPhotoClick,
  onClearSelectedSite,
}) => {
  // Coordinates from activeLocation (or default fallback)
  const lat = activeLocation?.lat ?? 19.085;
  const lon = activeLocation?.lon ?? 74.75;
  const locationName = activeLocation?.name ?? "Selected Map Location";

  // Scanner configuration
  const [activityType, setActivityType] = useState<ActivityType>("check_dam");
  const [bufferRadius, setBufferRadius] = useState<number>(500);
  const [hasBaseline, setHasBaseline] = useState<boolean>(true);
  const [baselineDate, setBaselineDate] = useState<string>("2023-01-15");

  // Analysis & Saved Site states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedSite, setSavedSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PDF Report modal state
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  // Reset analysis results when active location changes
  useEffect(() => {
    setAnalysisResult(null);
    setSavedSite(null);
    setError(null);
  }, [activeLocation?.lat, activeLocation?.lon]);

  // Execute Telemetry Scan
  const handleExecuteScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const data = await runAdHocAnalysis({
        lat,
        lon,
        claimed_activity_type: activityType,
        baseline_date: hasBaseline ? baselineDate : undefined,
        buffer_radius_m: bufferRadius,
      });
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to execute telemetry analysis");
    } finally {
      setIsScanning(false);
    }
  };

  // Save as Monitored Site
  const handleSaveSite = async () => {
    try {
      const newSite = await createSite({
        lat,
        lon,
        activity_type: activityType,
        buffer_radius_m: bufferRadius,
        baseline_date: hasBaseline ? baselineDate : undefined,
        description: `Monitored ${activityType.replace(/_/g, " ")} at ${locationName} (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
      });
      newSite.latest_analysis = analysisResult;
      setSavedSite(newSite);
      onSiteSaved(newSite);
    } catch (err: any) {
      setError(err.message || "Failed to save monitored site");
    }
  };

  // If user selected an existing monitored site, show SiteInspector with a search bar on top
  if (selectedSite) {
    return (
      <div className="flex flex-col gap-4">
        {/* Search Bar on top so user can search anytime */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Search Another Location</span>
            </span>
            <button
              onClick={onClearSelectedSite}
              className="text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              Back to Scanner
            </button>
          </div>
          <LocationSearchInput
            onLocationSelect={onLocationSelect}
            initialQuery={activeLocation?.name || ""}
          />
        </div>

        {/* Existing Site Inspector */}
        <SiteInspector
          site={selectedSite}
          onUploadPhotoClick={onUploadPhotoClick}
          onClose={onClearSelectedSite}
        />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-5 text-slate-800">
        {/* Panel Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Location & Telemetry Scanner</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Search any location — coordinates are fetched automatically
              </p>
            </div>
          </div>
        </div>

        {/* 1. Location Search Input (Search Bar moved outside map into the scan menu) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>1. Search Preferred Location</span>
            <span className="text-[10px] font-normal text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              City, Village, River, or Basin
            </span>
          </label>
          <LocationSearchInput
            onLocationSelect={onLocationSelect}
            initialQuery={activeLocation?.name || ""}
            placeholder="Type city, village, river (e.g. Pune, Godavari)..."
          />
        </div>

        {/* 2. System-Fetched Coordinates Card (No memorization needed!) */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate max-w-[200px]">
                {activeLocation ? activeLocation.name : "Target Map Coordinates"}
              </span>
            </div>
            <span className="text-[10px] font-medium font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>System Fetched</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200/80 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                Latitude (°N)
              </span>
              <span className="font-bold text-slate-900 mt-0.5">{lat.toFixed(4)}°N</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200/80 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                Longitude (°E)
              </span>
              <span className="font-bold text-slate-900 mt-0.5">{lon.toFixed(4)}°E</span>
            </div>
          </div>

          {activeLocation?.displayName && (
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {activeLocation.displayName}
            </p>
          )}
        </div>

        {/* 3. Claimed Intervention & Buffer Settings */}
        <div className="flex flex-col gap-3.5 pt-1 border-t border-slate-100">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Claimed Intervention Type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white capitalize transition-all cursor-pointer"
            >
              <option value="check_dam">Check Dam (Nala Bund)</option>
              <option value="farm_pond">Farm Pond / Reservoir</option>
              <option value="plantation">Afforestation / Plantation</option>
              <option value="contour_trench">Contour Trenching (CCT)</option>
              <option value="desilting">Waterbody Desilting</option>
              <option value="percolation_tank">Percolation Tank</option>
              <option value="water_body">General Water Basin</option>
            </select>
          </div>

          {/* Buffer Radius Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Analysis Buffer Radius</span>
              <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {bufferRadius} meters
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={bufferRadius}
              onChange={(e) => setBufferRadius(parseInt(e.target.value))}
              className="accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg mt-1"
            />
          </div>

          {/* Before/After Delta Toggle */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBaseline}
                  onChange={(e) => setHasBaseline(e.target.checked)}
                  className="accent-teal-600 rounded"
                />
                <span>Before/After Delta (Full Mode)</span>
              </label>
              <span className="text-[10px] font-mono font-semibold text-slate-500">
                {hasBaseline ? "Δ NDVI & Δ NDWI" : "Snapshot"}
              </span>
            </div>

            {hasBaseline && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-500">Baseline Date:</span>
                <input
                  type="date"
                  value={baselineDate}
                  onChange={(e) => setBaselineDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Execute Telemetry Query Button */}
        <button
          onClick={handleExecuteScan}
          disabled={isScanning}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Multi-Spectral Reflectance...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Execute Telemetry Scan</span>
            </>
          )}
        </button>

        {/* Results Section */}
        {analysisResult && (
          <div className="bg-slate-50 rounded-xl p-4 border border-teal-200 flex flex-col gap-4 mt-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                Telemetry Analysis Result
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                {(analysisResult.overall_status || "PENDING").toUpperCase()}
              </span>
            </div>

            {/* Health Score Gauge */}
            <HealthGauge
              score={analysisResult.health_score}
              grade={analysisResult.health_grade}
              ndviDelta={analysisResult.delta_ndvi}
              ndwiDelta={analysisResult.delta_ndwi}
              status={analysisResult.overall_status}
            />

            {/* Indices Delta Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-mono">NDVI (Vegetation)</div>
                <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                  {analysisResult.delta_ndvi !== null && analysisResult.delta_ndvi !== undefined
                    ? `${analysisResult.delta_ndvi >= 0 ? "+" : ""}${analysisResult.delta_ndvi.toFixed(3)}`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-mono">NDWI (Moisture)</div>
                <div className="font-mono font-bold text-sky-700 text-sm mt-0.5">
                  {analysisResult.delta_ndwi !== null && analysisResult.delta_ndwi !== undefined
                    ? `${analysisResult.delta_ndwi >= 0 ? "+" : ""}${analysisResult.delta_ndwi.toFixed(3)}`
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* Action Buttons: Save Site & Export PDF */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-200">
              {savedSite ? (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Saved as {savedSite.site_code || `#${savedSite.id.substring(0, 6)}`}
                  </span>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-600 text-white font-semibold text-[11px] hover:bg-teal-700 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3 h-3" />
                    <span>Print PDF</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveSite}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Monitored Site</span>
                  </button>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                    title="Export Official PDF Certificate"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PDF Report Modal */}
      {reportModalOpen && (
        <ReportModal
          site={
            savedSite || {
              id: "adhoc-target",
              site_code: `SCAN-${lat.toFixed(2)}-${lon.toFixed(2)}`,
              lat,
              lon,
              activity_type: activityType,
              description: `Watershed scan at ${locationName}`,
              is_seeded_demo: false,
              buffer_radius_m: bufferRadius,
              baseline_date: hasBaseline ? baselineDate : null,
              intervention_date: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              latest_analysis: analysisResult,
              photo_count: 0,
            }
          }
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </>
  );
};

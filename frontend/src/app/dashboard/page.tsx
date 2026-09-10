"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "../../components/Navbar";
import { StatsBar } from "../../components/StatsBar";
import { SiteInspector } from "../../components/SiteInspector";
import { AdHocScannerModal } from "../../components/AdHocScannerModal";
import { PhotoUploadModal } from "../../components/PhotoUploadModal";
import { SiteDirectory } from "../../components/SiteDirectory";
import { LocationScannerPanel } from "../../components/LocationScannerPanel";
import { FieldUploadView } from "../../components/FieldUploadView";
import { GeocodedLocation } from "../../components/LocationSearchInput";
import { fetchSites } from "../../lib/api";
import { Site, Photo } from "../../lib/types";
import { Sparkles, Compass, Loader2, Map, Camera, ListFilter, X } from "lucide-react";

// Dynamically import WatershedMap with SSR disabled (Leaflet requires window)
const WatershedMap = dynamic(
  () => import("../../components/WatershedMap").then((mod) => mod.WatershedMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-slate-500 text-xs gap-3 shadow-xs">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        <span className="font-medium text-slate-700">Initializing High-Resolution Map Engine...</span>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [activeSearchedPlace, setActiveSearchedPlace] = useState<GeocodedLocation | null>(null);
  const [lowerSectionTab, setLowerSectionTab] = useState<"sites" | "upload">("sites");

  // Ad-hoc scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lon: number }>({
    lat: 19.085,
    lon: 74.75,
  });

  // Photo upload modal state
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);

  // Load sites on initial mount (do NOT auto-select — only show when actively searched or clicked)
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchSites();
        setSites(data);
      } catch (err) {
        console.error("Failed to load sites", err);
      }
    }
    loadData();
  }, []);

  const handleSelectCoords = async (lat: number, lon: number) => {
    setTargetCoords({ lat, lon });
    setSelectedSite(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      const placeName = data.display_name?.split(",")[0] || `Point (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      setActiveSearchedPlace({
        name: placeName,
        displayName: data.display_name || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
        lat,
        lon,
      });
    } catch {
      setActiveSearchedPlace({
        name: `Coordinates (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`,
        displayName: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
        lat,
        lon,
      });
    }
  };

  const handleSelectAnomaly = () => {
    const anomalySite = sites.find(
      (s) => s.latest_analysis?.overall_status === "anomaly"
    );
    if (anomalySite) {
      setSelectedSite(anomalySite);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSiteSaved = (newSite: Site) => {
    setSites((prev) => [newSite, ...prev]);
    setSelectedSite(newSite);
  };

  const handlePhotoUploaded = (photo: Photo) => {
    if (!selectedSite) return;
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === selectedSite.id) {
          return {
            ...s,
            photo_count: (s.photo_count || 0) + 1,
            latest_analysis: s.latest_analysis
              ? {
                  ...s.latest_analysis,
                  photo_agreement: photo.predicted_class === s.activity_type,
                  classified_activity: photo.predicted_class,
                  classification_confidence: photo.classification_confidence,
                }
              : null,
          };
        }
        return s;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar onScanClick={() => setScannerOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-6">
        {/* Compact Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>NeerDrishti Dashboard</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                नीरदृष्टी
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Watershed Environmental Telemetry & Ground-Truth Verification
            </p>
          </div>

          {/* Active Search / Selection Indicator (Only shows when actively searched or selected) */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedSite ? (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-900 px-3 py-1.5 rounded-xl text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span className="font-semibold text-slate-700">Active Site:</span>
                <span className="font-bold text-teal-800 font-mono">
                  {selectedSite.site_code || `SITE-${selectedSite.id.substring(0, 6).toUpperCase()}`}
                </span>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  ({selectedSite.lat.toFixed(3)}°N, {selectedSite.lon.toFixed(3)}°E)
                </span>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="ml-1 text-slate-400 hover:text-slate-700 hover:bg-teal-100/50 p-1 rounded-md transition-colors cursor-pointer"
                  title="Clear active site selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : activeSearchedPlace ? (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-900 px-3 py-1.5 rounded-xl text-xs shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span className="font-semibold text-slate-700">Actively Searched:</span>
                <span className="font-bold text-teal-800">
                  {activeSearchedPlace.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  ({activeSearchedPlace.lat.toFixed(3)}°, {activeSearchedPlace.lon.toFixed(3)}°)
                </span>
                <button
                  onClick={() => {
                    setTargetCoords({ lat: activeSearchedPlace.lat, lon: activeSearchedPlace.lon });
                    setScannerOpen(true);
                  }}
                  className="ml-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  Scan Telemetry
                </button>
                <button
                  onClick={() => setActiveSearchedPlace(null)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-teal-100/50 p-1 rounded-md transition-colors cursor-pointer"
                  title="Clear active search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Search any location on map to inspect</span>
                </div>
                <button
                  onClick={() => setScannerOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Coordinates</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MAP AT THE TOP: Interactive Geospatial Map + Site Inspector ─────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Column (8 cols on desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <Map className="w-4 h-4 text-teal-600" />
                <span>Geospatial Watershed Map & Telemetry</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Telemetry Stream Active</span>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="h-[520px]">
              <WatershedMap
                sites={sites}
                selectedSite={selectedSite}
                onSelectSite={(s) => {
                  setSelectedSite(s);
                  setActiveSearchedPlace(null);
                }}
                onSelectCoords={handleSelectCoords}
                targetCoords={targetCoords}
              />
            </div>
          </div>

          {/* Location Search & Telemetry Scanner Column (4 cols on desktop) */}
          <div className="lg:col-span-4">
            <LocationScannerPanel
              selectedSite={selectedSite}
              activeLocation={activeSearchedPlace}
              onLocationSelect={(loc) => {
                setActiveSearchedPlace(loc);
                setSelectedSite(null);
                setTargetCoords({ lat: loc.lat, lon: loc.lon });
              }}
              onClearLocation={() => setActiveSearchedPlace(null)}
              onSiteSaved={handleSiteSaved}
              onUploadPhotoClick={() => setPhotoUploadOpen(true)}
              onClearSelectedSite={() => setSelectedSite(null)}
            />
          </div>
        </section>

        {/* ── STATS BAR: Placed directly below the map ────────────────────────── */}
        <section>
          <StatsBar sites={sites} onSelectAnomaly={handleSelectAnomaly} />
        </section>

        {/* ── SITES DIRECTORY & VERIFICATION: Directly below the stats ────────── */}
        <section className="flex flex-col gap-4">
          {/* Sub-header for Lower Section */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLowerSectionTab("sites")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  lowerSectionTab === "sites"
                    ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ListFilter className="w-4 h-4 text-teal-600" />
                <span>Monitored Sites Directory ({sites.length})</span>
              </button>

              <button
                onClick={() => setLowerSectionTab("upload")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  lowerSectionTab === "upload"
                    ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Camera className="w-4 h-4 text-teal-600" />
                <span>Field Photo Verification</span>
              </button>
            </div>

            <button
              onClick={() => setScannerOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add / Scan New Site</span>
            </button>
          </div>

          {/* Active Lower Section Content */}
          {lowerSectionTab === "sites" ? (
            <SiteDirectory
              sites={sites}
              onSelectSite={(site) => {
                setSelectedSite(site);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <FieldUploadView sites={sites} onPhotoUploaded={handlePhotoUploaded} />
          )}
        </section>
      </main>

      {/* Ad-Hoc Scanner Modal */}
      <AdHocScannerModal
        initialLat={targetCoords.lat}
        initialLon={targetCoords.lon}
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSiteSaved={handleSiteSaved}
      />

      {/* Photo Upload Modal */}
      {selectedSite && (
        <PhotoUploadModal
          site={selectedSite}
          isOpen={photoUploadOpen}
          onClose={() => setPhotoUploadOpen(false)}
          onPhotoUploaded={handlePhotoUploaded}
        />
      )}
    </div>
  );
}

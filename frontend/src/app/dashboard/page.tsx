"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "../../components/Navbar";
import { StatsBar } from "../../components/StatsBar";
import { SiteInspector } from "../../components/SiteInspector";
import { AdHocScannerModal } from "../../components/AdHocScannerModal";
import { PhotoUploadModal } from "../../components/PhotoUploadModal";
import { SiteDirectory } from "../../components/SiteDirectory";
import { FieldUploadView } from "../../components/FieldUploadView";
import { fetchSites } from "../../lib/api";
import { Site, Photo } from "../../lib/types";
import { Sparkles, Compass, Loader2, Map, Camera, ListFilter } from "lucide-react";

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
  const [lowerSectionTab, setLowerSectionTab] = useState<"sites" | "upload">("sites");

  // Ad-hoc scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lon: number }>({
    lat: 19.085,
    lon: 74.75,
  });

  // Photo upload modal state
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);

  // Load sites on initial mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchSites();
        setSites(data);
        if (data.length > 0) {
          setSelectedSite(data[0]);
        }
      } catch (err) {
        console.error("Failed to load sites", err);
      }
    }
    loadData();
  }, []);

  const handleSelectCoords = (lat: number, lon: number) => {
    setTargetCoords({ lat, lon });
    setScannerOpen(true);
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

          {/* Quick Actions / Active Sites Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sites.length > 0 ? (
              <>
                <span className="text-[11px] text-slate-500 font-mono mr-1">Active Sites ({sites.length}):</span>
                {sites.slice(0, 8).map((s) => {
                  const label = s.site_code || s.id.substring(0, 6);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSite(s);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                        selectedSite?.id === s.id
                          ? "bg-teal-50 border-teal-500 text-teal-800 font-bold shadow-xs"
                          : s.latest_analysis?.overall_status === "anomaly"
                          ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                      }`}
                    >
                      {label} {s.latest_analysis?.overall_status === "anomaly" ? "⚠" : ""}
                    </button>
                  );
                })}
              </>
            ) : (
              <button
                onClick={() => setScannerOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Scan New Coordinates</span>
              </button>
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
                }}
                onSelectCoords={handleSelectCoords}
                targetCoords={targetCoords}
              />
            </div>
          </div>

          {/* Site Inspector Column (4 cols on desktop) */}
          <div className="lg:col-span-4">
            {selectedSite ? (
              <SiteInspector
                site={selectedSite}
                onUploadPhotoClick={() => setPhotoUploadOpen(true)}
              />
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[360px] gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex flex-col gap-1 max-w-xs">
                  <span className="font-semibold text-slate-900 text-sm">No Site Selected</span>
                  <span className="text-slate-500">Click anywhere on the map or search for any location to inspect coordinates and telemetry.</span>
                </div>
                <button
                  onClick={() => setScannerOpen(true)}
                  className="mt-2 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Coordinates</span>
                </button>
              </div>
            )}
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

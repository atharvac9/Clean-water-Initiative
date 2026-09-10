"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { StatsBar } from "../components/StatsBar";
import { WatershedMap } from "../components/WatershedMap";
import { Globe3D } from "../components/Globe3D";
import { SiteInspector } from "../components/SiteInspector";
import { AdHocScannerModal } from "../components/AdHocScannerModal";
import { PhotoUploadModal } from "../components/PhotoUploadModal";
import { SiteDirectory } from "../components/SiteDirectory";
import { FieldUploadView } from "../components/FieldUploadView";
import { fetchSites } from "../lib/api";
import { Site, Photo } from "../lib/types";
import { Globe, Map, Sparkles, AlertTriangle, ShieldCheck, Compass } from "lucide-react";

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "sites" | "upload">("map");
  const [mapMode, setMapMode] = useState<"2d" | "3d">("2d");

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
      const data = await fetchSites();
      setSites(data);
      if (data.length > 0) {
        setSelectedSite(data[0]);
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
      setActiveTab("map");
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
                  photo_agreement:
                    photo.predicted_class === s.activity_type,
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
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Navbar with live telemetry status */}
      <Navbar
        onScanClick={() => setScannerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Watershed Header & Stats Overview */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Ahmednagar Basin Watershed Observatory</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-source waterbody monitoring • Sentinel-2 Harmonized Surface Reflectance (NDVI/NDWI) • OpenCLIP Photo Auditing
              </p>
            </div>

            {/* Quick Demo Jump Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-mono mr-1">Demo Cases:</span>
              {sites.slice(0, 8).map((s) => {
                const label = s.site_code || s.id.substring(0, 4);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSite(s);
                      setActiveTab("map");
                    }}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      selectedSite?.id === s.id
                        ? "bg-teal-500/20 border-teal-500/60 text-teal-300 font-bold"
                        : s.latest_analysis?.overall_status === "anomaly"
                        ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {label} {s.latest_analysis?.overall_status === "anomaly" ? "⚠" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats Bar */}
          <StatsBar sites={sites} onSelectAnomaly={handleSelectAnomaly} />
        </div>

        {/* Tab 1: Interactive Map & 3D Globe + Site Inspector */}
        {activeTab === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* Map / Globe Column (8 cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              {/* Map Controls & Mode Switcher */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => setMapMode("2d")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                      mapMode === "2d"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Tactical 2D Map</span>
                  </button>

                  <button
                    onClick={() => setMapMode("3d")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                      mapMode === "3d"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Orthographic 3D Globe</span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sentinel-2 L2A Harmonized Active</span>
                </div>
              </div>

              {/* Visualization Canvas */}
              <div className="h-[520px]">
                {mapMode === "2d" ? (
                  <WatershedMap
                    sites={sites}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                    onSelectCoords={handleSelectCoords}
                    targetCoords={targetCoords}
                  />
                ) : (
                  <Globe3D
                    sites={sites}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                    onSelectCoords={handleSelectCoords}
                  />
                )}
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
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[300px] gap-2">
                  <Compass className="w-8 h-8 text-teal-500/60 animate-pulse" />
                  <span>Select any point or site marker on the map to inspect telemetry</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Monitored Sites Directory */}
        {activeTab === "sites" && (
          <SiteDirectory
            sites={sites}
            onSelectSite={(site) => {
              setSelectedSite(site);
              setActiveTab("map");
            }}
          />
        )}

        {/* Tab 3: Dedicated Field Photo Upload */}
        {activeTab === "upload" && (
          <FieldUploadView sites={sites} onPhotoUploaded={handlePhotoUploaded} />
        )}
      </main>

      {/* Ad-Hoc Scanner Modal (click anywhere on globe/map) */}
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

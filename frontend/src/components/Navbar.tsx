"use client";

import React, { useEffect, useState } from "react";
import { Droplets, Satellite, Cpu, ShieldCheck, Database, RefreshCw } from "lucide-react";
import { fetchHealth } from "../lib/api";
import { SystemHealth } from "../lib/types";

interface NavbarProps {
  onScanClick: () => void;
  activeTab: "map" | "sites" | "upload";
  setActiveTab: (tab: "map" | "sites" | "upload") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScanClick, activeTab, setActiveTab }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const checkStatus = async () => {
    const data = await fetchHealth();
    setHealth(data);
  };

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("map")}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Droplets className="w-5 h-5 text-teal-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-100 tracking-tight">Clean Water</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                Initiative
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Sentinel-2 & CLIP Watershed Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "map"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            Live Map & Globe
          </button>
          <button
            onClick={() => setActiveTab("sites")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "sites"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            Monitored Sites
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "upload"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            Field Photo Upload
          </button>
        </div>

        {/* Right Status Badges & Quick Action */}
        <div className="flex items-center gap-3">
          {/* Telemetry badges */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300" title="Copernicus Sentinel-2 Surface Reflectance">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" />
              <span>GEE:</span>
              <span className={health?.services.gee_configured ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                {health?.services.gee_configured ? "ONLINE" : "STANDBY"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300" title="OpenAI ViT-B-32 Zero-Shot Classifier">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span>CLIP:</span>
              <span className={health?.services.clip_model_loaded ? "text-emerald-400 font-semibold" : "text-slate-400"}>
                {health?.services.clip_model_loaded ? "LOADED" : "ON-DEMAND"}
              </span>
            </div>
          </div>

          <button
            onClick={onScanClick}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-medium text-xs shadow-lg shadow-teal-900/30 transition-all active:scale-95 cursor-pointer"
          >
            <Satellite className="w-4 h-4 animate-spin-slow" />
            <span>Scan Coordinates</span>
          </button>
        </div>
      </div>
    </header>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, Satellite, Users, Home, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  onScanClick?: () => void;
  activeTab?: "map" | "sites" | "upload";
  setActiveTab?: (tab: "map" | "sites" | "upload") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onScanClick, activeTab, setActiveTab }) => {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/observatory");
  const isHome = pathname === "/";
  const isTeam = pathname.startsWith("/team");

  return (
    <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand: MeerDrushti */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 group-hover:bg-teal-100 transition-colors">
            <Droplets className="w-5 h-5 text-teal-600" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">MeerDrushti</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 tracking-wider">
                नीरदृष्टी
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Watershed Intelligence & Satellite Telemetry</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isHome
                ? "bg-white text-teal-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isDashboard
                ? "bg-white text-teal-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/team"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isTeam
                ? "bg-white text-teal-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </Link>
        </nav>

        {/* Right Action Button: GEE & CLIP badges removed as requested */}
        <div className="flex items-center gap-3">
          {isDashboard && onScanClick ? (
            <button
              onClick={onScanClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Scan Coordinates</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Open Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

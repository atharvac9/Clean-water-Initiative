"use client";

import React, { useState } from "react";
import { Site } from "../lib/types";
import { Filter, Search, ArrowUpRight, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

interface SiteDirectoryProps {
  sites: Site[];
  onSelectSite: (site: Site) => void;
}

export const SiteDirectory: React.FC<SiteDirectoryProps> = ({ sites, onSelectSite }) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredSites = sites.filter((site) => {
    // Status filter
    if (filterStatus !== "all") {
      const status = site.latest_analysis?.overall_status || "pending";
      if (status !== filterStatus) return false;
    }
    // Activity filter
    if (filterActivity !== "all" && site.activity_type !== filterActivity) {
      return false;
    }
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = site.id.toLowerCase().includes(term);
      const matchDesc = site.description?.toLowerCase().includes(term) || false;
      const matchType = site.activity_type?.toLowerCase().includes(term) || false;
      if (!matchId && !matchDesc && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
      {/* Directory Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Monitored Watershed Sites</h2>
          <p className="text-xs text-slate-400">Total {sites.length} active sites in observation network</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search site, village..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-44"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="anomaly">Flagged Anomalies</option>
            <option value="inconclusive">Inconclusive</option>
          </select>

          {/* Activity filter */}
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 capitalize"
          >
            <option value="all">All Activities</option>
            <option value="check_dam">Check Dam</option>
            <option value="farm_pond">Farm Pond</option>
            <option value="plantation">Plantation</option>
            <option value="contour_trench">Contour Trench</option>
          </select>
        </div>
      </div>

      {/* Sites Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Site ID</th>
              <th className="py-2.5 px-3">Intervention Type</th>
              <th className="py-2.5 px-3">Coordinates</th>
              <th className="py-2.5 px-3 text-center">Health Score</th>
              <th className="py-2.5 px-3">Cross-Validation</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredSites.map((site) => {
              const analysis = site.latest_analysis;
              const isAnomaly = analysis?.overall_status === "anomaly";
              const isConfirmed = analysis?.overall_status === "confirmed";

              return (
                <tr
                  key={site.id}
                  onClick={() => onSelectSite(site)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-slate-100 flex items-center gap-2">
                    <span>{site.id}</span>
                    {site.is_seeded_demo && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase font-sans">
                        Demo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-200">
                    {site.activity_type ? site.activity_type.replace(/_/g, " ") : "General Basin"}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {site.lat.toFixed(4)}°N, {site.lon.toFixed(4)}°E
                  </td>
                  <td className="py-3 px-3 text-center">
                    {analysis?.health_score !== undefined && analysis?.health_score !== null ? (
                      <div className="inline-flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-slate-100">{Math.round(analysis.health_score)}</span>
                        <span
                          className={`text-[10px] px-1 rounded font-bold ${
                            analysis.health_score >= 75
                              ? "bg-emerald-500/20 text-emerald-400"
                              : analysis.health_score >= 50
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {analysis.health_grade}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        isAnomaly
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : isConfirmed
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      {isAnomaly ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Anomaly Flagged</span>
                        </>
                      ) : isConfirmed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <span>Pending</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSite(site);
                      }}
                      className="inline-flex items-center gap-1 text-teal-400 group-hover:text-teal-300 text-xs font-medium hover:underline cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

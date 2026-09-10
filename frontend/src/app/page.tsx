"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import {
  LayoutDashboard,
  Camera,
  ShieldCheck,
  FileText,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Users,
  Activity,
  MapPin,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white border-b border-slate-200 pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6 shadow-xs">
            <Droplets className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>NeerDrishti नीरदृष्टी • AI & Multi-Spectral Telemetry</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
            Autonomous Telemetry Auditing for <span className="text-teal-600">Watershed Security</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            Eliminate ghost conservation projects and unverifiable claims. NeerDrishti combines multi-spectral telemetry (NDVI & NDWI) with zero-shot on-ground AI to verify check dams, farm ponds, and afforestation in real time.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-md shadow-teal-700/20 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/team"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-200 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span>Meet the Team</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-slate-100 text-xs font-medium text-slate-500 w-full max-w-2xl">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Vegetation & Water Indices</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero-Trust OpenCLIP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Single-Page PDF Exports</span>
            </div>
          </div>
        </div>
      </header>

      {/* Core Capabilities Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 font-mono">
            Full-Spectrum Verification Engine
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Telemetry & Ground-Truth Intelligence Converge
          </p>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            Standard audits rely on self-reported spreadsheets or easily fabricated photographs. NeerDrishti bridges the gap using objective, immutable physical measurements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Spectral Telemetry</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automated surface reflectance queries computing precise NDVI vegetation and NDWI moisture indices across seasons.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-teal-700 font-semibold">
              NDVI • NDWI • Moisture Delta
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">OpenCLIP Zero-Shot AI</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Evaluates on-ground photographs using state-of-the-art vision-language representations to verify that claimed civil structures actually exist.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-sky-700 font-semibold">
              Multi-Class Intervention Scoring
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">EXIF Sensor Forensics</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Validates camera hardware tags, exposure timestamps, and GPS coordinates to stop reused web photos or fraudulent geotag tampering.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-emerald-700 font-semibold">
              Hardware Tamper Detection
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clean Single-Page PDF</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Exports official verification certificates containing strictly the site coordinates, telemetry data, and audit checklist without web chrome.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-indigo-700 font-semibold">
              Printable Audit Certificate
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section className="bg-white border-y border-slate-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 font-mono">
              The 3-Step Verification Pipeline
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Raw Coordinates to Certified Audit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold font-mono text-lg flex items-center justify-center mb-4 shadow-sm">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">Search & Target Basin</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Use the real-time Nominatim geocoder or pan the interactive watershed map to target any village, stream, or watershed parcel worldwide.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold font-mono text-lg flex items-center justify-center mb-4 shadow-sm">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">Execute Spectral Query</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our server computes spectral surface indices, evaluating seasonal baseline and post-intervention vegetation and water retention deltas.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold font-mono text-lg flex items-center justify-center mb-4 shadow-sm">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Cross-Validate & Export</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Upload geotagged field photos for OpenCLIP matching. Generate a clean, official single-page PDF certificate with 0% chrome or clutter.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-md shadow-teal-700/20"
            >
              <span>Try Live in Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Supported Interventions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Supported Intervention Typologies</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Tailored spectral response baselines and AI classification models for all major soil and water conservation structures.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Check Dams", desc: "Nala Bunds & Weirs" },
            { label: "Farm Ponds", desc: "Rainwater Reservoirs" },
            { label: "Plantations", desc: "Afforestation Works" },
            { label: "Contour Trenches", desc: "Continuous CCT" },
            { label: "Waterbody Desilting", desc: "Storage Restoration" },
            { label: "Percolation Tanks", desc: "Groundwater Recharge" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center shadow-xs"
            >
              <Droplets className="w-5 h-5 text-teal-600 mb-1.5" />
              <div className="text-xs font-bold text-slate-900">{item.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto w-full">
        <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold">Ready to audit watershed projects?</h3>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
              Access the interactive geospatial map, run on-demand telemetry queries, and generate clean PDF verification certificates now.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-white text-teal-800 hover:bg-slate-100 font-bold text-sm transition-all shadow-md flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-6 lg:px-8 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2 justify-center sm:justify-start">
              <Droplets className="w-4 h-4 text-teal-600" />
              <span>NeerDrishti (नीरदृष्टी) • Watershed Intelligence</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              OpenStreetMap • OpenCLIP AI • Multi-Spectral Telemetry
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-teal-600 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-teal-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/team" className="hover:text-teal-600 transition-colors">
              Team
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

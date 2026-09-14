"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navbar } from "../components/Navbar";
import { LocationSearchInput, GeocodedLocation } from "../components/LocationSearchInput";
import {
  ArrowDown,
  Camera,
  Satellite,
  FileCheck,
  Shield,
  Fingerprint,
  Search,
  ChevronRight,
} from "lucide-react";

/* Dynamically load map — no SSR (Leaflet needs window) */
const WatershedMap = dynamic(
  () => import("../components/WatershedMap").then((mod) => mod.WatershedMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-lg bg-strata flex items-center justify-center">
        <span className="text-sm text-basalt-light/50 font-body">Loading map…</span>
      </div>
    ),
  }
);

/* ── NDVI Counter Animation ─────────────────────────────────── */
function NdviCounter({ target = 0.718, duration = 2200 }: { target?: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className="tabular-nums font-heading font-bold text-canopy">
      {value.toFixed(3)}
    </span>
  );
}

/* ── MAIN PAGE ──────────────────────────────────────────────── */
export default function HomePage() {
  const [exploreLocation, setExploreLocation] = useState<GeocodedLocation | null>(null);
  const [exploreCoords, setExploreCoords] = useState<{ lat: number; lon: number } | null>(null);

  const handleExploreSelect = (loc: GeocodedLocation) => {
    setExploreLocation(loc);
    setExploreCoords({ lat: loc.lat, lon: loc.lon });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════
          HERO — Split: copy left, data visualization right
          ═══════════════════════════════════════════════════════ */}
      <header className="relative bg-surface border-b border-strata">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left column — copy */}
            <div className="lg:col-span-7 flex flex-col">
              <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold tracking-tight leading-[1.1] text-basalt">
                See what's really happening{" "}
                <span className="text-reservoir">on the ground.</span>
              </h1>

              <p className="mt-5 text-[15px] sm:text-base text-basalt-light leading-relaxed max-w-xl">
                NeerDrishti cross-checks field photos against Sentinel-2 satellite data
                to verify water conservation work — check dams, farm ponds, afforestation — at
                any coordinate on earth. No more unverifiable claims or ghost projects.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-reservoir hover:bg-reservoir-light text-white text-[14px] font-semibold transition-colors"
                >
                  Explore Any Location
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[14px] font-medium text-basalt-light hover:text-basalt border border-strata-mid hover:border-strata-deep transition-colors"
                >
                  <span>How it works</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Trust line — no checkmark badges, just plain text */}
              <p className="mt-10 text-[12px] text-basalt-light/50 leading-relaxed">
                Built on Sentinel-2 multispectral imagery, OpenStreetMap geocoding,
                and MobileNetV3 deep vision classification. Open data, verifiable results.
              </p>
            </div>

            {/* Right column — data visualization card */}
            <div className="lg:col-span-5">
              <div className="bg-strata/60 border border-strata-mid rounded-lg p-5 sm:p-6">
                {/* Mini satellite tile placeholder */}
                <div className="w-full aspect-[4/3] rounded-md bg-basalt/5 border border-strata-mid flex items-center justify-center relative overflow-hidden">
                  {/* Faux satellite grid lines */}
                  <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `
                      linear-gradient(var(--color-basalt) 1px, transparent 1px),
                      linear-gradient(90deg, var(--color-basalt) 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                  }} />

                  {/* Pin + NDVI readout — the ONE animated moment */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-reservoir ring-4 ring-reservoir/20" />
                    <div className="bg-surface/90 backdrop-blur-sm border border-strata-mid rounded-md px-4 py-2.5 flex flex-col items-center">
                      <span className="text-[10px] font-medium text-basalt-light/60 uppercase tracking-wide font-body">
                        Vegetation Index (NDVI)
                      </span>
                      <span className="text-2xl mt-0.5">
                        <NdviCounter target={0.718} />
                      </span>
                      <span className="text-[10px] text-canopy/70 font-medium mt-0.5">
                        Healthy vegetation detected
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data context below tile */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-basalt-light/50 font-medium">Water Index</span>
                    <span className="text-[15px] font-semibold text-sentinel tabular-nums font-body">0.142</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-basalt-light/50 font-medium">Coordinates</span>
                    <span className="text-[13px] font-medium text-basalt tabular-nums font-body">19.085°N, 74.750°E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          EXPLORE ANY LOCATION — Centerpiece Interaction
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-surface border-b border-strata">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Section intro — colored left border, NOT all-caps eyebrow */}
          <div className="border-l-[3px] border-reservoir pl-4 mb-8">
            <h2 className="text-[22px] sm:text-[28px] font-semibold text-basalt">
              Explore any location on earth
            </h2>
            <p className="mt-1.5 text-[14px] text-basalt-light leading-relaxed max-w-2xl">
              Type a village, river, or set of coordinates. NeerDrishti pulls live satellite
              data for that spot — vegetation health, water presence, seasonal change — so
              you can verify conditions without traveling there.
            </p>
          </div>

          {/* Search + Map */}
          <div className="rounded-lg border border-strata-mid bg-strata/30 overflow-hidden">
            {/* Search bar */}
            <div className="px-4 sm:px-6 py-4 border-b border-strata-mid bg-surface flex items-center gap-3">
              <Search className="w-5 h-5 text-basalt-light/40 shrink-0" />
              <div className="flex-1">
                <LocationSearchInput
                  onLocationSelect={handleExploreSelect}
                  initialQuery=""
                  placeholder="Search any place — Nashik, Godavari River, 19.08°N 74.75°E…"
                />
              </div>
            </div>

            {/* Map */}
            <div className="h-[320px] sm:h-[400px] lg:h-[440px]">
              <WatershedMap
                sites={[]}
                selectedSite={null}
                onSelectSite={() => {}}
                onSelectCoords={() => {}}
                targetCoords={exploreCoords}
                targetLocationName={exploreLocation?.name}
              />
            </div>

            {/* CTA below map */}
            {exploreLocation && (
              <div className="px-4 sm:px-6 py-3 border-t border-strata-mid bg-surface flex items-center justify-between">
                <div className="text-[13px] text-basalt-light">
                  <span className="font-semibold text-basalt">{exploreLocation.name}</span>
                  <span className="mx-1.5 text-strata-deep">·</span>
                  <span className="tabular-nums">{exploreLocation.lat.toFixed(4)}°N, {exploreLocation.lon.toFixed(4)}°E</span>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 text-[13px] font-semibold text-reservoir hover:text-reservoir-light transition-colors"
                >
                  <span>Open full dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS — Pipeline strip, not numbered cards
          ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="border-b border-strata">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="border-l-[3px] border-sentinel pl-4 mb-10">
            <h2 className="text-[22px] sm:text-[28px] font-semibold text-basalt">
              How verification works
            </h2>
            <p className="mt-1.5 text-[14px] text-basalt-light max-w-2xl">
              One photo, one set of coordinates, one verified report.
            </p>
          </div>

          {/* Pipeline — horizontal on desktop, vertical on mobile */}
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-0">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col lg:flex-row items-start lg:items-center gap-4 p-5 sm:p-6 bg-surface rounded-lg lg:rounded-r-none border border-strata-mid lg:border-r-0">
              <div className="w-10 h-10 rounded-md bg-reservoir-faint flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-reservoir" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-basalt">Upload a field photo</h3>
                <p className="text-[13px] text-basalt-light mt-0.5 leading-relaxed">
                  Drop a geotagged photo from your phone. We extract the GPS coordinates
                  and camera metadata automatically.
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden lg:flex items-center px-0">
              <div className="w-8 h-[2px] bg-strata-mid" />
              <ChevronRight className="w-4 h-4 text-strata-deep -mx-1" />
            </div>
            <div className="lg:hidden flex justify-center py-1">
              <div className="w-[2px] h-6 bg-strata-mid" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col lg:flex-row items-start lg:items-center gap-4 p-5 sm:p-6 bg-surface border border-strata-mid lg:border-x-0 rounded-lg lg:rounded-none">
              <div className="w-10 h-10 rounded-md bg-sentinel-faint flex items-center justify-center shrink-0">
                <Satellite className="w-5 h-5 text-sentinel" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-basalt">Satellite cross-check</h3>
                <p className="text-[13px] text-basalt-light mt-0.5 leading-relaxed">
                  We query Sentinel-2 for that exact spot — vegetation index, water index,
                  and seasonal change — then compare against what the photo shows.
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden lg:flex items-center px-0">
              <div className="w-8 h-[2px] bg-strata-mid" />
              <ChevronRight className="w-4 h-4 text-strata-deep -mx-1" />
            </div>
            <div className="lg:hidden flex justify-center py-1">
              <div className="w-[2px] h-6 bg-strata-mid" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col lg:flex-row items-start lg:items-center gap-4 p-5 sm:p-6 bg-surface rounded-lg lg:rounded-l-none border border-strata-mid lg:border-l-0">
              <div className="w-10 h-10 rounded-md bg-canopy-faint flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-canopy" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-basalt">Verified report</h3>
                <p className="text-[13px] text-basalt-light mt-0.5 leading-relaxed">
                  Download a PDF certificate with the photo, satellite data, health score,
                  and any anomaly flags — ready for auditors or funders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CAPABILITIES — Asymmetric layout
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-surface border-b border-strata">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="border-l-[3px] border-canopy pl-4 mb-10">
            <h2 className="text-[22px] sm:text-[28px] font-semibold text-basalt">
              What makes this different
            </h2>
            <p className="mt-1.5 text-[14px] text-basalt-light max-w-2xl">
              Standard audits rely on self-reported spreadsheets or unverifiable photographs.
              NeerDrishti uses objective physical measurements that anyone can independently check.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Large feature card — the distinctive thing */}
            <div className="lg:col-span-3 p-6 sm:p-8 rounded-lg border border-strata-mid bg-strata/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-md bg-reservoir-faint flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-reservoir" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-basalt">
                    Photo × Satellite cross-validation
                  </h3>
                  <p className="text-[13px] text-basalt-light mt-1 leading-relaxed">
                    The core verification: a deep vision model classifies your field photo
                    (check dam, farm pond, plantation, urban area), while Sentinel-2 provides
                    independent vegetation and water measurements for the same coordinates.
                    If the photo claims "check dam" but the satellite sees no water retention,
                    that's flagged as an anomaly.
                  </p>
                </div>
              </div>

              {/* Mini data example */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-strata-mid">
                <div className="flex flex-col">
                  <span className="text-[11px] text-basalt-light/50 font-medium">Photo AI</span>
                  <span className="text-[14px] font-semibold text-basalt">Check Dam</span>
                  <span className="text-[11px] text-canopy font-medium">82% confidence</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-basalt-light/50 font-medium">NDVI</span>
                  <span className="text-[14px] font-semibold text-canopy tabular-nums">+0.368</span>
                  <span className="text-[11px] text-basalt-light/50">Vegetation present</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-basalt-light/50 font-medium">NDWI</span>
                  <span className="text-[14px] font-semibold text-sentinel tabular-nums">+0.076</span>
                  <span className="text-[11px] text-basalt-light/50">Water detected</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-basalt-light/50 font-medium">Verdict</span>
                  <span className="text-[14px] font-semibold text-canopy">Confirmed</span>
                  <span className="text-[11px] text-basalt-light/50">Photo matches satellite</span>
                </div>
              </div>
            </div>

            {/* Right column — three smaller supporting features */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex-1 p-5 rounded-lg border border-strata-mid bg-surface">
                <div className="flex items-center gap-3 mb-2">
                  <Fingerprint className="w-4.5 h-4.5 text-alluvial" />
                  <h3 className="text-[14px] font-semibold text-basalt">EXIF forensics</h3>
                </div>
                <p className="text-[13px] text-basalt-light leading-relaxed">
                  Validates camera hardware tags, timestamps, and GPS coordinates.
                  Catches reused web photos and tampered geotags.
                </p>
              </div>

              <div className="flex-1 p-5 rounded-lg border border-strata-mid bg-surface">
                <div className="flex items-center gap-3 mb-2">
                  <Satellite className="w-4.5 h-4.5 text-sentinel" />
                  <h3 className="text-[14px] font-semibold text-basalt">Seasonal baselines</h3>
                </div>
                <p className="text-[13px] text-basalt-light leading-relaxed">
                  Compares pre-intervention and post-intervention satellite data to
                  measure actual environmental change over time, not a single snapshot.
                </p>
              </div>

              <div className="flex-1 p-5 rounded-lg border border-strata-mid bg-surface">
                <div className="flex items-center gap-3 mb-2">
                  <FileCheck className="w-4.5 h-4.5 text-canopy" />
                  <h3 className="text-[14px] font-semibold text-basalt">Clean PDF certificates</h3>
                </div>
                <p className="text-[13px] text-basalt-light leading-relaxed">
                  One-page audit report with coordinates, satellite measurements,
                  photo evidence, and health score. No web chrome, ready for print.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SUPPORTED INTERVENTIONS
          ═══════════════════════════════════════════════════════ */}
      <section className="border-b border-strata">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="border-l-[3px] border-alluvial pl-4 mb-8">
            <h2 className="text-[22px] sm:text-[28px] font-semibold text-basalt">
              Works across intervention types
            </h2>
            <p className="mt-1.5 text-[14px] text-basalt-light max-w-2xl">
              Tailored spectral baselines and AI classification for all major soil
              and water conservation structures.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Check Dams", desc: "Nala bunds & weirs" },
              { label: "Farm Ponds", desc: "Rainwater reservoirs" },
              { label: "Plantations", desc: "Afforestation works" },
              { label: "Contour Trenches", desc: "Continuous CCT" },
              { label: "Desilting", desc: "Storage restoration" },
              { label: "Percolation Tanks", desc: "Groundwater recharge" },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-lg border border-strata-mid bg-surface text-center"
              >
                <div className="text-[13px] font-semibold text-basalt">{item.label}</div>
                <div className="text-[11px] text-basalt-light/60 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER — Minimal
          ═══════════════════════════════════════════════════════ */}
      <footer className="bg-surface border-t border-strata py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-basalt-light/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-reservoir flex items-center justify-center text-white text-[9px] font-heading font-bold">
              नी
            </div>
            <span className="font-heading font-medium text-basalt-light">NeerDrishti</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-basalt transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-basalt transition-colors">Dashboard</Link>
            <Link href="/team" className="hover:text-basalt transition-colors">Team</Link>
          </div>

          <p>Data: Sentinel-2, OpenStreetMap</p>
        </div>
      </footer>
    </div>
  );
}

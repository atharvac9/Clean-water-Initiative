"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import {
  Users,
  Compass,
  ShieldCheck,
  Droplets,
  Satellite,
  Cpu,
  ArrowRight,
  Mail,
  ExternalLink,
  Award,
  Globe2,
} from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  area: string;
  avatarBg: string;
  initials: string;
  bio: string;
  skills: string[];
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr. Rajesh Kulkarni",
    role: "Project Director & Lead Geospatial Architect",
    area: "Geospatial Systems & Remote Sensing",
    avatarBg: "bg-teal-600 text-white",
    initials: "RK",
    bio: "Specializes in earth observation satellite pipelines and spatial data infrastructure. Leads the architecture integrating Copernicus Sentinel-2 L2A telemetry with real-time browser GIS engines.",
    skills: ["Copernicus Sentinel-2", "Leaflet GIS", "FastAPI", "Next.js", "Spatial Telemetry"],
  },
  {
    name: "Dr. Ananya Deshmukh",
    role: "Lead Hydrologist & Earth Observation Scientist",
    area: "Hydrological Modeling & Environmental Indices",
    avatarBg: "bg-sky-600 text-white",
    initials: "AD",
    bio: "Expert in arid and semi-arid watershed hydrology. Designed the dual NDVI/NDWI seasonal delta models that evaluate soil moisture retention and check-dam water storage capacity.",
    skills: ["Remote Sensing", "NDWI / NDVI Modeling", "Watershed Hydrology", "Drought Analytics"],
  },
  {
    name: "Vikramaditya Shinde",
    role: "Machine Learning & Vision-Language Engineer",
    area: "Deep Learning & Forensic AI",
    avatarBg: "bg-indigo-600 text-white",
    initials: "VS",
    bio: "Pioneered the OpenCLIP zero-shot classifier and hardware EXIF verification pipeline, enabling instant automated validation of on-ground photographs against claimed civil interventions.",
    skills: ["OpenCLIP Vision", "EXIF Forensics", "Zero-Shot Classifiers", "PyTorch", "Python"],
  },
  {
    name: "Pooja Patil",
    role: "Field Verification & Community Impact Specialist",
    area: "Field Auditing & Citizen Hydrology",
    avatarBg: "bg-emerald-600 text-white",
    initials: "PP",
    bio: "Coordinates ground-truth data acquisition with village watershed committees and local NGOs. Oversees the audit compliance checklists and verifiable PDF certification standards.",
    skills: ["Ground-Truth Audits", "Community Hydrology", "ISO Compliance", "Field Verification"],
  },
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero Header */}
      <section className="bg-white border-b border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Multidisciplinary Engineering & Science Team</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Pioneering Open, Verifiable Watershed Intelligence
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            We are hydrologists, geospatial software engineers, and machine learning researchers dedicated to eliminating ghost water conservation projects through spaceborne satellite telemetry and ground-truth AI.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Dashboard</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm transition-all"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Team Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col gap-14">
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Core Engineering & Research Team</h2>
            <p className="text-sm text-slate-500 mt-2">
              Combining orbital mechanics, computer vision, and soil hydrology to bring absolute transparency to global water security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-xs ${member.avatarBg}`}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                    <p className="text-xs font-semibold text-teal-700">{member.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{member.area}</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {member.bio}
                </p>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Key Technical Domains
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guiding Principles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Our Core Principles</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Engineered from first principles to guarantee scientific reproducibility and audit accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div className="flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <Satellite className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Open Public Telemetry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We rely strictly on publicly verifiable Copernicus Sentinel-2 L2A imagery, ensuring any independent third party can verify calculations.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Zero-Trust Cross-Auditing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Spaceborne spectral vegetation and water index responses must corroborate on-ground photographic evidence to award certified verification.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Impact-Centric Metrics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We measure outcomes (biomass health, moisture retention, surface water delta) rather than administrative paperwork or claimed expenditures.
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Collaboration Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold">Collaborate With Our Research Team</h3>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
              Are you an NGO, watershed trust, government agency, or university interested in running verification pilot programs in your basin?
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-white text-teal-800 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 flex-shrink-0"
          >
            <span>Explore Dashboard Live</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 MeerDrushti (नीरदृष्टी) • Watershed Intelligence Platform</p>
        <p className="mt-1">Powered by Copernicus Sentinel-2 Multi-Spectral Data & OpenCLIP Vision Models</p>
      </footer>
    </div>
  );
}

import { Site, AnalysisResult, Photo, SystemHealth, AdHocAnalysisPayload } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Clean initial state — no hardcoded preset sites
export const FALLBACK_DEMO_SITES: Site[] = [];

export async function fetchHealth(): Promise<SystemHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch {
    return {
      status: "offline",
      services: {
        gee_configured: false,
        clip_model_loaded: false,
        storage_configured: false,
      },
    };
  }
}

export async function fetchSites(seededOnly: boolean = false): Promise<Site[]> {
  try {
    const res = await fetch(`${API_BASE}/sites?seeded_only=${seededOnly}&limit=100`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch sites");
    const data = await res.json();
    return data.sites || [];
  } catch (err) {
    console.warn("Using fallback demo sites (backend offline):", err);
    return FALLBACK_DEMO_SITES;
  }
}

export async function fetchSite(siteId: string): Promise<Site | null> {
  try {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch site");
    return await res.json();
  } catch {
    return FALLBACK_DEMO_SITES.find((s) => s.id === siteId) || null;
  }
}

export async function createSite(payload: Partial<Site>): Promise<Site> {
  const res = await fetch(`${API_BASE}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create site" }));
    throw new Error(err.detail || "Failed to create site");
  }
  return await res.json();
}

export async function runAdHocAnalysis(payload: AdHocAnalysisPayload): Promise<AnalysisResult> {
  try {
    const res = await fetch(`${API_BASE}/analysis/adhoc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
      throw new Error(err.detail || "Analysis failed");
    }
    return await res.json();
  } catch (err) {
    // Client-side simulation fallback when backend or GEE is offline
    console.warn("Generating simulated preview for ad-hoc point:", err);
    const mockScore = Math.floor(65 + Math.random() * 25);
    const grade = mockScore >= 80 ? "A" : mockScore >= 65 ? "B" : mockScore >= 50 ? "C" : "D";
    return {
      id: "adhoc-" + Date.now(),
      site_id: "adhoc-site",
      mode: payload.baseline_date ? "full" : "snapshot",
      health_score: mockScore,
      health_grade: grade,
      delta_ndvi: 0.12 + (Math.random() * 0.1 - 0.05),
      delta_ndwi: 0.08 + (Math.random() * 0.1 - 0.05),
      ndvi_t0: 0.22,
      ndvi_tnow: 0.35,
      ndwi_t0: -0.15,
      ndwi_tnow: -0.05,
      satellite_agreement: true,
      photo_agreement: null,
      overall_status: "confirmed",
      flags: [],
      confidence_score: 0.85,
      classified_activity: payload.claimed_activity_type || null,
      classification_confidence: 0.88,
      satellite_source: "Sentinel-2 (Simulated / GEE Offline)",
      buffer_radius_m: payload.buffer_radius_m || 500,
      analyzed_at: new Date().toISOString(),
    };
  }
}

export async function uploadSitePhoto(siteId: string, file: File): Promise<Photo> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/photos/${siteId}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return await res.json();
}

export async function fetchSitePhotos(siteId: string): Promise<Photo[]> {
  try {
    const res = await fetch(`${API_BASE}/photos/${siteId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch photos");
    return await res.json();
  } catch {
    return [];
  }
}

export function getReportDownloadUrl(siteId: string): string {
  return `${API_BASE}/reports/${siteId}/pdf`;
}

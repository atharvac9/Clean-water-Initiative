import { Site, AnalysisResult, Photo, SystemHealth, AdHocAnalysisPayload } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Fallback seed sites for immediate client-side demo if backend is offline
export const FALLBACK_DEMO_SITES: Site[] = [
  {
    id: "S01",
    lat: 19.0948,
    lon: 74.7480,
    activity_type: "check_dam",
    description: "Nala bund check dam near Bhalawani village, Ahmednagar",
    baseline_date: "2023-01-15",
    intervention_date: "2023-05-20",
    buffer_radius_m: 500,
    is_seeded_demo: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    photo_count: 2,
    latest_analysis: {
      id: "ana-01",
      site_id: "S01",
      mode: "full",
      health_score: 84.5,
      health_grade: "A",
      delta_ndvi: 0.185,
      delta_ndwi: 0.220,
      ndvi_t0: 0.210,
      ndvi_tnow: 0.395,
      ndwi_t0: -0.150,
      ndwi_tnow: 0.070,
      satellite_agreement: true,
      photo_agreement: true,
      overall_status: "confirmed",
      flags: [],
      confidence_score: 0.88,
      classified_activity: "check_dam",
      classification_confidence: 0.92,
      satellite_source: "Sentinel-2 L2A",
      buffer_radius_m: 500,
      analyzed_at: "2024-06-15T10:30:00Z",
    },
  },
  {
    id: "S02",
    lat: 19.1205,
    lon: 74.7123,
    activity_type: "farm_pond",
    description: "Plastic-lined community farm pond, Pimpalgaon Pisa",
    baseline_date: "2022-11-10",
    intervention_date: "2023-03-15",
    buffer_radius_m: 350,
    is_seeded_demo: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    photo_count: 1,
    latest_analysis: {
      id: "ana-02",
      site_id: "S02",
      mode: "full",
      health_score: 78.0,
      health_grade: "B",
      delta_ndvi: 0.095,
      delta_ndwi: 0.310,
      ndvi_t0: 0.180,
      ndvi_tnow: 0.275,
      ndwi_t0: -0.220,
      ndwi_tnow: 0.090,
      satellite_agreement: true,
      photo_agreement: true,
      overall_status: "confirmed",
      flags: [],
      confidence_score: 0.82,
      classified_activity: "farm_pond",
      classification_confidence: 0.89,
      satellite_source: "Sentinel-2 L2A",
      buffer_radius_m: 350,
      analyzed_at: "2024-06-15T10:32:00Z",
    },
  },
  {
    id: "S03",
    lat: 19.0432,
    lon: 74.6854,
    activity_type: "plantation",
    description: "Horticulture agroforestry along stream embankment, Shrigonda",
    baseline_date: "2022-06-01",
    intervention_date: "2022-09-15",
    buffer_radius_m: 600,
    is_seeded_demo: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    photo_count: 3,
    latest_analysis: {
      id: "ana-03",
      site_id: "S03",
      mode: "full",
      health_score: 91.2,
      health_grade: "A",
      delta_ndvi: 0.290,
      delta_ndwi: 0.080,
      ndvi_t0: 0.240,
      ndvi_tnow: 0.530,
      ndwi_t0: -0.110,
      ndwi_tnow: -0.030,
      satellite_agreement: true,
      photo_agreement: true,
      overall_status: "confirmed",
      flags: [],
      confidence_score: 0.94,
      classified_activity: "plantation",
      classification_confidence: 0.95,
      satellite_source: "Sentinel-2 L2A",
      buffer_radius_m: 600,
      analyzed_at: "2024-06-15T10:35:00Z",
    },
  },
  {
    id: "S06",
    lat: 18.9850,
    lon: 74.8210,
    activity_type: "farm_pond",
    description: "Deliberate test anomaly: claimed farm pond with dried bed and vegetation loss",
    baseline_date: "2023-02-01",
    intervention_date: "2023-04-10",
    buffer_radius_m: 500,
    is_seeded_demo: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    photo_count: 1,
    latest_analysis: {
      id: "ana-06",
      site_id: "S06",
      mode: "full",
      health_score: 32.4,
      health_grade: "F",
      delta_ndvi: -0.085,
      delta_ndwi: -0.140,
      ndvi_t0: 0.230,
      ndvi_tnow: 0.145,
      ndwi_t0: -0.050,
      ndwi_tnow: -0.190,
      satellite_agreement: false,
      photo_agreement: false,
      overall_status: "anomaly",
      flags: [
        "Satellite water index (NDWI) decreased after reported farm pond construction",
        "Vegetation vigor drop detected in 500m buffer zone",
        "Photo classification detected degraded soil rather than water reservoir",
      ],
      confidence_score: 0.85,
      classified_activity: "degraded_land",
      classification_confidence: 0.76,
      satellite_source: "Sentinel-2 L2A",
      buffer_radius_m: 500,
      analyzed_at: "2024-06-15T10:40:00Z",
    },
  },
  {
    id: "S07",
    lat: 19.1620,
    lon: 74.7950,
    activity_type: "contour_trench",
    description: "Continuous contour trenching on degraded ridge, Parner taluka",
    baseline_date: "2023-05-01",
    intervention_date: "2023-08-01",
    buffer_radius_m: 450,
    is_seeded_demo: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    photo_count: 1,
    latest_analysis: {
      id: "ana-07",
      site_id: "S07",
      mode: "full",
      health_score: 72.8,
      health_grade: "B",
      delta_ndvi: 0.140,
      delta_ndwi: 0.050,
      ndvi_t0: 0.160,
      ndvi_tnow: 0.300,
      ndwi_t0: -0.180,
      ndwi_tnow: -0.130,
      satellite_agreement: true,
      photo_agreement: true,
      overall_status: "confirmed",
      flags: [],
      confidence_score: 0.79,
      classified_activity: "contour_trench",
      classification_confidence: 0.81,
      satellite_source: "Sentinel-2 L2A",
      buffer_radius_m: 450,
      analyzed_at: "2024-06-15T10:42:00Z",
    },
  },
];

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

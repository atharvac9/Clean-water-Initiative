"""
🌊 Watershed Photo-Satellite Fusion Dashboard
Smart India Hackathon 2026 — Field Evidence × Satellite Intelligence

Main Streamlit application entry point featuring interactive 3D WebGL Globe,
real-time cross-validation, and multi-modal evidence inspection.
"""
import os
import sys
import json

import streamlit as st
import pandas as pd
import numpy as np
from PIL import Image

# ─── Page Config (must be first Streamlit call) ─────────────────────────────
st.set_page_config(
    page_title="Watershed Monitor",
    page_icon="🛰️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── Path setup ──────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from src.gee_client import initialize_gee, get_indices_for_site, get_thumbnail, clear_cache
from src.classifier import classify_photo, classify_all_photos
from src.cross_validator import validate_site, validate_all_sites
from src.health_score import compute_health_score, compute_all_health_scores, compute_overall_watershed_health
from src.map_builder import build_map
from utils.db_utils import init_db, save_sites, save_analysis, load_all_results, has_results
from globe_selector import globe_selector
from src.technical_page import render_technical_approach

# ─── Dark Theme CSS (Space Grotesk & IBM Plex Mono) ──────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* Global application theme */
.stApp {
    background: #05070d;
    color: #e8eef2;
    font-family: 'Space Grotesk', sans-serif;
}
.mono { font-family: 'IBM Plex Mono', monospace; }

/* Main Header */
.main-header {
    background: linear-gradient(135deg, rgba(13, 43, 62, 0.9) 0%, rgba(5, 17, 28, 0.95) 100%);
    border: 1px solid rgba(61, 220, 151, 0.25);
    border-radius: 12px;
    padding: 20px 28px;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}

.main-header h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.9em;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.5px;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 10px;
}

.main-header p {
    color: #94a3b8;
    margin: 4px 0 0 0;
    font-size: 0.9em;
}

.header-badge {
    background: rgba(61, 220, 151, 0.1);
    border: 1px solid rgba(61, 220, 151, 0.3);
    color: #3ddc97;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    padding: 6px 14px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Stats Bar */
.stats-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.stat-card {
    background: rgba(13, 43, 62, 0.7);
    border: 1px solid rgba(71, 85, 105, 0.35);
    border-radius: 10px;
    padding: 14px 18px;
    flex: 1;
    min-width: 140px;
    text-align: center;
    backdrop-filter: blur(8px);
    transition: transform 0.2s, border-color 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
    border-color: rgba(61, 220, 151, 0.4);
}

.stat-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 2em;
    font-weight: 700;
    line-height: 1;
}

.stat-label {
    font-size: 0.75em;
    color: #94a3b8;
    margin-top: 6px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
}

/* Slide-in site inspection panel */
.site-panel {
    background: rgba(13, 43, 62, 0.92);
    border: 1px solid rgba(61, 220, 151, 0.25);
    border-radius: 12px;
    padding: 22px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    margin-bottom: 16px;
}

.site-panel.anomaly-border {
    border-color: rgba(255, 93, 93, 0.5);
    box-shadow: 0 8px 32px rgba(255, 93, 93, 0.12);
}

.status-confirmed {
    color: #3ddc97;
}

.status-anomaly {
    color: #ff5d5d;
}

.status-inconclusive {
    color: #ffbe3d;
}

.status-pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-pill.confirmed {
    background: rgba(61, 220, 151, 0.15);
    border: 1px solid rgba(61, 220, 151, 0.4);
    color: #3ddc97;
}

.status-pill.anomaly {
    background: rgba(255, 93, 93, 0.18);
    border: 1px solid rgba(255, 93, 93, 0.5);
    color: #ff5d5d;
}

.status-pill.inconclusive {
    background: rgba(255, 190, 61, 0.15);
    border: 1px solid rgba(255, 190, 61, 0.4);
    color: #ffbe3d;
}

/* Health score */
.health-score-card {
    background: rgba(5, 7, 13, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 10px;
    padding: 16px;
    margin: 14px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.health-score {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 44px;
    font-weight: 600;
    line-height: 1;
}

.health-grade-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 6px;
}

/* Anomaly alert box */
.anomaly-box {
    background: rgba(255, 93, 93, 0.08);
    border: 1px solid rgba(255, 93, 93, 0.35);
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
}

.anomaly-box h4 {
    color: #ff8585;
    font-size: 13px;
    margin: 0 0 6px 0;
    font-family: 'Space Grotesk', sans-serif;
}

.anomaly-flag-item {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #fca5a5;
    margin: 3px 0;
}

/* Index delta display */
.index-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 12px;
    background: rgba(5, 7, 13, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.25);
    border-radius: 6px;
    margin: 4px 0;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
}

.index-delta-pos { color: #3ddc97; }
.index-delta-neg { color: #ff5d5d; }
.index-delta-neu { color: #94a3b8; }

/* Streamlit component container style */
div[data-testid="stHorizontalBlock"] {
    align-items: flex-start;
}

/* Hide Streamlit default clutter */
#MainMenu { visibility: hidden; }
footer { visibility: hidden; }
header { visibility: hidden; }
</style>
""", unsafe_allow_html=True)


# ─── Helper Functions ────────────────────────────────────────────────────────

def render_header():
    """Render the dark-themed cyber-watershed header."""
    st.markdown("""
    <div class="main-header">
        <div>
            <h1>🛰️ Watershed Photo-Satellite Fusion</h1>
            <p>Smart India Hackathon 2026 — Ground Truth Verification via Sentinel-2 & CLIP</p>
        </div>
        <div class="header-badge">
            <span style="width:7px; height:7px; border-radius:50%; background:#3ddc97; display:inline-block; box-shadow:0 0 6px #3ddc97;"></span>
            LIVE MONITORING • AHMEDNAGAR BASIN
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_stats_bar(sites_df, validation_results, health_scores):
    """Render the summary statistics bar."""
    total = len(sites_df)
    confirmed = sum(1 for v in validation_results.values() if v.get("overall_status") == "confirmed")
    anomalies = sum(1 for v in validation_results.values() if v.get("overall_status") == "anomaly")
    inconclusive = sum(1 for v in validation_results.values() if v.get("overall_status") == "inconclusive")

    overall = compute_overall_watershed_health(health_scores)
    avg_score = overall.get("overall_score", 0)

    st.markdown(f"""
    <div class="stats-bar">
        <div class="stat-card">
            <div class="stat-value" style="color: #e8eef2;">{total}</div>
            <div class="stat-label">Total Sites</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #3ddc97;">{confirmed}</div>
            <div class="stat-label">✅ Confirmed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #ff5d5d;">{anomalies}</div>
            <div class="stat-label">🚨 Anomalies Flagged</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #ffbe3d;">{inconclusive}</div>
            <div class="stat-label">⚠️ Inconclusive</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #06b6d4;">{avg_score}</div>
            <div class="stat-label">Watershed Health Index</div>
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_health_gauge(health_data):
    """Render health score gauge with component bars."""
    score = health_data.get("score", 0)
    grade = health_data.get("grade", "?")
    components = health_data.get("components", {})

    if score >= 70:
        color = "#3ddc97"
        bg = "rgba(61, 220, 151, 0.15)"
    elif score >= 45:
        color = "#ffbe3d"
        bg = "rgba(255, 190, 61, 0.15)"
    else:
        color = "#ff5d5d"
        bg = "rgba(255, 93, 93, 0.15)"

    st.markdown(f"""
    <div class="health-score-card">
        <div>
            <div class="mono" style="font-size:11px; color:#94a3b8; text-transform:uppercase;">Health Score</div>
            <div class="health-score" style="color: {color};">{score}<span style="font-size:20px; color:#64748b;">/100</span></div>
        </div>
        <div>
            <div class="health-grade-badge" style="background: {bg}; color: {color}; border: 1px solid {color}40;">
                Grade {grade}
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Component breakdown bars
    comp_data = {
        "🌿 NDVI Vegetation Trend": components.get("ndvi_score", 0),
        "💧 NDWI Moisture Trend": components.get("ndwi_score", 0),
        "🔗 Photo-Satellite Agreement": components.get("agreement_score", 0),
        "🎯 Prediction Confidence": components.get("confidence_score", 0),
    }
    for label, val in comp_data.items():
        bar_pct = min(max(val / 100.0, 0.0), 1.0)
        bar_color = "#3ddc97" if val >= 60 else "#ffbe3d" if val >= 35 else "#ff5d5d"
        st.markdown(f"""
        <div style="margin: 5px 0;">
            <div style="display:flex; justify-content:space-between; font-size:11px; font-family:'IBM Plex Mono', monospace;">
                <span style="color:#94a3b8;">{label}</span>
                <span style="color:{bar_color}; font-weight:600;">{val:.0f}</span>
            </div>
            <div style="background:rgba(5,7,13,0.8); border-radius:3px; height:5px; margin-top:2px; overflow:hidden;">
                <div style="background:{bar_color}; width:{bar_pct*100:.0f}%; height:100%; border-radius:3px;"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)


def render_indices(satellite_data):
    """Render NDVI / NDWI index values and deltas."""
    ndvi_t0 = satellite_data.get("ndvi_t0", 0)
    ndvi_tn = satellite_data.get("ndvi_tnow", 0)
    delta_ndvi = satellite_data.get("delta_ndvi", 0)

    ndwi_t0 = satellite_data.get("ndwi_t0", 0)
    ndwi_tn = satellite_data.get("ndwi_tnow", 0)
    delta_ndwi = satellite_data.get("delta_ndwi", 0)

    def format_delta(delta):
        if delta > 0.01:
            return "index-delta-pos", f"▲ +{delta:.3f}"
        elif delta < -0.01:
            return "index-delta-neg", f"▼ {delta:.3f}"
        return "index-delta-neu", f"─ {delta:+.3f}"

    ndvi_cls, ndvi_txt = format_delta(delta_ndvi)
    ndwi_cls, ndwi_txt = format_delta(delta_ndwi)

    st.markdown(f"""
    <div class="index-row">
        <span style="color:#94a3b8;">🌿 NDVI (Vegetation)</span>
        <span>{ndvi_t0:.3f} → {ndvi_tn:.3f} <strong class="{ndvi_cls}">{ndvi_txt}</strong></span>
    </div>
    <div class="index-row">
        <span style="color:#94a3b8;">💧 NDWI (Moisture)</span>
        <span>{ndwi_t0:.3f} → {ndwi_tn:.3f} <strong class="{ndwi_cls}">{ndwi_txt}</strong></span>
    </div>
    """, unsafe_allow_html=True)


# ─── Data Loading & Analysis Pipeline ────────────────────────────────────────

@st.cache_data(show_spinner=False)
def load_sites():
    """Load sites CSV into DataFrame."""
    if os.path.exists(config.SITES_CSV):
        df = pd.read_csv(config.SITES_CSV)
        return df
    return pd.DataFrame()


def run_analysis(sites_df, progress_callback=None):
    """
    Run full multi-modal analysis pipeline across all sites.
    """
    gee_ok = initialize_gee()

    satellite_results = {}
    for i, (_, row) in enumerate(sites_df.iterrows()):
        if progress_callback:
            progress_callback(f"🛰️ Querying Sentinel-2 data for {row['site_id']}...",
                              (i + 1) / (len(sites_df) * 3))
        satellite_results[row["site_id"]] = get_indices_for_site(
            site_id=row["site_id"],
            lat=row["lat"],
            lon=row["lon"],
            activity_type=row["activity_type"],
            gee_initialized=gee_ok,
        )

    classification_results = {}
    for i, (_, row) in enumerate(sites_df.iterrows()):
        if progress_callback:
            progress_callback(f"📸 Classifying field photo for {row['site_id']}...",
                              (len(sites_df) + i + 1) / (len(sites_df) * 3))
        photo_path = os.path.join(config.PHOTOS_DIR, row["photo_filename"])
        classification_results[row["site_id"]] = classify_photo(photo_path)

    validation_results = validate_all_sites(sites_df, satellite_results, classification_results)
    health_scores = compute_all_health_scores(sites_df, satellite_results, validation_results)

    init_db()
    save_sites(sites_df)
    for _, row in sites_df.iterrows():
        sid = row["site_id"]
        save_analysis(
            sid,
            satellite_results.get(sid, {}),
            classification_results.get(sid, {}),
            validation_results.get(sid, {}),
            health_scores.get(sid, {}),
        )

    if progress_callback:
        progress_callback("✅ Analysis complete!", 1.0)

    return satellite_results, classification_results, validation_results, health_scores


# ─── Main Application ────────────────────────────────────────────────────────

def main():
    render_header()

    # Top-level Navigation Switcher
    nav_col1, nav_col2 = st.columns([2.5, 1.5])
    with nav_col1:
        current_nav = st.radio(
            "Navigation",
            ["🛰️ Live Watershed Monitor", "📖 Technical Architecture & Approach"],
            horizontal=True,
            label_visibility="collapsed",
            key="app_main_navigation"
        )
    with nav_col2:
        st.markdown("""
        <div style="text-align:right; padding-top:4px;">
            <a href="https://github.com/atharvac9/Clean-water-Initiative/blob/main/docs/TECHNICAL_APPROACH.md" 
               target="_blank" style="font-family:'IBM Plex Mono', monospace; font-size:11px; color:#3ddc97; text-decoration:none;">
               📄 GitHub Technical Spec ↗
            </a>
        </div>
        """, unsafe_allow_html=True)

    if current_nav == "📖 Technical Architecture & Approach":
        render_technical_approach()
        return

    sites_df = load_sites()
    if sites_df.empty:
        st.error("❌ No sites data found. Please ensure `data/sites.csv` exists.")
        st.stop()

    if "analysis_done" not in st.session_state:
        st.session_state.analysis_done = False
    if "selected_site" not in st.session_state:
        st.session_state.selected_site = "S01"

    # Run analysis pipeline on first launch
    if not st.session_state.analysis_done:
        st.markdown("### 🔬 Initializing Watershed Fusion Pipeline...")
        progress_bar = st.progress(0)
        status_text = st.empty()

        def progress_cb(msg, pct):
            status_text.markdown(f"*{msg}*")
            progress_bar.progress(pct)

        results = run_analysis(sites_df, progress_cb)
        st.session_state.satellite_results = results[0]
        st.session_state.classification_results = results[1]
        st.session_state.validation_results = results[2]
        st.session_state.health_scores = results[3]
        st.session_state.analysis_done = True
        st.rerun()

    satellite_results = st.session_state.satellite_results
    classification_results = st.session_state.classification_results
    validation_results = st.session_state.validation_results
    health_scores = st.session_state.health_scores

    # Summary Stats Bar
    render_stats_bar(sites_df, validation_results, health_scores)

    # Prepare site payload for the 3D globe
    globe_sites = []
    for _, row in sites_df.iterrows():
        sid = row["site_id"]
        status = validation_results.get(sid, {}).get("overall_status", "confirmed")
        globe_sites.append({
            "id": sid,
            "name": f"{row['activity_type'].replace('_', ' ').title()} - {sid}",
            "lat": float(row["lat"]),
            "lng": float(row["lon"]),
            "status": status,
            "activity_type": row["activity_type"],
            "score": health_scores.get(sid, {}).get("score", 0),
        })

    # Two-column layout: 3D Globe / Map (Left) + Site Inspector Panel (Right)
    globe_col, panel_col = st.columns([1.8, 1.2])

    with globe_col:
        # Header + View switcher
        view_mode = st.radio(
            "Visualization Mode",
            ["🌐 3D Interactive Globe", "🗺️ 2D High-Res Satellite Map"],
            horizontal=True,
            label_visibility="collapsed",
            key="view_mode_selector",
        )

        if view_mode == "🌐 3D Interactive Globe":
            st.markdown("""
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:600; font-size:15px; color:#e8eef2;">🛰️ 3D Sensor Globe — click any marker</span>
                <span class="mono" style="font-size:11px; color:#64748b;">WebGL Powered • Drag to rotate • Scroll to zoom</span>
            </div>
            """, unsafe_allow_html=True)

            selected_from_globe = globe_selector(
                globe_sites,
                selected_id=st.session_state.selected_site,
                height=600,
                key="watershed_globe"
            )

            # Sync globe click back to Streamlit
            if selected_from_globe and selected_from_globe != st.session_state.selected_site:
                st.session_state.selected_site = selected_from_globe
                st.rerun()

        else:
            st.markdown("""
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:600; font-size:15px; color:#e8eef2;">🗺️ 2D High-Resolution Satellite Map</span>
                <span class="mono" style="font-size:11px; color:#64748b;">Sentinel-2 Multi-spectral Layers</span>
            </div>
            """, unsafe_allow_html=True)

            folium_map = build_map(sites_df, validation_results, health_scores)
            from streamlit_folium import st_folium
            st_folium(folium_map, width=None, height=600, key="folium_view")

        # Quick Site Selector Buttons beneath the Globe
        st.markdown('<div class="mono" style="font-size:11px; color:#94a3b8; margin-top:12px; margin-bottom:6px;">QUICK SELECT SITE:</div>', unsafe_allow_html=True)
        pill_cols = st.columns(len(globe_sites))
        for idx, s in enumerate(globe_sites):
            with pill_cols[idx]:
                sid = s["id"]
                is_active = (sid == st.session_state.selected_site)
                emoji = "🚨" if s["status"] == "anomaly" else "✅"
                btn_label = f"{emoji} {sid}"
                btn_type = "primary" if is_active else "secondary"
                if st.button(btn_label, key=f"pill_{sid}", type=btn_type, use_container_width=True):
                    st.session_state.selected_site = sid
                    st.rerun()

    with panel_col:
        curr_id = st.session_state.selected_site or "S01"
        site_row = sites_df[sites_df["site_id"] == curr_id].iloc[0]
        sat_data = satellite_results.get(curr_id, {})
        class_data = classification_results.get(curr_id, {})
        valid_data = validation_results.get(curr_id, {})
        health_data = health_scores.get(curr_id, {})

        status = valid_data.get("overall_status", "confirmed")
        status_class = "status-anomaly" if status == "anomaly" else "status-confirmed"
        pill_class = "anomaly" if status == "anomaly" else "confirmed"
        border_class = "anomaly-border" if status == "anomaly" else ""
        flags = valid_data.get("flags", [])

        # Inspection Panel Header
        st.markdown(f"""
        <div class="site-panel {border_class}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="mono" style="opacity:0.7; font-size:12px; letter-spacing:1px;">SITE INSPECTOR // {curr_id}</span>
                <span class="status-pill {pill_class}">{status.upper()}</span>
            </div>
            <h3 style="margin: 8px 0 4px 0; font-size: 1.4em; color: #ffffff;">
                {site_row['activity_type'].replace('_', ' ').title()}
            </h3>
            <div class="mono" style="opacity:0.7; font-size:12px; margin-bottom: 12px;">
                📍 {site_row['lat']:.4f}°N, {site_row['lon']:.4f}°E • Date: {site_row.get('date', 'N/A')}
            </div>
        """, unsafe_allow_html=True)

        # Health score component
        render_health_gauge(health_data)

        # Anomaly Box if flags exist
        if status == "anomaly" or flags:
            flags_html = "".join([f'<div class="anomaly-flag-item">⚠️ {f}</div>' for f in flags])
            st.markdown(f"""
            <div class="anomaly-box">
                <h4>🚨 CROSS-VALIDATION MISMATCH DETECTED</h4>
                {flags_html}
            </div>
            """, unsafe_allow_html=True)

        # Indices breakdown
        render_indices(sat_data)

        st.markdown('</div>', unsafe_allow_html=True)

        # Visual Evidence Tabs: Photo vs Satellite
        tab_photo, tab_satellite = st.tabs(["📸 Field Photo Evidence", "🛰️ Sentinel-2 Comparison"])

        with tab_photo:
            photo_path = os.path.join(config.PHOTOS_DIR, site_row["photo_filename"])
            if os.path.exists(photo_path):
                st.image(photo_path, use_container_width=True)
            else:
                st.markdown(
                    f"""<div style="background:rgba(5,7,13,0.7); border:1px dashed rgba(71,85,105,0.6);
                    border-radius:8px; padding:28px; text-align:center; color:#64748b;">
                    <div style="font-size:1.8em; margin-bottom:6px;">📷</div>
                    <div class="mono" style="font-size:12px;">Photo not present</div>
                    <div class="mono" style="font-size:10px; margin-top:2px;">{site_row['photo_filename']}</div>
                    </div>""",
                    unsafe_allow_html=True,
                )

            # CLIP classification card
            predicted_class = class_data.get("predicted_class", "—")
            pred_conf = class_data.get("confidence", 0)
            st.markdown(f"""
            <div style="margin-top:10px; padding:10px 14px; background:rgba(5,7,13,0.7);
                        border:1px solid rgba(71,85,105,0.3); border-radius:8px;">
                <div class="mono" style="font-size:10px; color:#94a3b8; text-transform:uppercase;">AI Visual Interpretation (Zero-Shot CLIP)</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                    <strong style="color:#e8eef2; font-size:13px;">{predicted_class.replace('_', ' ').title()}</strong>
                    <span class="mono" style="color:#3ddc97; font-size:12px; font-weight:600;">{pred_conf:.1%} confidence</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

        with tab_satellite:
            thumb_t0 = get_thumbnail(curr_id, "t0")
            thumb_tnow = get_thumbnail(curr_id, "tnow")

            if thumb_t0 and thumb_tnow:
                try:
                    from streamlit_image_comparison import image_comparison
                    image_comparison(
                        img1=thumb_t0,
                        img2=thumb_tnow,
                        label1=f"Baseline ({config.T0_START[:7]})",
                        label2=f"Current ({config.T_NOW_START[:7]})",
                        width=700,
                        starting_position=50,
                        show_labels=True,
                        make_responsive=True,
                    )
                except (ImportError, TypeError, Exception):
                    c1, c2 = st.columns(2)
                    with c1:
                        st.image(thumb_t0, caption=f"Baseline ({config.T0_START[:7]})", use_container_width=True)
                    with c2:
                        st.image(thumb_tnow, caption=f"Current ({config.T_NOW_START[:7]})", use_container_width=True)
            else:
                st.markdown(
                    """<div style="background:rgba(5,7,13,0.7); border:1px dashed rgba(71,85,105,0.6);
                    border-radius:8px; padding:28px; text-align:center; color:#64748b;">
                    <div style="font-size:1.8em; margin-bottom:6px;">🛰️</div>
                    <div class="mono" style="font-size:12px;">Satellite thumbnails cached locally</div>
                    </div>""",
                    unsafe_allow_html=True,
                )

        # Quick Actions
        st.markdown("")
        if st.button("🔄 Re-run Analysis Pipeline", use_container_width=True):
            clear_cache()
            st.session_state.analysis_done = False
            st.rerun()

    # ── Site Metadata & Raw Scores Expander ──────────────────────────────────
    with st.expander("📋 Site Metadata & Classification Probabilities", expanded=False):
        meta_col1, meta_col2 = st.columns(2)
        with meta_col1:
            st.markdown("**Site Attributes:**")
            st.json({
                "site_id": curr_id,
                "coordinates": f"{site_row['lat']}, {site_row['lon']}",
                "date": str(site_row.get("date", "")),
                "claimed_activity": site_row["activity_type"],
                "description": site_row.get("description", ""),
                "data_source": sat_data.get("source", "Sentinel-2 / Mock"),
            })
        with meta_col2:
            st.markdown("**CLIP Class Distribution:**")
            scores = class_data.get("all_scores", {})
            if scores:
                chart_df = pd.DataFrame({
                    "Class": [k.replace("_", " ").title() for k in scores.keys()],
                    "Probability": list(scores.values())
                })
                st.bar_chart(chart_df.set_index("Class"), height=180)

    # ── All Sites Summary Table ──────────────────────────────────────────────
    with st.expander("📊 All Sites Summary Table", expanded=False):
        summary_rows = []
        for _, row in sites_df.iterrows():
            sid = row["site_id"]
            v = validation_results.get(sid, {})
            h = health_scores.get(sid, {})
            s = satellite_results.get(sid, {})
            c = classification_results.get(sid, {})

            status = v.get("overall_status", "?")
            emoji = {"confirmed": "🟢", "anomaly": "🔴", "inconclusive": "🟡"}.get(status, "⚪")

            summary_rows.append({
                "Status": f"{emoji} {status.upper()}",
                "Site": sid,
                "Activity": row["activity_type"],
                "NDVI Δ": f"{s.get('delta_ndvi', 0):+.3f}",
                "NDWI Δ": f"{s.get('delta_ndwi', 0):+.3f}",
                "Photo Class": c.get("predicted_class", "—"),
                "Confidence": f"{c.get('confidence', 0):.0%}",
                "Health": f"{h.get('score', 0)}/100 ({h.get('grade', '?')})",
                "Flags": len(v.get("flags", [])),
            })

        st.dataframe(
            pd.DataFrame(summary_rows),
            use_container_width=True,
            hide_index=True,
        )

    # ── Footer ───────────────────────────────────────────────────────────────
    st.markdown("---")
    st.markdown(
        """<div style="text-align:center; color:#64748b; font-size:0.8em; font-family:'IBM Plex Mono', monospace; padding: 10px 0;">
        🛰️ Watershed Photo-Satellite Fusion • Smart India Hackathon 2026 •
        Sentinel-2 Multispectral Analysis + CLIP Zero-Shot Vision + WebGL 3D Globe
        </div>""",
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()

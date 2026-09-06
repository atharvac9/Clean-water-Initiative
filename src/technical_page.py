"""
📖 Technical Architecture & Approach Page
Comprehensive technical explanation of the Watershed Photo-Satellite Fusion System.
"""
import streamlit as st
import pandas as pd


def render_technical_approach():
    """Renders the comprehensive interactive technical architecture guide."""
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(13, 43, 62, 0.95) 0%, rgba(5, 17, 28, 0.98) 100%);
                border: 1px solid rgba(61, 220, 151, 0.3); border-radius: 12px; padding: 24px 30px; margin-bottom: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
            <div>
                <span class="mono" style="color:#3ddc97; font-size:12px; letter-spacing:1px;">SYSTEM SPECIFICATION // SIH 2026</span>
                <h2 style="color:#ffffff; margin: 4px 0 8px 0; font-size: 2em; font-weight:700;">
                    Technical Architecture & Operational Approach
                </h2>
                <p style="color:#94a3b8; font-size: 0.95em; max-width: 850px; line-height:1.6; margin:0;">
                    How our multi-modal fusion platform bridges ground-level photographic evidence with spaceborne Sentinel-2 
                    remote sensing to automate verification, flag false claims, and track long-term watershed health.
                </p>
            </div>
            <div style="text-align:right;">
                <span style="background: rgba(61, 220, 151, 0.15); border: 1px solid rgba(61, 220, 151, 0.4); 
                             color: #3ddc97; font-family:'IBM Plex Mono', monospace; font-size: 11px; padding: 6px 14px; border-radius: 20px;">
                    WHITE-PAPER VIEW
                </span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Section Tabs ─────────────────────────────────────────────────────────
    tab_overview, tab_pipeline, tab_math, tab_rules, tab_tools, tab_case = st.tabs([
        "🏗️ System Architecture",
        "🔄 End-to-End Pipeline",
        "📐 Mathematical Formulations",
        "⚖️ Cross-Validation Matrix",
        "🛠️ Tooling & Tech Stack",
        "🚨 S06 Anomaly Case Study"
    ])

    # ── TAB 1: System Architecture ───────────────────────────────────────────
    with tab_overview:
        st.markdown("### 1. High-Level Architectural Framework")
        st.markdown("""
        The system decouples data ingestion, deep learning vision interpretation, physical band math, 
        heuristic cross-validation, and 3D WebGL rendering into four distinct execution layers:
        """)

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("""
            <div style="background: rgba(13, 43, 62, 0.7); border: 1px solid rgba(71, 85, 105, 0.4); 
                        border-radius: 10px; padding: 18px; margin-bottom: 14px;">
                <div class="mono" style="color: #3ddc97; font-size: 12px; font-weight:600;">LAYER 1: GROUND EVIDENCE (EDGE)</div>
                <h4 style="color:#ffffff; margin: 4px 0 8px 0;">Field Photos & Geo-Coordinates</h4>
                <p style="color:#94a3b8; font-size: 12px; line-height:1.5;">
                    Captures geo-tagged field photographs and claimed intervention types (Check Dam, Farm Pond, Plantation, 
                    Water Body, Degraded Land) recorded by field personnel.
                </p>
            </div>
            <div style="background: rgba(13, 43, 62, 0.7); border: 1px solid rgba(71, 85, 105, 0.4); 
                        border-radius: 10px; padding: 18px;">
                <div class="mono" style="color: #06b6d4; font-size: 12px; font-weight:600;">LAYER 2: SPACEBORNE SENSING (GEE)</div>
                <h4 style="color:#ffffff; margin: 4px 0 8px 0;">Sentinel-2 Multi-Spectral Reflectance</h4>
                <p style="color:#94a3b8; font-size: 12px; line-height:1.5;">
                    Queries Google Earth Engine Copernicus Sentinel-2 Level-2A surface reflectance at 10m resolution 
                    across baseline ($T_0$) and post-intervention ($T_{now}$) temporal windows with cloud masking.
                </p>
            </div>
            """, unsafe_allow_html=True)

        with col2:
            st.markdown("""
            <div style="background: rgba(13, 43, 62, 0.7); border: 1px solid rgba(71, 85, 105, 0.4); 
                        border-radius: 10px; padding: 18px; margin-bottom: 14px;">
                <div class="mono" style="color: #a855f7; font-size: 12px; font-weight:600;">LAYER 3: MULTI-MODAL FUSION CORE</div>
                <h4 style="color:#ffffff; margin: 4px 0 8px 0;">CLIP Vision AI & Rule Engine</h4>
                <p style="color:#94a3b8; font-size: 12px; line-height:1.5;">
                    Executes zero-shot photo classification via OpenAI CLIP (ViT-B/32) and feeds class probabilities 
                    alongside satellite &Delta;NDVI and &Delta;NDWI into the cross-validation rule engine.
                </p>
            </div>
            <div style="background: rgba(13, 43, 62, 0.7); border: 1px solid rgba(71, 85, 105, 0.4); 
                        border-radius: 10px; padding: 18px;">
                <div class="mono" style="color: #f59e0b; font-size: 12px; font-weight:600;">LAYER 4: INTERACTIVE 3D PRESENTATION</div>
                <h4 style="color:#ffffff; margin: 4px 0 8px 0;">3D WebGL Globe & Inspector</h4>
                <p style="color:#94a3b8; font-size: 12px; line-height:1.5;">
                    Renders an interactive Three.js / Globe.gl 3D Earth model with radar pulse ripples, 
                    real-time telemetry HUD, comparison sliders, and audit trail tables.
                </p>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("#### Architectural Dataflow Diagram")
        st.code("""
┌─────────────────────────┐          ┌───────────────────────────┐
│ Ground Field Evidence   │          │ Spaceborne Remote Sensing │
│ • Geo-tagged Photos     │          │ • Sentinel-2 Harmonized   │
│ • Coordinates (lat,lon) │          │ • Temporal Query (T0/Tnow)│
└────────────┬────────────┘          └─────────────┬─────────────┘
             │                                     │
             ▼                                     ▼
┌─────────────────────────┐          ┌───────────────────────────┐
│ OpenAI CLIP Classifier  │          │ GEE Multispectral Engine  │
│ (ViT-B/32 Zero-Shot)    │          │ (NDVI & NDWI Deltas)      │
└────────────┬────────────┘          └─────────────┬─────────────┘
             │                                     │
             └──────────────────┬──────────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │ Cross-Validation Engine │
                   │ • Rule Consistency     │
                   │ • Discrepancy Detection │
                   └────────────┬────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │  Health Score & Flags   │
                   │  (0 - 100 Index Score)  │
                   └────────────┬────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │  Interactive Dashboard  │
                   │  • 3D WebGL Globe       │
                   │  • 2D Multispectral Map │
                   │  • Slide-in Inspector   │
                   └─────────────────────────┘
        """, language="text")

    # ── TAB 2: End-to-End Pipeline ───────────────────────────────────────────
    with tab_pipeline:
        st.markdown("### 2. End-to-End Execution Sequence")
        st.markdown("""
        Every site undergoing audit passes through a deterministic 5-step analysis pipeline:
        """)

        steps = [
            ("1. Ingestion & Spatial Query", 
             "Loads coordinates and claimed intervention from CSV. Spatially buffers a 500m radius around the coordinate."),
            ("2. Multi-Temporal Sentinel-2 Query",
             "Queries ESA Copernicus Sentinel-2 Surface Reflectance (Level-2A). Calculates median composites for T0 (Baseline) and T_now (Current) with QA60 cloud masking (<20%)."),
            ("3. Band Math Computation",
             "Extracts Band 4 (Red), Band 3 (Green), Band 8 (NIR) to compute NDVI (Biomass) and NDWI (Moisture) indices and delta shifts."),
            ("4. Zero-Shot Visual Classification",
             "Runs OpenAI CLIP (ViT-B/32) on the field photograph against 5 engineered watershed prompt embeddings to determine true visual composition."),
            ("5. Cross-Validation & Health Scoring",
             "Compares physical index deltas against claimed intervention rules. Emits anomaly flags on violation and calculates a standardized 0-100 Watershed Health Score."),
        ]

        for title, desc in steps:
            st.markdown(f"""
            <div style="display:flex; align-items:flex-start; gap:12px; background:rgba(5,7,13,0.6); 
                        border:1px solid rgba(71,85,105,0.3); border-radius:8px; padding:14px 18px; margin:8px 0;">
                <span class="mono" style="background:#0d2b3e; color:#3ddc97; border:1px solid rgba(61,220,151,0.3);
                                          padding:4px 10px; border-radius:6px; font-weight:600; font-size:12px;">{title[:2]}</span>
                <div>
                    <strong style="color:#ffffff; font-size:14px;">{title[3:]}</strong>
                    <div style="color:#94a3b8; font-size:12px; margin-top:3px;">{desc}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

    # ── TAB 3: Mathematical Formulations ─────────────────────────────────────
    with tab_math:
        st.markdown("### 3. Remote Sensing & Health Scoring Mathematics")

        st.markdown("#### A. Normalized Difference Vegetation Index (NDVI)")
        st.markdown("Quantifies photosynthetic active biomass using Near-Infrared (B8) and Red (B4) reflectance:")
        st.latex(r"\text{NDVI} = \frac{\text{B8 (NIR)} - \text{B4 (Red)}}{\text{B8 (NIR)} + \text{B4 (Red)}}")
        st.markdown("""
        - **Range**: $[-1.0, +1.0]$
        - **Interpretation**: Values $> 0.2$ indicate emerging vegetation; $> 0.4$ indicate dense, vigorous canopy.
        - **Role**: Validates whether afforestation and hill plantation initiatives resulted in vegetative expansion.
        """)

        st.markdown("---")
        st.markdown("#### B. Normalized Difference Water Index (NDWI - McFeeters)")
        st.markdown("Delineates surface water features and moisture saturation using Green (B3) and NIR (B8):")
        st.latex(r"\text{NDWI} = \frac{\text{B3 (Green)} - \text{B8 (NIR)}}{\text{B3 (Green)} + \text{B8 (NIR)}}")
        st.markdown("""
        - **Range**: $[-1.0, +1.0]$
        - **Interpretation**: Positive values ($> 0.0$) denote open standing water bodies; $-0.15$ to $0.0$ denote saturated soils/wetlands.
        - **Role**: Validates water impoundment in farm ponds, check dams, and percolation tanks.
        """)

        st.markdown("---")
        st.markdown("#### C. Composite Watershed Health Score (0–100)")
        st.markdown("Holistic multi-factor equation balancing physical remote sensing, model consensus, and certainty:")
        st.latex(r"S = w_{\text{NDVI}} \cdot S_{\text{NDVI}} + w_{\text{NDWI}} \cdot S_{\text{NDWI}} + w_{\text{agree}} \cdot S_{\text{agree}} + w_{\text{conf}} \cdot S_{\text{conf}}")

        st.markdown("""
        | Weight | Factor | Formulation | Target Goal |
        | :--- | :--- | :--- | :--- |
        | **$w_{\\text{NDVI}} = 0.30$** | **Vegetation Vitality** | Normalized $\\Delta\\text{NDVI} \\in [-0.3, +0.3] \\to [0, 100]$ | Rewards biomass accumulation |
        | **$w_{\\text{NDWI}} = 0.30$** | **Hydrological Presence**| Normalized $\\Delta\\text{NDWI} \\in [-0.3, +0.3] \\to [0, 100]$ | Rewards water harvesting |
        | **$w_{\\text{agree}} = 0.25$**| **Model Consensus** | $100$ (Confirmed), $50$ (Inconclusive), $\\le 30$ (Anomaly) | Penalizes contradictions |
        | **$w_{\\text{conf}} = 0.15$** | **Prediction Confidence**| $\\text{Softmax Confidence} \\times 100$ | Rewards clear visual evidence |
        """)

        st.markdown("#### Grade Categorization:")
        st.markdown("""
        - 🟢 **Grade A (80–100)**: Exemplary intervention; high water/vegetation growth with verified photo evidence.
        - 🟢 **Grade B (65–79)**: Sound intervention; positive index trends with minor seasonal variation.
        - 🟡 **Grade C (50–64)**: Marginal performance; low water retention or slow vegetative establishment.
        - 🔴 **Grade D (<50)**: Critical anomaly; failed intervention, false claim, or severe degradation.
        """)

    # ── TAB 4: Cross-Validation Matrix ───────────────────────────────────────
    with tab_rules:
        st.markdown("### 4. Cross-Validation Consistency Rules")
        st.markdown("""
        The engine applies physical constraints to verify whether satellite trend data aligns with 
        the claimed intervention:
        """)

        rules_data = [
            {"Claimed Activity": "Check Dam", "Expected NDVI": "Stable / Increase (Δ ≥ -0.05)", "Expected NDWI": "Increase (Δ ≥ 0.00)", "Failure Condition": "Falling NDWI or severe vegetation loss"},
            {"Claimed Activity": "Farm Pond", "Expected NDVI": "Stable (Δ ≥ -0.10)", "Expected NDWI": "Increase (Δ ≥ 0.00, T_now ≥ -0.15)", "Failure Condition": "No water signature / negative NDWI"},
            {"Claimed Activity": "Plantation", "Expected NDVI": "Significant Increase (Δ ≥ +0.05)", "Expected NDWI": "Stable (Δ ≥ -0.15)", "Failure Condition": "NDVI fails to rise or declines"},
            {"Claimed Activity": "Water Body", "Expected NDVI": "Stable (Δ ≥ -0.20)", "Expected NDWI": "High Persistent (T_now ≥ -0.05)", "Failure Condition": "NDWI below open water threshold"},
            {"Claimed Activity": "Degraded Land", "Expected NDVI": "Low Baseline (Δ ≤ +0.10)", "Expected NDWI": "Low Baseline (Δ ≤ 0.00)", "Failure Condition": "Reference control class"},
        ]
        st.dataframe(pd.DataFrame(rules_data), use_container_width=True, hide_index=True)

        st.markdown("""
        > **⚠️ Photo Discrepancy Rule:** If the CLIP predicted class does not match the claimed intervention with 
        > confidence > 60%, the site is automatically flagged with an explicit visual mismatch warning.
        """)

    # ── TAB 5: Tooling & Tech Stack ──────────────────────────────────────────
    with tab_tools:
        st.markdown("### 5. Architectural Tooling Matrix")
        st.markdown("Every technology was selected to optimize performance, developer velocity, and hackathon presentation:")

        tools_data = [
            {"Tool": "Python 3.11+", "Category": "Core Language", "Why Selected": "Universal standard for GIS, remote sensing, PyTorch inference, and rapid prototyping."},
            {"Tool": "Streamlit", "Category": "Web Framework", "Why Selected": "Native reactive Python state management; instant component updates without building separate REST APIs."},
            {"Tool": "Three.js / Globe.gl", "Category": "3D WebGL Visualization", "Why Selected": "Hardware-accelerated 3D planetary rendering with radar rings, atmosphere shaders, and postMessage event sync."},
            {"Tool": "Google Earth Engine", "Category": "Satellite Compute", "Why Selected": "Server-side band math and spatial aggregation on petabytes of Sentinel-2 data without downloading raw granules."},
            {"Tool": "OpenAI CLIP (ViT-B/32)", "Category": "Zero-Shot Vision AI", "Why Selected": "Eliminates need for thousands of manually labeled images; highly resilient to variable lighting, angles, and ground clutter."},
            {"Tool": "Folium / Leaflet", "Category": "2D Cartography", "Why Selected": "Reliable 2D fallback offering multi-spectral satellite basemaps and interactive coordinate markers."},
            {"Tool": "Streamlit Image Comparison", "Category": "Visual Inspection", "Why Selected": "Intuitive before/after slider comparing baseline (T0) vs current (T_now) satellite snapshots."},
            {"Tool": "SQLite3", "Category": "Persistence", "Why Selected": "Zero-config embedded relational database enabling tamper-resistant historical audit logs."},
        ]
        st.dataframe(pd.DataFrame(tools_data), use_container_width=True, hide_index=True)

    # ── TAB 6: S06 Anomaly Case Study ────────────────────────────────────────
    with tab_case:
        st.markdown("### 6. The \"Demo Beat\": S06 Anomaly Investigation")
        st.markdown("""
        To demonstrate the power of multi-modal fusion over single-modality checks, the sample dataset features 
        **Site S06**, representing a fraudulent or failed watershed asset claim:
        """)

        c1, c2 = st.columns(2)
        with c1:
            st.markdown("""
            <div style="background:rgba(13,43,62,0.8); border:1px solid rgba(71,85,105,0.4); border-radius:10px; padding:20px;">
                <div class="mono" style="color:#94a3b8; font-size:12px;">CLAIMED ASSET RECORD</div>
                <h3 style="color:#ffffff; margin:4px 0;">Site S06 — Farm Pond</h3>
                <p style="color:#94a3b8; font-size:13px;">📍 19.050°N, 74.900°E (Ahmednagar, MH)</p>
                <div class="status-pill confirmed" style="margin-top:4px;">CLAIM: COMPLETED FARM POND</div>
                <p style="color:#cbd5e1; font-size:12px; margin-top:12px;">
                    Field officer submitted photo claiming a newly excavated farm pond for rainwater harvesting.
                </p>
            </div>
            """, unsafe_allow_html=True)

        with c2:
            st.markdown("""
            <div style="background:rgba(255,93,93,0.1); border:1px solid rgba(255,93,93,0.4); border-radius:10px; padding:20px;">
                <div class="mono" style="color:#ff5d5d; font-size:12px;">FUSION SYSTEM VERDICT</div>
                <h3 style="color:#ff8585; margin:4px 0;">🚨 ANOMALY DETECTED</h3>
                <p style="color:#fca5a5; font-size:13px;">Health Score: <strong>37 / 100 (Grade D)</strong></p>
                <div class="status-pill anomaly" style="margin-top:4px;">VERDICT: GROUND CONTRADICTION</div>
                <p style="color:#fecaca; font-size:12px; margin-top:12px;">
                    Multi-modal evidence rejects claim: Photo depicts barren degraded soil, and Sentinel-2 confirms 
                    zero water presence.
                </p>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("#### The 3 Automated Red Flags Raised on S06:")
        st.markdown("""
        1. 🚨 **NDWI Trend Contradiction**: $\\Delta\\text{NDWI} = -0.071$. Moisture declined rather than increasing, contradicting farm pond water harvesting.
        2. 🚨 **Absence of Water Signature**: $\\text{NDWI}_{now} = -0.277$. Far below the $-0.15$ threshold required for standing or pooled water.
        3. 🚨 **Photo Classification Mismatch**: OpenAI CLIP classified the field image as **`degraded_land`** with **82% confidence**, directly contradicting the claimed `farm_pond`.
        """)

    st.markdown("---")
    st.markdown("""
    <div style="text-align:center; padding:16px 0;">
        <span class="mono" style="color:#64748b; font-size:12px;">
            Full 4,000-word markdown specification available in repository at 
            <a href="https://github.com/atharvac9/Clean-water-Initiative/blob/main/docs/TECHNICAL_APPROACH.md" 
               target="_blank" style="color:#3ddc97;">docs/TECHNICAL_APPROACH.md</a>
        </span>
    </div>
    """, unsafe_allow_html=True)

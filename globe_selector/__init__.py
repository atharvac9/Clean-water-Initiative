"""
Globe Selector — Streamlit Component
Interactive 3D WebGL globe with site markers for watershed monitoring.
Uses st.iframe (or st.components.v1.html fallback) to render the globe inline.
"""
import os
import json
import streamlit as st

try:
    import streamlit.components.v1 as components
except ImportError:
    components = None


def globe_selector(sites, selected_id=None, height=580, key=None, default=None):
    """
    Renders an interactive 3D WebGL globe with watershed site markers.

    Returns the selected site ID from session state.
    """
    normalized_sites = []
    for s in sites:
        item = dict(s)
        if "lng" not in item and "lon" in item:
            item["lng"] = float(item["lon"])
        if "lat" in item:
            item["lat"] = float(item["lat"])
        normalized_sites.append(item)

    sites_json = json.dumps(normalized_sites)
    selected_json = json.dumps(selected_id)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
  <!-- Load Globe.gl from high-speed jsDelivr CDN -->
  <script src="https://cdn.jsdelivr.net/npm/globe.gl@2.46.2/dist/globe.gl.min.js"></script>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html, body {{
      background: #05070d;
      color: #e8eef2;
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
      width: 100%;
      height: 100%;
      user-select: none;
    }}
    #globeViz {{
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
    }}
    .hud-panel {{
      position: absolute;
      z-index: 20;
      pointer-events: auto;
    }}
    .hud-top-left {{
      top: 14px;
      left: 14px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }}
    .hud-badge {{
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(5, 7, 13, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.35);
      backdrop-filter: blur(8px);
      padding: 5px 11px;
      border-radius: 6px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: #06b6d4;
      font-weight: 500;
      letter-spacing: 0.5px;
    }}
    .hud-pulse {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
      animation: pulse-hud 1.8s infinite;
    }}
    .hud-pulse.anomaly {{
      background: #ff5d5d;
      box-shadow: 0 0 8px #ff5d5d;
    }}
    @keyframes pulse-hud {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(0.85); }}
    }}
    .hud-top-right {{
      top: 14px;
      right: 14px;
      display: flex;
      gap: 6px;
    }}
    .hud-btn {{
      background: rgba(5, 7, 13, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      color: #94a3b8;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      padding: 5px 9px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }}
    .hud-btn:hover {{
      background: rgba(6, 182, 212, 0.15);
      border-color: rgba(6, 182, 212, 0.5);
      color: #e8eef2;
    }}
    .hud-btn.active {{
      border-color: #06b6d4;
      color: #06b6d4;
    }}
    .hud-bottom-left {{
      bottom: 14px;
      left: 14px;
      background: rgba(5, 7, 13, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(8px);
      padding: 7px 11px;
      border-radius: 6px;
      font-size: 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }}
    .legend-item {{
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
    }}
    .dot {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }}
    .dot-confirmed {{ background: #3ddc97; box-shadow: 0 0 5px #3ddc97; }}
    .dot-anomaly {{ background: #ff5d5d; box-shadow: 0 0 5px #ff5d5d; }}
    .dot-inconclusive {{ background: #ffbe3d; box-shadow: 0 0 5px #ffbe3d; }}
    .hud-bottom-right {{
      bottom: 12px;
      right: 12px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      color: #64748b;
      background: rgba(5, 7, 13, 0.7);
      padding: 3px 7px;
      border-radius: 4px;
    }}
  </style>
</head>
<body>
  <div id="globeViz">
    <div id="loadingText">🛰️ Initializing 3D Satellite Globe...</div>
  </div>

  <div class="hud-panel hud-top-left">
    <div class="hud-badge" id="hudStatusBadge">
      <div class="hud-pulse" id="hudPulse"></div>
      <span id="hudStatusText">WATERSHED SENSOR NETWORK</span>
    </div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#94a3b8;padding-left:3px;" id="hudSelectedDetails">
      Click a marker to inspect
    </div>
  </div>

  <div class="hud-panel hud-top-right">
    <button class="hud-btn" id="btnFocusWatershed" title="Focus Watershed"><span>🎯</span> Focus</button>
    <button class="hud-btn" id="btnResetView" title="Orbit View"><span>🌍</span> Orbit</button>
    <button class="hud-btn active" id="btnToggleRotate" title="Auto-Rotate"><span>🔄</span> Rotate</button>
  </div>

  <div class="hud-panel hud-bottom-left">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#64748b;margin-bottom:3px;text-transform:uppercase;">
      Site Status
    </div>
    <div class="legend-item"><span class="dot dot-confirmed"></span> Confirmed</div>
    <div class="legend-item"><span class="dot dot-anomaly"></span> Anomaly</div>
    <div class="legend-item"><span class="dot dot-inconclusive"></span> Inconclusive</div>
  </div>

  <div class="hud-panel hud-bottom-right" id="hudCameraInfo">LAT 19.050° | LON 74.720°</div>

  <script>
    const sitesData = {sites_json};
    let currentSelectedId = {selected_json};
    let isAutoRotating = true;

    function getStatusColor(s) {{
      if (s === 'anomaly') return '#ff5d5d';
      if (s === 'inconclusive') return '#ffbe3d';
      return '#3ddc97';
    }}

    function updateHud(site) {{
      const badge = document.getElementById('hudStatusBadge');
      const pulse = document.getElementById('hudPulse');
      const txt = document.getElementById('hudStatusText');
      const det = document.getElementById('hudSelectedDetails');
      if (!site) {{ txt.innerText = 'WATERSHED SENSOR NETWORK'; pulse.className = 'hud-pulse'; det.innerText = 'Click any marker'; return; }}
      if (site.status === 'anomaly') {{
        pulse.className = 'hud-pulse anomaly'; badge.style.borderColor = 'rgba(255,93,93,0.4)'; badge.style.color = '#ff5d5d';
        txt.innerText = site.id + ' — ANOMALY FLAGGED';
      }} else {{
        pulse.className = 'hud-pulse'; badge.style.borderColor = 'rgba(61,220,151,0.4)'; badge.style.color = '#3ddc97';
        txt.innerText = site.id + ' — VERIFIED';
      }}
      const nm = site.name || (site.activity_type ? site.activity_type.replace('_',' ').toUpperCase() : '');
      det.innerText = nm + ' | ' + site.lat.toFixed(4) + '°N, ' + site.lng.toFixed(4) + '°E';
    }}

    function initGlobe() {{
      const container = document.getElementById('globeViz');
      if (!container || typeof Globe === 'undefined') {{
        console.warn('Globe.gl library not loaded yet or container missing');
        return;
      }}
      container.innerHTML = ''; // clear loading text

      const initialWidth = container.clientWidth || window.innerWidth || 800;
      const initialHeight = container.clientHeight || {height};

      const globe = Globe()(container)
        .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .atmosphereColor('#06b6d4')
        .atmosphereAltitude(0.22)
        .width(initialWidth)
        .height(initialHeight)
        .pointsData(sitesData)
        .pointLat('lat').pointLng('lng')
        .pointColor(d => d.id === currentSelectedId ? '#ffffff' : getStatusColor(d.status))
        .pointAltitude(d => d.id === currentSelectedId ? 0.08 : 0.03)
        .pointRadius(d => d.id === currentSelectedId ? 1.0 : 0.55)
        .pointLabel(d => `
          <div style="background:rgba(5,7,13,0.92);border:1px solid ${{getStatusColor(d.status)}};border-radius:6px;padding:7px 11px;font-family:'Space Grotesk',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,0.6);">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:${{getStatusColor(d.status)}};font-weight:600;">
              ${{d.id}} • ${{d.status.toUpperCase()}}
            </div>
            <div style="font-weight:600;font-size:12px;color:#fff;margin:2px 0;">
              ${{d.name || (d.activity_type ? d.activity_type.replace('_',' ') : 'Site')}}
            </div>
            <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#94a3b8;">
              ${{d.lat.toFixed(4)}}°N, ${{d.lng.toFixed(4)}}°E
            </div>
          </div>`)
        .onPointClick(d => {{
          currentSelectedId = d.id;
          updateHud(d);
          globe.pointsData([...sitesData]);
          globe.ringsData([...sitesData]);
          globe.labelsData([...sitesData]);
          globe.pointOfView({{ lat: d.lat, lng: d.lng, altitude: 0.75 }}, 1200);
        }})
        .ringsData(sitesData)
        .ringLat('lat').ringLng('lng')
        .ringColor(d => () => getStatusColor(d.status))
        .ringMaxRadius(d => d.id === currentSelectedId ? 3.2 : 1.5)
        .ringPropagationSpeed(d => d.status === 'anomaly' ? 2.5 : 1.2)
        .ringRepeatPeriod(d => d.status === 'anomaly' ? 750 : 1200)
        .labelsData(sitesData)
        .labelLat('lat').labelLng('lng')
        .labelText(d => d.id)
        .labelSize(d => d.id === currentSelectedId ? 1.5 : 1.1)
        .labelDotRadius(0.3)
        .labelColor(d => d.id === currentSelectedId ? '#ffffff' : getStatusColor(d.status))
        .labelAltitude(d => d.id === currentSelectedId ? 0.09 : 0.04)
        .onLabelClick(d => {{
          currentSelectedId = d.id;
          updateHud(d);
          globe.pointsData([...sitesData]);
          globe.ringsData([...sitesData]);
          globe.labelsData([...sitesData]);
          globe.pointOfView({{ lat: d.lat, lng: d.lng, altitude: 0.75 }}, 1200);
        }});

      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      controls.addEventListener('change', () => {{
        const pov = globe.pointOfView();
        const info = document.getElementById('hudCameraInfo');
        if (info && pov) info.innerText = 'LAT ' + pov.lat.toFixed(3) + '° | LON ' + pov.lng.toFixed(3) + '° | ALT ' + pov.altitude.toFixed(2);
      }});

      // Focus on the selected site, or default to watershed center
      if (currentSelectedId) {{
        const sel = sitesData.find(s => s.id === currentSelectedId);
        if (sel) {{
          updateHud(sel);
          globe.pointOfView({{ lat: sel.lat, lng: sel.lng, altitude: 0.75 }}, 1400);
        }}
      }} else if (sitesData.length > 0) {{
        globe.pointOfView({{ lat: 19.10, lng: 74.72, altitude: 1.2 }}, 0);
      }}

      // Handle dynamic window resizing
      window.addEventListener('resize', () => {{
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || {height};
        globe.width(w).height(h);
      }});

      document.getElementById('btnFocusWatershed').addEventListener('click', () => {{
        globe.pointOfView({{ lat: 19.10, lng: 74.72, altitude: 0.65 }}, 1200);
      }});
      document.getElementById('btnResetView').addEventListener('click', () => {{
        globe.pointOfView({{ lat: 20.0, lng: 75.0, altitude: 2.2 }}, 1200);
      }});
      const btnR = document.getElementById('btnToggleRotate');
      btnR.addEventListener('click', () => {{
        isAutoRotating = !isAutoRotating;
        globe.controls().autoRotate = isAutoRotating;
        btnR.classList.toggle('active', isAutoRotating);
      }});
    }}

    // Ensure DOM and external scripts are loaded
    if (document.readyState === 'loading') {{
      document.addEventListener('DOMContentLoaded', initGlobe);
    }} else {{
      setTimeout(initGlobe, 100);
    }}
  </script>
</body>
</html>
"""

    # Use modern st.iframe if available (Streamlit >= 1.40), fallback to components.html
    if hasattr(st, "iframe"):
        st.iframe(html_content, height=height, width="stretch")
    elif components is not None and hasattr(components, "html"):
        components.html(html_content, height=height, scrolling=False)
    else:
        st.error("HTML iframe embedding is not supported in this Streamlit version.")

    return selected_id

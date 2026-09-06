"""
Folium map builder for watershed sites.
Creates an interactive map with color-coded pins by validation status.
"""
import os
import sys

import folium
from folium import plugins

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def _get_marker_color(status):
    """Map validation status to Folium marker color name."""
    return {
        "confirmed": "green",
        "anomaly": "red",
        "inconclusive": "orange",
    }.get(status, "gray")


def _get_marker_icon(status):
    """Map validation status to Folium icon name."""
    return config.STATUS_ICONS.get(status, "info-sign")


def _build_popup_html(site_id, row, validation, health):
    """Build rich HTML popup content for a map marker."""
    status = validation.get("overall_status", "unknown")
    score = health.get("score", 0)
    grade = health.get("grade", "?")

    status_color = config.STATUS_COLORS.get(status, "#6b7280")
    status_emoji = {"confirmed": "✅", "anomaly": "🚨", "inconclusive": "⚠️"}.get(status, "❓")

    flags_html = ""
    if validation.get("flags"):
        flags_list = "".join(
            f"<li style='font-size:11px; color:#fca5a5; margin:2px 0;'>{f}</li>"
            for f in validation["flags"]
        )
        flags_html = f"""
        <div style='margin-top:8px; padding:6px; background:rgba(239,68,68,0.1);
                     border-left:3px solid #ef4444; border-radius:4px;'>
            <strong style='color:#ef4444; font-size:11px;'>⚠ FLAGS:</strong>
            <ul style='margin:4px 0 0 16px; padding:0;'>{flags_list}</ul>
        </div>
        """

    html = f"""
    <div style='font-family: Inter, system-ui, sans-serif; min-width: 260px;
                padding: 4px; color: #e2e8f0;'>
        <div style='display:flex; justify-content:space-between; align-items:center;
                    margin-bottom: 8px;'>
            <h4 style='margin:0; color:#f8fafc; font-size:15px;'>
                {status_emoji} {site_id}
            </h4>
            <span style='background:{status_color}; color:white; padding:2px 8px;
                         border-radius:12px; font-size:11px; font-weight:600;'>
                {status.upper()}
            </span>
        </div>

        <table style='width:100%; font-size:12px; border-collapse:collapse;'>
            <tr>
                <td style='padding:3px 0; color:#94a3b8;'>Activity</td>
                <td style='padding:3px 0; font-weight:600;'>{row.get("activity_type", "—")}</td>
            </tr>
            <tr>
                <td style='padding:3px 0; color:#94a3b8;'>Health Score</td>
                <td style='padding:3px 0; font-weight:600;'>
                    <span style='font-size:16px; color:{status_color};'>{score}</span>/100
                    <span style='margin-left:4px; background:#334155; padding:1px 6px;
                                 border-radius:4px; font-size:10px;'>Grade {grade}</span>
                </td>
            </tr>
            <tr>
                <td style='padding:3px 0; color:#94a3b8;'>Coordinates</td>
                <td style='padding:3px 0;'>{row.get("lat", 0):.3f}, {row.get("lon", 0):.3f}</td>
            </tr>
        </table>

        {flags_html}

        <div style='margin-top:8px; text-align:center;'>
            <em style='font-size:10px; color:#64748b;'>Click pin to select in dashboard ↗</em>
        </div>
    </div>
    """
    return html


def build_map(sites_df, validation_results, health_scores):
    """
    Build a Folium map with color-coded markers for all watershed sites.

    Args:
        sites_df: DataFrame with site_id, lat, lon, activity_type
        validation_results: dict mapping site_id → validation result
        health_scores: dict mapping site_id → health score dict

    Returns:
        folium.Map object
    """
    # Create base map
    m = folium.Map(
        location=[config.MAP_CENTER_LAT, config.MAP_CENTER_LON],
        zoom_start=config.MAP_ZOOM,
        tiles=None,
    )

    # Add multiple tile layers
    folium.TileLayer(
        tiles="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        name="Dark Mode",
        attr='&copy; <a href="https://carto.com/">CARTO</a>',
        max_zoom=19,
    ).add_to(m)

    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        name="Satellite",
        attr="Esri World Imagery",
        max_zoom=18,
    ).add_to(m)

    folium.TileLayer(
        tiles="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        name="OpenStreetMap",
        attr="OpenStreetMap",
        max_zoom=19,
    ).add_to(m)

    # Add markers for each site
    for _, row in sites_df.iterrows():
        sid = row["site_id"]
        lat = row["lat"]
        lon = row["lon"]

        validation = validation_results.get(sid, {})
        health = health_scores.get(sid, {})
        status = validation.get("overall_status", "inconclusive")

        color = _get_marker_color(status)
        icon_name = _get_marker_icon(status)

        popup_html = _build_popup_html(sid, row, validation, health)

        # Create marker
        folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(popup_html, max_width=320),
            tooltip=folium.Tooltip(
                f"<b>{sid}</b> — {row.get('activity_type', '?')} "
                f"({status.upper()})",
            ),
            icon=folium.Icon(
                color=color,
                icon=icon_name,
                prefix="glyphicon"
            ),
        ).add_to(m)

    # Add layer control
    folium.LayerControl(collapsed=False).add_to(m)

    # Fit bounds to all markers
    if len(sites_df) > 0:
        sw = [sites_df["lat"].min() - 0.05, sites_df["lon"].min() - 0.05]
        ne = [sites_df["lat"].max() + 0.05, sites_df["lon"].max() + 0.05]
        m.fit_bounds([sw, ne])

    return m

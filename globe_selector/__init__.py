"""
Globe Selector — Streamlit Custom Component
Interactive 3D WebGL globe with site markers for watershed monitoring.
"""
import os
import streamlit.components.v1 as components

# Locate the frontend directory
_FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

# Declare the Streamlit component
_component_func = components.declare_component(
    "globe_selector",
    path=_FRONTEND_DIR
)


def globe_selector(sites, selected_id=None, height=580, key=None, default=None):
    """
    Renders an interactive 3D WebGL globe with watershed site markers.

    Parameters
    ----------
    sites : list of dict
        List of site dictionaries. Each dict should contain:
        - 'id': str (e.g. 'S01')
        - 'name': str (e.g. 'Check Dam - Site 01')
        - 'lat': float (latitude)
        - 'lng': float or 'lon': float (longitude)
        - 'status': str ('confirmed', 'anomaly', 'inconclusive')
        - optional 'activity_type', 'score', etc.
    selected_id : str, optional
        Currently selected site ID to highlight and focus on the globe.
    height : int, optional
        Height of the globe container in pixels (default: 580).
    key : str, optional
        Streamlit component key.
    default : str, optional
        Default selected site ID if none chosen yet.

    Returns
    -------
    str or None
        The ID of the currently selected site.
    """
    # Normalize longitude key ('lon' or 'lng' -> 'lng')
    normalized_sites = []
    for s in sites:
        item = dict(s)
        if "lng" not in item and "lon" in item:
            item["lng"] = float(item["lon"])
        if "lat" in item:
            item["lat"] = float(item["lat"])
        normalized_sites.append(item)

    default_val = default if default is not None else (selected_id or (sites[0]["id"] if sites else None))

    component_value = _component_func(
        sites=normalized_sites,
        selected_id=selected_id,
        height=height,
        key=key,
        default=default_val,
    )

    return component_value

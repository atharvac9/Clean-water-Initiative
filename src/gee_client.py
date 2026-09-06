"""
Google Earth Engine client for Sentinel-2 imagery, NDVI/NDWI computation, and caching.
"""
import os
import json
import hashlib
import io
import numpy as np
import requests
from PIL import Image

try:
    import ee
    GEE_AVAILABLE = True
except ImportError:
    GEE_AVAILABLE = False

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


# ─── GEE Initialization ─────────────────────────────────────────────────────

def initialize_gee(project=None, timeout=10):
    """
    Initialize Google Earth Engine with a timeout.
    Returns True if successful, False otherwise (falls back to mock data).
    """
    if not GEE_AVAILABLE:
        print("WARNING: earthengine-api not installed. Using mock data.")
        return False

    import threading

    result = [False]
    error_msg = [None]

    def _try_init():
        try:
            if project:
                ee.Initialize(project=project)
            else:
                ee.Initialize()
            result[0] = True
        except Exception as e:
            error_msg[0] = str(e)

    thread = threading.Thread(target=_try_init, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if thread.is_alive():
        print(f"WARNING: GEE init timed out after {timeout}s. Using mock data.")
        return False

    if result[0]:
        return True

    print(f"WARNING: GEE init failed: {error_msg[0]}. Using mock data.")
    return False


# ─── Cache helpers ───────────────────────────────────────────────────────────

def _cache_key(site_id, period):
    """Generate a unique cache key for a site + time period."""
    return f"{site_id}_{period}"


def _cache_dir(site_id):
    """Get the cache directory for a site."""
    d = os.path.join(config.CACHE_DIR, site_id)
    os.makedirs(d, exist_ok=True)
    return d


def _load_cached(site_id):
    """Load cached analysis results for a site. Returns dict or None."""
    cache_file = os.path.join(_cache_dir(site_id), "analysis.json")
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            return json.load(f)
    return None


def _save_cache(site_id, data):
    """Save analysis results to cache."""
    cache_file = os.path.join(_cache_dir(site_id), "analysis.json")
    with open(cache_file, "w") as f:
        json.dump(data, f, indent=2)


def _load_cached_thumbnail(site_id, period):
    """Load cached thumbnail image. Returns PIL Image or None."""
    thumb_path = os.path.join(_cache_dir(site_id), f"thumb_{period}.png")
    if os.path.exists(thumb_path):
        return Image.open(thumb_path)
    return None


def _save_thumbnail(site_id, period, img):
    """Save thumbnail PIL Image to cache."""
    thumb_path = os.path.join(_cache_dir(site_id), f"thumb_{period}.png")
    if isinstance(img, Image.Image):
        img.save(thumb_path)
    return thumb_path


# ─── GEE Sentinel-2 Fetching ────────────────────────────────────────────────

def _get_s2_composite(lat, lon, start_date, end_date, buffer_m=None):
    """
    Fetch a Sentinel-2 median composite from GEE.
    Returns an ee.Image with bands B2, B3, B4, B8.
    """
    if buffer_m is None:
        buffer_m = config.BUFFER_RADIUS_M

    point = ee.Geometry.Point([lon, lat])
    roi = point.buffer(buffer_m)

    collection = (
        ee.ImageCollection(config.GEE_COLLECTION)
        .filterBounds(roi)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', config.GEE_CLOUD_COVER_MAX))
        .select(config.BANDS_ANALYSIS)
    )

    composite = collection.median().clip(roi)
    return composite, roi


def _download_as_numpy(image, roi, bands=None):
    """Download an ee.Image as a numpy structured array."""
    if bands is None:
        bands = config.BANDS_ANALYSIS

    url = image.select(bands).getDownloadURL({
        'region': roi,
        'scale': config.SCALE_M,
        'format': 'NPY'
    })

    response = requests.get(url, timeout=120)
    response.raise_for_status()
    data = np.load(io.BytesIO(response.content), allow_pickle=True)
    return data


def _download_rgb_thumbnail(image, roi, width=512):
    """Download an RGB thumbnail as a PIL Image."""
    vis_params = {
        'bands': config.BANDS_RGB,
        'min': 0,
        'max': 3000,
        'region': roi,
        'dimensions': width,
        'format': 'png'
    }
    url = image.getThumbURL(vis_params)
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content))


# ─── NDVI / NDWI Computation ────────────────────────────────────────────────

def compute_ndvi_from_structured(data):
    """
    Compute mean NDVI from a numpy structured array with fields B4, B8.
    NDVI = (NIR - Red) / (NIR + Red) = (B8 - B4) / (B8 + B4)
    """
    nir = data[config.BAND_NIR].astype(float)
    red = data[config.BAND_RED].astype(float)

    denominator = nir + red
    # Avoid division by zero
    valid = denominator > 0
    ndvi = np.where(valid, (nir - red) / denominator, 0.0)

    return float(np.nanmean(ndvi))


def compute_ndwi_from_structured(data):
    """
    Compute mean NDWI from a numpy structured array with fields B3, B8.
    NDWI = (Green - NIR) / (Green + NIR) = (B3 - B8) / (B3 + B8)
    """
    green = data[config.BAND_GREEN].astype(float)
    nir = data[config.BAND_NIR].astype(float)

    denominator = green + nir
    valid = denominator > 0
    ndwi = np.where(valid, (green - nir) / denominator, 0.0)

    return float(np.nanmean(ndwi))


# ─── Mock Data Generator ────────────────────────────────────────────────────

def _generate_mock_data(site_id, activity_type):
    """
    Generate realistic mock satellite data for demo when GEE is unavailable.
    Returns analysis dict with plausible NDVI/NDWI values.
    """
    # Seed based on site_id for reproducibility
    seed = int(hashlib.md5(site_id.encode()).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)

    # Base values depend on activity type
    mock_profiles = {
        "check_dam":     {"ndvi_t0": 0.18, "ndvi_tn": 0.28, "ndwi_t0": -0.15, "ndwi_tn": 0.05},
        "farm_pond":     {"ndvi_t0": 0.15, "ndvi_tn": 0.17, "ndwi_t0": -0.10, "ndwi_tn": 0.12},
        "plantation":    {"ndvi_t0": 0.12, "ndvi_tn": 0.35, "ndwi_t0": -0.20, "ndwi_tn": -0.15},
        "water_body":    {"ndvi_t0": 0.05, "ndvi_tn": 0.03, "ndwi_t0": 0.15,  "ndwi_tn": 0.20},
        "degraded_land": {"ndvi_t0": 0.10, "ndvi_tn": 0.08, "ndwi_t0": -0.25, "ndwi_tn": -0.28},
    }

    profile = mock_profiles.get(activity_type, mock_profiles["degraded_land"])

    # Add small random noise
    noise = lambda: rng.uniform(-0.03, 0.03)

    # Special handling for anomaly site S06: claimed farm_pond but shows degraded land
    if site_id == "S06":
        # Satellite shows degraded land indicators despite farm_pond claim
        ndvi_t0 = 0.10 + noise()
        ndvi_tnow = 0.07 + noise()
        ndwi_t0 = -0.22 + noise()
        ndwi_tnow = -0.28 + noise()
    else:
        ndvi_t0 = profile["ndvi_t0"] + noise()
        ndvi_tnow = profile["ndvi_tn"] + noise()
        ndwi_t0 = profile["ndwi_t0"] + noise()
        ndwi_tnow = profile["ndwi_tn"] + noise()

    return {
        "ndvi_t0": round(ndvi_t0, 4),
        "ndvi_tnow": round(ndvi_tnow, 4),
        "ndwi_t0": round(ndwi_t0, 4),
        "ndwi_tnow": round(ndwi_tnow, 4),
        "delta_ndvi": round(ndvi_tnow - ndvi_t0, 4),
        "delta_ndwi": round(ndwi_tnow - ndwi_t0, 4),
        "source": "mock",
    }


def _generate_mock_thumbnail(site_id, period, activity_type):
    """
    Generate a simple color-coded mock satellite thumbnail.
    Green-ish for vegetation, blue-ish for water, brown for degraded.
    """
    seed = int(hashlib.md5(f"{site_id}_{period}".encode()).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)

    size = (256, 256, 3)

    color_profiles = {
        "check_dam":     {"base": [80, 120, 70],  "water": True},
        "farm_pond":     {"base": [90, 110, 60],   "water": True},
        "plantation":    {"base": [50, 140, 50],   "water": False},
        "water_body":    {"base": [40, 80, 150],   "water": True},
        "degraded_land": {"base": [160, 130, 90],  "water": False},
    }

    profile = color_profiles.get(activity_type, color_profiles["degraded_land"])
    base = np.array(profile["base"], dtype=np.uint8)

    # Create base image with noise
    img = np.zeros(size, dtype=np.uint8)
    for c in range(3):
        img[:, :, c] = np.clip(
            base[c] + rng.randint(-20, 20, (256, 256)),
            0, 255
        ).astype(np.uint8)

    # For T-now period, shift colors based on expected trends
    if period == "tnow":
        if activity_type in ["plantation", "check_dam"]:
            # More green
            img[:, :, 1] = np.clip(img[:, :, 1].astype(int) + 30, 0, 255).astype(np.uint8)
        if activity_type in ["farm_pond", "check_dam", "water_body"]:
            # More blue (water)
            img[:, :, 2] = np.clip(img[:, :, 2].astype(int) + 25, 0, 255).astype(np.uint8)

    # Special: S06 anomaly — both periods look degraded
    if site_id == "S06":
        brown = np.array([165, 130, 85], dtype=np.uint8)
        for c in range(3):
            img[:, :, c] = np.clip(
                brown[c] + rng.randint(-15, 15, (256, 256)),
                0, 255
            ).astype(np.uint8)

    pil_img = Image.fromarray(img)
    return pil_img


# ─── Main API ────────────────────────────────────────────────────────────────

def get_indices_for_site(site_id, lat, lon, activity_type, gee_initialized=False):
    """
    Get NDVI/NDWI indices for both time periods for a site.
    Uses cache if available, falls back to mock data if GEE unavailable.

    Returns:
        dict with keys: ndvi_t0, ndvi_tnow, ndwi_t0, ndwi_tnow,
                        delta_ndvi, delta_ndwi, source
    """
    # Check cache first
    cached = _load_cached(site_id)
    if cached is not None:
        return cached

    if gee_initialized and GEE_AVAILABLE:
        try:
            # Fetch T0 composite
            composite_t0, roi_t0 = _get_s2_composite(
                lat, lon, config.T0_START, config.T0_END
            )
            data_t0 = _download_as_numpy(composite_t0, roi_t0)
            ndvi_t0 = compute_ndvi_from_structured(data_t0)
            ndwi_t0 = compute_ndwi_from_structured(data_t0)

            # Fetch T-now composite
            composite_tnow, roi_tnow = _get_s2_composite(
                lat, lon, config.T_NOW_START, config.T_NOW_END
            )
            data_tnow = _download_as_numpy(composite_tnow, roi_tnow)
            ndvi_tnow = compute_ndvi_from_structured(data_tnow)
            ndwi_tnow = compute_ndwi_from_structured(data_tnow)

            result = {
                "ndvi_t0": round(ndvi_t0, 4),
                "ndvi_tnow": round(ndvi_tnow, 4),
                "ndwi_t0": round(ndwi_t0, 4),
                "ndwi_tnow": round(ndwi_tnow, 4),
                "delta_ndvi": round(ndvi_tnow - ndvi_t0, 4),
                "delta_ndwi": round(ndwi_tnow - ndwi_t0, 4),
                "source": "gee",
            }

            # Cache thumbnails
            try:
                thumb_t0 = _download_rgb_thumbnail(composite_t0, roi_t0)
                _save_thumbnail(site_id, "t0", thumb_t0)
                thumb_tnow = _download_rgb_thumbnail(composite_tnow, roi_tnow)
                _save_thumbnail(site_id, "tnow", thumb_tnow)
            except Exception as thumb_err:
                print(f"WARNING: Could not cache thumbnails for {site_id}: {thumb_err}")

            # Cache the result
            _save_cache(site_id, result)
            return result

        except Exception as e:
            print(f"WARNING: GEE fetch failed for {site_id}: {e}. Falling back to mock.")

    # Fallback: generate mock data
    result = _generate_mock_data(site_id, activity_type)
    _save_cache(site_id, result)

    # Generate mock thumbnails
    for period in ["t0", "tnow"]:
        mock_thumb = _generate_mock_thumbnail(site_id, period, activity_type)
        _save_thumbnail(site_id, period, mock_thumb)

    return result


def get_thumbnail(site_id, period):
    """
    Get the satellite thumbnail for a site/period.
    Returns PIL Image or None.
    """
    return _load_cached_thumbnail(site_id, period)


def clear_cache(site_id=None):
    """Clear cached data for a site or all sites."""
    import shutil
    if site_id:
        site_cache = os.path.join(config.CACHE_DIR, site_id)
        if os.path.exists(site_cache):
            shutil.rmtree(site_cache)
    else:
        if os.path.exists(config.CACHE_DIR):
            shutil.rmtree(config.CACHE_DIR)
            os.makedirs(config.CACHE_DIR, exist_ok=True)

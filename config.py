"""
Watershed Photo-Satellite Fusion MVP — Configuration
"""
import os

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PHOTOS_DIR = os.path.join(DATA_DIR, "photos")
CACHE_DIR = os.path.join(BASE_DIR, "cache")
DB_PATH = os.path.join(BASE_DIR, "db", "watershed.db")
SITES_CSV = os.path.join(DATA_DIR, "sites.csv")

# Ensure directories exist
for d in [CACHE_DIR, os.path.join(BASE_DIR, "db")]:
    os.makedirs(d, exist_ok=True)

# ─── Google Earth Engine ─────────────────────────────────────────────────────
GEE_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED"
GEE_CLOUD_COVER_MAX = 20  # percent

# Time windows for satellite comparison
T0_START = "2024-01-01"
T0_END = "2024-03-31"
T_NOW_START = "2026-06-01"
T_NOW_END = "2026-08-31"

# Spatial parameters
BUFFER_RADIUS_M = 500  # meters around each coordinate
SCALE_M = 10           # Sentinel-2 native resolution

# Sentinel-2 band names
BAND_BLUE = "B2"
BAND_GREEN = "B3"
BAND_RED = "B4"
BAND_NIR = "B8"
BANDS_RGB = [BAND_RED, BAND_GREEN, BAND_BLUE]
BANDS_ANALYSIS = [BAND_BLUE, BAND_GREEN, BAND_RED, BAND_NIR]

# ─── CLIP Classifier ────────────────────────────────────────────────────────
CLIP_MODEL_NAME = "ViT-B-32"
CLIP_PRETRAINED = "openai"

# Zero-shot prompts (engineered for field-level watershed photos)
CLIP_LABELS = [
    "a photograph of a check dam built across a stream or river for water conservation",
    "a photograph of a farm pond or dugout pond used for irrigation and water harvesting",
    "a photograph of a tree plantation or afforestation area with rows of planted trees",
    "a photograph of degraded barren land with soil erosion and no vegetation",
    "a photograph of a water body such as a lake reservoir or large pond",
]

CLASS_NAMES = ["check_dam", "farm_pond", "plantation", "degraded_land", "water_body"]

CLASS_INDEX_MAP = {i: name for i, name in enumerate(CLASS_NAMES)}

# ─── Cross-Validation Rules ─────────────────────────────────────────────────
# Each activity type maps to expected satellite trends
# delta = T_now - T0 value
VALIDATION_RULES = {
    "check_dam": {
        "ndvi_trend": "stable_or_increase",   # Vegetation around dam should stabilize/grow
        "ndwi_trend": "increase",              # Water presence should increase
        "ndvi_min": -0.05,                     # Delta NDVI >= this
        "ndwi_min": 0.0,                       # Delta NDWI >= this
    },
    "farm_pond": {
        "ndvi_trend": "stable",
        "ndwi_trend": "increase",
        "ndvi_min": -0.10,
        "ndwi_min": 0.0,                       # NDWI should show water presence
    },
    "plantation": {
        "ndvi_trend": "increase",
        "ndwi_trend": "stable",
        "ndvi_min": 0.05,                      # Meaningful vegetation increase
        "ndwi_min": -0.15,
    },
    "water_body": {
        "ndvi_trend": "stable_or_decrease",
        "ndwi_trend": "high",
        "ndvi_min": -0.20,
        "ndwi_min": -0.05,                     # NDWI should remain relatively high
    },
    "degraded_land": {
        "ndvi_trend": "low",
        "ndwi_trend": "low",
        "ndvi_min": -0.30,                     # Very low threshold — degraded
        "ndwi_min": -0.30,
    },
}

# ─── Health Score Weights ────────────────────────────────────────────────────
HEALTH_WEIGHT_NDVI = 0.30
HEALTH_WEIGHT_NDWI = 0.30
HEALTH_WEIGHT_AGREEMENT = 0.25
HEALTH_WEIGHT_CONFIDENCE = 0.15

# Normalization range for index deltas → 0-100 score
INDEX_DELTA_MIN = -0.3
INDEX_DELTA_MAX = 0.3

# ─── UI ──────────────────────────────────────────────────────────────────────
APP_TITLE = "🌊 Watershed Photo-Satellite Fusion"
APP_SUBTITLE = "Smart India Hackathon 2026 — Field Evidence × Satellite Intelligence"
MAP_CENTER_LAT = 19.05
MAP_CENTER_LON = 74.72
MAP_ZOOM = 11

STATUS_COLORS = {
    "confirmed": "#22c55e",   # green
    "anomaly": "#ef4444",     # red
    "inconclusive": "#f59e0b", # amber
}

STATUS_ICONS = {
    "confirmed": "ok-sign",
    "anomaly": "remove-sign",
    "inconclusive": "question-sign",
}

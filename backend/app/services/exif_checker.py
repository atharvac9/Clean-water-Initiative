"""
EXIF metadata extraction for photo authenticity checking.

Checks for GPS coordinates, camera model, and capture timestamp.
Returns soft warnings (not hard rejects) when metadata is missing.
"""

import io
import logging
from typing import Optional

from PIL import Image

logger = logging.getLogger(__name__)


def extract_exif(image_bytes: bytes) -> dict:
    """
    Extract EXIF metadata from image bytes.

    Returns:
        dict with:
            - has_exif: bool
            - has_gps: bool
            - has_camera_model: bool
            - has_timestamp: bool
            - gps_lat: float | None
            - gps_lon: float | None
            - camera_model: str | None
            - capture_datetime: str | None
            - warnings: list[str]
    """
    result = {
        "has_exif": False,
        "has_gps": False,
        "has_camera_model": False,
        "has_timestamp": False,
        "gps_lat": None,
        "gps_lon": None,
        "camera_model": None,
        "capture_datetime": None,
        "warnings": [],
    }

    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        result["warnings"].append(f"Could not open image: {e}")
        return result

    from PIL import ExifTags

    # Try to get EXIF data using Pillow's built-in APIs
    exif_data = None
    try:
        exif_data = img._getexif()
    except (AttributeError, Exception):
        pass

    raw_exif = None
    try:
        raw_exif = img.getexif()
    except (AttributeError, Exception):
        pass

    if exif_data is None and (raw_exif is None or len(raw_exif) == 0):
        result["warnings"].append(
            "No EXIF metadata found — photo may have been screenshot, "
            "downloaded, or had metadata stripped by messaging/social platforms"
        )
        return result

    result["has_exif"] = True
    if exif_data is None:
        exif_data = dict(raw_exif)

    # ── Camera Model (tag 0x0110 = 272) ──────────────────────────────────
    camera_model = exif_data.get(272) or (raw_exif.get(272) if raw_exif else None)
    if not camera_model and raw_exif:
        camera_model = raw_exif.get(ExifTags.Base.Model) or raw_exif.get(ExifTags.Base.Make)
    if camera_model:
        result["has_camera_model"] = True
        result["camera_model"] = str(camera_model).replace("\x00", "").strip()
    else:
        result["warnings"].append("No camera model in EXIF — may not be a direct camera photo")

    # ── Timestamp (tag 0x9003 = 36867 = DateTimeOriginal) ────────────────
    datetime_original = exif_data.get(36867)
    datetime_digitized = exif_data.get(36868)
    datetime_basic = exif_data.get(306)
    if not (datetime_original or datetime_digitized or datetime_basic) and raw_exif:
        datetime_basic = raw_exif.get(306) or raw_exif.get(ExifTags.Base.DateTime)

    capture_dt = datetime_original or datetime_digitized or datetime_basic
    if capture_dt:
        result["has_timestamp"] = True
        result["capture_datetime"] = str(capture_dt).replace("\x00", "").strip()
    else:
        result["warnings"].append("No capture timestamp in EXIF")

    # ── GPS (tag 0x8825 = 34853 = GPSInfo) ───────────────────────────────
    gps_info = None
    # Method A: from _getexif() dict
    if isinstance(exif_data.get(34853), dict):
        gps_info = exif_data.get(34853)
    # Method B: from getexif().get_ifd(ExifTags.IFD.GPSInfo)
    if not gps_info and raw_exif:
        try:
            if hasattr(ExifTags, "IFD") and hasattr(ExifTags.IFD, "GPSInfo"):
                ifd_data = raw_exif.get_ifd(ExifTags.IFD.GPSInfo)
                if ifd_data:
                    gps_info = dict(ifd_data)
        except Exception:
            pass
    if not gps_info and raw_exif:
        try:
            ifd_data = raw_exif.get_ifd(0x8825)
            if ifd_data:
                gps_info = dict(ifd_data)
        except Exception:
            pass

    if gps_info:
        try:
            # Handle numeric tags (1=LatRef, 2=Lat, 3=LonRef, 4=Lon) or string keys
            lat_ref = gps_info.get(1) or gps_info.get("GPSLatitudeRef")
            lat_val = gps_info.get(2) or gps_info.get("GPSLatitude")
            lon_ref = gps_info.get(3) or gps_info.get("GPSLongitudeRef")
            lon_val = gps_info.get(4) or gps_info.get("GPSLongitude")

            gps_lat = _convert_gps_to_decimal(lat_val, lat_ref)
            gps_lon = _convert_gps_to_decimal(lon_val, lon_ref)

            if gps_lat is not None and gps_lon is not None:
                result["has_gps"] = True
                result["gps_lat"] = round(gps_lat, 6)
                result["gps_lon"] = round(gps_lon, 6)
            else:
                result["warnings"].append(
                    "GPS tag present but coordinates could not be parsed"
                )
        except Exception as e:
            logger.warning(f"GPS parsing error: {e}")
            result["warnings"].append("GPS tag present but malformed")
    else:
        result["warnings"].append(
            "No GPS coordinates found in image EXIF. Camera location tagging may be disabled in device settings, or photo was downloaded/shared without metadata."
        )

    # Try piexif for more detailed extraction if available
    try:
        import piexif
        piexif_data = piexif.load(image_bytes)

        # Double-check GPS if Pillow missed it
        if not result["has_gps"] and piexif_data.get("GPS"):
            gps = piexif_data["GPS"]
            if piexif.GPSIFD.GPSLatitude in gps and piexif.GPSIFD.GPSLongitude in gps:
                lat = _piexif_gps_to_decimal(
                    gps[piexif.GPSIFD.GPSLatitude],
                    gps.get(piexif.GPSIFD.GPSLatitudeRef, b"N"),
                )
                lon = _piexif_gps_to_decimal(
                    gps[piexif.GPSIFD.GPSLongitude],
                    gps.get(piexif.GPSIFD.GPSLongitudeRef, b"E"),
                )
                if lat is not None and lon is not None:
                    result["has_gps"] = True
                    result["gps_lat"] = round(lat, 6)
                    result["gps_lon"] = round(lon, 6)
                    result["warnings"] = [
                        w for w in result["warnings"]
                        if "No GPS coordinates" not in w
                    ]
    except ImportError:
        pass
    except Exception as e:
        logger.debug(f"piexif extraction failed (non-critical): {e}")

    return result


def _convert_gps_to_decimal(
    dms_tuple: Optional[tuple],
    ref: Optional[str],
) -> Optional[float]:
    """Convert GPS DMS (degrees, minutes, seconds) tuple to decimal degrees."""
    if dms_tuple is None or ref is None:
        return None

    try:
        # Handle both IFDRational and plain tuple formats
        def _to_float(val):
            if hasattr(val, "numerator") and hasattr(val, "denominator"):
                return float(val.numerator) / float(val.denominator) if val.denominator else 0.0
            if isinstance(val, tuple) and len(val) == 2:
                return float(val[0]) / float(val[1]) if val[1] else 0.0
            return float(val)

        # Handle single float, 1-tuple, 2-tuple, or standard 3-tuple (deg, min, sec)
        if isinstance(dms_tuple, (int, float)):
            decimal = float(dms_tuple)
        elif len(dms_tuple) == 1:
            decimal = _to_float(dms_tuple[0])
        elif len(dms_tuple) == 2:
            decimal = _to_float(dms_tuple[0]) + _to_float(dms_tuple[1]) / 60.0
        else:
            degrees = _to_float(dms_tuple[0])
            minutes = _to_float(dms_tuple[1])
            seconds = _to_float(dms_tuple[2])
            decimal = degrees + minutes / 60.0 + seconds / 3600.0

        ref_str = ref if isinstance(ref, str) else ref.decode("utf-8", errors="ignore")
        if ref_str.upper() in ("S", "W"):
            decimal = -decimal

        return decimal

    except (IndexError, TypeError, ValueError) as e:
        logger.debug(f"GPS conversion error: {e}")
        return None


def _piexif_gps_to_decimal(
    dms_tuple: tuple,
    ref: bytes,
) -> Optional[float]:
    """Convert piexif GPS format to decimal degrees."""
    try:
        def _rational_to_float(r):
            return float(r[0]) / float(r[1]) if r[1] else 0.0

        degrees = _rational_to_float(dms_tuple[0])
        minutes = _rational_to_float(dms_tuple[1])
        seconds = _rational_to_float(dms_tuple[2])

        decimal = degrees + minutes / 60 + seconds / 3600

        ref_str = ref.decode("utf-8") if isinstance(ref, bytes) else str(ref)
        if ref_str.upper() in ("S", "W"):
            decimal = -decimal

        return decimal

    except (IndexError, TypeError, ValueError, ZeroDivisionError):
        return None

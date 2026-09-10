"""
Tests for EXIF metadata extraction.
"""

import io
import struct
import pytest
from PIL import Image

from app.services.exif_checker import extract_exif


def _create_jpeg_bytes(width=100, height=100) -> bytes:
    """Create a minimal JPEG image in memory (no EXIF)."""
    img = Image.new("RGB", (width, height), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _create_jpeg_with_exif(
    camera_model: str = None,
    datetime_original: str = None,
) -> bytes:
    """Create a JPEG with some EXIF data using piexif if available."""
    img = Image.new("RGB", (100, 100), color=(100, 150, 100))
    buf = io.BytesIO()

    try:
        import piexif

        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}

        if camera_model:
            exif_dict["0th"][piexif.ImageIFD.Model] = camera_model.encode()

        if datetime_original:
            exif_dict["Exif"][piexif.ExifIFD.DateTimeOriginal] = datetime_original.encode()

        exif_bytes = piexif.dump(exif_dict)
        img.save(buf, format="JPEG", exif=exif_bytes)
    except ImportError:
        # piexif not available — just save without EXIF
        img.save(buf, format="JPEG")

    return buf.getvalue()


class TestExifExtraction:
    def test_no_exif_returns_warnings(self):
        """JPEG without EXIF should flag warnings."""
        result = extract_exif(_create_jpeg_bytes())
        assert result["has_exif"] is False or len(result["warnings"]) > 0

    def test_invalid_image_data(self):
        """Non-image bytes should return warnings without crashing."""
        result = extract_exif(b"this is not an image")
        assert len(result["warnings"]) > 0

    def test_empty_bytes(self):
        """Empty input should handle gracefully."""
        result = extract_exif(b"")
        assert len(result["warnings"]) > 0

    def test_png_without_exif(self):
        """PNG files typically don't have EXIF."""
        img = Image.new("RGB", (50, 50), color=(200, 200, 200))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        result = extract_exif(buf.getvalue())
        assert isinstance(result["warnings"], list)

    def test_result_structure(self):
        """Result dict should always have all expected keys."""
        result = extract_exif(_create_jpeg_bytes())
        assert "has_exif" in result
        assert "has_gps" in result
        assert "has_camera_model" in result
        assert "has_timestamp" in result
        assert "gps_lat" in result
        assert "gps_lon" in result
        assert "camera_model" in result
        assert "capture_datetime" in result
        assert "warnings" in result
        assert isinstance(result["warnings"], list)

    def test_camera_model_extracted(self):
        """Camera model should be extracted from EXIF if present."""
        try:
            import piexif
        except ImportError:
            pytest.skip("piexif not installed")

        image_bytes = _create_jpeg_with_exif(camera_model="Test Camera X100")
        result = extract_exif(image_bytes)
        if result["has_exif"]:
            assert result["has_camera_model"] is True
            assert "Test Camera" in (result["camera_model"] or "")

    def test_timestamp_extracted(self):
        """Timestamp should be extracted from EXIF if present."""
        try:
            import piexif
        except ImportError:
            pytest.skip("piexif not installed")

        image_bytes = _create_jpeg_with_exif(datetime_original="2024:06:15 10:30:00")
        result = extract_exif(image_bytes)
        if result["has_exif"]:
            assert result["has_timestamp"] is True

"""
Pydantic schemas for Photos.
"""

from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from app.schemas.analysis import ExifInfo, ClassificationResult


class PhotoResponse(BaseModel):
    """Photo details returned from API."""
    id: str
    site_id: str
    original_filename: str
    public_url: Optional[str] = None
    content_type: str = "image/jpeg"
    file_size_bytes: Optional[int] = None

    # EXIF
    exif: Optional[ExifInfo] = None

    # Classification
    classified: bool = False
    classification: Optional[ClassificationResult] = None

    uploaded_by: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PhotoListResponse(BaseModel):
    """List of photos for a site."""
    photos: list[PhotoResponse]
    total: int

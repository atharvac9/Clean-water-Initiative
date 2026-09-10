"""
Photos API — upload, classify, and manage field photos.

Upload flow: file input → POST multipart → EXIF extract → Supabase Storage → CLIP classify → persist
"""

import json
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.photo import Photo
from app.models.site import Site
from app.schemas.analysis import ExifInfo, ClassificationResult
from app.schemas.photo import PhotoResponse, PhotoListResponse
from app.services import classifier, exif_checker, storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/photos", tags=["photos"])

# Max upload size: 25MB
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/{site_id}", response_model=PhotoResponse, status_code=201)
async def upload_photo(
    site_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a field photo for a site.

    Flow:
    1. Validate file type and size
    2. Extract EXIF metadata (GPS, camera, timestamp)
    3. Upload to Supabase Storage
    4. Run CLIP classification on the actual image
    5. Persist photo record with EXIF + classification results
    """
    # 1. Validate site exists
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if site is None:
        raise HTTPException(status_code=404, detail="Site not found")

    # 2. Validate file
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: JPEG, PNG, WebP",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(image_bytes) / 1024 / 1024:.1f}MB). Max: 25MB",
        )

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # 3. Extract EXIF metadata
    exif_data = exif_checker.extract_exif(image_bytes)

    # 4. Upload to Supabase Storage
    try:
        storage_result = await storage.upload_photo(
            image_bytes=image_bytes,
            original_filename=file.filename or "photo.jpg",
            site_id=site_id,
            content_type=file.content_type or "image/jpeg",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 5. Run CLIP classification on the REAL image
    classification = None
    try:
        classification = await classifier.classify_photo_from_bytes(image_bytes)
    except Exception as e:
        logger.error(f"CLIP classification failed for photo upload: {e}")
        # Don't fail the upload — classification can be retried

    # 6. Persist photo record
    photo = Photo(
        site_id=site_id,
        original_filename=file.filename or "photo.jpg",
        storage_path=storage_result["storage_path"],
        public_url=storage_result.get("public_url"),
        content_type=file.content_type or "image/jpeg",
        file_size_bytes=len(image_bytes),
        # EXIF
        has_exif=exif_data["has_exif"],
        has_gps=exif_data["has_gps"],
        has_camera_model=exif_data["has_camera_model"],
        has_timestamp=exif_data["has_timestamp"],
        exif_gps_lat=exif_data.get("gps_lat"),
        exif_gps_lon=exif_data.get("gps_lon"),
        exif_camera_model=exif_data.get("camera_model"),
        exif_datetime=exif_data.get("capture_datetime"),
        exif_warnings_json=json.dumps(exif_data.get("warnings", [])),
        # Classification
        classified=classification is not None,
        predicted_class=classification["predicted_class"] if classification else None,
        classification_confidence=classification["confidence"] if classification else None,
        classification_scores_json=json.dumps(classification["all_scores"]) if classification else None,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)

    return _build_photo_response(photo, exif_data, classification)


@router.get("/{site_id}", response_model=PhotoListResponse)
async def list_photos(site_id: str, db: AsyncSession = Depends(get_db)):
    """List all photos for a site."""
    result = await db.execute(
        select(Photo)
        .where(Photo.site_id == site_id)
        .order_by(Photo.created_at.desc())
    )
    photos = result.scalars().all()

    return PhotoListResponse(
        photos=[_build_photo_response_from_model(p) for p in photos],
        total=len(photos),
    )


@router.post("/{photo_id}/reclassify", response_model=PhotoResponse)
async def reclassify_photo(photo_id: str, db: AsyncSession = Depends(get_db)):
    """Re-run CLIP classification on an existing photo."""
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    if not photo.public_url:
        raise HTTPException(status_code=400, detail="Photo has no public URL")

    try:
        classification = await classifier.classify_photo_from_url(photo.public_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")

    photo.classified = True
    photo.predicted_class = classification["predicted_class"]
    photo.classification_confidence = classification["confidence"]
    photo.classification_scores_json = json.dumps(classification["all_scores"])

    await db.flush()
    await db.refresh(photo)

    return _build_photo_response_from_model(photo)


@router.delete("/{photo_id}", status_code=204)
async def delete_photo(photo_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a photo from storage and database."""
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Delete from storage
    if photo.storage_path:
        await storage.delete_photo(photo.storage_path)

    await db.delete(photo)


# ── Response Builders ────────────────────────────────────────────────────────

def _build_photo_response(
    photo: Photo,
    exif_data: dict,
    classification: dict = None,
) -> PhotoResponse:
    """Build response from fresh data."""
    exif_info = ExifInfo(
        has_exif=exif_data["has_exif"],
        has_gps=exif_data["has_gps"],
        has_camera_model=exif_data["has_camera_model"],
        has_timestamp=exif_data["has_timestamp"],
        gps_lat=exif_data.get("gps_lat"),
        gps_lon=exif_data.get("gps_lon"),
        camera_model=exif_data.get("camera_model"),
        capture_datetime=exif_data.get("capture_datetime"),
        warnings=exif_data.get("warnings", []),
    )

    classification_result = None
    if classification:
        classification_result = ClassificationResult(
            predicted_class=classification["predicted_class"],
            confidence=classification["confidence"],
            all_scores=classification.get("all_scores", {}),
        )

    return PhotoResponse(
        id=photo.id,
        site_id=photo.site_id,
        original_filename=photo.original_filename,
        public_url=photo.public_url,
        content_type=photo.content_type,
        file_size_bytes=photo.file_size_bytes,
        exif=exif_info,
        classified=photo.classified,
        classification=classification_result,
        uploaded_by=photo.uploaded_by,
        created_at=photo.created_at,
    )


def _build_photo_response_from_model(photo: Photo) -> PhotoResponse:
    """Build response from persisted model."""
    exif_info = ExifInfo(
        has_exif=photo.has_exif,
        has_gps=photo.has_gps,
        has_camera_model=photo.has_camera_model,
        has_timestamp=photo.has_timestamp,
        gps_lat=photo.exif_gps_lat,
        gps_lon=photo.exif_gps_lon,
        camera_model=photo.exif_camera_model,
        capture_datetime=photo.exif_datetime,
        warnings=json.loads(photo.exif_warnings_json) if photo.exif_warnings_json else [],
    )

    classification_result = None
    if photo.classified and photo.predicted_class:
        classification_result = ClassificationResult(
            predicted_class=photo.predicted_class,
            confidence=photo.classification_confidence or 0.0,
            all_scores=json.loads(photo.classification_scores_json)
            if photo.classification_scores_json else {},
        )

    return PhotoResponse(
        id=photo.id,
        site_id=photo.site_id,
        original_filename=photo.original_filename,
        public_url=photo.public_url,
        content_type=photo.content_type,
        file_size_bytes=photo.file_size_bytes,
        exif=exif_info,
        classified=photo.classified,
        classification=classification_result,
        uploaded_by=photo.uploaded_by,
        created_at=photo.created_at,
    )

"""
Analysis API — the core "analyze any point" endpoint.

Two flows:
1. POST /api/analysis/adhoc — analyze any lat/lon (the "click anywhere" feature)
2. POST /api/analysis/{site_id} — run/refresh analysis for a saved site
"""

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.site import Site
from app.models.analysis import AnalysisResult, AnalysisMode
from app.schemas.analysis import (
    AdHocAnalysisRequest,
    SiteAnalysisRequest,
    AnalysisResponse,
    SatelliteData,
    CrossValidationResult,
    HealthScoreResult,
)
from app.services import gee_service, cross_validator, health_score

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/adhoc", response_model=AnalysisResponse)
async def analyze_adhoc(
    body: AdHocAnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze any point on the globe — the core "click anywhere" feature.

    This creates an ad-hoc site and runs analysis in one step.
    If claimed_activity_type is provided, cross-validation runs.
    If baseline_date is provided, runs full before/after analysis.
    Otherwise, runs snapshot-only mode.
    """
    # 1. Create ad-hoc site
    site = Site(
        lat=body.lat,
        lon=body.lon,
        activity_type=body.claimed_activity_type,
        buffer_radius_m=body.buffer_radius_m,
        baseline_date=body.baseline_date,
        is_seeded_demo=False,
    )
    db.add(site)
    await db.flush()

    # 2. Determine mode
    has_baseline = body.baseline_date is not None
    mode = AnalysisMode.FULL if has_baseline else AnalysisMode.SNAPSHOT

    # 3. Fetch satellite data
    if has_baseline:
        # Full mode — need baseline window
        # Use 3-month window centered on baseline date
        from datetime import datetime as dt, timedelta
        baseline_dt = dt.strptime(body.baseline_date, "%Y-%m-%d")
        t0_start = (baseline_dt - timedelta(days=45)).strftime("%Y-%m-%d")
        t0_end = (baseline_dt + timedelta(days=45)).strftime("%Y-%m-%d")

        sat_data = await gee_service.get_full_indices(
            body.lat, body.lon, t0_start, t0_end, body.buffer_radius_m,
        )
    else:
        sat_data = await gee_service.get_snapshot_indices(
            body.lat, body.lon, body.buffer_radius_m,
        )

    # Check for GEE errors
    if "error" in sat_data:
        # Still create the analysis result with error state
        analysis = AnalysisResult(
            site_id=site.id,
            mode=mode.value,
            satellite_source=sat_data.get("error", "error"),
            buffer_radius_m=body.buffer_radius_m,
        )
        db.add(analysis)
        await db.flush()
        await db.refresh(analysis)

        return _build_response(analysis, sat_data, mode)

    # 4. Cross-validation (only if activity_type provided and we have satellite data)
    validation_result = None
    if body.claimed_activity_type and mode == AnalysisMode.FULL:
        validation_result = cross_validator.validate_site(
            activity_type=body.claimed_activity_type,
            satellite_data=sat_data,
            classification_result=None,  # No photo yet in adhoc flow
        )
    elif body.claimed_activity_type and mode == AnalysisMode.SNAPSHOT:
        # Snapshot mode — can still do limited validation (absolute thresholds)
        validation_result = cross_validator.validate_site(
            activity_type=body.claimed_activity_type,
            satellite_data=sat_data,
            classification_result=None,
        )

    # 5. Health score
    if mode == AnalysisMode.FULL and validation_result:
        health_result = health_score.compute_health_score_full(sat_data, validation_result)
    else:
        health_result = health_score.compute_health_score_snapshot(sat_data)

    # 6. Persist analysis result
    analysis = AnalysisResult(
        site_id=site.id,
        mode=mode.value,
        ndvi_t0=sat_data.get("ndvi_t0"),
        ndwi_t0=sat_data.get("ndwi_t0"),
        t0_start_date=sat_data.get("t0_start_date"),
        t0_end_date=sat_data.get("t0_end_date"),
        ndvi_tnow=sat_data.get("ndvi_tnow"),
        ndwi_tnow=sat_data.get("ndwi_tnow"),
        tnow_start_date=sat_data.get("tnow_start_date"),
        tnow_end_date=sat_data.get("tnow_end_date"),
        delta_ndvi=sat_data.get("delta_ndvi"),
        delta_ndwi=sat_data.get("delta_ndwi"),
        satellite_source=sat_data.get("source", "gee"),
        satellite_agreement=validation_result.get("satellite_agreement") if validation_result else None,
        photo_agreement=validation_result.get("photo_agreement") if validation_result else None,
        overall_status=validation_result.get("overall_status") if validation_result else None,
        flags_json=json.dumps(validation_result["flags"]) if validation_result else None,
        validation_confidence=validation_result.get("confidence") if validation_result else None,
        health_score=health_result["score"],
        health_grade=health_result["grade"],
        health_components_json=json.dumps(health_result["components"]),
        buffer_radius_m=body.buffer_radius_m,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    return _build_response(analysis, sat_data, mode, validation_result, health_result)


@router.post("/{site_id}", response_model=AnalysisResponse)
async def analyze_site(
    site_id: str,
    body: SiteAnalysisRequest = SiteAnalysisRequest(),
    db: AsyncSession = Depends(get_db),
):
    """
    Run or refresh analysis for an existing saved site.
    """
    # Get site
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if site is None:
        raise HTTPException(status_code=404, detail="Site not found")

    # Check for existing results (unless force_refresh)
    if not body.force_refresh:
        existing = await db.execute(
            select(AnalysisResult)
            .where(AnalysisResult.site_id == site_id)
            .order_by(AnalysisResult.created_at.desc())
            .limit(1)
        )
        existing_result = existing.scalar_one_or_none()
        if existing_result:
            mode = AnalysisMode(existing_result.mode)
            return _build_response_from_model(existing_result, mode)

    # Determine mode based on site's baseline
    has_baseline = site.has_baseline
    mode = AnalysisMode.FULL if has_baseline else AnalysisMode.SNAPSHOT

    # Fetch satellite data
    if has_baseline:
        from datetime import datetime as dt, timedelta
        baseline_dt = dt.strptime(site.baseline_date, "%Y-%m-%d")
        t0_start = (baseline_dt - timedelta(days=45)).strftime("%Y-%m-%d")
        t0_end = (baseline_dt + timedelta(days=45)).strftime("%Y-%m-%d")

        sat_data = await gee_service.get_full_indices(
            site.lat, site.lon, t0_start, t0_end, site.buffer_radius_m,
        )
    else:
        sat_data = await gee_service.get_snapshot_indices(
            site.lat, site.lon, site.buffer_radius_m,
        )

    if "error" in sat_data:
        analysis = AnalysisResult(
            site_id=site.id,
            mode=mode.value,
            satellite_source=sat_data.get("error", "error"),
            buffer_radius_m=site.buffer_radius_m,
        )
        db.add(analysis)
        await db.flush()
        await db.refresh(analysis)
        return _build_response(analysis, sat_data, mode)

    # Get latest photo classification for this site (if any)
    from app.models.photo import Photo
    photo_result = await db.execute(
        select(Photo)
        .where(Photo.site_id == site_id, Photo.classified == True)
        .order_by(Photo.created_at.desc())
        .limit(1)
    )
    latest_photo = photo_result.scalar_one_or_none()
    classification_result = None
    if latest_photo and latest_photo.predicted_class:
        classification_result = {
            "predicted_class": latest_photo.predicted_class,
            "confidence": latest_photo.classification_confidence or 0.0,
            "all_scores": json.loads(latest_photo.classification_scores_json)
            if latest_photo.classification_scores_json else {},
        }

    # Cross-validation
    validation_result = None
    if site.activity_type:
        validation_result = cross_validator.validate_site(
            activity_type=site.activity_type,
            satellite_data=sat_data,
            classification_result=classification_result,
        )

    # Health score
    if mode == AnalysisMode.FULL and validation_result:
        health_result = health_score.compute_health_score_full(sat_data, validation_result)
    else:
        health_result = health_score.compute_health_score_snapshot(sat_data, classification_result)

    # Persist
    analysis = AnalysisResult(
        site_id=site.id,
        mode=mode.value,
        ndvi_t0=sat_data.get("ndvi_t0"),
        ndwi_t0=sat_data.get("ndwi_t0"),
        t0_start_date=sat_data.get("t0_start_date"),
        t0_end_date=sat_data.get("t0_end_date"),
        ndvi_tnow=sat_data.get("ndvi_tnow"),
        ndwi_tnow=sat_data.get("ndwi_tnow"),
        tnow_start_date=sat_data.get("tnow_start_date"),
        tnow_end_date=sat_data.get("tnow_end_date"),
        delta_ndvi=sat_data.get("delta_ndvi"),
        delta_ndwi=sat_data.get("delta_ndwi"),
        satellite_source=sat_data.get("source", "gee"),
        predicted_class=classification_result["predicted_class"] if classification_result else None,
        photo_confidence=classification_result["confidence"] if classification_result else None,
        classification_scores_json=json.dumps(classification_result["all_scores"]) if classification_result else None,
        satellite_agreement=validation_result.get("satellite_agreement") if validation_result else None,
        photo_agreement=validation_result.get("photo_agreement") if validation_result else None,
        overall_status=validation_result.get("overall_status") if validation_result else None,
        flags_json=json.dumps(validation_result["flags"]) if validation_result else None,
        validation_confidence=validation_result.get("confidence") if validation_result else None,
        health_score=health_result["score"],
        health_grade=health_result["grade"],
        health_components_json=json.dumps(health_result["components"]),
        buffer_radius_m=site.buffer_radius_m,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    return _build_response(analysis, sat_data, mode, validation_result, health_result, classification_result)


@router.get("/{site_id}/latest", response_model=AnalysisResponse)
async def get_latest_analysis(
    site_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get the most recent analysis result for a site."""
    result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.site_id == site_id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    if analysis is None:
        raise HTTPException(status_code=404, detail="No analysis results found for this site")

    mode = AnalysisMode(analysis.mode)
    return _build_response_from_model(analysis, mode)


# ── Response Builders ────────────────────────────────────────────────────────

def _build_response(
    analysis: AnalysisResult,
    sat_data: dict,
    mode: AnalysisMode,
    validation_result: dict = None,
    health_result: dict = None,
    classification_result: dict = None,
) -> AnalysisResponse:
    """Build API response from analysis data."""
    from app.schemas.analysis import ClassificationResult

    satellite = SatelliteData(
        ndvi_tnow=sat_data.get("ndvi_tnow"),
        ndwi_tnow=sat_data.get("ndwi_tnow"),
        tnow_start_date=sat_data.get("tnow_start_date"),
        tnow_end_date=sat_data.get("tnow_end_date"),
        ndvi_t0=sat_data.get("ndvi_t0"),
        ndwi_t0=sat_data.get("ndwi_t0"),
        t0_start_date=sat_data.get("t0_start_date"),
        t0_end_date=sat_data.get("t0_end_date"),
        delta_ndvi=sat_data.get("delta_ndvi"),
        delta_ndwi=sat_data.get("delta_ndwi"),
        source=sat_data.get("source", sat_data.get("error", "unknown")),
    )

    cross_val = None
    if validation_result:
        cross_val = CrossValidationResult(
            satellite_agreement=validation_result["satellite_agreement"],
            photo_agreement=validation_result.get("photo_agreement", False),
            overall_status=validation_result["overall_status"],
            flags=validation_result["flags"],
            confidence=validation_result["confidence"],
        )

    health = None
    if health_result:
        health = HealthScoreResult(
            score=health_result["score"],
            grade=health_result["grade"],
            mode=health_result["mode"],
            components=health_result["components"],
        )

    classification = None
    if classification_result:
        classification = ClassificationResult(
            predicted_class=classification_result["predicted_class"],
            confidence=classification_result["confidence"],
            all_scores=classification_result.get("all_scores", {}),
        )

    return AnalysisResponse(
        id=analysis.id,
        site_id=analysis.site_id,
        mode=mode.value,
        satellite=satellite,
        classification=classification,
        cross_validation=cross_val,
        health_score=health,
        buffer_radius_m=analysis.buffer_radius_m,
        created_at=analysis.created_at,
        is_snapshot=(mode == AnalysisMode.SNAPSHOT),
    )


def _build_response_from_model(
    analysis: AnalysisResult,
    mode: AnalysisMode,
) -> AnalysisResponse:
    """Build API response from a persisted AnalysisResult model."""
    from app.schemas.analysis import ClassificationResult

    satellite = SatelliteData(
        ndvi_tnow=analysis.ndvi_tnow,
        ndwi_tnow=analysis.ndwi_tnow,
        tnow_start_date=analysis.tnow_start_date,
        tnow_end_date=analysis.tnow_end_date,
        ndvi_t0=analysis.ndvi_t0,
        ndwi_t0=analysis.ndwi_t0,
        t0_start_date=analysis.t0_start_date,
        t0_end_date=analysis.t0_end_date,
        delta_ndvi=analysis.delta_ndvi,
        delta_ndwi=analysis.delta_ndwi,
        source=analysis.satellite_source or "unknown",
    )

    cross_val = None
    if analysis.overall_status:
        cross_val = CrossValidationResult(
            satellite_agreement=analysis.satellite_agreement or False,
            photo_agreement=analysis.photo_agreement or False,
            overall_status=analysis.overall_status,
            flags=json.loads(analysis.flags_json) if analysis.flags_json else [],
            confidence=analysis.validation_confidence or 0.0,
        )

    health = None
    if analysis.health_score is not None:
        health = HealthScoreResult(
            score=analysis.health_score,
            grade=analysis.health_grade or "?",
            mode=analysis.mode,
            components=json.loads(analysis.health_components_json)
            if analysis.health_components_json else {},
        )

    classification = None
    if analysis.predicted_class:
        classification = ClassificationResult(
            predicted_class=analysis.predicted_class,
            confidence=analysis.photo_confidence or 0.0,
            all_scores=json.loads(analysis.classification_scores_json)
            if analysis.classification_scores_json else {},
        )

    return AnalysisResponse(
        id=analysis.id,
        site_id=analysis.site_id,
        mode=mode.value,
        satellite=satellite,
        classification=classification,
        cross_validation=cross_val,
        health_score=health,
        buffer_radius_m=analysis.buffer_radius_m,
        created_at=analysis.created_at,
        is_snapshot=(mode == AnalysisMode.SNAPSHOT),
    )

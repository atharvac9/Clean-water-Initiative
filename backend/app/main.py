"""
FastAPI application — main entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_tables
from app.routers import sites, analysis, photos, reports, health

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting Clean Water Initiative backend...")

    # Create database tables (dev convenience — use Alembic for production)
    await create_tables()
    logger.info("Database tables ready")

    # Preload CLIP model to avoid first-request latency
    try:
        from app.services.classifier import preload_model
        preload_model()
    except Exception as e:
        logger.warning(f"CLIP model preload failed (will retry on first request): {e}")

    # Check GEE configuration
    from app.services.gee_service import is_gee_configured
    if is_gee_configured():
        logger.info("GEE credentials configured ✓")
    else:
        logger.warning("GEE credentials NOT configured — satellite queries will return errors")

    # Seed demo sites if database is empty
    try:
        await _seed_demo_sites()
    except Exception as e:
        logger.warning(f"Demo site seeding failed: {e}")

    yield

    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Watershed health monitoring dashboard — satellite indices + CLIP photo classification",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — only allow configured frontend origins, NOT wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(sites.router, prefix=settings.api_prefix)
app.include_router(analysis.router, prefix=settings.api_prefix)
app.include_router(photos.router, prefix=settings.api_prefix)
app.include_router(reports.router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
    }


async def _seed_demo_sites():
    """
    Seed the 8 Ahmednagar demo sites on first run.
    These have is_seeded_demo=True and known baseline dates for
    full before/after analysis.
    """
    from sqlalchemy import select, func
    from app.database import async_session_factory
    from app.models.site import Site

    async with async_session_factory() as session:
        # Check if demo sites already exist
        result = await session.execute(
            select(func.count(Site.id)).where(Site.is_seeded_demo == True)
        )
        count = result.scalar_one()
        if count > 0:
            logger.info(f"Demo sites already seeded ({count} found)")
            return

        # Seed the 8 showcase sites
        demo_sites = [
            {
                "site_code": "S01",
                "lat": 19.095, "lon": 74.738,
                "activity_type": "check_dam",
                "description": "Check dam across seasonal stream near Ahmednagar",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-06-15",
            },
            {
                "site_code": "S02",
                "lat": 19.140, "lon": 74.685,
                "activity_type": "farm_pond",
                "description": "Farm pond for irrigation water harvesting",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-07-20",
            },
            {
                "site_code": "S03",
                "lat": 18.920, "lon": 74.600,
                "activity_type": "plantation",
                "description": "Afforestation zone on degraded hillslope",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-05-10",
            },
            {
                "site_code": "S04",
                "lat": 19.200, "lon": 74.800,
                "activity_type": "check_dam",
                "description": "Gabion check dam at stream crossing",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-08-01",
            },
            {
                "site_code": "S05",
                "lat": 18.850, "lon": 74.550,
                "activity_type": "water_body",
                "description": "Natural percolation reservoir",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-06-25",
            },
            {
                "site_code": "S06",
                "lat": 19.050, "lon": 74.900,
                "activity_type": "farm_pond",
                "description": "ANOMALY - Claims farm pond but site shows degraded barren land",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-07-15",
            },
            {
                "site_code": "S07",
                "lat": 19.300, "lon": 74.650,
                "activity_type": "plantation",
                "description": "Contour plantation on hill slope",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-05-30",
            },
            {
                "site_code": "S08",
                "lat": 18.980, "lon": 74.750,
                "activity_type": "degraded_land",
                "description": "Erosion-prone barren area awaiting intervention",
                "baseline_date": "2024-01-15",
                "intervention_date": "2024-08-10",
            },
        ]

        import json
        from app.models.analysis import AnalysisResult

        analyses_data = {
            "S01": {"score": 85, "grade": "A", "d_ndvi": 0.185, "d_ndwi": 0.220, "ndvi_t0": 0.21, "ndvi_now": 0.395, "ndwi_t0": -0.15, "ndwi_now": 0.07, "status": "confirmed", "sat_agree": True, "photo_agree": True, "flags": []},
            "S02": {"score": 78, "grade": "B", "d_ndvi": 0.095, "d_ndwi": 0.310, "ndvi_t0": 0.18, "ndvi_now": 0.275, "ndwi_t0": -0.22, "ndwi_now": 0.09, "status": "confirmed", "sat_agree": True, "photo_agree": True, "flags": []},
            "S03": {"score": 91, "grade": "A", "d_ndvi": 0.290, "d_ndwi": 0.080, "ndvi_t0": 0.24, "ndvi_now": 0.530, "ndwi_t0": -0.11, "ndwi_now": -0.03, "status": "confirmed", "sat_agree": True, "photo_agree": True, "flags": []},
            "S04": {"score": 82, "grade": "A", "d_ndvi": 0.150, "d_ndwi": 0.180, "ndvi_t0": 0.20, "ndvi_now": 0.350, "ndwi_t0": -0.16, "ndwi_now": 0.02, "status": "confirmed", "sat_agree": True, "photo_agree": True, "flags": []},
            "S05": {"score": 76, "grade": "B", "d_ndvi": 0.080, "d_ndwi": 0.240, "ndvi_t0": 0.15, "ndvi_now": 0.230, "ndwi_t0": -0.10, "ndwi_now": 0.14, "status": "confirmed", "sat_agree": True, "photo_agree": True, "flags": []},
            "S06": {"score": 32, "grade": "F", "d_ndvi": -0.085, "d_ndwi": -0.140, "ndvi_t0": 0.23, "ndvi_now": 0.145, "ndwi_t0": -0.05, "ndwi_now": -0.19, "status": "anomaly", "sat_agree": False, "photo_agree": False, "flags": ["ANOMALY: Satellite moisture index (NDWI) decreased after reported farm pond construction", "Vegetation vigor loss detected in 500m buffer zone", "Ground photo confirms dried barren soil rather than water reservoir"]},
            "S07": {"score": 73, "grade": "B", "d_ndvi": 0.140, "d_ndwi": 0.050, "ndvi_t0": 0.16, "ndvi_now": 0.300, "ndwi_t0": -0.18, "ndwi_now": -0.13, "status": "confirmed", "sat_agree": True, "photo_agree": True, "flags": []},
            "S08": {"score": 38, "grade": "D", "d_ndvi": 0.010, "d_ndwi": -0.020, "ndvi_t0": 0.14, "ndvi_now": 0.150, "ndwi_t0": -0.20, "ndwi_now": -0.22, "status": "inconclusive", "sat_agree": True, "photo_agree": None, "flags": []},
        }

        for data in demo_sites:
            site = Site(
                site_code=data["site_code"],
                lat=data["lat"],
                lon=data["lon"],
                activity_type=data["activity_type"],
                description=data["description"],
                baseline_date=data["baseline_date"],
                intervention_date=data["intervention_date"],
                is_seeded_demo=True,
                buffer_radius_m=500,
            )
            session.add(site)
            await session.flush()

            # Add seeded analysis result for demo showcase
            ana_meta = analyses_data.get(data["site_code"], {})
            analysis = AnalysisResult(
                site_id=site.id,
                mode="full",
                health_score=ana_meta.get("score"),
                health_grade=ana_meta.get("grade"),
                delta_ndvi=ana_meta.get("d_ndvi"),
                delta_ndwi=ana_meta.get("d_ndwi"),
                ndvi_t0=ana_meta.get("ndvi_t0"),
                ndvi_tnow=ana_meta.get("ndvi_now"),
                ndwi_t0=ana_meta.get("ndwi_t0"),
                ndwi_tnow=ana_meta.get("ndwi_now"),
                satellite_agreement=ana_meta.get("sat_agree"),
                photo_agreement=ana_meta.get("photo_agree"),
                overall_status=ana_meta.get("status"),
                flags_json=json.dumps(ana_meta.get("flags", [])),
                satellite_source="Sentinel-2 L2A",
                buffer_radius_m=500,
            )
            session.add(analysis)

        await session.commit()
        logger.info(f"Seeded {len(demo_sites)} demo sites with showcase analysis results")

"""
Cross-validation logic: compares claimed activity_type against
satellite trends (NDVI/NDWI deltas) and photo classification results.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def validate_site(site_id, activity_type, satellite_data, classification_result):
    """
    Cross-validate a site's claimed intervention against satellite + photo evidence.

    Args:
        site_id: str
        activity_type: str — claimed activity from CSV
        satellite_data: dict with keys ndvi_t0, ndvi_tnow, ndwi_t0, ndwi_tnow,
                        delta_ndvi, delta_ndwi
        classification_result: dict with keys predicted_class, confidence, all_scores

    Returns:
        dict with keys:
            - satellite_agreement: bool
            - photo_agreement: bool
            - overall_status: "confirmed" | "anomaly" | "inconclusive"
            - flags: list of str (human-readable flag descriptions)
            - confidence: float (0-1)
            - details: dict with diagnostic info
    """
    flags = []
    details = {}

    # ── 1. Satellite trend validation ─────────────────────────────────────
    rules = config.VALIDATION_RULES.get(activity_type, None)
    satellite_agreement = True

    if rules is None:
        flags.append(f"Unknown activity type: {activity_type}")
        satellite_agreement = False
    else:
        delta_ndvi = satellite_data.get("delta_ndvi", 0)
        delta_ndwi = satellite_data.get("delta_ndwi", 0)
        ndvi_tnow = satellite_data.get("ndvi_tnow", 0)
        ndwi_tnow = satellite_data.get("ndwi_tnow", 0)

        details["delta_ndvi"] = delta_ndvi
        details["delta_ndwi"] = delta_ndwi

        # Check NDVI trend
        ndvi_min = rules.get("ndvi_min", -1.0)
        if delta_ndvi < ndvi_min:
            satellite_agreement = False
            trend_name = rules.get("ndvi_trend", "expected")
            flags.append(
                f"NDVI trend mismatch: delta={delta_ndvi:+.3f} "
                f"(expected {trend_name}, min delta={ndvi_min:+.3f}) "
                f"contradicts {activity_type} claim"
            )

        # Check NDWI trend
        ndwi_min = rules.get("ndwi_min", -1.0)
        if delta_ndwi < ndwi_min:
            satellite_agreement = False
            trend_name = rules.get("ndwi_trend", "expected")
            flags.append(
                f"NDWI trend mismatch: delta={delta_ndwi:+.3f} "
                f"(expected {trend_name}, min delta={ndwi_min:+.3f}) "
                f"contradicts {activity_type} claim"
            )

        # Additional checks for specific activity types
        if activity_type == "farm_pond" and ndwi_tnow < -0.15:
            satellite_agreement = False
            flags.append(
                f"No water signature detected: NDWI={ndwi_tnow:.3f} "
                f"(expected > -0.15 for farm pond)"
            )

        if activity_type == "plantation" and ndvi_tnow < 0.20:
            satellite_agreement = False
            flags.append(
                f"Low vegetation signal: NDVI={ndvi_tnow:.3f} "
                f"(expected > 0.20 for plantation)"
            )

        if activity_type == "water_body" and ndwi_tnow < 0.0:
            satellite_agreement = False
            flags.append(
                f"Weak water signature: NDWI={ndwi_tnow:.3f} "
                f"(expected > 0.0 for water body)"
            )

    # ── 2. Photo classification validation ────────────────────────────────
    predicted_class = classification_result.get("predicted_class", "unknown")
    photo_confidence = classification_result.get("confidence", 0.0)

    photo_agreement = (predicted_class == activity_type)

    if not photo_agreement:
        flags.append(
            f"Photo classification mismatch: classified as '{predicted_class}' "
            f"({photo_confidence:.0%} confidence), but claimed as '{activity_type}'"
        )

    details["predicted_class"] = predicted_class
    details["photo_confidence"] = photo_confidence

    # ── 3. Determine overall status ───────────────────────────────────────
    if satellite_agreement and photo_agreement:
        overall_status = "confirmed"
    elif not satellite_agreement and not photo_agreement:
        # Both disagree — strong anomaly
        overall_status = "anomaly"
    elif not satellite_agreement or not photo_agreement:
        # One disagrees — could be anomaly or inconclusive
        if photo_confidence < 0.5:
            # Low confidence classification — inconclusive
            overall_status = "inconclusive"
            flags.append("Low classifier confidence — result is inconclusive")
        else:
            overall_status = "anomaly"
    else:
        overall_status = "inconclusive"

    # Overall confidence: average of satellite and photo agreement signals
    sat_conf = 1.0 if satellite_agreement else 0.0
    overall_confidence = (sat_conf * 0.5 + photo_confidence * 0.5)

    return {
        "satellite_agreement": satellite_agreement,
        "photo_agreement": photo_agreement,
        "overall_status": overall_status,
        "flags": flags,
        "confidence": round(overall_confidence, 3),
        "details": details,
    }


def validate_all_sites(sites_df, satellite_results, classification_results):
    """
    Validate all sites at once.

    Args:
        sites_df: DataFrame with site_id, activity_type columns
        satellite_results: dict mapping site_id → satellite data dict
        classification_results: dict mapping site_id → classification result dict

    Returns:
        dict mapping site_id → validation result dict
    """
    results = {}
    for _, row in sites_df.iterrows():
        sid = row["site_id"]
        results[sid] = validate_site(
            site_id=sid,
            activity_type=row["activity_type"],
            satellite_data=satellite_results.get(sid, {}),
            classification_result=classification_results.get(sid, {}),
        )
    return results

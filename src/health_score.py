"""
Watershed health score computation.
Produces a 0-100 score per site combining NDVI trend, NDWI trend,
photo-satellite agreement, and classifier confidence.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def _normalize_delta(delta, min_val=None, max_val=None):
    """
    Normalize a delta value from [min_val, max_val] to [0, 100].
    Values outside the range are clamped.
    """
    if min_val is None:
        min_val = config.INDEX_DELTA_MIN
    if max_val is None:
        max_val = config.INDEX_DELTA_MAX

    if max_val == min_val:
        return 50.0

    normalized = (delta - min_val) / (max_val - min_val) * 100
    return max(0.0, min(100.0, normalized))


def compute_health_score(satellite_data, validation_result):
    """
    Compute a 0-100 watershed health score for a single site.

    Formula:
        score = (
            W_ndvi × ndvi_score +
            W_ndwi × ndwi_score +
            W_agreement × agreement_score +
            W_confidence × confidence_score
        )

    Args:
        satellite_data: dict with delta_ndvi, delta_ndwi
        validation_result: dict with overall_status, details (containing photo_confidence)

    Returns:
        dict with keys:
            - score: int (0-100)
            - components: dict with individual component scores
            - grade: str (A/B/C/D/F)
    """
    delta_ndvi = satellite_data.get("delta_ndvi", 0)
    delta_ndwi = satellite_data.get("delta_ndwi", 0)

    # Component 1: NDVI trend score (0-100)
    # Positive delta = vegetation improvement = higher score
    ndvi_score = _normalize_delta(delta_ndvi)

    # Component 2: NDWI trend score (0-100)
    # Positive delta = water presence improvement = higher score
    ndwi_score = _normalize_delta(delta_ndwi)

    # Component 3: Agreement score
    status = validation_result.get("overall_status", "inconclusive")
    if status == "confirmed":
        agreement_score = 100.0
    elif status == "inconclusive":
        agreement_score = 50.0
    else:  # anomaly
        agreement_score = 0.0

    # Component 4: Classifier confidence score
    photo_confidence = validation_result.get("details", {}).get("photo_confidence", 0.5)
    confidence_score = photo_confidence * 100

    # Weighted combination
    score = (
        config.HEALTH_WEIGHT_NDVI * ndvi_score +
        config.HEALTH_WEIGHT_NDWI * ndwi_score +
        config.HEALTH_WEIGHT_AGREEMENT * agreement_score +
        config.HEALTH_WEIGHT_CONFIDENCE * confidence_score
    )

    score = round(score)
    score = max(0, min(100, score))

    # Grade assignment
    if score >= 80:
        grade = "A"
    elif score >= 65:
        grade = "B"
    elif score >= 50:
        grade = "C"
    elif score >= 35:
        grade = "D"
    else:
        grade = "F"

    return {
        "score": score,
        "grade": grade,
        "components": {
            "ndvi_score": round(ndvi_score, 1),
            "ndwi_score": round(ndwi_score, 1),
            "agreement_score": round(agreement_score, 1),
            "confidence_score": round(confidence_score, 1),
        },
    }


def compute_all_health_scores(sites_df, satellite_results, validation_results):
    """
    Compute health scores for all sites.

    Returns:
        dict mapping site_id → health score dict
    """
    scores = {}
    for _, row in sites_df.iterrows():
        sid = row["site_id"]
        scores[sid] = compute_health_score(
            satellite_data=satellite_results.get(sid, {}),
            validation_result=validation_results.get(sid, {}),
        )
    return scores


def compute_overall_watershed_health(health_scores):
    """
    Compute an aggregate watershed health score across all sites.

    Returns:
        dict with overall_score, site_count, grade_distribution
    """
    if not health_scores:
        return {"overall_score": 0, "site_count": 0, "grade_distribution": {}}

    scores = [v["score"] for v in health_scores.values()]
    grades = [v["grade"] for v in health_scores.values()]

    grade_dist = {}
    for g in ["A", "B", "C", "D", "F"]:
        grade_dist[g] = grades.count(g)

    return {
        "overall_score": round(sum(scores) / len(scores)),
        "site_count": len(scores),
        "min_score": min(scores),
        "max_score": max(scores),
        "grade_distribution": grade_dist,
    }

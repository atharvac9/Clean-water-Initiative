"""Quick end-to-end pipeline test."""
import pandas as pd
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from src.gee_client import get_indices_for_site, clear_cache
from src.classifier import classify_photo
from src.cross_validator import validate_all_sites
from src.health_score import compute_all_health_scores, compute_overall_watershed_health

# Clear any stale cache
clear_cache()

# Load sites
df = pd.read_csv(config.SITES_CSV)
print(f"Loaded {len(df)} sites")

# Run satellite (mock)
sat = {}
for _, r in df.iterrows():
    sat[r["site_id"]] = get_indices_for_site(
        r["site_id"], r["lat"], r["lon"], r["activity_type"], False
    )

# Run classification (mock - no photos yet)
cls = {}
for _, r in df.iterrows():
    cls[r["site_id"]] = classify_photo(
        os.path.join(config.PHOTOS_DIR, r["photo_filename"])
    )

# Cross-validate
val = validate_all_sites(df, sat, cls)

# Health scores
hs = compute_all_health_scores(df, sat, val)
overall = compute_overall_watershed_health(hs)

print(f"\nOverall watershed health: {overall['overall_score']}/100")
print(f"Grade distribution: {overall['grade_distribution']}")
print()

for sid in sorted(val.keys()):
    v = val[sid]
    h = hs[sid]
    status = v["overall_status"].upper()
    print(f"  {sid}: {status:13s} | Score: {h['score']:3d} ({h['grade']}) | Flags: {len(v['flags'])}")
    for f in v["flags"]:
        print(f"    -> {f}")

print("\n=== Pipeline test PASSED ===")

"""
SQLite persistence utilities for caching analysis results.
"""
import os
import sys
import json
import sqlite3
from contextlib import contextmanager

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


@contextmanager
def get_connection():
    """Context manager for SQLite connections."""
    os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Create database tables if they don't exist."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sites (
                site_id TEXT PRIMARY KEY,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                date TEXT,
                activity_type TEXT,
                photo_filename TEXT,
                description TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS analysis_results (
                site_id TEXT PRIMARY KEY,
                ndvi_t0 REAL,
                ndvi_tnow REAL,
                ndwi_t0 REAL,
                ndwi_tnow REAL,
                delta_ndvi REAL,
                delta_ndwi REAL,
                predicted_class TEXT,
                photo_confidence REAL,
                overall_status TEXT,
                health_score INTEGER,
                health_grade TEXT,
                flags_json TEXT,
                source TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (site_id) REFERENCES sites(site_id)
            )
        """)


def save_sites(sites_df):
    """Save sites DataFrame to the database."""
    with get_connection() as conn:
        for _, row in sites_df.iterrows():
            conn.execute("""
                INSERT OR REPLACE INTO sites
                (site_id, lat, lon, date, activity_type, photo_filename, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                row["site_id"], row["lat"], row["lon"],
                row.get("date", ""), row.get("activity_type", ""),
                row.get("photo_filename", ""), row.get("description", ""),
            ))


def save_analysis(site_id, satellite_data, classification_result,
                  validation_result, health_score_data):
    """Save a complete analysis result for a site."""
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO analysis_results
            (site_id, ndvi_t0, ndvi_tnow, ndwi_t0, ndwi_tnow,
             delta_ndvi, delta_ndwi, predicted_class, photo_confidence,
             overall_status, health_score, health_grade, flags_json, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            site_id,
            satellite_data.get("ndvi_t0"),
            satellite_data.get("ndvi_tnow"),
            satellite_data.get("ndwi_t0"),
            satellite_data.get("ndwi_tnow"),
            satellite_data.get("delta_ndvi"),
            satellite_data.get("delta_ndwi"),
            classification_result.get("predicted_class"),
            classification_result.get("confidence"),
            validation_result.get("overall_status"),
            health_score_data.get("score"),
            health_score_data.get("grade"),
            json.dumps(validation_result.get("flags", [])),
            satellite_data.get("source", "unknown"),
        ))


def load_all_results():
    """Load all analysis results from the database."""
    with get_connection() as conn:
        cursor = conn.execute("""
            SELECT s.*, a.ndvi_t0, a.ndvi_tnow, a.ndwi_t0, a.ndwi_tnow,
                   a.delta_ndvi, a.delta_ndwi, a.predicted_class,
                   a.photo_confidence, a.overall_status, a.health_score,
                   a.health_grade, a.flags_json, a.source
            FROM sites s
            LEFT JOIN analysis_results a ON s.site_id = a.site_id
        """)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


def has_results():
    """Check if analysis results exist in the database."""
    with get_connection() as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM analysis_results")
        count = cursor.fetchone()[0]
        return count > 0

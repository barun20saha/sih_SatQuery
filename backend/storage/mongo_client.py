"""
backend/storage/mongo_client.py
=================================
MongoDB client for SatQuery AI.

Responsibilities:
  - Log each query request (query text, type, status, duration) to the
    'query_logs' collection in the 'satquery_db' database.
  - Store spatial coordinate annotations (bounding boxes) from grounding tasks.
  - Retrieve query history for the frontend history panel.

Uses pymongo (synchronous) with a short connection timeout so the API
doesn't hang if MongoDB is not running. All operations have graceful fallback.
"""

import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://satquery:satquery_secret@localhost:27017/satquery_db?authSource=admin"
)
MONGO_DB_NAME  = "satquery_db"
COLLECTION_LOGS = "query_logs"
COLLECTION_ANNOTATIONS = "spatial_annotations"

# ---------------------------------------------------------------------------
# Lazy client initialisation
# ---------------------------------------------------------------------------
_mongo_client = None
_mongo_db     = None
_mongo_available = False
_mongo_init_attempted = False   # prevents repeated connection retries


def _get_db():
    """Return the MongoDB database handle, initialising once on first call."""
    global _mongo_client, _mongo_db, _mongo_available, _mongo_init_attempted

    if _mongo_init_attempted:
        return _mongo_db if _mongo_available else None

    _mongo_init_attempted = True
    try:
        import pymongo  # type: ignore
        client = pymongo.MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=3000,   # 3s — fast fail if not running
            connectTimeoutMS=3000,
        )
        # Probe connectivity
        client.admin.command("ping")
        _mongo_client = client
        _mongo_db = client[MONGO_DB_NAME]
        _mongo_available = True
        logger.info("[MongoDB] Connected — database: %s", MONGO_DB_NAME)
    except ImportError:
        logger.warning("[MongoDB] 'pymongo' not installed — logging disabled. Run: pip install pymongo")
    except Exception as exc:
        logger.warning("[MongoDB] Not available (%s) — logging disabled.", exc)
        _mongo_available = False

    return _mongo_db if _mongo_available else None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def log_query(
    *,
    query: str,
    query_type: str,
    task_id: Optional[str] = None,
    status: str = "completed",
    duration_s: float = 0.0,
    image_keys: Optional[List[str]] = None,
    result_summary: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    """
    Insert a query execution log record into MongoDB.

    Args:
        query:          The natural language query string.
        query_type:     One of vqa | change | sar | describe | grounding.
        task_id:        Unique task identifier (generated if not provided).
        status:         'completed' | 'failed' | 'cached'.
        duration_s:     Execution duration in seconds.
        image_keys:     MinIO object keys of uploaded images.
        result_summary: Compact summary of the result (answer + confidence).

    Returns:
        The MongoDB inserted document ID as string, or None on failure.
    """
    db = _get_db()
    if not db:
        return None

    doc = {
        "task_id":        task_id or str(uuid.uuid4()),
        "query":          query,
        "query_type":     query_type,
        "status":         status,
        "duration_s":     round(duration_s, 3),
        "image_keys":     image_keys or [],
        "result_summary": result_summary or {},
        "created_at":     datetime.now(timezone.utc),
    }

    try:
        result = db[COLLECTION_LOGS].insert_one(doc)
        logger.info("[MongoDB] Logged query [%s] task_id=%s", query_type, doc["task_id"])
        return str(result.inserted_id)
    except Exception as exc:
        logger.error("[MongoDB] log_query failed: %s", exc)
        return None


def save_spatial_annotation(
    task_id: str,
    boxes: List[Dict[str, Any]],
    query: str,
    image_key: Optional[str] = None,
) -> Optional[str]:
    """
    Persist bounding box annotations from grounding tasks.

    Args:
        task_id:   Task identifier linking back to query_logs.
        boxes:     List of box dicts {x, y, width, height, label, confidence}.
        query:     The grounding query text.
        image_key: MinIO key of the source image.

    Returns:
        Inserted document ID string or None.
    """
    db = _get_db()
    if not db:
        return None

    doc = {
        "task_id":   task_id,
        "query":     query,
        "image_key": image_key,
        "boxes":     boxes,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = db[COLLECTION_ANNOTATIONS].insert_one(doc)
        logger.info("[MongoDB] Saved %d annotations for task %s", len(boxes), task_id)
        return str(result.inserted_id)
    except Exception as exc:
        logger.error("[MongoDB] save_spatial_annotation failed: %s", exc)
        return None


def get_recent_logs(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Retrieve the most recent query logs (for history panel).

    Args:
        limit: Maximum number of records to return.

    Returns:
        List of log dicts with '_id' cast to string.
    """
    db = _get_db()
    if not db:
        return []

    try:
        cursor = (
            db[COLLECTION_LOGS]
            .find({}, {"_id": 1, "task_id": 1, "query": 1, "query_type": 1,
                       "status": 1, "duration_s": 1, "created_at": 1})
            .sort("created_at", -1)
            .limit(limit)
        )
        records = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("created_at"), datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            records.append(doc)
        return records
    except Exception as exc:
        logger.error("[MongoDB] get_recent_logs failed: %s", exc)
        return []


def is_available() -> bool:
    """Return True if MongoDB is reachable."""
    return _get_db() is not None

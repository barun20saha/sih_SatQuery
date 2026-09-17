"""
backend/storage/redis_client.py
=================================
Redis client for SatQuery AI.

Responsibilities:
  - Cache task execution results by task_id (TTL: 1 hour by default).
  - Store and retrieve session state for active analysis sessions.
  - Track task status transitions: PENDING → PROCESSING → COMPLETED/FAILED.

Uses redis-py (synchronous). Graceful fallback: if Redis is not running,
all operations log a warning and return safe defaults.
"""

import os
import json
import logging
import uuid
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
REDIS_URL      = os.getenv("REDIS_URL", "redis://:satquery_redis_secret@localhost:6379/0")
DEFAULT_TTL_S  = int(os.getenv("REDIS_RESULT_TTL_S", "3600"))   # 1 hour

# Key prefixes
PREFIX_RESULT  = "satquery:result:"
PREFIX_STATUS  = "satquery:status:"
PREFIX_SESSION = "satquery:session:"

# ---------------------------------------------------------------------------
# Lazy client initialisation
# ---------------------------------------------------------------------------
_redis_client    = None
_redis_available = False
_redis_init_attempted = False   # prevents repeated import/connection retries


def _get_client():
    """Return the Redis client, initialising once on first call."""
    global _redis_client, _redis_available, _redis_init_attempted

    if _redis_init_attempted:
        return _redis_client if _redis_available else None

    _redis_init_attempted = True
    try:
        import redis  # type: ignore
        client = redis.from_url(
            REDIS_URL,
            socket_connect_timeout=2,   # 2s — fast fail
            socket_timeout=2,
            decode_responses=True,
        )
        client.ping()
        _redis_client = client
        _redis_available = True
        logger.info("[Redis] Connected — URL: %s", REDIS_URL.split("@")[-1])
    except ImportError:
        logger.warning("[Redis] 'redis' package not installed — caching disabled. Run: pip install redis")
    except Exception as exc:
        logger.warning("[Redis] Not available (%s) — caching disabled.", exc)
        _redis_available = False

    return _redis_client if _redis_available else None


# ---------------------------------------------------------------------------
# Task Result Cache
# ---------------------------------------------------------------------------

def cache_result(task_id: str, result: Dict[str, Any], ttl: int = DEFAULT_TTL_S) -> bool:
    """
    Store an analysis result in Redis with a TTL.

    Args:
        task_id: Unique task identifier.
        result:  The full result dict to cache.
        ttl:     Expiry in seconds (default 3600).

    Returns:
        True on success, False if Redis is unavailable.
    """
    client = _get_client()
    if not client:
        return False
    try:
        key = PREFIX_RESULT + task_id
        client.setex(key, ttl, json.dumps(result, default=str))
        logger.debug("[Redis] Cached result for task %s (TTL=%ds)", task_id, ttl)
        return True
    except Exception as exc:
        logger.error("[Redis] cache_result failed: %s", exc)
        return False


def get_cached_result(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a cached analysis result.

    Args:
        task_id: Task identifier to look up.

    Returns:
        The cached result dict, or None if not found / expired.
    """
    client = _get_client()
    if not client:
        return None
    try:
        key = PREFIX_RESULT + task_id
        raw = client.get(key)
        if raw:
            logger.debug("[Redis] Cache HIT for task %s", task_id)
            return json.loads(raw)
        logger.debug("[Redis] Cache MISS for task %s", task_id)
        return None
    except Exception as exc:
        logger.error("[Redis] get_cached_result failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Task Status Tracking
# ---------------------------------------------------------------------------

def set_task_status(task_id: str, status: str, ttl: int = DEFAULT_TTL_S) -> bool:
    """
    Set a task's status string (PENDING | PROCESSING | COMPLETED | FAILED).

    Args:
        task_id: Task identifier.
        status:  Status string.
        ttl:     Expiry in seconds.

    Returns:
        True on success, False otherwise.
    """
    client = _get_client()
    if not client:
        return False
    try:
        client.setex(PREFIX_STATUS + task_id, ttl, status)
        return True
    except Exception as exc:
        logger.error("[Redis] set_task_status failed: %s", exc)
        return False


def get_task_status(task_id: str) -> Optional[str]:
    """
    Retrieve the current status of a task.

    Returns:
        Status string or None if not found.
    """
    client = _get_client()
    if not client:
        return None
    try:
        return client.get(PREFIX_STATUS + task_id)
    except Exception as exc:
        logger.error("[Redis] get_task_status failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Session State
# ---------------------------------------------------------------------------

def set_session(session_id: str, state: Dict[str, Any], ttl: int = 86400) -> bool:
    """
    Store a session state dict (e.g. uploaded image keys, active query).

    Args:
        session_id: Client session identifier.
        state:      State dict to persist.
        ttl:        Expiry in seconds (default 24 hours).

    Returns:
        True on success, False otherwise.
    """
    client = _get_client()
    if not client:
        return False
    try:
        client.setex(PREFIX_SESSION + session_id, ttl, json.dumps(state, default=str))
        return True
    except Exception as exc:
        logger.error("[Redis] set_session failed: %s", exc)
        return False


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a session state dict.

    Returns:
        State dict or None.
    """
    client = _get_client()
    if not client:
        return None
    try:
        raw = client.get(PREFIX_SESSION + session_id)
        return json.loads(raw) if raw else None
    except Exception as exc:
        logger.error("[Redis] get_session failed: %s", exc)
        return None


def generate_task_id() -> str:
    """Generate a unique task ID."""
    return str(uuid.uuid4())


def is_available() -> bool:
    """Return True if Redis is reachable."""
    return _get_client() is not None

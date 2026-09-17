"""
backend/storage/minio_client.py
================================
MinIO object storage client for SatQuery AI.

Responsibilities:
  - Upload raw satellite images (GeoTIFF, TIFF, PNG, JPEG) to the
    'satquery-imagery' bucket.
  - Upload generated visual outputs (change maps, bounding box overlays)
    to the 'satquery-outputs' bucket.
  - Download images by object key for re-processing.
  - Generate pre-signed URLs for frontend display.

Graceful fallback: If MinIO is not running (e.g. Docker not started),
all operations log a warning and return safe defaults — the API never crashes.
"""

import io
import os
import logging
import uuid
from datetime import timedelta
from typing import Optional, BinaryIO

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration (from environment or docker-compose defaults)
# ---------------------------------------------------------------------------
MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT",   "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY",  "satquery_minio")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY",  "satquery_minio_secret")
MINIO_SECURE     = os.getenv("MINIO_SECURE", "false").lower() == "true"

BUCKET_IMAGERY = "satquery-imagery"   # raw uploaded satellite images
BUCKET_OUTPUTS = "satquery-outputs"   # generated change maps / overlays


# ---------------------------------------------------------------------------
# Lazy client initialisation
# ---------------------------------------------------------------------------
_minio_client = None
_minio_available = False


def _get_client():
    """Return the MinIO client, initialising it once on first call."""
    global _minio_client, _minio_available
    if _minio_client is not None:
        return _minio_client if _minio_available else None

    try:
        from minio import Minio  # type: ignore
        client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE,
        )
        # Quick connectivity probe
        client.list_buckets()
        _minio_client = client
        _minio_available = True
        logger.info("[MinIO] Connected to %s", MINIO_ENDPOINT)
        _ensure_buckets(client)
    except ImportError:
        logger.warning("[MinIO] 'minio' package not installed — storage disabled. Run: pip install minio")
    except Exception as exc:
        logger.warning("[MinIO] Not available (%s) — storage disabled.", exc)
        _minio_available = False

    return _minio_client if _minio_available else None


def _ensure_buckets(client) -> None:
    """Create required buckets if they don't already exist."""
    for bucket in (BUCKET_IMAGERY, BUCKET_OUTPUTS):
        try:
            if not client.bucket_exists(bucket):
                client.make_bucket(bucket)
                logger.info("[MinIO] Created bucket: %s", bucket)
        except Exception as exc:
            logger.warning("[MinIO] Could not ensure bucket %s: %s", bucket, exc)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def upload_image(
    file_data: bytes,
    filename: str,
    content_type: str = "image/png",
    bucket: str = BUCKET_IMAGERY,
) -> Optional[str]:
    """
    Upload raw bytes to MinIO.

    Args:
        file_data:    Raw file bytes.
        filename:     Original filename (used to derive extension).
        content_type: MIME type string.
        bucket:       Target bucket name.

    Returns:
        The object key (str) on success, or None if MinIO is unavailable.
    """
    client = _get_client()
    if not client:
        logger.warning("[MinIO] upload_image skipped — MinIO not available.")
        return None

    ext = os.path.splitext(filename)[-1] or ".bin"
    object_key = f"{uuid.uuid4().hex}{ext}"
    data_stream = io.BytesIO(file_data)

    try:
        client.put_object(
            bucket_name=bucket,
            object_name=object_key,
            data=data_stream,
            length=len(file_data),
            content_type=content_type,
        )
        logger.info("[MinIO] Uploaded %s → %s/%s", filename, bucket, object_key)
        return object_key
    except Exception as exc:
        logger.error("[MinIO] Upload failed for %s: %s", filename, exc)
        return None


def upload_output_bytes(
    image_bytes: bytes,
    suffix: str = "output.png",
    content_type: str = "image/png",
) -> Optional[str]:
    """
    Upload a generated output image (e.g. change map) to the outputs bucket.

    Returns:
        Object key str or None.
    """
    return upload_image(
        file_data=image_bytes,
        filename=suffix,
        content_type=content_type,
        bucket=BUCKET_OUTPUTS,
    )


def get_presigned_url(object_key: str, bucket: str = BUCKET_IMAGERY, expires_hours: int = 24) -> Optional[str]:
    """
    Generate a pre-signed download URL for a stored object.

    Args:
        object_key:    The MinIO object key.
        bucket:        Source bucket.
        expires_hours: URL expiry in hours (default 24).

    Returns:
        A pre-signed URL string, or None if MinIO is unavailable.
    """
    client = _get_client()
    if not client:
        return None
    try:
        url = client.presigned_get_object(
            bucket_name=bucket,
            object_name=object_key,
            expires=timedelta(hours=expires_hours),
        )
        return url
    except Exception as exc:
        logger.error("[MinIO] presigned_url failed for %s: %s", object_key, exc)
        return None


def download_image(object_key: str, bucket: str = BUCKET_IMAGERY) -> Optional[bytes]:
    """
    Download an image from MinIO and return raw bytes.

    Args:
        object_key: The MinIO object key.
        bucket:     Source bucket.

    Returns:
        bytes on success, or None if unavailable.
    """
    client = _get_client()
    if not client:
        return None
    try:
        response = client.get_object(bucket_name=bucket, object_name=object_key)
        data = response.read()
        response.close()
        response.release_conn()
        logger.info("[MinIO] Downloaded %s/%s (%d bytes)", bucket, object_key, len(data))
        return data
    except Exception as exc:
        logger.error("[MinIO] Download failed for %s: %s", object_key, exc)
        return None


def is_available() -> bool:
    """Return True if MinIO is reachable."""
    return _get_client() is not None

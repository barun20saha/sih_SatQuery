import os
from pathlib import Path

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
WORKSPACE_SIH = PROJECT_DIR.parent  # C:\Users\User\Downloads\SIH
DOWNLOADS_DIR = WORKSPACE_SIH.parent # C:\Users\User\Downloads

# Model paths (fallback order: env var -> local backend/weights -> SIH directory -> Downloads)
OPTICAL_CHANGE_MODEL_PATH = os.getenv(
    "OPTICAL_CHANGE_MODEL_PATH",
    str(WORKSPACE_SIH / "change_detection_model_final.pth")
)

OPTICAL_SAR_MODEL_PATH = os.getenv(
    "OPTICAL_SAR_MODEL_PATH",
    str(WORKSPACE_SIH / "optical_sar_change_detection.pth")
)

def _find_vlm_bundle():
    custom_path = os.getenv("VLM_MODEL_BUNDLE_PATH")
    if custom_path and Path(custom_path).exists():
        return custom_path
    candidates = [
        BACKEND_DIR / "models" / "satquery_model_bundle",
        DOWNLOADS_DIR / "satquery_model_bundle",
        WORKSPACE_SIH / "modles" / "satquery_model_bundle",
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return str(BACKEND_DIR / "models" / "satquery_model_bundle")

VLM_MODEL_BUNDLE_PATH = _find_vlm_bundle()
OFFLOAD_DIR = BACKEND_DIR / "models" / "offload"
OFFLOAD_DIR.mkdir(parents=True, exist_ok=True)

VLM_BASE_MODEL_NAME = os.getenv(
    "VLM_BASE_MODEL_NAME",
    "Qwen/Qwen2-VL-2B-Instruct"
)

# Device Configuration
FORCE_CPU = os.getenv("FORCE_CPU", "false").lower() in ("true", "1", "yes")

# ============================================================
# Server Configuration
# NOTE: Backend runs on 8000; Spring Boot Gateway owns 8080.
# ============================================================
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))   # Changed from 8080 → 8000 (Gateway takes 8080)

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",   # Spring Boot Gateway forward requests
    "http://127.0.0.1:8080",
]

# ============================================================
# Storage Configuration — MinIO
# ============================================================
MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT",   "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY",  "satquery_minio")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY",  "satquery_minio_secret")
MINIO_SECURE     = os.getenv("MINIO_SECURE",       "false").lower() == "true"

# ============================================================
# Storage Configuration — MongoDB
# ============================================================
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://satquery:satquery_secret@localhost:27017/satquery_db?authSource=admin"
)

# ============================================================
# Storage Configuration — Redis
# ============================================================
REDIS_URL = os.getenv("REDIS_URL", "redis://:satquery_redis_secret@localhost:6379/0")
REDIS_RESULT_TTL_S = int(os.getenv("REDIS_RESULT_TTL_S", "3600"))

# ============================================================
# Cloud GPU Dispatcher
# Set to your Colab/Kaggle ngrok URL to enable real inference:
#   CLOUD_GPU_ENDPOINT=https://xxxx.ngrok.io
# Leave empty to use mock responses (default for local dev).
# ============================================================
CLOUD_GPU_ENDPOINT = os.getenv("CLOUD_GPU_ENDPOINT", "").strip()
CLOUD_GPU_TIMEOUT_S = int(os.getenv("CLOUD_GPU_TIMEOUT_S", "120"))

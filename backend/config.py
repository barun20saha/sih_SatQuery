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

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8080))
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add project root to sys.path so 'backend.*' imports always resolve
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import CORS_ORIGINS, HOST, PORT
from backend.model_manager import ModelManager
from backend.routes.change_routes import router as change_router
from backend.routes.vlm_routes import router as vlm_router
from backend.routes.analyze_routes import router as analyze_router
from backend.routes.v1_routes import router as v1_router     # NEW: hybrid v1 routes

# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def _probe_storage() -> None:
    """
    Non-blocking probe of storage services at startup.
    Logs warnings if any service is unreachable — does NOT crash the server.
    """
    import logging
    log = logging.getLogger("satquery.startup")

    try:
        from backend.storage.redis_client import is_available as redis_ok
        log.info("[Startup] Redis: %s", "✓ connected" if redis_ok() else "✗ not available (caching disabled)")
    except Exception as exc:
        log.warning("[Startup] Redis probe error: %s", exc)

    try:
        from backend.storage.mongo_client import is_available as mongo_ok
        log.info("[Startup] MongoDB: %s", "✓ connected" if mongo_ok() else "✗ not available (logging disabled)")
    except Exception as exc:
        log.warning("[Startup] MongoDB probe error: %s", exc)

    try:
        from backend.storage.minio_client import is_available as minio_ok
        log.info("[Startup] MinIO: %s", "✓ connected" if minio_ok() else "✗ not available (object storage disabled)")
    except Exception as exc:
        log.warning("[Startup] MinIO probe error: %s", exc)

    try:
        from backend.services.cloud_dispatcher import is_cloud_active
        log.info("[Startup] Cloud GPU: %s", "✓ endpoint configured" if is_cloud_active() else "✗ not set (mock mode active)")
    except Exception as exc:
        log.warning("[Startup] CloudDispatcher probe error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load PyTorch models once into memory
    print("=" * 60)
    print("[SatQuery] Starting SatQuery AI Backend Server...")
    print(f"[SatQuery] Backend port: {PORT} | Gateway port: 8080")
    print("=" * 60)
    manager = ModelManager.get_instance()
    status = manager.health_status()
    print(f"[Startup] Active inference device: {status['device'].upper()}")
    print(f"[Startup] Models loaded: {status['models']}")
    print("=" * 60)
    _probe_storage()
    print("=" * 60)
    yield
    print("[SatQuery] Shutting down SatQuery AI Backend Server...")

app = FastAPI(
    title="SatQuery AI Backend",
    description=(
        "Multi-modal satellite imagery intelligence API powered by PyTorch & Qwen2-VL. "
        "Hybrid architecture: Spring Boot Gateway (8080) → FastAPI Orchestrator (8000) → "
        "MinIO | MongoDB | Redis | Cloud GPU Dispatcher."
    ),
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Legacy routers (preserved) ───────────────────────────────
app.include_router(change_router)
app.include_router(vlm_router)
app.include_router(analyze_router)      # /api/analyze  (legacy)

# ── v1 router — new hybrid architecture endpoints ────────────
app.include_router(v1_router)           # /api/v1/analyze, /api/v1/upload, /api/v1/history


@app.get("/api/health")
async def health_check():
    """Health check endpoint — returns backend status, loaded AI models, and storage availability."""
    manager = ModelManager.get_instance()
    base = manager.health_status()

    # Augment with storage status
    try:
        from backend.storage.redis_client import is_available as redis_ok
        from backend.storage.mongo_client import is_available as mongo_ok
        from backend.storage.minio_client import is_available as minio_ok
        from backend.services.cloud_dispatcher import is_cloud_active
        base["storage"] = {
            "redis":   "connected" if redis_ok()   else "unavailable",
            "mongodb": "connected" if mongo_ok()   else "unavailable",
            "minio":   "connected" if minio_ok()   else "unavailable",
            "cloudGpu": "configured" if is_cloud_active() else "mock_mode",
        }
    except Exception:
        pass

    return base


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Formats uncaught exceptions into structured JSON compatible with ResultsPage error cards."""
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "errorTitle": "Model Processing Error",
            "errorMessage": str(exc),
            "suggestion": "Verify that your uploaded imagery is a valid satellite image and the query is appropriately phrased.",
            "executionTrace": {
                "task": "Inference Execution",
                "status": "failed",
                "steps": ["Image receipt", f"Error encountered: {str(exc)[:100]}"]
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)

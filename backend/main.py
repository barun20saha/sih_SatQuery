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

# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load PyTorch models once into memory
    print("=" * 60)
    print("[SatQuery] Starting SatQuery AI Backend Server...")
    print("=" * 60)
    manager = ModelManager.get_instance()
    status = manager.health_status()
    print(f"[Startup] Active inference device: {status['device'].upper()}")
    print(f"[Startup] Models loaded: {status['models']}")
    print("=" * 60)
    yield
    print("[SatQuery] Shutting down SatQuery AI Backend Server...")

app = FastAPI(
    title="SatQuery AI Backend",
    description="Multi-modal satellite imagery intelligence API powered by PyTorch & Qwen2-VL",
    version="1.0.0",
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

# Register routers
app.include_router(change_router)
app.include_router(vlm_router)
app.include_router(analyze_router)

@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify backend status and loaded AI models."""
    manager = ModelManager.get_instance()
    return manager.health_status()

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

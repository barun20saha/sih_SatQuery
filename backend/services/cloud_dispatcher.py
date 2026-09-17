"""
backend/services/cloud_dispatcher.py
=======================================
SatQuery Cloud GPU Dispatcher — the bridge between the FastAPI backend
and a remote GPU worker running on Google Colab or Kaggle.

Architecture
------------
                    ┌─────────────────────────────┐
  FastAPI backend   │   cloud_dispatcher.py        │
  (any route)  ───► │                              │
                    │  1. Is CLOUD_GPU_ENDPOINT set? │
                    │     YES → POST to Colab/Kaggle │
                    │     NO  → return mock result  │
                    └─────────────────────────────┘

Colab / Kaggle Setup
--------------------
On your Colab notebook:
  1. Run the model server cell (see ARCHITECTURE.md for the FastAPI snippet).
  2. Expose it via ngrok:
         from pyngrok import ngrok
         public_url = ngrok.connect(8000)
         print(public_url)
  3. Copy the https://xxxxx.ngrok.io URL.
  4. Set it in your local .env:
         CLOUD_GPU_ENDPOINT=https://xxxxx.ngrok.io

When CLOUD_GPU_ENDPOINT is empty or unreachable, the dispatcher returns a
fully structured mock response so the frontend works immediately.

Payload contract (sent to cloud endpoint):
-----------------------------------------
POST /infer
{
  "image_url":  "<pre-signed MinIO URL or base64 data URL>",
  "image2_url": "<optional second image for change detection>",
  "query":      "<natural language query>",
  "task_type":  "vqa | change | sar | describe | grounding",
  "task_id":    "<uuid>"
}

Expected response contract (from cloud endpoint):
-------------------------------------------------
{
  "queryType":      "vqa",
  "answer":         "...",
  "confidence":     {"score": 0.92, "level": "high", "explanation": "..."},
  "evidence":       {"type": "vqa", "originalImage": "...", ...},
  "executionTrace": {"task": "...", "steps": [...], "duration": "..."},
  "modelDetails":   [...],
  "fusionStrategy": null
}
"""

import os
import logging
import uuid
import time
import random
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration (read at dispatch time so .env is respected after uvicorn load)
# ---------------------------------------------------------------------------
def _get_endpoint() -> str:
    """Re-read CLOUD_GPU_ENDPOINT at call time so hot .env changes are picked up."""
    return os.getenv("CLOUD_GPU_ENDPOINT", "").strip().rstrip("/")

CLOUD_TIMEOUT_S = int(os.getenv("CLOUD_GPU_TIMEOUT_S", "120"))   # 2-min default

# ---------------------------------------------------------------------------
# Mock response templates
# ---------------------------------------------------------------------------

_MOCK_BOXES = [
    {"x": 0.19, "y": 0.13, "w": 0.31, "h": 0.24, "label": "Urban Settlement",   "color": "#4A90D9", "confidence": 0.91},
    {"x": 0.59, "y": 0.33, "w": 0.22, "h": 0.16, "label": "Agricultural Field", "color": "#7ED321", "confidence": 0.87},
    {"x": 0.09, "y": 0.48, "w": 0.14, "h": 0.11, "label": "Water Body",         "color": "#0066CC", "confidence": 0.83},
]

_MOCK_VQA_ANSWERS = [
    "The satellite imagery reveals a densely urbanised area with structured road networks, "
    "residential blocks arranged in a grid pattern, and several large commercial rooftops identifiable "
    "by their rectangular metallic surfaces. Vegetation coverage appears minimal, concentrated along "
    "canal edges and park reserves.",
    "Analysis of the multi-spectral data indicates active agricultural land with seasonal crop patterns. "
    "Field boundaries are well-defined with irrigation channels running along the east-facing plots. "
    "Soil moisture indices suggest recent irrigation activity within the past 72 hours.",
    "The scene depicts a semi-arid terrain with sparse shrub cover transitioning to bare soil in the "
    "northern sector. A dry riverbed is visible along the western edge. No permanent structures detected "
    "within the primary region of interest.",
]

_MOCK_CHANGE_ANSWERS = [
    "Bi-temporal analysis detected 23.7% surface change between the two acquisitions. "
    "Significant urban expansion is observed in the north-eastern quadrant, with previously "
    "undeveloped land now showing building rooftop signatures. Agricultural fields in the "
    "south-western sector appear unchanged.",
    "Multi-temporal optical change detection identified 18.2% radiometric variance. "
    "Primary change regions correspond to seasonal vegetation loss and new road infrastructure "
    "along the corridor between coordinates (245, 180) and (410, 320).",
]

_MOCK_GROUNDING_ANSWERS = [
    "Target object localised at 3 distinct regions within the image. Primary detection "
    "confidence: 91% (north-central cluster). Secondary detections at south and west quadrants "
    "with confidence 87% and 83% respectively.",
]


def _build_mock_response(
    task_type: str,
    query: str,
    task_id: str,
    image_url: Optional[str],
    elapsed: float,
) -> Dict[str, Any]:
    """Build a fully structured mock response matching the real API contract."""

    confidence_score = round(random.uniform(0.82, 0.95), 2)
    conf_level = "high" if confidence_score >= 0.85 else "medium"

    # Select answer by task type
    if task_type == "change":
        answer = random.choice(_MOCK_CHANGE_ANSWERS)
        return {
            "queryType": "change",
            "answer": answer,
            "confidence": {
                "score": confidence_score,
                "level": conf_level,
                "explanation": "[MOCK] Cloud GPU dispatcher — Colab endpoint not configured. "
                               "Set CLOUD_GPU_ENDPOINT in .env to enable real inference.",
            },
            "evidence": {
                "type": "change",
                "beforeImage": image_url,
                "afterImage": image_url,
                "changeMap": None,
                "beforeLabel": "Before (T1)",
                "afterLabel": "After (T2)",
            },
            "executionTrace": {
                "task": "Bi-temporal Optical Change Detection [MOCK]",
                "inputCount": "2 image(s)",
                "modelsUsed": ["MOCK — Cloud GPU not active"],
                "steps": [
                    "Image receipt",
                    "Cloud GPU endpoint check",
                    "CLOUD_GPU_ENDPOINT not set → mock response",
                    "Structured mock result returned",
                ],
                "parameters": {"Mode": "MOCK", "task_id": task_id},
                "duration": f"{elapsed:.2f}s",
                "status": "mock",
            },
            "modelDetails": [{"name": "MOCK", "confidence": str(confidence_score),
                              "inputType": "Optical x 2", "role": "Mock Change Detector"}],
            "fusionStrategy": "Mock — Siamese feature subtraction placeholder",
            "_isMock": True,
        }

    elif task_type in ("grounding",):
        answer = random.choice(_MOCK_GROUNDING_ANSWERS)
        boxes = _MOCK_BOXES[:2]
        return {
            "queryType": "vqa",
            "answer": answer,
            "confidence": {
                "score": confidence_score,
                "level": conf_level,
                "explanation": "[MOCK] Cloud GPU dispatcher — Colab endpoint not configured.",
            },
            "evidence": {
                "type": "vqa",
                "originalImage": image_url,
                "groundingImage": None,
                "groundingBoxes": boxes,
            },
            "executionTrace": {
                "task": "Visual Grounding & Localisation [MOCK]",
                "inputCount": "1 image",
                "modelsUsed": ["MOCK — Cloud GPU not active"],
                "steps": ["Image receipt", "CLOUD_GPU_ENDPOINT not set → mock bounding boxes returned"],
                "parameters": {"Mode": "MOCK", "task_id": task_id},
                "duration": f"{elapsed:.2f}s",
                "status": "mock",
            },
            "modelDetails": [{"name": "MOCK", "confidence": str(confidence_score),
                              "inputType": "Optical", "role": "Mock Grounder"}],
            "fusionStrategy": None,
            "_isMock": True,
        }

    else:
        # vqa | describe | sar — all return VQA-style
        answer = random.choice(_MOCK_VQA_ANSWERS)
        return {
            "queryType": task_type if task_type in ("vqa", "describe", "sar") else "vqa",
            "answer": answer,
            "confidence": {
                "score": confidence_score,
                "level": conf_level,
                "explanation": "[MOCK] Cloud GPU dispatcher — Colab endpoint not configured. "
                               "Set CLOUD_GPU_ENDPOINT=https://<ngrok-url> in .env to enable real inference.",
            },
            "evidence": {
                "type": "vqa",
                "originalImage": image_url,
                "groundingImage": None,
                "groundingBoxes": [],
            },
            "executionTrace": {
                "task": f"[MOCK] {task_type.upper()} via Cloud GPU Dispatcher",
                "inputCount": "1 image",
                "modelsUsed": ["MOCK — Cloud GPU not active"],
                "steps": [
                    "Image receipt by FastAPI backend",
                    "Cloud GPU dispatcher invoked",
                    f"CLOUD_GPU_ENDPOINT='{CLOUD_GPU_ENDPOINT or 'NOT SET'}' — using mock",
                    "Structured mock VQA result returned",
                    "Result logged to MongoDB (if available)",
                    "Result cached in Redis (if available)",
                ],
                "parameters": {
                    "Mode": "MOCK",
                    "task_id": task_id,
                    "Tip": "Set CLOUD_GPU_ENDPOINT in .env for real GPU inference",
                },
                "duration": f"{elapsed:.2f}s",
                "status": "mock",
            },
            "modelDetails": [{"name": "MOCK", "confidence": str(confidence_score),
                              "inputType": "Optical", "role": "Mock VQA Engine"}],
            "fusionStrategy": None,
            "_isMock": True,
        }


# ---------------------------------------------------------------------------
# Cloud dispatch — main public function
# ---------------------------------------------------------------------------

def dispatch(
    image_url: Optional[str],
    query: str,
    task_type: str,
    task_id: Optional[str] = None,
    image2_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Dispatch an inference request to the Cloud GPU endpoint.

    If CLOUD_GPU_ENDPOINT is not set or the endpoint is unreachable,
    returns a structured mock response so the frontend works immediately.

    Args:
        image_url:   Pre-signed MinIO URL or base64 data URL of primary image.
        query:       Natural language query string.
        task_type:   One of: vqa | change | sar | describe | grounding.
        task_id:     Optional task UUID (generated if not provided).
        image2_url:  Optional secondary image URL for change/SAR tasks.

    Returns:
        Full result dict matching the /api/v1/analyze response contract.
    """
    task_id  = task_id or str(uuid.uuid4())
    start    = time.time()
    endpoint = _get_endpoint()

    # --- Check if cloud endpoint is configured ---
    if not endpoint:
        logger.info(
            "[CloudDispatcher] CLOUD_GPU_ENDPOINT not set — returning mock response "
            "(task_id=%s, task_type=%s)", task_id, task_type
        )
        return _build_mock_response(task_type, query, task_id, image_url, time.time() - start)

    # --- Attempt real cloud dispatch ---
    payload = {
        "image_url":  image_url,
        "image2_url": image2_url,
        "query":      query,
        "task_type":  task_type,
        "task_id":    task_id,
    }

    logger.info(
        "[CloudDispatcher] Dispatching to %s (task_id=%s, task_type=%s)",
        endpoint, task_id, task_type
    )

    try:
        import httpx  # type: ignore
        with httpx.Client(timeout=CLOUD_TIMEOUT_S) as http:
            response = http.post(
                f"{endpoint}/infer",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            result = response.json()
            elapsed = time.time() - start
            logger.info(
                "[CloudDispatcher] Cloud GPU response received in %.2fs (task_id=%s)",
                elapsed, task_id
            )
            return result

    except ImportError:
        logger.warning("[CloudDispatcher] 'httpx' not installed. Run: pip install httpx")
    except Exception as exc:
        logger.warning(
            "[CloudDispatcher] Cloud GPU request failed (%s) — falling back to mock.", exc
        )

    # Fallback to mock on any error
    elapsed = time.time() - start
    return _build_mock_response(task_type, query, task_id, image_url, elapsed)


def is_cloud_active() -> bool:
    """Return True if CLOUD_GPU_ENDPOINT is configured in the environment."""
    return bool(_get_endpoint())

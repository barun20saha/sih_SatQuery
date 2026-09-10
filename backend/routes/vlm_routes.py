import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.model_manager import ModelManager
from backend.utils.image_processing import (
    validate_and_load_image,
    image_to_base64_data_url,
    create_grounding_overlay_data_url
)

router = APIRouter(prefix="/api", tags=["Visual Language Models"])

@router.post("/caption")
async def caption_endpoint(
    image: UploadFile = File(..., description="Satellite image to caption")
):
    """
    Stand-alone Satellite Image Captioning endpoint.
    Uses Qwen2-VL-2B-Instruct + satquery_model_bundle LoRA adapter.
    """
    start_time = time.time()
    manager = ModelManager.get_instance()
    service = manager.vlm_service
    if not service:
        raise HTTPException(status_code=503, detail="VLM Service is not available.")

    img = await validate_and_load_image(image)
    res = service.caption(img)
    elapsed = round(time.time() - start_time, 2)

    return {
        "status": "success",
        "task": "caption",
        "caption": res["answer"],
        "confidence": res["confidence"],
        "duration_seconds": elapsed,
        "evidence": {
            "type": "describe",
            "originalImage": image_to_base64_data_url(img),
            "groundingBoxes": []
        }
    }

@router.post("/vqa")
async def vqa_endpoint(
    image: UploadFile = File(..., description="Satellite image"),
    question: str = Form(..., description="Question regarding the satellite imagery")
):
    """
    Stand-alone Visual Question Answering (VQA) endpoint.
    """
    start_time = time.time()
    manager = ModelManager.get_instance()
    service = manager.vlm_service
    if not service:
        raise HTTPException(status_code=503, detail="VLM Service is not available.")

    img = await validate_and_load_image(image)
    res = service.vqa(img, question)
    elapsed = round(time.time() - start_time, 2)

    boxes = res.get("boxes", [])
    grounding_overlay = create_grounding_overlay_data_url(img, boxes) if boxes else None

    return {
        "status": "success",
        "task": "vqa",
        "question": question,
        "answer": res["answer"],
        "confidence": res["confidence"],
        "boxes": boxes,
        "duration_seconds": elapsed,
        "evidence": {
            "type": "vqa",
            "originalImage": image_to_base64_data_url(img),
            "groundingImage": grounding_overlay,
            "groundingBoxes": boxes,
        }
    }

@router.post("/grounding")
async def grounding_endpoint(
    image: UploadFile = File(..., description="Satellite image"),
    query: str = Form(..., description="Object or feature to ground/locate")
):
    """
    Stand-alone Phrase Grounding and Localization endpoint.
    """
    start_time = time.time()
    manager = ModelManager.get_instance()
    service = manager.vlm_service
    if not service:
        raise HTTPException(status_code=503, detail="VLM Service is not available.")

    img = await validate_and_load_image(image)
    res = service.grounding(img, query)
    elapsed = round(time.time() - start_time, 2)

    boxes = res.get("boxes", [])
    grounding_overlay = create_grounding_overlay_data_url(img, boxes) if boxes else None

    return {
        "status": "success",
        "task": "grounding",
        "target": query,
        "answer": res["answer"],
        "confidence": res["confidence"],
        "boxes": boxes,
        "duration_seconds": elapsed,
        "evidence": {
            "type": "vqa",
            "originalImage": image_to_base64_data_url(img),
            "groundingImage": grounding_overlay,
            "groundingBoxes": boxes,
        }
    }

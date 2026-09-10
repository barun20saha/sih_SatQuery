import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.model_manager import ModelManager
from backend.utils.image_processing import (
    validate_and_load_image,
    image_to_base64_data_url,
    create_change_map_data_url
)

router = APIRouter(prefix="/api", tags=["Change Detection"])

@router.post("/optical-change")
async def optical_change_endpoint(
    before_image: UploadFile = File(..., description="Satellite image before change (T1)"),
    after_image: UploadFile = File(..., description="Satellite image after change (T2)"),
    threshold: float = Form(0.5)
):
    """
    Stand-alone Optical Change Detection API.
    Uses change_detection_model_final.pth Siamese CNN.
    """
    start_time = time.time()
    manager = ModelManager.get_instance()
    service = manager.optical_change_service
    if not service:
        raise HTTPException(status_code=503, detail="Optical Change Detection model is not available.")

    img1 = await validate_and_load_image(before_image)
    img2 = await validate_and_load_image(after_image)

    result = service.predict(img1, img2, threshold=threshold)
    elapsed = round(time.time() - start_time, 2)

    # Generate visual evidence
    before_url = image_to_base64_data_url(img1)
    after_url = image_to_base64_data_url(img2)
    change_map_url = create_change_map_data_url(result["probability_map"])

    return {
        "status": "success",
        "task": "Optical Change Detection",
        "change_percentage": result["change_percentage"],
        "confidence": result["confidence"],
        "duration_seconds": elapsed,
        "evidence": {
            "type": "change",
            "beforeImage": before_url,
            "afterImage": after_url,
            "changeMap": change_map_url,
            "beforeLabel": "Before (T1)",
            "afterLabel": "After (T2)",
        }
    }

@router.post("/optical-sar-change")
async def optical_sar_change_endpoint(
    optical_image: UploadFile = File(..., description="Optical satellite image"),
    sar_image: UploadFile = File(..., description="SAR satellite image"),
    threshold: float = Form(0.5)
):
    """
    Stand-alone Optical + SAR Change Detection & Multi-modal Fusion API.
    Uses optical_sar_change_detection.pth dual-encoder network.
    """
    start_time = time.time()
    manager = ModelManager.get_instance()
    service = manager.optical_sar_service
    if not service:
        raise HTTPException(status_code=503, detail="Optical + SAR Change model is not available.")

    opt_img = await validate_and_load_image(optical_image)
    sar_img = await validate_and_load_image(sar_image)

    result = service.predict(opt_img, sar_img, threshold=threshold)
    elapsed = round(time.time() - start_time, 2)

    opt_url = image_to_base64_data_url(opt_img)
    sar_url = image_to_base64_data_url(sar_img.convert("RGB"))
    fusion_map_url = create_change_map_data_url(result["probability_map"])

    return {
        "status": "success",
        "task": "Optical + SAR Change Detection",
        "change_percentage": result["change_percentage"],
        "confidence": result["confidence"],
        "duration_seconds": elapsed,
        "evidence": {
            "type": "sar",
            "opticalImage": opt_url,
            "sarImage": sar_url,
            "fusionImage": fusion_map_url,
            "opticalAnalysisImage": fusion_map_url,
        }
    }

import torch
from typing import Dict, Any
from backend.config import (
    OPTICAL_CHANGE_MODEL_PATH,
    OPTICAL_SAR_MODEL_PATH,
    VLM_MODEL_BUNDLE_PATH,
    VLM_BASE_MODEL_NAME,
    FORCE_CPU
)
from backend.models.optical_change import OpticalChangeInferenceService
from backend.models.optical_sar import OpticalSARInferenceService
from backend.models.vlm_service import VLMService

class ModelManager:
    _instance = None

    def __init__(self):
        if FORCE_CPU:
            self.device = "cpu"
        else:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"

        print(f"[ModelManager] Initializing models on device: {self.device}")
        
        # 1. Optical Change Model
        self.optical_change_service = None
        try:
            self.optical_change_service = OpticalChangeInferenceService(
                model_path=OPTICAL_CHANGE_MODEL_PATH,
                device=self.device
            )
        except Exception as e:
            print(f"[ModelManager] Error initializing Optical Change Model: {e}")

        # 2. Optical + SAR Change Model
        self.optical_sar_service = None
        try:
            self.optical_sar_service = OpticalSARInferenceService(
                model_path=OPTICAL_SAR_MODEL_PATH,
                device=self.device
            )
        except Exception as e:
            print(f"[ModelManager] Error initializing Optical+SAR Model: {e}")

        # 3. VLM Model (Qwen2-VL + LoRA)
        self.vlm_service = None
        try:
            self.vlm_service = VLMService(
                bundle_path=VLM_MODEL_BUNDLE_PATH,
                base_model_name=VLM_BASE_MODEL_NAME,
                device=self.device
            )
        except Exception as e:
            print(f"[ModelManager] Error initializing VLM Service: {e}")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def health_status(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "device": self.device,
            "cuda_available": torch.cuda.is_available(),
            "models": {
                "optical_change": self.optical_change_service is not None,
                "optical_sar": self.optical_sar_service is not None,
                "vlm_service": self.vlm_service is not None,
                "vlm_base_loaded": getattr(self.vlm_service, "is_loaded", False) if self.vlm_service else False,
            }
        }

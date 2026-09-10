import sys
from pathlib import Path
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backend.models.optical_change import OpticalChangeInferenceService
from backend.models.optical_sar import OpticalSARInferenceService
from backend.config import OPTICAL_CHANGE_MODEL_PATH, OPTICAL_SAR_MODEL_PATH

def main():
    print("=== 1. Checking CUDA ===")
    cuda_avail = torch.cuda.is_available()
    print(f"CUDA Available: {cuda_avail}")
    if cuda_avail:
        print(f"Device: {torch.cuda.get_device_name(0)}")
    device = "cuda" if cuda_avail else "cpu"

    print("\n=== 2. Testing Optical Change Detector ===")
    opt_service = OpticalChangeInferenceService(OPTICAL_CHANGE_MODEL_PATH, device=device)
    img1 = Image.new("RGB", (512, 512), color=(100, 150, 200))
    img2 = Image.new("RGB", (512, 512), color=(120, 160, 190))
    res_opt = opt_service.predict(img1, img2)
    print("Optical Change Model: SUCCESS!")
    print(f"  Change %: {res_opt['change_percentage']}")
    print(f"  Confidence: {res_opt['confidence']}")
    print(f"  Probability Map Shape: {res_opt['probability_map'].shape}")

    print("\n=== 3. Testing Optical + SAR Detector ===")
    sar_service = OpticalSARInferenceService(OPTICAL_SAR_MODEL_PATH, device=device)
    sar_img = Image.new("L", (512, 512), color=128)
    res_sar = sar_service.predict(img1, sar_img)
    print("Optical + SAR Model: SUCCESS!")
    print(f"  Change %: {res_sar['change_percentage']}")
    print(f"  Confidence: {res_sar['confidence']}")
    print(f"  Probability Map Shape: {res_sar['probability_map'].shape}")

if __name__ == "__main__":
    main()

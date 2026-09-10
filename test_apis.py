import io
import requests
from PIL import Image

BASE_URL = "http://127.0.0.1:8080"

def create_dummy_image(color=(100, 150, 200), size=(256, 256), mode="RGB"):
    img = Image.new(mode, size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

def test_health():
    print("\n[TEST 1] GET /api/health")
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    print("  Response:", data)
    assert data["status"] == "healthy"
    print("  PASS: Health check successful!")

def test_optical_change():
    print("\n[TEST 2] POST /api/optical-change")
    img1 = create_dummy_image(color=(50, 100, 150))
    img2 = create_dummy_image(color=(80, 140, 190))
    files = {
        "before_image": ("t1.png", img1, "image/png"),
        "after_image": ("t2.png", img2, "image/png")
    }
    res = requests.post(f"{BASE_URL}/api/optical-change", files=files, data={"threshold": 0.5})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    print("  Change %:", data["change_percentage"])
    print("  Confidence:", data["confidence"])
    print("  ChangeMap URL length:", len(data["evidence"]["changeMap"]))
    assert "changeMap" in data["evidence"]
    print("  PASS: Optical change detection successful!")

def test_optical_sar_change():
    print("\n[TEST 3] POST /api/optical-sar-change")
    opt_img = create_dummy_image(color=(30, 90, 140))
    sar_img = create_dummy_image(color=100, mode="L")
    files = {
        "optical_image": ("opt.png", opt_img, "image/png"),
        "sar_image": ("sar.png", sar_img, "image/png")
    }
    res = requests.post(f"{BASE_URL}/api/optical-sar-change", files=files, data={"threshold": 0.5})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    print("  Change %:", data["change_percentage"])
    print("  Confidence:", data["confidence"])
    assert "fusionImage" in data["evidence"]
    print("  PASS: Optical + SAR change detection successful!")

def test_caption():
    print("\n[TEST 4] POST /api/caption")
    img = create_dummy_image(color=(70, 120, 80))
    files = {"image": ("sat.png", img, "image/png")}
    res = requests.post(f"{BASE_URL}/api/caption", files=files)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    print("  Caption:", data["caption"])
    print("  Confidence:", data["confidence"])
    print("  PASS: Captioning successful!")

def test_vqa():
    print("\n[TEST 5] POST /api/vqa")
    img = create_dummy_image(color=(120, 70, 80))
    files = {"image": ("sat.png", img, "image/png")}
    res = requests.post(f"{BASE_URL}/api/vqa", files=files, data={"question": "Are there any buildings in the image?"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    print("  Question:", data["question"])
    print("  Answer:", data["answer"])
    print("  PASS: VQA successful!")

def test_grounding():
    print("\n[TEST 6] POST /api/grounding")
    img = create_dummy_image(color=(60, 140, 100))
    files = {"image": ("sat.png", img, "image/png")}
    res = requests.post(f"{BASE_URL}/api/grounding", files=files, data={"query": "water body"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    print("  Target:", data["target"])
    print("  Answer:", data["answer"])
    print("  Grounding Boxes:", data["boxes"])
    print("  PASS: Grounding successful!")

def test_unified_analyze():
    print("\n[TEST 7] POST /api/analyze (Unified Router)")
    
    # 7a. VQA / Describe route
    img1 = create_dummy_image(color=(100, 110, 120))
    res = requests.post(
        f"{BASE_URL}/api/analyze",
        files={"image1": ("img1.png", img1, "image/png")},
        data={"query": "Describe the terrain and land cover."}
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    d1 = res.json()
    print("  Unified Describe route type:", d1["queryType"])
    assert d1["queryType"] in ("describe", "vqa")

    # 7b. Change route with 2 images
    img1 = create_dummy_image(color=(100, 110, 120))
    img2 = create_dummy_image(color=(140, 120, 100))
    res = requests.post(
        f"{BASE_URL}/api/analyze",
        files={
            "image1": ("img1.png", img1, "image/png"),
            "image2": ("img2.png", img2, "image/png")
        },
        data={"query": "Detect changes between before and after images."}
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    d2 = res.json()
    print("  Unified Change route type:", d2["queryType"])
    assert d2["queryType"] == "change"
    assert "changeMap" in d2["evidence"]

    # 7c. SAR fusion route
    img_sar1 = create_dummy_image(color=(100, 110, 120))
    img_sar2 = create_dummy_image(color=140, mode="L")
    res = requests.post(
        f"{BASE_URL}/api/analyze",
        files={
            "image1": ("img1.png", img_sar1, "image/png"),
            "image2": ("sar.png", img_sar2, "image/png")
        },
        data={"query": "Perform optical and SAR fusion analysis."}
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    d3 = res.json()
    print("  Unified SAR route type:", d3["queryType"])
    assert d3["queryType"] == "sar"
    assert "fusionImage" in d3["evidence"]

    print("  PASS: Unified /api/analyze router successful for all modalities!")

if __name__ == "__main__":
    print("==================================================")
    print("  Testing All SatQuery API Endpoints Standalone  ")
    print("==================================================")
    test_health()
    test_optical_change()
    test_optical_sar_change()
    test_caption()
    test_vqa()
    test_grounding()
    test_unified_analyze()
    print("\n==================================================")
    print("  ALL 7 API TESTS PASSED WITH 100% SUCCESS!       ")
    print("==================================================")

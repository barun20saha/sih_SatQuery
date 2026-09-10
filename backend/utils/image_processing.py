import io
import base64
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from fastapi import UploadFile, HTTPException

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/tiff", "image/geotiff",
    "image/webp", "image/bmp", "application/octet-stream"
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".bmp"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

async def validate_and_load_image(file: UploadFile) -> Image.Image:
    """
    Validates uploaded file MIME type, extension, size, and returns a PIL Image.
    """
    filename = file.filename or "unknown"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PNG, JPEG, TIFF/GeoTIFF, WebP."
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail=f"File '{filename}' is empty.")
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' exceeds maximum allowed size of 50 MB."
        )

    try:
        image = Image.open(io.BytesIO(content))
        image.load() # Verify integrity
        return image
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse image '{filename}'. File may be corrupt. Error: {str(e)}"
        )

def image_to_base64_data_url(img: Image.Image, format: str = "PNG") -> str:
    """Converts a PIL Image to a base64 data URL."""
    buffered = io.BytesIO()
    img.save(buffered, format=format)
    encoded = base64.b64encode(buffered.getvalue()).decode("ascii")
    mime = "image/png" if format.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{encoded}"

def create_change_map_data_url(prob_map: np.ndarray, width: int = 640, height: int = 400) -> str:
    """
    Generates a colorized change detection map.
    Unchanged pixels: dark navy (#1a1a2e).
    Changed pixels: red gradient based on change probability.
    """
    # Resize prob_map to target width, height
    p_img = Image.fromarray((prob_map * 255).astype(np.uint8)).resize((width, height), resample=Image.BILINEAR)
    p_arr = np.array(p_img, dtype=np.float32) / 255.0

    # Base dark background: R=26, G=26, B=46 (#1a1a2e)
    rgb = np.zeros((height, width, 3), dtype=np.uint8)
    rgb[:, :, 0] = 26
    rgb[:, :, 1] = 26
    rgb[:, :, 2] = 46

    # Blend red: #E74C3C (231, 76, 60) where change detected
    mask = p_arr > 0.1
    alpha = np.clip((p_arr - 0.1) / 0.9, 0, 1)

    for c, val in enumerate([231, 76, 60]):
        rgb[:, :, c] = (rgb[:, :, c] * (1 - alpha) + val * alpha).astype(np.uint8)

    out_img = Image.fromarray(rgb)
    return image_to_base64_data_url(out_img, "PNG")

def create_grounding_overlay_data_url(base_img: Image.Image, boxes: list) -> str:
    """
    Draws colored bounding boxes with labels on top of the base image.
    """
    img = base_img.convert("RGBA").copy()
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for box in boxes:
        bx = int(box["x"] * w)
        by = int(box["y"] * h)
        bw = int(box["w"] * w)
        bh = int(box["h"] * h)
        color = box.get("color", "#0066CC")
        
        # Parse hex color
        hex_val = color.lstrip("#")
        rgb = tuple(int(hex_val[i:i+2], 16) for i in (0, 2, 4))
        fill_color = (*rgb, 50) # 20% alpha
        border_color = (*rgb, 255)

        # Draw filled rect and outline
        draw.rectangle([bx, by, bx + bw, by + bh], fill=fill_color, outline=border_color, width=max(2, int(w * 0.003)))

        # Label tag
        label = box.get("label", "Detection")
        tag_h = max(18, int(h * 0.035))
        draw.rectangle([bx, max(0, by - tag_h), bx + max(60, len(label) * 8), by], fill=border_color)
        draw.text((bx + 4, max(2, by - tag_h + 2)), label, fill=(255, 255, 255, 255))

    combined = Image.alpha_composite(img, overlay)
    return image_to_base64_data_url(combined.convert("RGB"), "PNG")

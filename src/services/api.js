// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://unpleased-spinach-repeater.ngrok-free.dev';
const IS_MOCK = import.meta.env.VITE_MOCK_MODE === 'true';

export const analyzeSatelliteRaster = async (arg1, arg2) => {
  let userQuery = '';
  let imageFiles = null;

  if (typeof arg1 === 'string') {
    userQuery = arg1;
    imageFiles = arg2;
  } else if (typeof arg2 === 'string') {
    userQuery = arg2;
    imageFiles = arg1;
  } else {
    imageFiles = arg1;
  }

  if (IS_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const q = (userQuery || '').toLowerCase();

    // Default: Forest / Delhi Ridge
    let primaryClass = "Broad-leaved forest";
    let macroGroup = "Forest & Vegetation";
    let explanation = "Dense natural forest canopy detected with high infrared spectral signature across optical bands.";
    let bounds = [28.56, 77.16, 28.59, 77.19];
    let center = [28.575, 77.175];

    // Dynamic Routing
    if (q.includes("change") || q.includes("different") || q.includes("between") || q.includes("compare")) {
      primaryClass = "Forest Degradation / Land Cover Change";
      macroGroup = "Change Detection";
      explanation = "Comparative change detection indicates a 14.8% decrease in forest density, with noticeable soil exposure along the eastern quadrant.";
      bounds = [28.56, 77.16, 28.59, 77.19];
      center = [28.575, 77.175];
    } else if (q.includes("water") || q.includes("river") || q.includes("flood") || q.includes("lake") || q.includes("stream")) {
      primaryClass = "Water Body / Hydrological Feature";
      macroGroup = "Water Resources";
      explanation = "Hydrological assessment detects high surface moisture and low NIR reflectance. River boundaries remain intact with minor silt deposits near the bank curve.";
      bounds = [28.68, 77.22, 28.72, 77.26];
      center = [28.70, 77.24];
    } else if (q.includes("urban") || q.includes("building") || q.includes("structure") || q.includes("city") || q.includes("road")) {
      primaryClass = "Continuous Urban Fabric";
      macroGroup = "Built-up & Artificial";
      explanation = "High-density concrete structures and asphalt road networks identified across the central coordinate grid with high thermal emission signatures.";
      bounds = [28.625, 77.210, 28.638, 77.225];
      center = [28.6315, 77.2175];
    } else if (q.includes("agriculture") || q.includes("crop") || q.includes("farm") || q.includes("field")) {
      primaryClass = "Arable Land / Cropland";
      macroGroup = "Agricultural Surface";
      explanation = "Regular geometric field boundary patterns detected with high vegetation index (NDVI > 0.65), signifying healthy growing crops.";
      bounds = [28.75, 77.05, 28.79, 77.09];
      center = [28.77, 77.07];
    }

    return {
      status: "success",
      main_answer: explanation,
      explanation: explanation,
      primaryClass,
      macroGroup,
      confidence_score: 94.8,
      confidence_level: "Validated via Qwen2-VL multimodal spectral grounding",
      metadata: {
        crs: "EPSG:4326",
        resolution: [10.0, 10.0],
        channels: 3,
        bounds: bounds,
        center: center
      },
      executionTrace: [
        "1. Multi-spectral GeoTIFF ingested via Rasterio engine",
        "2. Dynamic min-max RGB channel normalization applied",
        "3. Multimodal 19-class feature grounding evaluated via Qwen2-VL"
      ]
    };
  }

  // Live Backend Pipeline
  try {
    const formData = new FormData();
    const filesArray = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
    
    filesArray.forEach((file) => {
      if (file) formData.append('files', file?.file ? file.file : file);
    });
    formData.append('prompt', userQuery || 'Describe this satellite image');

    const response = await fetch(`${BASE_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Remainder': 'true',
      },
      body: formData,
    });

    if (!response.ok) throw new Error(`Backend Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("❌ API Request Error:", error);
    return {
      status: "error",
      main_answer: `Could not reach backend at ${BASE_URL}. Verify FastAPI connection or set VITE_MOCK_MODE=true in .env`,
      metadata: { crs: "N/A", resolution: [0, 0], channels: 0, bounds: [28.61, 77.20, 28.63, 77.23] }
    };
  }
};

export const analyzeSatelliteImage = analyzeSatelliteRaster;
export default analyzeSatelliteRaster;
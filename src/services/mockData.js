/**
 * Mock data for SatQuery AI.
 * 
 * This module provides realistic mock responses for all four query types.
 * Replace api.js's MOCK_MODE flag to use real backend endpoints instead.
 * 
 * Response shape is the contract between frontend and backend:
 *   POST /api/analyze returns this exact structure.
 */

// --- Mock satellite image URLs (public domain / placeholder) ---
const MOCK_OPTICAL_URL  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Landsat8-WRS2-014028-20130706-img.jpg/640px-Landsat8-WRS2-014028-20130706-img.jpg';
const MOCK_SAR_URL      = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/SIR-C_image_of_the_Teotihuacan_pyramid_complex.jpg/640px-SIR-C_image_of_the_Teotihuacan_pyramid_complex.jpg';
const MOCK_BEFORE_URL   = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Landsat8-WRS2-014028-20130706-img.jpg/640px-Landsat8-WRS2-014028-20130706-img.jpg';
const MOCK_AFTER_URL    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg';

// --- Simulated processing delay (ms) ---
const MOCK_DELAY = 2800;

/**
 * Detects query type from natural language query string.
 * Used only in mock mode — real backend performs its own routing.
 */
export function detectQueryType(query = '', fileCount = 1) {
  const q = query.toLowerCase();
  if (q.includes('sar') || q.includes('radar') || q.includes('fusion') || q.includes('optical and sar')) return 'sar';
  if (q.includes('change') || q.includes('differ') || q.includes('before') || q.includes('after') || q.includes('temporal') || fileCount >= 2) return 'change';
  if (q.includes('where') || q.includes('locate') || q.includes('find') || q.includes('building') || q.includes('detect') || q.includes('ground')) return 'vqa';
  return 'describe';
}

/**
 * Generates a mock change map as a base64 data URL using Canvas.
 * In real mode, the backend returns a pre-generated change map image URL.
 */
export function generateMockChangeMap(width = 400, height = 300) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Dark base (unchanged areas)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Grid overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Red change blobs
    const changeAreas = [
      { x: 0.15, y: 0.10, w: 0.25, h: 0.20, opacity: 0.85 },
      { x: 0.55, y: 0.35, w: 0.18, h: 0.15, opacity: 0.75 },
      { x: 0.30, y: 0.60, w: 0.22, h: 0.18, opacity: 0.70 },
      { x: 0.70, y: 0.65, w: 0.15, h: 0.22, opacity: 0.80 },
    ];

    changeAreas.forEach(area => {
      const grd = ctx.createRadialGradient(
        (area.x + area.w / 2) * width, (area.y + area.h / 2) * height, 0,
        (area.x + area.w / 2) * width, (area.y + area.h / 2) * height,
        Math.max(area.w * width, area.h * height) / 2
      );
      grd.addColorStop(0, `rgba(231, 76, 60, ${area.opacity})`);
      grd.addColorStop(1, `rgba(231, 76, 60, 0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(area.x * width, area.y * height, area.w * width, area.h * height);
    });

    // Text label
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px monospace';
    ctx.fillText('CHANGE DETECTION MAP', 10, height - 12);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Generates a mock grounding overlay (bounding boxes on image).
 * Returns { overlayDataUrl, boxes } where boxes is array of { label, x, y, w, h }.
 */
export function generateMockGroundingOverlay(sourceImageUrl, width = 400, height = 300) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Semi-transparent overlay base
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, width, height);

    const boxes = [
      { label: 'Built-up Area', x: 0.10, y: 0.08, w: 0.30, h: 0.25, color: '#0066CC' },
      { label: 'Vegetation',    x: 0.50, y: 0.20, w: 0.25, h: 0.30, color: '#27AE60' },
      { label: 'Water Body',    x: 0.20, y: 0.60, w: 0.20, h: 0.20, color: '#00BFFF' },
    ];

    boxes.forEach(box => {
      const px = box.x * width, py = box.y * height;
      const pw = box.w * width, ph = box.h * height;

      // Box
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);

      // Fill
      ctx.fillStyle = box.color + '22';
      ctx.fillRect(px, py, pw, ph);

      // Label background
      const labelW = ctx.measureText(box.label).width + 10;
      ctx.fillStyle = box.color;
      ctx.fillRect(px, py - 18, labelW, 18);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(box.label, px + 5, py - 5);
    });

    return { overlayDataUrl: canvas.toDataURL('image/png'), boxes };
  } catch {
    return { overlayDataUrl: null, boxes: [] };
  }
}

// --- Mock Response Builders ---

function mockDescribeResponse(fileCount) {
  return {
    queryType: 'describe',
    answer: 'The satellite image shows a mixed land-use area featuring urban settlements in the northwestern quadrant, agricultural fields in the central and eastern regions, and a network of roads connecting the zones. Vegetation is dense along river corridors, while bare soil patches indicate recent construction or seasonal crop cycles.',
    confidence: { score: 0.82, level: 'high', explanation: 'Based on model agreement (3/3 models), high image resolution, and consistent feature detection across spectral bands.' },
    evidence: {
      type: 'describe',
      originalImage: MOCK_OPTICAL_URL,
      groundingImage: null,
      groundingBoxes: [],
    },
    executionTrace: {
      task: 'Single-Image Description',
      inputCount: `${fileCount} GeoTIFF file`,
      modelsUsed: ['RS-VLM (GeoChat)', 'Scene Classifier'],
      steps: ['Image validation', 'GeoTIFF metadata extraction', 'Scene classification', 'VLM caption generation', 'Answer synthesis'],
      parameters: { 'Image Preprocessing': 'Normalized', 'Spectral Bands': 'RGB', 'VLM Prompt': 'Descriptive' },
      duration: '1.8s',
      status: 'completed',
    },
    modelDetails: [
      { name: 'RS-VLM (GeoChat)', confidence: '0.84', inputType: 'Optical', role: 'Primary Captioner' },
      { name: 'Scene Classifier (ResNet-50)', confidence: '0.79', inputType: 'Optical', role: 'Context Support' },
    ],
    fusionStrategy: null,
  };
}

function mockVQAResponse(fileCount) {
  return {
    queryType: 'vqa',
    answer: 'Building clusters are concentrated in the northwestern quadrant (highlighted blue) and along the central road corridor. Three distinct built-up zones are identified: a dense residential area (upper-left), a commercial strip (center-right), and an industrial block (lower boundary). No significant structures detected in the southeastern agricultural zone.',
    confidence: { score: 0.89, level: 'high', explanation: 'Based on high model agreement and clear spectral signatures for built-up areas. Minor uncertainty at building boundaries due to shadow overlap.' },
    evidence: {
      type: 'vqa',
      originalImage: MOCK_OPTICAL_URL,
      groundingImage: '__CANVAS__',
      groundingBoxes: [
        { label: 'Built-up Area', x: 0.10, y: 0.08, w: 0.30, h: 0.25, color: '#0066CC' },
        { label: 'Vegetation',    x: 0.50, y: 0.20, w: 0.25, h: 0.30, color: '#27AE60' },
        { label: 'Water Body',    x: 0.20, y: 0.60, w: 0.20, h: 0.20, color: '#00BFFF' },
      ],
    },
    executionTrace: {
      task: 'Visual Question Answering + Grounding',
      inputCount: `${fileCount} GeoTIFF file`,
      modelsUsed: ['RS-VLM (GeoChat)', 'Grounding DINO', 'SAM (Segment Anything)'],
      steps: ['Image validation', 'GeoTIFF metadata extraction', 'Object detection', 'Region grounding', 'Bounding box generation', 'VLM answer synthesis'],
      parameters: { 'Detection Threshold': '0.45', 'Grounding Mode': 'Phrase-guided', 'NMS IoU': '0.5' },
      duration: '2.4s',
      status: 'completed',
    },
    modelDetails: [
      { name: 'RS-VLM (GeoChat)', confidence: '0.92', inputType: 'Optical', role: 'VQA Answerer' },
      { name: 'Grounding DINO', confidence: '0.88', inputType: 'Optical', role: 'Object Localizer' },
      { name: 'SAM (Segment Anything)', confidence: '0.85', inputType: 'Optical', role: 'Mask Refiner' },
    ],
    fusionStrategy: null,
  };
}

function mockChangeResponse() {
  return {
    queryType: 'change',
    answer: 'Significant land-cover changes detected between the two images. Built-up area expanded by approximately 18% in the northern zone, with new construction evident in grid patterns. Vegetation cover decreased by 12% in the central region, likely due to land clearing for infrastructure. Water body extent remains stable. Total changed area: ~34 km².',
    confidence: { score: 0.87, level: 'high', explanation: 'Based on multi-temporal alignment quality, model ensemble agreement (4/4), and clear radiometric differences between acquisition dates.' },
    evidence: {
      type: 'change',
      beforeImage: MOCK_BEFORE_URL,
      afterImage: MOCK_AFTER_URL,
      changeMap: '__CANVAS_CHANGE__',
      beforeLabel: 'Before (T₁)',
      afterLabel: 'After (T₂)',
    },
    executionTrace: {
      task: 'Bi-temporal Change Analysis',
      inputCount: '2 GeoTIFF files',
      modelsUsed: ['Change Detector (BIT)', 'RS-VLM (GeoChat)', 'Temporal Aligner'],
      steps: ['Image validation', 'GeoTIFF metadata extraction', 'Temporal alignment', 'Co-registration', 'Change detection inference', 'Change map generation', 'Result explanation'],
      parameters: { 'Registration': 'Enabled (ECC)', 'Change Threshold': '0.35', 'Fusion Mode': 'Decision-level', 'Min Change Area': '500 m²' },
      duration: '3.2s',
      status: 'completed',
    },
    modelDetails: [
      { name: 'Change Detector (BIT)', confidence: '0.89', inputType: 'Optical × 2', role: 'Change Mapper' },
      { name: 'RS-VLM (GeoChat)', confidence: '0.85', inputType: 'Optical', role: 'Change Explainer' },
      { name: 'Temporal Aligner (ECC)', confidence: '0.94', inputType: 'Optical × 2', role: 'Image Registration' },
    ],
    fusionStrategy: 'Decision-level fusion of change detector outputs',
  };
}

function mockSARResponse() {
  return {
    queryType: 'sar',
    answer: 'Fusion of optical and SAR data confirms the presence of water bodies in the central and southeastern regions. The optical analysis identifies spectral water signatures, while SAR backscatter confirms low-roughness smooth surfaces consistent with calm water. Fused result shows 3 distinct water bodies with a combined area of approximately 142 km². Urban areas show high coherence in SAR with double-bounce scattering signatures.',
    confidence: { score: 0.91, level: 'high', explanation: 'Optical and SAR modalities show high cross-modal agreement (91% overlap). Fusion improves robustness over single-modality analysis.' },
    evidence: {
      type: 'sar',
      opticalImage: MOCK_OPTICAL_URL,
      sarImage: MOCK_SAR_URL,
      opticalAnalysisImage: '__CANVAS_OPTICAL__',
      fusionImage: '__CANVAS_FUSION__',
    },
    executionTrace: {
      task: 'Optical + SAR Multi-modal Fusion',
      inputCount: '2 files (1 Optical + 1 SAR)',
      modelsUsed: ['SAR Interpreter', 'Optical Analyzer (RS-VLM)', 'Fusion Module'],
      steps: ['Image validation', 'Modality classification', 'SAR preprocessing (speckle filter)', 'Optical analysis', 'SAR interpretation', 'Feature-level fusion', 'Answer synthesis'],
      parameters: { 'SAR Filter': 'Lee (5×5)', 'Fusion Strategy': 'Feature-level', 'Cross-modal Weight': '0.5 / 0.5', 'Band Combination': 'RGB + VV + VH' },
      duration: '4.1s',
      status: 'completed',
    },
    modelDetails: [
      { name: 'RS-VLM (GeoChat)', confidence: '0.88', inputType: 'Optical', role: 'Optical Analyzer' },
      { name: 'SAR-VLM (SARChat)', confidence: '0.90', inputType: 'SAR', role: 'SAR Interpreter' },
      { name: 'Fusion Module (DeepFuse)', confidence: '0.91', inputType: 'Optical + SAR', role: 'Modal Fusion' },
    ],
    fusionStrategy: 'Feature-level fusion (concatenated CNN features from both modalities)',
  };
}

function mockErrorResponse() {
  return {
    queryType: 'error',
    error: true,
    errorTitle: 'Unable to Process Query',
    errorMessage: 'Insufficient image resolution to perform the requested analysis. The uploaded image has a ground sampling distance (GSD) > 30m, which is below the minimum threshold for building-level detection.',
    suggestion: 'Try uploading a higher-resolution image (GSD ≤ 10m recommended) or rephrase your question for coarser-scale analysis.',
    executionTrace: {
      task: 'Visual Question Answering',
      inputCount: '1 file',
      modelsUsed: ['Image Validator', 'Quality Checker'],
      steps: ['Image validation', 'Resolution check — FAILED (GSD: 35m, minimum: 10m)'],
      parameters: { 'Min GSD': '10m', 'Detected GSD': '35m' },
      duration: '0.3s',
      status: 'failed',
    },
  };
}

/**
 * Main mock response generator.
 * Detects query type and returns the appropriate mock response after a delay.
 */
export async function getMockResponse(files = [], query = '') {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

  const fileCount = files.length;
  const queryType = detectQueryType(query, fileCount);

  // Simulate occasional error (for testing error page) - triggered by "error" in query
  if (query.toLowerCase().includes('error') || query.toLowerCase().includes('fail')) {
    return mockErrorResponse();
  }

  switch (queryType) {
    case 'sar':    return mockSARResponse();
    case 'change': return mockChangeResponse();
    case 'vqa':    return mockVQAResponse(fileCount);
    default:       return mockDescribeResponse(fileCount);
  }
}

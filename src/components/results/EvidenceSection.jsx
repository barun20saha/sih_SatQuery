import { useEffect, useRef } from 'react';
import Card from '../common/Card';
import { generateMockChangeMap, generateMockGroundingOverlay } from '../../services/mockData';

/* ---------- helpers ---------- */

function ImageFrame({ src, caption, isCanvas = false, canvasRef }) {
  return (
    <div className="img-frame">
      {isCanvas
        ? <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        : <img src={src} alt={caption} loading="lazy" />
      }
      {caption && <div className="img-frame__caption">{caption}</div>}
    </div>
  );
}

/* ---------- layout variants ---------- */

function DescribeLayout({ evidence }) {
  const { originalImage } = evidence;
  return (
    <div className="evidence-grid evidence-grid--2col">
      <div className="img-frame">
        <img src={originalImage} alt="Original satellite image" loading="lazy" />
        <div className="img-frame__caption">Original Image</div>
      </div>
      <div className="img-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
          <p style={{ fontSize: 13 }}>Description only — no spatial grounding</p>
        </div>
      </div>
    </div>
  );
}

function VQALayout({ evidence }) {
  const { originalImage, groundingBoxes = [] } = evidence;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const w = canvas.width;
      const h = canvas.height;

      groundingBoxes.forEach(box => {
        const px = box.x * w, py = box.y * h;
        const pw = box.w * w, ph = box.h * h;

        ctx.strokeStyle = box.color || '#0066CC';
        ctx.lineWidth = Math.max(2, w * 0.004);
        ctx.strokeRect(px, py, pw, ph);

        ctx.fillStyle = (box.color || '#0066CC') + '28';
        ctx.fillRect(px, py, pw, ph);

        const labelW = ctx.measureText(box.label).width + 10;
        ctx.fillStyle = box.color || '#0066CC';
        ctx.fillRect(px, py - 20, labelW, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, w * 0.018)}px Inter, sans-serif`;
        ctx.fillText(box.label, px + 5, py - 6);
      });
    };
    img.onerror = () => {
      // Fallback: generate pure canvas grounding
      canvas.width = 640; canvas.height = 400;
      const { overlayDataUrl } = generateMockGroundingOverlay(null, 640, 400);
      if (overlayDataUrl) {
        const ovrImg = new Image();
        ovrImg.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#2a2a3a';
          ctx.fillRect(0, 0, 640, 400);
          ctx.drawImage(ovrImg, 0, 0);
        };
        ovrImg.src = overlayDataUrl;
      }
    };
    img.src = originalImage;
  }, [originalImage, groundingBoxes]);

  return (
    <>
      <div className="evidence-grid evidence-grid--2col">
        <div className="img-frame">
          <img src={originalImage} alt="Original satellite image" loading="lazy" />
          <div className="img-frame__caption">Original Image</div>
        </div>
        <div className="img-frame">
          <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
          <div className="img-frame__caption">Highlighted Regions</div>
        </div>
      </div>
      {groundingBoxes.length > 0 && (
        <div className="evidence-legend" style={{ marginTop: '12px' }}>
          {groundingBoxes.map(box => (
            <div key={box.label} className="evidence-legend__item">
              <span className="legend-dot" style={{ background: box.color }} />
              {box.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ChangeLayout({ evidence }) {
  const { beforeImage, afterImage, beforeLabel, afterLabel } = evidence;
  const changeMapRef = useRef(null);

  useEffect(() => {
    const canvas = changeMapRef.current;
    if (!canvas) return;
    canvas.width = 640; canvas.height = 400;
    const dataUrl = generateMockChangeMap(640, 400);
    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = dataUrl;
    }
  }, []);

  return (
    <>
      <div className="evidence-grid evidence-grid--3col">
        <div className="img-frame">
          <img src={beforeImage} alt={beforeLabel} loading="lazy" />
          <div className="img-frame__caption">{beforeLabel || 'Before (T₁)'}</div>
        </div>
        <div className="img-frame">
          <img src={afterImage} alt={afterLabel} loading="lazy" />
          <div className="img-frame__caption">{afterLabel || 'After (T₂)'}</div>
        </div>
        <div className="img-frame">
          <canvas ref={changeMapRef} style={{ width: '100%', display: 'block' }} />
          <div className="img-frame__caption">Change Map</div>
        </div>
      </div>
      <div className="evidence-legend" style={{ marginTop: '12px' }}>
        <div className="evidence-legend__item">
          <span className="legend-dot" style={{ background: '#E74C3C' }} />
          Changed Area
        </div>
        <div className="evidence-legend__item">
          <span className="legend-dot" style={{ background: '#1a1a2e' }} />
          Unchanged Area
        </div>
        <div className="evidence-legend__item" style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '11px' }}>
          Red intensity proportional to change magnitude
        </div>
      </div>
    </>
  );
}

function SARLayout({ evidence }) {
  const { opticalImage, sarImage } = evidence;
  const optAnalysisRef = useRef(null);
  const fusionRef = useRef(null);

  useEffect(() => {
    // Optical analysis overlay (blue water detection)
    const optCanvas = optAnalysisRef.current;
    if (optCanvas) {
      optCanvas.width = 640; optCanvas.height = 400;
      const ctx = optCanvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 640, 400);
        ctx.fillStyle = 'rgba(0, 102, 204, 0.35)';
        ctx.fillRect(140, 200, 180, 130);
        ctx.fillRect(360, 240, 120, 100);
        ctx.strokeStyle = '#0066CC';
        ctx.lineWidth = 2;
        ctx.strokeRect(140, 200, 180, 130);
        ctx.strokeRect(360, 240, 120, 100);
        ctx.fillStyle = '#0066CC';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('Water Body', 148, 220);
        ctx.fillText('Water Body', 368, 260);
      };
      img.onerror = () => {
        ctx.fillStyle = '#1c2a4a';
        ctx.fillRect(0, 0, 640, 400);
        ctx.fillStyle = 'rgba(0,102,204,0.5)';
        ctx.fillRect(100, 160, 200, 140);
        ctx.fillRect(340, 210, 140, 110);
        ctx.fillStyle = '#aac8f0';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('Water Detected (Optical)', 10, 30);
      };
      img.src = opticalImage;
    }

    // Fusion result
    const fusionCanvas = fusionRef.current;
    if (fusionCanvas) {
      fusionCanvas.width = 640; fusionCanvas.height = 400;
      const ctx = fusionCanvas.getContext('2d');
      ctx.fillStyle = '#0f1f33';
      ctx.fillRect(0, 0, 640, 400);
      // Water bodies (confirmed by both modalities)
      ctx.fillStyle = 'rgba(0, 180, 255, 0.7)';
      ctx.fillRect(120, 185, 200, 150);
      ctx.fillRect(340, 225, 150, 120);
      // Urban (SAR double-bounce)
      ctx.fillStyle = 'rgba(255, 165, 0, 0.4)';
      ctx.fillRect(30, 50, 250, 120);
      ctx.fillRect(400, 50, 180, 100);
      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('Water (Confirmed)', 130, 268);
      ctx.fillText('Water (Confirmed)', 352, 288);
      ctx.fillText('Urban (SAR)', 38, 118);
      ctx.fillText('Urban (SAR)', 408, 108);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.fillText('FUSION RESULT — Optical + SAR', 10, 390);
    }
  }, [opticalImage]);

  return (
    <div className="evidence-grid evidence-grid--2col" style={{ rowGap: '16px' }}>
      <div className="img-frame">
        <img src={opticalImage} alt="Optical satellite image" loading="lazy" />
        <div className="img-frame__caption">Optical Image</div>
      </div>
      <div className="img-frame">
        <img src={sarImage} alt="SAR image" loading="lazy" />
        <div className="img-frame__caption">SAR Image</div>
      </div>
      <div className="img-frame">
        <canvas ref={optAnalysisRef} style={{ width: '100%', display: 'block' }} />
        <div className="img-frame__caption">Optical Analysis (Water Detected)</div>
      </div>
      <div className="img-frame">
        <canvas ref={fusionRef} style={{ width: '100%', display: 'block' }} />
        <div className="img-frame__caption">Fusion Result (Optical + SAR)</div>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */

export default function EvidenceSection({ evidence }) {
  if (!evidence) return null;

  const layoutMap = {
    describe: DescribeLayout,
    vqa:      VQALayout,
    change:   ChangeLayout,
    sar:      SARLayout,
  };

  const Layout = layoutMap[evidence.type] || DescribeLayout;

  return (
    <section id="evidence-section" aria-label="Visual Evidence">
      <p className="section-label">Visual Evidence</p>
      <Card>
        <h2 className="card-heading">Visual Evidence</h2>
        <Layout evidence={evidence} />
      </Card>
    </section>
  );
}

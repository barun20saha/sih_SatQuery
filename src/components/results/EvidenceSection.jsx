import React, { useEffect, useRef, useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { generateMockChangeMap } from '../../services/mockData';
import { ZoomInIcon, ZoomOutIcon, RotateCcwIcon, LayersIcon } from '../common/Icons';

export default function EvidenceSection({ evidence }) {
  const [showOverlays, setShowOverlays] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const changeMapRef = useRef(null);

  // High-fidelity bounding box styling adhering to Section 15 & Section 2 wireframe
  const defaultBoxes = [
    { label: 'Urban Footprint', confidence: '92%', x: 0.08, y: 0.08, w: 0.38, h: 0.35, color: '#1A3A52', fill: 'rgba(26, 58, 82, 0.22)' },
    { label: 'Residential Density', confidence: '89%', x: 0.52, y: 0.15, w: 0.36, h: 0.32, color: '#FF8C42', fill: 'rgba(255, 140, 66, 0.22)' },
    { label: 'Vegetation Canopy', confidence: '85%', x: 0.18, y: 0.52, w: 0.32, h: 0.36, color: '#2D9D78', fill: 'rgba(45, 157, 120, 0.22)' },
  ];

  const boxes = evidence?.groundingBoxes?.length ? evidence.groundingBoxes : defaultBoxes;

  // Render VQA Grounding Canvas
  useEffect(() => {
    if (!evidence) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 540;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      if (!showOverlays) return;

      const w = canvas.width;
      const h = canvas.height;

      boxes.forEach((box) => {
        const px = box.x * w;
        const py = box.y * h;
        const pw = box.w * w;
        const ph = box.h * h;

        // Bounding box outline
        ctx.strokeStyle = box.color || '#2D9D78';
        ctx.lineWidth = Math.max(3, Math.round(w * 0.005));
        ctx.strokeRect(px, py, pw, ph);

        // Semi-transparent overlay fill
        ctx.fillStyle = box.fill || (box.color + '26');
        ctx.fillRect(px, py, pw, ph);

        // Tag label header
        const labelText = `${box.label}${box.confidence ? ` (${box.confidence})` : ''}`;
        ctx.font = `bold ${Math.max(12, Math.round(w * 0.02))}px Inter, sans-serif`;
        const textWidth = ctx.measureText(labelText).width;
        const tagHeight = Math.max(24, Math.round(w * 0.035));

        ctx.fillStyle = box.color || '#2D9D78';
        ctx.fillRect(px, py - tagHeight, textWidth + 14, tagHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, px + 7, py - Math.round(tagHeight * 0.28));
      });
    };

    img.onerror = () => {
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1A3A52';
      ctx.fillRect(0, 0, 800, 500);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Grounding Overlay — Optical Scene Render', 20, 40);
    };

    img.src = evidence.originalImage || evidence.beforeImage;
  }, [evidence, showOverlays, boxes]);

  // Render Change Map Canvas if applicable
  useEffect(() => {
    if (!evidence || evidence.type !== 'change') return;
    const cMap = changeMapRef.current;
    if (!cMap) return;

    cMap.width = 640;
    cMap.height = 420;
    const dataUrl = generateMockChangeMap(640, 420);
    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        const ctx = cMap.getContext('2d');
        ctx.drawImage(img, 0, 0);
      };
      img.src = dataUrl;
    }
  }, [evidence]);

  if (!evidence) return null;

  return (
    <Card id="evidence-section" className="evidence-card">
      <div className="card-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayersIcon size={18} color="var(--color-secondary)" />
          <span>Visual Evidence &amp; Spatial Grounding</span>
        </div>
        <div className="evidence-toolbar">
          <Button
            variant={showOverlays ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowOverlays(!showOverlays)}
          >
            {showOverlays ? 'Overlays: Visible' : 'Overlays: Hidden'}
          </Button>
          <button
            className="preview-tool-btn"
            onClick={() => setZoom(Math.min(2, zoom + 0.2))}
            title="Zoom in"
          >
            <ZoomInIcon size={16} />
          </button>
          <button
            className="preview-tool-btn"
            onClick={() => setZoom(Math.max(1, zoom - 0.2))}
            title="Zoom out"
          >
            <ZoomOutIcon size={16} />
          </button>
          <button
            className="preview-tool-btn"
            onClick={() => setZoom(1)}
            title="Reset"
          >
            <RotateCcwIcon size={16} />
          </button>
        </div>
      </div>

      {/* Detection Confidence Chips Bar (Section 2 Results Page Wireframe) */}
      <div className="evidence-chips-row">
        <span className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
          Grounding Layers:
        </span>
        {boxes.map((box) => (
          <div
            key={box.label}
            className="evidence-chip"
            style={{ borderColor: box.color, color: box.color }}
          >
            <span className="evidence-chip__dot" style={{ backgroundColor: box.color }} />
            <span className="evidence-chip__label">{box.label}</span>
            {box.confidence && <span className="evidence-chip__score">{box.confidence}</span>}
          </div>
        ))}
      </div>

      {/* Evidence Visual Presentation */}
      {evidence.type === 'change' ? (
        <div className="evidence-change-grid">
          <div className="evidence-frame">
            <img src={evidence.beforeImage} alt="Before acquisition" />
            <div className="evidence-frame__tag">Before Acquisition (T₁)</div>
          </div>
          <div className="evidence-frame">
            <img src={evidence.afterImage} alt="After acquisition" />
            <div className="evidence-frame__tag">After Acquisition (T₂)</div>
          </div>
          <div className="evidence-frame">
            <canvas ref={changeMapRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div className="evidence-frame__tag">Neural Change Vector Map</div>
          </div>
        </div>
      ) : evidence.type === 'sar' ? (
        <div className="evidence-sar-grid">
          <div className="evidence-frame">
            <img src={evidence.opticalImage} alt="Optical Band" />
            <div className="evidence-frame__tag">Optical Multispectral (RGB)</div>
          </div>
          <div className="evidence-frame">
            <img src={evidence.sarImage} alt="SAR Band" />
            <div className="evidence-frame__tag">SAR Radar Backscatter (VV/VH)</div>
          </div>
          <div className="evidence-frame" style={{ gridColumn: 'span 2' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div className="evidence-frame__tag">Cross-modal Optical + SAR Fused Water &amp; Urban Grounding</div>
          </div>
        </div>
      ) : (
        <div className="evidence-single-wrapper" style={{ overflow: 'hidden' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
            />
          </div>
        </div>
      )}

      {/* Color Legend (Section 15 Sample color combinations) */}
      <div className="evidence-legend-bar">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#1A3A52' }} />
          <span>Primary Zone (#1A3A52)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#FF8C42' }} />
          <span>Highlight / High Delta (#FF8C42)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#2D9D78' }} />
          <span>Vegetation / Verified (#2D9D78)</span>
        </div>
        <span className="legend-note">
          Ground Sampling Distance: 10m · Geometric IoU: 0.92
        </span>
      </div>
    </Card>
  );
}

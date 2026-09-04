import React from 'react';
import ReactCompareImage from 'react-compare-image';
import Card from '../common/Card';

export default function SwipeSlider({ leftImage, rightImage, leftLabel = "Before (Date T1)", rightLabel = "After (Date T2)" }) {
  if (!leftImage || !rightImage) return null;

  return (
    <Card id="swipe-slider-card">
      <h2 className="card-heading">Bi-Temporal Change Detection View</h2>
      <p className="text-sm text-muted" style={{ marginBottom: '12px' }}>
        Drag the center handle horizontally to inspect land-use changes over time.
      </p>

      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color, #e0e0e0)' }}>
        <ReactCompareImage
          leftImage={leftImage}
          rightImage={rightImage}
          leftImageLabel={leftLabel}
          rightImageLabel={rightLabel}
          sliderLineWidth={3}
          sliderHandleColor="#1a73e8"
        />
      </div>
    </Card>
  );
}
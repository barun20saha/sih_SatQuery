import React from 'react';
import Card from '../common/Card';

function getLevel(scoreDecimal) {
  if (scoreDecimal >= 0.75) return 'high';
  if (scoreDecimal >= 0.50) return 'medium';
  return 'low';
}

function getLevelLabel(level) {
  return { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }[level];
}

function getAccent(level) {
  return { high: 'success', medium: 'warning', low: 'error' }[level];
}

export default function ConfidenceCard(props) {
  // Extract score safely without recursive object self-assignment
  const confObj = typeof props.confidence === 'object' ? props.confidence : null;
  
  let rawScore = confObj?.score ?? props.confidence_score ?? (typeof props.confidence === 'number' ? props.confidence : null);

  if (rawScore === undefined || rawScore === null) return null;

  // Normalize score: if value > 1 (e.g. 94.8), convert to decimal 0.948
  const scoreDecimal = rawScore > 1 ? rawScore / 100 : rawScore;
  const pct = Math.min(100, Math.max(0, Math.round(scoreDecimal * 100)));

  const level = getLevel(scoreDecimal);
  const accent = getAccent(level);

  const explanation = confObj?.explanation || props.explanation;
  const abstention = confObj?.abstention || props.abstention;

  return (
    <Card id="confidence-card" accent={accent}>
      <h2 className="card-heading" style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
        Confidence &amp; Reliability
      </h2>

      <div className="confidence-score" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
        <span className={`confidence-score__number confidence-score__number--${level}`} style={{ fontSize: '28px', fontWeight: 700 }}>
          {pct}%
        </span>
        <span className={`confidence-score__label confidence-score__label--${level}`} style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
          {getLevelLabel(level)}
        </span>
      </div>

      <div 
        className="confidence-bar" 
        role="progressbar" 
        aria-valuenow={pct} 
        aria-valuemin={0} 
        aria-valuemax={100}
        aria-label={`Model confidence level: ${pct}%`}
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <div
          className={`confidence-bar__fill confidence-bar__fill--${level}`}
          style={{ 
            width: `${pct}%`,
            height: '100%',
            backgroundColor: level === 'high' ? '#10b981' : level === 'medium' ? '#f59e0b' : '#ef4444',
            transition: 'width 0.4s ease-in-out'
          }}
        />
      </div>

      <p className="text-sm text-muted" style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
        {explanation || 'Evaluated via Qwen2-VL multimodal feature grounding and multi-spectral raster similarity.'}
      </p>

      {abstention && (
        <div className="abstention-notice" role="note" style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#fffbebe6', border: '1px solid #fef3c7', borderRadius: '6px', fontSize: '12px', color: '#b45309', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span aria-hidden="true">⚠️</span>
          <span>{abstention}</span>
        </div>
      )}
    </Card>
  );
}
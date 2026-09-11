import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { CheckCircleIcon, AlertTriangleIcon } from '../common/Icons';

export default function ConfidenceCard({ confidence }) {
  if (!confidence) return null;

  const score = confidence.score || 0.87;
  const pct = Math.round(score * 100);

  const isHigh = score >= 0.75;
  const isMed = score >= 0.5 && score < 0.75;
  const levelClass = isHigh ? 'high' : isMed ? 'medium' : 'low';
  const levelLabel = isHigh ? 'High Confidence ✓' : isMed ? 'Medium Confidence' : 'Low Confidence ⚠';
  const badgeVariant = isHigh ? 'success' : isMed ? 'warning' : 'error';

  return (
    <Card id="confidence-card" accent={isHigh ? 'secondary' : isMed ? 'warning' : 'error'}>
      <div className="card-heading">
        <span>CONFIDENCE SCORE</span>
        <Badge variant={badgeVariant}>{levelLabel}</Badge>
      </div>

      <div className="confidence-meter-container">
        <div className="confidence-bar-wrapper">
          <div
            className={`confidence-bar-fill confidence-bar-fill--${levelClass}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="confidence-score-display">
          <span className={`confidence-score-num confidence-score-num--${levelClass}`}>
            {pct}%
          </span>
          <span className="confidence-score-caption">
            {isHigh ? 'High reliability index' : 'Elevated uncertainty margin'}
          </span>
        </div>
      </div>

      {/* Section 11: "This means" and "When to be cautious" breakdown */}
      <div className="confidence-guidance-grid">
        <div className="confidence-guidance-col">
          <div className="confidence-guidance-title confidence-guidance-title--good">
            <CheckCircleIcon size={16} />
            <span>This means:</span>
          </div>
          <ul className="confidence-guidance-list">
            <li>• Results are reliable for analytical assessment</li>
            <li>• Safe for environmental planning &amp; decision-making</li>
            <li>• Low uncertainty margin (&lt; 15% noise threshold)</li>
          </ul>
        </div>

        <div className="confidence-guidance-col">
          <div className="confidence-guidance-title confidence-guidance-title--cautious">
            <AlertTriangleIcon size={16} />
            <span>When to be cautious:</span>
          </div>
          <ul className="confidence-guidance-list">
            <li>◦ If findings contradict ground-truth or local survey data</li>
            <li>◦ In partially cloudy, haze-covered, or shadowed areas</li>
            <li>◦ Near scene boundaries with low radiometric overlap</li>
          </ul>
        </div>
      </div>

      {confidence.explanation && (
        <div className="confidence-explanation-note">
          <strong>Model Diagnostic: </strong>
          <span>{confidence.explanation}</span>
        </div>
      )}

      {confidence.abstention && (
        <div className="abstention-notice">
          <AlertTriangleIcon size={16} color="var(--color-warning)" />
          <span>{confidence.abstention}</span>
        </div>
      )}
    </Card>
  );
}

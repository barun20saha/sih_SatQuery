import Card from '../common/Card';

function getLevel(score) {
  if (score >= 0.75) return 'high';
  if (score >= 0.50) return 'medium';
  return 'low';
}

function getLevelLabel(level) {
  return { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }[level];
}

function getAccent(level) {
  return { high: 'success', medium: 'warning', low: 'error' }[level];
}

export default function ConfidenceCard({ confidence }) {
  if (!confidence) return null;

  const { score, explanation, abstention } = confidence;
  const level  = getLevel(score);
  const accent = getAccent(level);
  const pct    = Math.round(score * 100);

  return (
    <Card id="confidence-card" accent={accent}>
      <h2 className="card-heading">Confidence &amp; Reliability</h2>

      <div className="confidence-score">
        <span className={`confidence-score__number confidence-score__number--${level}`}>
          {pct}%
        </span>
        <span className={`confidence-score__label confidence-score__label--${level}`}>
          {getLevelLabel(level)}
        </span>
      </div>

      <div className="confidence-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`confidence-bar__fill confidence-bar__fill--${level}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-sm text-muted" style={{ marginTop: '8px' }}>
        {explanation || 'Based on model agreement, image quality, and answer consistency.'}
      </p>

      {abstention && (
        <div className="abstention-notice" role="note">
          <span aria-hidden="true">⚠️</span>
          <span>{abstention}</span>
        </div>
      )}
    </Card>
  );
}

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
  // Support both object props ({ confidence: { score: 0.8 } }) 
  // and flat backend response props ({ confidence_score: 29.98 })
  const confObj = props.confidence || props;
  
  // Extract score from possible backend keys
  let rawScore = confObj?.score ?? props.confidence_score ?? props.confidence;

  if (rawScore === undefined || rawScore === null) return null;

  // Normalize score: if value > 1 (e.g. 29.98), convert to decimal 0.2998
  const scoreDecimal = rawScore > 1 ? rawScore / 100 : rawScore;
  const pct = Math.round(scoreDecimal * 100);

  const level = getLevel(scoreDecimal);
  const accent = getAccent(level);

  const explanation = confObj?.explanation || props.explanation;
  const abstention = confObj?.abstention || props.abstention;

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
        {explanation || 'Based on multi-modal CLIP model similarity and feature extraction.'}
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
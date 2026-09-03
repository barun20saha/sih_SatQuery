import Card from '../common/Card';

function confidenceColor(val) {
  const v = parseFloat(val);
  if (v >= 0.80) return 'var(--success)';
  if (v >= 0.60) return 'var(--warning)';
  return 'var(--error)';
}

export default function ModelDetailsCard({ models = [], fusionStrategy }) {
  if (!models.length) return null;

  return (
    <Card id="model-details-card">
      <h2 className="card-heading">Model Details</h2>

      <table className="model-table" aria-label="Model performance details">
        <thead>
          <tr>
            <th>Model</th>
            <th>Role</th>
            <th>Input Type</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m, i) => (
            <tr key={i}>
              <td><span className="model-name">{m.name}</span></td>
              <td>{m.role}</td>
              <td>
                <span className="badge badge--neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  {m.inputType}
                </span>
              </td>
              <td>
                <span
                  className="confidence-cell"
                  style={{ color: confidenceColor(m.confidence) }}
                >
                  {m.confidence}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {fusionStrategy && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
            Fusion Strategy:{' '}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{fusionStrategy}</span>
        </div>
      )}
    </Card>
  );
}

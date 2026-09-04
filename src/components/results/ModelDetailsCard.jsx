import Card from '../common/Card';

function confidenceColor(val) {
  const v = parseFloat(val);
  // Support both decimal (0.80) and percentage (80%) values safely
  const normalized = v > 1 ? v / 100 : v;
  if (normalized >= 0.80) return 'var(--success)';
  if (normalized >= 0.60) return 'var(--warning)';
  return 'var(--error)';
}

export default function ModelDetailsCard({ models = [], fusionStrategy, metadata }) {
  // If neither models nor spatial metadata exist, hide card
  if (!models.length && !metadata) return null;

  return (
    <Card id="model-details-card">
      <h2 className="card-heading">Model &amp; Spatial Details</h2>

      {/* --- Model Table --- */}
      {models.length > 0 && (
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
      )}

      {/* --- Fusion Strategy --- */}
      {fusionStrategy && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
            Fusion Strategy:{' '}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{fusionStrategy}</span>
        </div>
      )}

      {/* --- GeoTIFF Spatial Metadata Section --- */}
      {metadata && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e0e0e0)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Rasterio Spatial Metadata
          </span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong>CRS:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{metadata.crs || 'EPSG:4326'}</span>
            </div>
            <div>
              <strong>Channels:</strong> {metadata.channels || metadata.count || 3}
            </div>
            <div>
              <strong>Resolution:</strong> {metadata.resolution ? `${metadata.resolution[0]} x ${metadata.resolution[1]}` : 'N/A'}
            </div>
            <div>
              <strong>Bounds:</strong> {Array.isArray(metadata.bounds) ? metadata.bounds.map(b => Number(b).toFixed(2)).join(', ') : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
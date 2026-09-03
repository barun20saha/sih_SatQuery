import { useApp } from '../../context/AppContext';
import Badge from '../common/Badge';

export default function QueryEchoBar() {
  const { filePreviews, files, query, result } = useApp();

  return (
    <section className="query-echo-bar" aria-label="Query summary">
      <div className="query-echo-bar__inner">
        {/* Thumbnails */}
        <div className="query-echo-bar__thumbs" aria-label="Uploaded images">
          {filePreviews.length > 0
            ? filePreviews.map((src, i) => (
                <div key={i} className="query-echo-thumb">
                  {src
                    ? <img src={src} alt={files[i]?.name || `Image ${i + 1}`} />
                    : <span aria-hidden="true">🛰️</span>
                  }
                </div>
              ))
            : (
              <div className="query-echo-thumb">
                <span aria-hidden="true">🛰️</span>
              </div>
            )
          }
        </div>

        {/* Query */}
        <div className="query-echo-bar__query">
          <strong>Query: </strong>
          <span>"{query || 'Satellite image analysis'}"</span>
        </div>

        {/* Status */}
        <div className="query-echo-bar__status">
          {result?.error ? (
            <Badge variant="error" icon="✕">Failed</Badge>
          ) : (
            <Badge variant="success" icon="✓">Complete</Badge>
          )}
        </div>
      </div>
    </section>
  );
}

import { useApp } from '../../context/AppContext';
import Badge from '../common/Badge';

export default function QueryEchoBar() {
  const { filePreviews, files, query, result } = useApp();

  // Helper to check if a file is a GeoTIFF (browsers cannot natively display .tif images)
  const isGeoTiff = (file) => {
    if (!file) return false;
    const name = file.name?.toLowerCase() || '';
    return name.endsWith('.tif') || name.endsWith('.tiff') || file.type?.includes('tiff');
  };

  return (
    <section className="query-echo-bar" aria-label="Query summary">
      <div className="query-echo-bar__inner">
        {/* Thumbnails */}
        <div className="query-echo-bar__thumbs" aria-label="Uploaded images">
          {filePreviews && filePreviews.length > 0 ? (
            filePreviews.map((src, i) => {
              const file = files[i];
              const isTiff = isGeoTiff(file);

              return (
                <div key={i} className="query-echo-thumb" title={file?.name || `Image ${i + 1}`}>
                  {/* If it's a valid browser image (PNG/JPG) render <img>, otherwise show satellite emoji fallback */}
                  {src && !isTiff ? (
                    <img 
                      src={src} 
                      alt={file?.name || `Image ${i + 1}`} 
                      onError={(e) => {
                        // Fallback if browser fails to render
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span aria-hidden="true">🛰️</span>';
                      }}
                    />
                  ) : (
                    <span aria-hidden="true" style={{ fontSize: '20px' }}>🛰️</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="query-echo-thumb">
              <span aria-hidden="true" style={{ fontSize: '20px' }}>🛰️</span>
            </div>
          )}
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
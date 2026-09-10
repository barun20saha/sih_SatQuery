import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Badge from '../common/Badge';

export default function QueryEchoBar() {
  const { filePreviews, files, query, result } = useApp();
  const [failedImages, setFailedImages] = useState({});

  // Helper to check if a file is a GeoTIFF (browsers cannot natively display .tif images)
  const isGeoTiff = (file) => {
    if (!file) return false;
    const name = file.name?.toLowerCase() || '';
    return name.endsWith('.tif') || name.endsWith('.tiff') || file.type?.includes('tiff');
  };

  const handleImageError = (index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <section 
      className="query-echo-bar" 
      aria-label="Query summary"
      style={{
        width: '100%',
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '12px 16px',
        color: '#f8fafc',
        boxSizing: 'border-box',
        marginBottom: '16px'
      }}
    >
      <div 
        className="query-echo-bar__inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        {/* Thumbnails */}
        <div 
          className="query-echo-bar__thumbs" 
          aria-label="Uploaded images"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {filePreviews && filePreviews.length > 0 ? (
            filePreviews.map((src, i) => {
              const file = files?.[i];
              const isTiff = isGeoTiff(file);
              const hasFailed = failedImages[i];

              return (
                <div 
                  key={file?.name ? `${file.name}-${i}` : i} 
                  className="query-echo-thumb" 
                  title={file?.name || `Image ${i + 1}`}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shrink: 0
                  }}
                >
                  {src && !isTiff && !hasFailed ? (
                    <img 
                      src={src} 
                      alt={file?.name || `Image ${i + 1}`} 
                      onError={() => handleImageError(i)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span aria-hidden="true" style={{ fontSize: '18px' }}>🛰️</span>
                  )}
                </div>
              );
            })
          ) : (
            <div 
              className="query-echo-thumb"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span aria-hidden="true" style={{ fontSize: '18px' }}>🛰️</span>
            </div>
          )}
        </div>

        {/* Query */}
        <div 
          className="query-echo-bar__query"
          style={{
            flex: 1,
            minWidth: '200px',
            fontSize: '13px',
            color: '#e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <strong style={{ color: '#38bdf8' }}>Query: </strong>
          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>
            "{query || 'Satellite image analysis'}"
          </span>
        </div>

        {/* Status */}
        <div className="query-echo-bar__status" style={{ shrink: 0 }}>
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
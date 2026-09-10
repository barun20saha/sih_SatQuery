import React from 'react';
import { useApp } from '../../context/AppContext';

export default function FileList() {
  const context = useApp();
  const files = context?.files || [];
  const setFiles = context?.setFiles;
  const removeFile = context?.removeFile;
  const activeFileIndex = context?.activeFileIndex || 0;
  const setActiveFileIndex = context?.setActiveFileIndex;

  if (!files || files.length === 0) return null;

  const handleRemove = (e, index) => {
    e.stopPropagation(); // Stop triggering file selection when clicking remove
    if (typeof removeFile === 'function') {
      removeFile(index);
    } else if (typeof setFiles === 'function') {
      setFiles((prev) => (Array.isArray(prev) ? prev.filter((_, i) => i !== index) : []));
    }
  };

  const handleSelect = (index) => {
    if (typeof setActiveFileIndex === 'function') {
      setActiveFileIndex(index);
    }
  };

  return (
    <div className="file-list" style={{ marginTop: '12px', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', margin: 0 }}>
          Selected Imagery ({files.length}):
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {files.map((fileItem, index) => {
          // Unwrap raw File object if nested inside metadata object
          const file = fileItem?.file ? fileItem.file : fileItem;
          const fileName = file?.name || `Satellite_Image_${index + 1}.tif`;
          const fileSize = file?.size
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : 'GeoTIFF Raster';
          
          const isActive = index === activeFileIndex;

          return (
            <div
              key={`${fileName}-${index}`}
              onClick={() => handleSelect(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: isActive ? '#f0f9ff' : '#ffffff',
                border: isActive ? '1px solid #0284c7' : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                boxShadow: isActive ? '0 2px 4px rgba(2, 132, 199, 0.1)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <span style={{ fontSize: '16px' }}>🛰️</span>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#0369a1' : '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '220px',
                    }}
                  >
                    {fileName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{fileSize}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleRemove(e, index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background 0.15s ease'
                }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
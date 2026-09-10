import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const context = useApp();
  const addFiles = context?.addFiles;
  const setFiles = context?.setFiles;

  const handleFilesAdded = (rawFiles) => {
    const fileArray = Array.from(rawFiles);
    
    if (typeof addFiles === 'function') {
      addFiles(fileArray);
    } else if (typeof setFiles === 'function') {
      setFiles((prev) => [...(Array.isArray(prev) ? prev : []), ...fileArray]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
      e.target.value = ''; // Reset input so same file can be re-uploaded if needed
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'active' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: isDragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
        borderRadius: '12px',
        padding: '36px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
        transition: 'all 0.2s ease-in-out',
        boxShadow: isDragging ? '0 0 12px rgba(37, 99, 235, 0.15)' : 'none'
      }}
    >
      <input
        type="file"
        id="file-input"
        multiple
        /* ── ALLOW TIFF / GEOTIFF / STANDARD IMAGES ── */
        accept="image/png, image/jpeg, image/jpg, image/tiff, .tif, .tiff, .geotiff"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
        <div 
          style={{ 
            fontSize: '36px', 
            marginBottom: '8px',
            transform: isDragging ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.2s ease'
          }}
        >
          🛰️
        </div>
        <p style={{ fontWeight: 600, margin: '6px 0', color: '#1e293b', fontSize: '15px' }}>
          Drag &amp; drop satellite rasters here, or <span style={{ color: '#2563eb', textDecoration: 'underline' }}>browse</span>
        </p>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
          Supports Multi-spectral GeoTIFF (.tif), PNG, JPEG, JPG (Select 1 or more files)
        </p>
      </label>
    </div>
  );
}
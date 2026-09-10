import React from 'react';
import { useApp } from '../../context/AppContext';
import { inferModality } from '../../utils/fileUtils';

export default function ImageInfoCard() {
  const { files } = useApp();

  if (!files || files.length === 0) {
    return (
      <div className="card" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Dataset Overview</h3>
        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>No imagery uploaded yet. Drag &amp; drop satellite files to view metadata.</p>
      </div>
    );
  }

  const primaryFile = files[0];
  const modality = inferModality(primaryFile);

  return (
    <div className="card" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: '#fff', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Dataset Overview</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>Total Imagery:</span>
          <span style={{ fontWeight: 600 }}>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>Detected Modality:</span>
          <span style={{ fontWeight: 600, color: '#0066cc' }}>{modality}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>Analysis Mode:</span>
          <span style={{ fontWeight: 600 }}>
            {files.length >= 2 ? 'Bi-Temporal Change Detection' : 'Single Image Zero-Shot'}
          </span>
        </div>
      </div>
    </div>
  );
}
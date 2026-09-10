import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import { exportResultsToPDF } from '../../utils/pdfExporter';

export default function ActionBar() {
  const navigate = useNavigate();
  const context = useApp();
  const [isExporting, setIsExporting] = useState(false);

  // Safely resolve reset function or fallback handlers
  const reset = context?.reset;
  const clearAll = context?.clearAll;
  const setResult = context?.setResult;
  const setFiles = context?.setFiles;
  const setQuery = context?.setQuery;

  const handleBack = () => {
    navigate('/');
  };

  const handleNewQuery = () => {
    // Execute available context reset method
    if (typeof reset === 'function') {
      reset();
    } else if (typeof clearAll === 'function') {
      clearAll();
    } else {
      if (typeof setResult === 'function') setResult(null);
      if (typeof setFiles === 'function') setFiles([]);
      if (typeof setQuery === 'function') setQuery('');
    }
    navigate('/');
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await exportResultsToPDF('results-content', context?.result);
    } catch (err) {
      console.error('PDF export failed, falling back to window.print():', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      className="action-bar no-print" 
      role="navigation" 
      aria-label="Result actions"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        marginTop: '16px',
        gap: '12px',
        flexWrap: 'wrap'
      }}
    >
      <Button
        id="btn-back"
        variant="ghost"
        onClick={handleBack}
        style={{ color: '#94a3b8', cursor: 'pointer' }}
      >
        ← Back to Upload
      </Button>

      <div 
        className="action-bar__center"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Button
          id="btn-download"
          variant="primary"
          onClick={handleDownload}
          disabled={isExporting}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 600,
            border: 'none',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.7 : 1
          }}
        >
          {isExporting ? '⏳ Generating PDF...' : '📥 Download Report'}
        </Button>
        
        <Button
          id="btn-new-query"
          variant="secondary"
          onClick={handleNewQuery}
          style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 600,
            border: '1px solid #334155',
            cursor: 'pointer'
          }}
        >
          New Query
        </Button>
      </div>

      <div style={{ width: 120 }} />
    </div>
  );
}
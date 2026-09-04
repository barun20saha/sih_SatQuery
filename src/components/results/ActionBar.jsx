import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import { exportResultsToPDF } from '../../utils/pdfExporter';

export default function ActionBar() {
  const navigate = useNavigate();
  const { reset } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const handleBack = () => {
    navigate('/');
  };

  const handleNewQuery = () => {
    reset();
    navigate('/');
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      // Targets the main results page container
      await exportResultsToPDF('results-content');
    } catch (err) {
      console.error('PDF export failed:', err);
      // Fallback to native print if html2canvas/jspdf fails
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="action-bar no-print" role="navigation" aria-label="Result actions">
      <Button
        id="btn-back"
        variant="ghost"
        onClick={handleBack}
      >
        ← Back to Upload
      </Button>

      <div className="action-bar__center">
        <Button
          id="btn-download"
          variant="primary"
          onClick={handleDownload}
          disabled={isExporting}
        >
          {isExporting ? '⏳ Generating PDF...' : '📥 Download Report'}
        </Button>
        <Button
          id="btn-new-query"
          variant="primary"
          onClick={handleNewQuery}
        >
          New Query
        </Button>
      </div>

      <div style={{ width: 120 }} /> {/* spacer for centering */}
    </div>
  );
}
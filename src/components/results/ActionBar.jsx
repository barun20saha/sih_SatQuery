import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import { DownloadIcon, ZapIcon, HistoryIcon, CheckIcon } from '../common/Icons';

export default function ActionBar() {
  const navigate = useNavigate();
  const { reset } = useApp();
  const [isSaved, setIsSaved] = useState(false);

  const handleBack = () => {
    navigate('/workspace');
  };

  const handleNewAnalysis = () => {
    reset();
    navigate('/workspace');
  };

  const handleExport = () => {
    window.print();
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="action-bar no-print" role="navigation" aria-label="Result Actions">
      <div className="action-bar__left">
        <Button
          id="btn-back"
          variant="secondary"
          size="sm"
          onClick={handleBack}
        >
          ← Edit Scene &amp; Query
        </Button>
      </div>

      <div className="action-bar__center">
        {/* Section 2 Wireframe: [Export] [Save] [New Analysis] */}
        <Button
          id="btn-export"
          variant="secondary"
          size="md"
          onClick={handleExport}
          icon={<DownloadIcon size={16} />}
        >
          Export Report
        </Button>

        <Button
          id="btn-save"
          variant="secondary"
          size="md"
          onClick={handleSave}
          icon={isSaved ? <CheckIcon size={16} color="var(--color-success)" /> : <HistoryIcon size={16} />}
        >
          {isSaved ? 'Saved to History ✓' : 'Save Analysis'}
        </Button>

        <Button
          id="btn-new-analysis"
          variant="primary"
          size="md"
          onClick={handleNewAnalysis}
          icon={<ZapIcon size={16} />}
        >
          New Analysis
        </Button>
      </div>

      <div className="action-bar__right">
        <span className="text-xs text-muted">
          Ready for export &middot; Geospatial PDF
        </span>
      </div>
    </div>
  );
}

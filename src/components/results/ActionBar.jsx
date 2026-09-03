import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';

export default function ActionBar() {
  const navigate = useNavigate();
  const { reset } = useApp();

  const handleBack = () => {
    navigate('/');
  };

  const handleNewQuery = () => {
    reset();
    navigate('/');
  };

  const handleDownload = () => {
    // Print-based PDF generation (print CSS hides action bar)
    window.print();
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
        >
          📥 Download Report
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

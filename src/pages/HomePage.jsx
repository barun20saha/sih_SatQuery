import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { analyzeImages } from '../services/api';
import DropZone from '../components/home/DropZone';
import FileList from '../components/home/FileList';
import QueryInput from '../components/home/QueryInput';
import ImageInfoCard from '../components/home/ImageInfoCard';
import ExampleQueriesCard from '../components/home/ExampleQueriesCard';
import GuidelinesCard from '../components/home/GuidelinesCard';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const LOADING_STEPS = [
  'Validating images...',
  'Extracting metadata...',
  'Running AI analysis...',
  'Generating visual evidence...',
  'Synthesizing results...',
];

export default function HomePage() {
  const navigate = useNavigate();
  const {
    files, query, isLoading,
    setLoading, setLoadingStep, setResult, setError,
  } = useApp();

  // Safe string coercion to prevent crashes if query is non-string
  const safeQuery = typeof query === 'string' ? query.trim() : '';
  const canAnalyze = files.length > 0 && safeQuery.length > 0 && !isLoading;

  // Simulate progressive loading steps for UX
  useEffect(() => {
    if (!isLoading) return;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length) setLoadingStep(step);
    }, 550);
    return () => clearInterval(interval);
  }, [isLoading, setLoadingStep]);

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setLoading(true);
    try {
      const result = await analyzeImages(files, safeQuery);
      setResult(result);
      navigate('/results');
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze();
  };

  return (
    <main className="home-page" role="main">
      <div className="home-layout">
        {/* ── Left Column: Upload + Query ── */}
        <div className="upload-panel">
          <div>
            <h1 className="upload-panel__title">
              Satellite Image Intelligence
            </h1>
            <p className="upload-panel__subtitle">
              Upload satellite imagery and ask natural language questions. 
              Powered by multi-modal AI for change detection, VQA, and SAR fusion.
            </p>
          </div>

          {/* Upload zone */}
          <DropZone />

          {/* Uploaded file list */}
          <FileList />

          {/* Query input */}
          <div onKeyDown={handleKeyDown}>
            <QueryInput />
          </div>

          {/* Analyze button */}
          <div className="analyze-btn-wrapper">
            <Button
              id="btn-analyze"
              variant="primary"
              size="lg"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              aria-label="Analyze uploaded images"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Analyzing...
                </>
              ) : (
                'ANALYZE'
              )}
            </Button>

            {!isLoading && (
              <span className="text-xs text-muted" style={{ alignSelf: 'center' }}>
                {!files.length
                  ? 'Upload at least one image to begin'
                  : !safeQuery
                  ? 'Enter or speak a query to continue'
                  : 'Ctrl+Enter to analyze'}
              </span>
            )}

            {isLoading && (
              <span className="text-xs text-muted" style={{ alignSelf: 'center' }}>
                {LOADING_STEPS[0]}
              </span>
            )}
          </div>

          {/* Mock mode notice */}
          {import.meta.env.VITE_MOCK_MODE !== 'false' && (
            <div style={{
              padding: '8px 12px',
              background: '#fff3e0',
              border: '1px solid #ffcc80',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#e65100',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>🔬</span>
              <span>
                <strong>Mock mode active</strong> — Using simulated AI responses.
                Set <code>VITE_MOCK_MODE=false</code> to connect the real backend.
              </span>
            </div>
          )}
        </div>

        {/* ── Right Column: Info Cards ── */}
        <aside className="info-panel" aria-label="Upload information">
          <ImageInfoCard />
          <ExampleQueriesCard />
          <GuidelinesCard />
        </aside>
      </div>
    </main>
  );
}
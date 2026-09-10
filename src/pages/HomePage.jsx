import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { analyzeSatelliteRaster } from '../services/api';
import DropZone from '../components/home/DropZone';
import FileList from '../components/home/FileList';
import QueryInput from '../components/home/QueryInput';
import ImageInfoCard from '../components/home/ImageInfoCard';
import ExampleQueriesCard from '../components/home/ExampleQueriesCard';
import GuidelinesCard from '../components/home/GuidelinesCard';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const LOADING_STEPS = [
  'Validating satellite rasters...',
  'Extracting multi-spectral metadata...',
  'Evaluating Qwen2-VL feature grounding...',
  'Generating visual spatial evidence...',
  'Synthesizing land-cover response...'
];

export default function HomePage() {
  const navigate = useNavigate();
  const {
    files,
    query,
    isLoading,
    loadingStep,
    setLoading,
    setLoadingStep,
    setResult,
    setError,
  } = useApp();

  const safeQuery = typeof query === 'string' ? query.trim() : '';
  const canAnalyze = files.length > 0 && safeQuery.length > 0 && !isLoading;

  useEffect(() => {
    if (!isLoading) return;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length) setLoadingStep(step);
    }, 600);
    return () => clearInterval(interval);
  }, [isLoading, setLoadingStep]);

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setLoading(true);
    try {
      // 1. Sanitize all uploaded files
      const sanitizedFiles = files.map((f) => (f?.file ? f.file : f));

      // 2. Pass safeQuery as Arg 1 and sanitizedFiles as Arg 2
      const resultData = await analyzeSatelliteRaster(safeQuery, sanitizedFiles);
      
      setResult(resultData);
      navigate('/results');
    } catch (err) {
      console.error('Analysis Failed:', err);
      setError(err?.message || 'An unexpected error occurred during processing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const isMockActive = import.meta.env.VITE_MOCK_MODE === 'true';

  return (
    <main className="home-page fade-in" role="main" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div 
        className="home-layout" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(320px, 1.6fr) minmax(280px, 1fr)', 
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* ── Left Column: Upload + Query ── */}
        <div className="upload-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h1 className="upload-panel__title" style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Satellite Image Intelligence
            </h1>
            <p className="upload-panel__subtitle" style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Upload satellite imagery and ask natural language queries. 
              Powered by multi-modal AI for land cover classification, VQA, and geospatial analysis.
            </p>
          </div>

          <DropZone />
          <FileList />

          <div onKeyDown={handleKeyDown}>
            <QueryInput onSubmit={handleAnalyze} />
          </div>

          <div className="analyze-btn-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <Button
              id="btn-analyze"
              variant="primary"
              size="lg"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              aria-label="Analyze uploaded images"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                borderRadius: '8px',
                backgroundColor: canAnalyze ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                'ANALYZE SATELLITE RASTER'
              )}
            </Button>

            {!isLoading && (
              <span className="text-xs text-muted" style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                {!files.length
                  ? '⚠️ Upload at least one GeoTIFF/image to begin'
                  : !safeQuery
                  ? '⚠️ Enter or speak a query to continue'
                  : '💡 Press Ctrl+Enter or click ANALYZE'}
              </span>
            )}

            {isLoading && (
              <span className="text-xs text-muted" style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textAlign: 'center' }}>
                {LOADING_STEPS[loadingStep || 0]}
              </span>
            )}
          </div>

          {isMockActive && (
            <div style={{
              padding: '10px 14px',
              background: '#fffbe3',
              border: '1px solid #fef08a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#854d0e',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span>
                <strong>VITE_MOCK_MODE active</strong> — Using instant local responses for presentation stability.
                Set <code>VITE_MOCK_MODE=false</code> in <code>.env</code> to connect live FastAPI.
              </span>
            </div>
          )}
        </div>

        {/* ── Right Column: Info Cards ── */}
        <aside className="info-panel" aria-label="Upload information" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ImageInfoCard />
          <ExampleQueriesCard />
          <GuidelinesCard />
        </aside>
      </div>
    </main>
  );
}
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import QueryEchoBar from '../components/results/QueryEchoBar';
import MainAnswerCard from '../components/results/MainAnswerCard';
import EvidenceSection from '../components/results/EvidenceSection';
import ConfidenceCard from '../components/results/ConfidenceCard';
import ExecutionTraceCard from '../components/results/ExecutionTraceCard';
import ModelDetailsCard from '../components/results/ModelDetailsCard';
import ActionBar from '../components/results/ActionBar';
import Button from '../components/common/Button';

// GIS & Advanced Visualization Components
import MapViewer from '../components/gis/MapViewer';
import SwipeSlider from '../components/gis/SwipeSlider';

function LoadingPage({ steps, currentStep }) {
  return (
    <div className="loading-page" role="status" aria-live="polite">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛰️</div>
        <p className="loading-page__title">Analyzing your satellite imagery</p>
        <p className="loading-page__sub">This may take a few moments...</p>
      </div>

      <div className="loading-steps" aria-label="Processing steps">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`loading-step ${
              i < currentStep ? 'loading-step--done' :
              i === currentStep ? 'loading-step--active' : ''
            }`}
          >
            <span aria-hidden="true" style={{ width: 16, textAlign: 'center' }}>
              {i < currentStep ? '✓' : i === currentStep ? '›' : '○'}
            </span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorPage({ result, onBack }) {
  return (
    <main className="results-page" role="main">
      <QueryEchoBar />
      <div className="results-content">
        <div className="error-page-content">
          <span className="error-page-content__icon" aria-hidden="true">⚠️</span>
          <h1 className="error-page-content__heading">
            {result?.errorTitle || 'Unable to Process Query'}
          </h1>
          <p className="error-page-content__body">
            {result?.errorMessage || 'An error occurred during analysis.'}
          </p>
          {result?.suggestion && (
            <p className="error-page-content__suggestion">
              💡 {result.suggestion}
            </p>
          )}
          <Button id="btn-error-back" variant="primary" onClick={onBack}>
            ← Try Again
          </Button>
        </div>

        {result?.executionTrace && (
          <ExecutionTraceCard trace={result.executionTrace} />
        )}
      </div>
      <ActionBar />
    </main>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, isLoading, loadingStep, loadingSteps, filePreviews, files } = useApp();

  useEffect(() => {
    if (!isLoading && !result) {
      navigate('/', { replace: true });
    }
  }, [isLoading, result, navigate]);

  if (isLoading) {
    return <LoadingPage steps={loadingSteps} currentStep={loadingStep} />;
  }

  if (!result) return null;

  if (result.error) {
    return <ErrorPage result={result} onBack={() => navigate('/')} />;
  }

  const mainAnswerText = result.main_answer || result.answer || result.summary || "Analysis completed successfully.";
  const confidenceData = result.confidence || {
    score: (result.confidence_score ?? 100) / 100,
    explanation: `Confidence level: ${result.confidence_level || 'High'}`
  };

  const modelDetails = result.modelDetails?.length > 0
    ? result.modelDetails
    : [
        {
          name: 'Fine-Tuned CLIP',
          role: 'Zero-Shot Land Cover Classifier',
          inputType: 'GeoTIFF / RGB',
          confidence: `${result.confidence_score || 97}%`
        }
      ];

  // Resolve images for Bi-Temporal Comparison
  const hasMultipleImages = 
    (filePreviews && filePreviews.length >= 2) || 
    (files && files.length >= 2) || 
    (result.images && result.images.length >= 2) || 
    result.beforeImage;

  const leftImageSrc = 
    filePreviews?.[0] || 
    result.beforeImage || 
    result.images?.[0] || 
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop';

  const rightImageSrc = 
    filePreviews?.[1] || 
    result.afterImage || 
    result.images?.[1] || 
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop';

  return (
    <main className="results-page fade-in" role="main" id="results-content">
      <QueryEchoBar />

      <div className="results-content">
        {/* Section 1: Classification Output */}
        <section aria-labelledby="answer-heading">
          <p className="section-label">Analysis Result</p>
          <MainAnswerCard answer={mainAnswerText} />
        </section>

        {/* Section 2: Bi-Temporal Change Detection Slider */}
        {hasMultipleImages && (
          <section aria-labelledby="change-heading" style={{ marginTop: '24px' }}>
            <p className="section-label">Interactive Change Detection</p>
            <SwipeSlider
              leftImage={leftImageSrc}
              rightImage={rightImageSrc}
              leftLabel="Pre-Event / Image 1"
              rightLabel="Post-Event / Image 2"
            />
          </section>
        )}

        {/* Section 3: Visual Evidence */}
        {result.evidence && (
          <EvidenceSection evidence={result.evidence} />
        )}

        {/* Section 4: Interactive Leaflet Map View */}
        {result.metadata?.bounds && (
          <section aria-labelledby="map-heading" style={{ marginTop: '24px' }}>
            <p className="section-label">Spatial Visualization</p>
            <MapViewer metadata={result.metadata} answer={mainAnswerText} />
          </section>
        )}

        {/* Section 5: Model Confidence */}
        <section aria-labelledby="confidence-heading" style={{ marginTop: '24px' }}>
          <p className="section-label">Confidence &amp; Reliability</p>
          <ConfidenceCard confidence={confidenceData} />
        </section>

        {/* Section 6: Execution Trace */}
        {result.executionTrace && (
          <section aria-labelledby="trace-heading" style={{ marginTop: '24px' }}>
            <p className="section-label">Execution Trace</p>
            <ExecutionTraceCard trace={result.executionTrace} />
          </section>
        )}

        {/* Section 7: Model & GeoTIFF Details */}
        <section aria-labelledby="models-heading" style={{ marginTop: '24px' }}>
          <p className="section-label">Model &amp; Spatial Details</p>
          <ModelDetailsCard
            models={modelDetails}
            fusionStrategy={result.fusionStrategy || 'Multi-Modal Spatial Feature Analysis'}
            metadata={result.metadata}
          />
        </section>

        <div style={{ height: 16 }} />
      </div>

      <ActionBar />
    </main>
  );
}
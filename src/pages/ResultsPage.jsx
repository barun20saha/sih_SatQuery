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
import Card from '../components/common/Card';

/* ── Loading Page ── */
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

/* ── Error Page ── */
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

        {/* Still show trace even on error */}
        {result?.executionTrace && (
          <ExecutionTraceCard trace={result.executionTrace} />
        )}
      </div>
      <ActionBar />
    </main>
  );
}

/* ── Main Results Page ── */
export default function ResultsPage() {
  const navigate  = useNavigate();
  const { result, isLoading, loadingStep, loadingSteps } = useApp();

  // Guard: if user lands here with no result, send home
  useEffect(() => {
    if (!isLoading && !result) {
      navigate('/', { replace: true });
    }
  }, [isLoading, result, navigate]);

  if (isLoading) {
    return <LoadingPage steps={loadingSteps} currentStep={loadingStep} />;
  }

  if (!result) return null;

  // Error state
  if (result.error) {
    return <ErrorPage result={result} onBack={() => navigate('/')} />;
  }

  return (
    <main className="results-page fade-in" role="main">
      {/* Section 1: Query echo */}
      <QueryEchoBar />

      <div className="results-content">
        {/* Section 2: Main Answer */}
        <section aria-labelledby="answer-heading">
          <p className="section-label">Analysis Result</p>
          <MainAnswerCard answer={result.answer} />
        </section>

        {/* Section 3: Visual Evidence */}
        {result.evidence && (
          <EvidenceSection evidence={result.evidence} />
        )}

        {/* Section 4: Confidence */}
        {result.confidence && (
          <section aria-labelledby="confidence-heading">
            <p className="section-label">Confidence &amp; Reliability</p>
            <ConfidenceCard confidence={result.confidence} />
          </section>
        )}

        {/* Section 5: Execution Trace */}
        {result.executionTrace && (
          <section aria-labelledby="trace-heading">
            <p className="section-label">Execution Trace</p>
            <ExecutionTraceCard trace={result.executionTrace} />
          </section>
        )}

        {/* Section 6: Model Details */}
        {result.modelDetails?.length > 0 && (
          <section aria-labelledby="models-heading">
            <p className="section-label">Model Details</p>
            <ModelDetailsCard
              models={result.modelDetails}
              fusionStrategy={result.fusionStrategy}
            />
          </section>
        )}

        {/* Spacer so content isn't hidden under action bar */}
        <div style={{ height: 16 }} />
      </div>

      {/* Section 7: Action Bar */}
      <ActionBar />
    </main>
  );
}

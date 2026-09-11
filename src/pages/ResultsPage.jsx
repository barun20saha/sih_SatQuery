import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import QueryEchoBar from '../components/results/QueryEchoBar';
import MainAnswerCard from '../components/results/MainAnswerCard';
import EvidenceSection from '../components/results/EvidenceSection';
import ConfidenceCard from '../components/results/ConfidenceCard';
import ExecutionTraceCard from '../components/results/ExecutionTraceCard';
import ModelDetailsCard from '../components/results/ModelDetailsCard';
import ActionBar from '../components/results/ActionBar';

/* ── Loading View ── */
function LoadingPage({ steps, currentStep }) {
  return (
    <div className="results-loading-state" role="status" aria-live="polite">
      <div className="loading-card card">
        <div style={{ fontSize: 44, marginBottom: 12 }}>🛰️</div>
        <h2 style={{ fontSize: '20px', marginBottom: '6px', color: 'var(--color-heading)' }}>
          Analyzing Satellite Scene
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Synthesizing multi-modal telemetry and visual grounding...
        </p>

        <div className="loading-progress-bar-wrap">
          <div
            className="loading-progress-bar-fill"
            style={{ width: `${Math.min(100, Math.round(((currentStep + 1) / steps.length) * 100))}%` }}
          />
        </div>

        <div className="loading-steps-list">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`loading-step-item ${
                idx < currentStep ? 'loading-step-item--done' :
                idx === currentStep ? 'loading-step-item--active' : ''
              }`}
            >
              <span className="loading-step-bullet">
                {idx < currentStep ? '✓' : idx === currentStep ? '›' : '○'}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, query, isLoading, loadingStep, loadingSteps } = useApp();

  const defaultTask = result?.queryType || (result?.evidence?.type === 'change' ? 'change' : 'vqa');
  const [selectedTaskTab, setSelectedTaskTab] = useState(null);
  const activeTaskTab = selectedTaskTab || defaultTask;

  // Guard: if no result and not loading, navigate to workspace
  useEffect(() => {
    if (!isLoading && !result) {
      navigate('/workspace', { replace: true });
    }
  }, [isLoading, result, navigate]);

  if (isLoading) {
    return <LoadingPage steps={loadingSteps} currentStep={loadingStep} />;
  }

  if (!result) return null;

  return (
    <div className="results-page fade-in">
      {/* Query Echo Banner */}
      <QueryEchoBar />

      <div className="results-container">
        {/* Section 2 Wireframe: Task mode tabs/badges: [VQA] [Captioning] [Grounding] [Change Detection] */}
        <div className="task-mode-tabs-bar" role="tablist" aria-label="Task Mode">
          <button
            role="tab"
            aria-selected={activeTaskTab === 'vqa'}
            className={`task-tab-btn ${activeTaskTab === 'vqa' ? 'task-tab-btn--active' : ''}`}
            onClick={() => setSelectedTaskTab('vqa')}
          >
            <span>VQA</span>
            <span className="task-tab-pill">Visual QA</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTaskTab === 'captioning' || activeTaskTab === 'describe'}
            className={`task-tab-btn ${activeTaskTab === 'captioning' || activeTaskTab === 'describe' ? 'task-tab-btn--active' : ''}`}
            onClick={() => setSelectedTaskTab('captioning')}
          >
            <span>Captioning</span>
            <span className="task-tab-pill">Descriptive</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTaskTab === 'grounding'}
            className={`task-tab-btn ${activeTaskTab === 'grounding' ? 'task-tab-btn--active' : ''}`}
            onClick={() => setSelectedTaskTab('grounding')}
          >
            <span>Grounding</span>
            <span className="task-tab-pill">Bounding Boxes</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTaskTab === 'change'}
            className={`task-tab-btn ${activeTaskTab === 'change' ? 'task-tab-btn--active' : ''}`}
            onClick={() => setSelectedTaskTab('change')}
          >
            <span>Change Detection</span>
            <span className="task-tab-pill">Bi-temporal</span>
          </button>
        </div>

        {/* Section 2 Wireframe: Question & Answer Card */}
        <section aria-label="Question and Answer">
          <MainAnswerCard answer={result.answer} query={query} />
        </section>

        {/* Section 2 Wireframe & Section 11: Confidence Meter */}
        {result.confidence && (
          <section aria-label="Confidence Meter">
            <ConfidenceCard confidence={result.confidence} />
          </section>
        )}

        {/* Section 2 Wireframe: Visual Evidence (Annotated Image with Bounding Boxes) */}
        {result.evidence && (
          <section aria-label="Visual Evidence">
            <EvidenceSection evidence={result.evidence} />
          </section>
        )}

        {/* Section 2 Wireframe: "How This Was Analysed" */}
        {result.executionTrace && (
          <section aria-label="Analysis Trace">
            <ExecutionTraceCard
              trace={result.executionTrace}
              modelName={result.modelDetails?.[0]?.name}
              confidenceScore={result.confidence?.score || 0.87}
            />
          </section>
        )}

        {/* Neural Model Details */}
        {result.modelDetails?.length > 0 && (
          <section aria-label="Model Ensembles">
            <ModelDetailsCard
              models={result.modelDetails}
              fusionStrategy={result.fusionStrategy}
            />
          </section>
        )}

        {/* Spacer for bottom action bar */}
        <div style={{ height: '40px' }} />
      </div>

      {/* Floating Action Bar (Export / Save / New Analysis) */}
      <ActionBar />
    </div>
  );
}

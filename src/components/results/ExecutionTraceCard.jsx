import React, { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { ZapIcon, ChevronDownIcon } from '../common/Icons';

export default function ExecutionTraceCard({ trace, modelName = 'YOLOv8-Geospatial', confidenceScore = 0.87 }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!trace) return null;
  const isDone = trace.status === 'completed';
  const isFailed = trace.status === 'failed';

  return (
    <Card id="execution-trace-card" className="trace-card">
      <div
        className="card-heading"
        style={{ cursor: 'pointer', marginBottom: isExpanded ? '16px' : '0' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ZapIcon size={18} color="var(--color-secondary)" />
          <span>HOW THIS WAS ANALYSED</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={isDone ? 'success' : isFailed ? 'error' : 'processing'}>
            {isDone ? '✓ Verified Pipeline' : trace.status}
          </Badge>
          <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', display: 'flex' }}>
            <ChevronDownIcon size={16} />
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="trace-content slide-down">
          {/* Section 2 Wireframe Highlights: Task, Model, Confidence */}
          <div className="trace-summary-grid">
            <div className="trace-summary-pill">
              <span className="trace-summary-pill__check">✓</span>
              <span className="trace-summary-pill__label">Task:</span>
              <span className="trace-summary-pill__val">{trace.task || 'Visual Grounding'}</span>
            </div>
            <div className="trace-summary-pill">
              <span className="trace-summary-pill__check">✓</span>
              <span className="trace-summary-pill__label">Model:</span>
              <span className="trace-summary-pill__val">{trace.modelsUsed?.[0] || modelName}</span>
            </div>
            <div className="trace-summary-pill">
              <span className="trace-summary-pill__check">✓</span>
              <span className="trace-summary-pill__label">Confidence:</span>
              <span className="trace-summary-pill__val">{Math.round(confidenceScore * 100)}%</span>
            </div>
          </div>

          <div className="trace-block">
            {/* Input Scene */}
            <div className="trace-row">
              <span className="trace-row__key">Input Scenes</span>
              <span className="trace-row__value">{trace.inputCount || '1 Satellite Scene'}</span>
            </div>

            {/* Neural Ensembles */}
            <div className="trace-row">
              <span className="trace-row__key">Ensembles</span>
              <span className="trace-row__value monospace-data">
                {trace.modelsUsed?.join(', ') || 'RS-VLM (GeoChat), YOLOv8-Geospatial'}
              </span>
            </div>

            <div className="trace-divider" />

            {/* Step Trace */}
            <div className="trace-row">
              <span className="trace-row__key">Pipeline Steps</span>
              <div className="trace-row__value">
                <ul className="trace-list">
                  {trace.steps?.map((step, i) => (
                    <li key={i}>
                      <span className="step-num">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {trace.parameters && (
              <>
                <div className="trace-divider" />
                <div className="trace-row">
                  <span className="trace-row__key">Parameters</span>
                  <div className="trace-row__value monospace-data" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {Object.entries(trace.parameters).map(([k, v]) => (
                      <span key={k}>
                        <strong>{k}:</strong> {v}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="trace-divider" />

            <div className="trace-row" style={{ alignItems: 'center' }}>
              <span className="trace-row__key">Duration</span>
              <span className="trace-row__value monospace-data">
                {trace.duration || '2.1s'} ({isDone ? 'Finished' : 'Running'})
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

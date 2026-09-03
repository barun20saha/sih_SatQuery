import Card from '../common/Card';

export default function ExecutionTraceCard({ trace }) {
  if (!trace) return null;

  const isDone   = trace.status === 'completed';
  const isFailed = trace.status === 'failed';

  return (
    <Card id="execution-trace-card">
      <h2 className="card-heading">How This Was Analyzed</h2>

      <div className="trace-block">
        {/* Task */}
        <div className="trace-row">
          <span className="trace-row__key">Task</span>
          <span className="trace-row__value">{trace.task}</span>
        </div>

        {/* Input */}
        <div className="trace-row">
          <span className="trace-row__key">Input</span>
          <span className="trace-row__value">{trace.inputCount}</span>
        </div>

        {/* Models */}
        <div className="trace-row">
          <span className="trace-row__key">Models Used</span>
          <span className="trace-row__value">{trace.modelsUsed?.join(', ')}</span>
        </div>

        <div className="trace-divider" />

        {/* Steps */}
        <div className="trace-row">
          <span className="trace-row__key">Steps</span>
          <div className="trace-row__value">
            <ul className="trace-list">
              {trace.steps?.map((step, i) => (
                <li key={i}
                  style={{
                    color: isFailed && i === trace.steps.length - 1 ? 'var(--error)' : undefined
                  }}
                >
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="trace-divider" />

        {/* Parameters */}
        {trace.parameters && (
          <div className="trace-row">
            <span className="trace-row__key">Parameters</span>
            <div className="trace-row__value">
              {Object.entries(trace.parameters).map(([k, v]) => (
                <div key={k} style={{ marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="trace-divider" />

        {/* Status */}
        <div className="trace-row">
          <span className="trace-row__key">Status</span>
          <div className={`trace-status ${isFailed ? 'text-error' : ''}`}
               style={{ color: isFailed ? 'var(--error)' : 'var(--success)' }}>
            <span className="trace-status-dot"
                  style={{ background: isFailed ? 'var(--error)' : 'var(--success)' }} />
            {isDone  && `Completed in ${trace.duration}`}
            {isFailed && `Failed in ${trace.duration}`}
            {!isDone && !isFailed && `Status: ${trace.status}`}
          </div>
        </div>
      </div>
    </Card>
  );
}

import React from 'react';
import { useApp } from '../../context/AppContext';
import VoiceInput from '../common/VoiceInput';

const SAMPLE_PROMPTS = [
  "Classify primary land cover types",
  "Identify water bodies and vegetation",
  "Detect urban structures and roads",
  "Explain multi-spectral feature changes"
];

export default function QueryInput({ onSubmit }) {
  const { query, setQuery } = useApp();

  const handleTranscript = (spokenText) => {
    if (typeof spokenText === 'string') {
      setQuery((prev) => {
        const current = typeof prev === 'string' ? prev : '';
        return current ? `${current} ${spokenText}` : spokenText;
      });
    }
  };

  const handleChipClick = (promptText) => {
    // 1. Immediately update AppContext state
    setQuery(promptText);
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (unless Shift+Enter is held for a new line) OR Ctrl+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (typeof onSubmit === 'function') {
        onSubmit();
      }
    }
  };

  const queryText = typeof query === 'string' ? query : '';

  return (
    <div className="query-section" style={{ width: '100%', marginTop: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <label
          className="query-section__label"
          htmlFor="query-textarea"
          style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#1e293b' }}
        >
          Analysis Query / Prompt
        </label>
        <VoiceInput onTranscript={handleTranscript} />
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          id="query-textarea"
          className="textarea"
          placeholder="Ask SatQuery AI about these images... e.g., 'Classify land cover and identify urban or forest regions'"
          value={queryText}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          maxLength={1000}
          aria-describedby="query-hint"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#0f172a'
          }}
        />
        
        {queryText.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            title="Clear query"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '6px',
        }}
      >
        {/* Preset Prompt Chips for Quick Demo Testing */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(prompt)}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: queryText === prompt ? '#eff6ff' : '#f8fafc',
                color: '#2563eb',
                fontWeight: queryText === prompt ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              + {prompt}
            </button>
          ))}
        </div>

        <p id="query-hint" className="text-xs text-muted" style={{ fontSize: '11px', color: '#94a3b8', margin: 0, whiteSpace: 'nowrap' }}>
          {queryText.length} / 1000
        </p>
      </div>
    </div>
  );
}
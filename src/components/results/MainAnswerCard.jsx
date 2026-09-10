import React, { useState } from 'react';
import Card from '../common/Card';
import { useApp } from '../../context/AppContext';

export default function MainAnswerCard({ answer, main_answer, mainAnswer }) {
  const context = useApp();
  const [copied, setCopied] = useState(false);

  // Extract from direct props or context result payload
  const contextAnswer = context?.result?.explanation || context?.result?.main_answer || context?.result?.answer;
  const displayText = main_answer || answer || mainAnswer || contextAnswer || "No analysis result available.";

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card id="main-answer-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 className="card-heading" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Analysis Result
        </h2>
        
        <button
          type="button"
          onClick={handleCopy}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: copied ? '#f0fdf4' : '#f8fafc',
            color: copied ? '#16a34a' : '#475569',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      <div 
        className="answer-card__content"
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#334155',
          backgroundColor: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          whiteSpace: 'pre-wrap' // Preserves line breaks and lists from VLM output
        }}
      >
        {displayText}
      </div>
    </Card>
  );
}
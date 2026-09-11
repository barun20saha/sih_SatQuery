import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { BrainIcon } from '../common/Icons';

export default function MainAnswerCard({ answer, query }) {
  return (
    <Card id="main-answer-card" accent="primary" className="main-answer-card">
      <div className="card-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainIcon size={20} color="var(--color-primary)" />
          <span>QUESTION &amp; ANSWER</span>
        </div>
        <Badge variant="task">AI Verified Insight</Badge>
      </div>

      <div className="qa-breakdown">
        {query && (
          <div className="qa-query-box">
            <span className="qa-query-label">Q:</span>
            <span className="qa-query-text">"{query}"</span>
          </div>
        )}

        <div className="qa-answer-box">
          <span className="qa-answer-label">A:</span>
          <div className="qa-answer-text">
            {answer}
          </div>
        </div>
      </div>
    </Card>
  );
}

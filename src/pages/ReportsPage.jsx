import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { FileTextIcon, DownloadIcon } from '../components/common/Icons';
import { useApp } from '../context/AppContext';

export default function ReportsPage() {
  const { history } = useApp();

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <div className="reports-page fade-in">
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Intelligence Reports &amp; Briefs</h1>
          <p className="reports-subtitle">
            Exportable geospatial intelligence briefs, environmental impact audits, and change detection summaries.
          </p>
        </div>
        <Button variant="primary" onClick={() => window.print()} icon={<DownloadIcon size={16} />}>
          Print Executive Summary
        </Button>
      </div>

      <div className="reports-list">
        {history.map((item) => (
          <Card key={item.id} className="report-item-card card--lift">
            <div className="report-item-main">
              <div className="report-item-icon">
                <FileTextIcon size={24} color="var(--color-secondary)" />
              </div>
              <div className="report-item-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{item.title}</h3>
                  <Badge variant="task">{item.taskType}</Badge>
                  <Badge variant="success">Confidence: {Math.round(item.confidence * 100)}%</Badge>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 8px' }}>
                  "{item.answer}"
                </p>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Generated on {item.date} &nbsp;·&nbsp; Modality: {item.modality} &nbsp;·&nbsp; Model: {item.model}
                </div>
              </div>
            </div>

            <div className="report-item-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownloadReport(item.title)}
                icon={<DownloadIcon size={14} />}
              >
                Download PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

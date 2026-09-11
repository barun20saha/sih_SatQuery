import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  UploadIcon,
  ZapIcon,
  HistoryIcon,
  BrainIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SatelliteIcon,
  EyeIcon,
} from '../components/common/Icons';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { setFiles, history, loadHistoryItem } = useApp();
  const fileInputRef = useRef(null);

  const handleQuickUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files).slice(0, 2));
      navigate('/workspace');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files).slice(0, 2));
      navigate('/workspace');
    }
  };

  return (
    <div className="dashboard-page fade-in">
      {/* ── Hero Section (Section 2 Wireframe) ── */}
      <section className="dashboard-hero" aria-label="Welcome">
        <div className="dashboard-hero__content">
          <div className="hero-badge">
            <span className="hero-badge__dot" />
            <span>EARTH OBSERVATION AI PLATFORM</span>
          </div>
          <h1 className="dashboard-hero__title">
            SatQuery <span>AI</span>
          </h1>
          <p className="dashboard-hero__quote">
            "Ask the Earth"
          </p>
          <p className="dashboard-hero__desc">
            Next-generation multimodal satellite intelligence. Query optical, SAR, and temporal satellite imagery with natural language for autonomous change detection, visual grounding, and environmental monitoring.
          </p>
          <div className="dashboard-hero__actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/workspace')}
              icon={<ZapIcon size={18} />}
            >
              New Analysis
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/history')}
              icon={<HistoryIcon size={18} />}
            >
              View History
            </Button>
          </div>
        </div>

        <div className="dashboard-hero__stats">
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--color-secondary)' }}>
              <SatelliteIcon size={24} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">48.2k km²</span>
              <span className="stat-card__label">Earth Surface Scanned</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--color-accent)' }}>
              <BrainIcon size={24} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">4 Models</span>
              <span className="stat-card__label">Neural Ensembles Active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--color-success)' }}>
              <CheckCircleIcon size={24} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">93.4%</span>
              <span className="stat-card__label">Avg. Grounding Accuracy</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Upload Section ── */}
      <section className="dashboard-quick-upload" aria-label="Quick Upload">
        <div className="section-header">
          <div>
            <h2 className="section-title">Quick Upload</h2>
            <p className="section-subtitle">
              Drop any satellite scene (GeoTIFF, TIFF, PNG, JPEG) to instantly launch the analysis workspace
            </p>
          </div>
        </div>

        <div
          className="quick-upload-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".tiff,.tif,.png,.jpg,.jpeg,.geotiff"
            multiple
            style={{ display: 'none' }}
            onChange={handleQuickUpload}
          />
          <div className="quick-upload-dropzone__icon">
            <UploadIcon size={36} color="var(--color-secondary)" />
          </div>
          <div className="quick-upload-dropzone__text">
            <span className="quick-upload-dropzone__main">
              Drag files or click to browse
            </span>
            <span className="quick-upload-dropzone__sub">
              Supports single or bi-temporal pairs &nbsp;·&nbsp; GeoTIFF, PNG, JPEG up to 100MB
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Select Files
          </Button>
        </div>
      </section>

      {/* ── Recent Analyses Section ── */}
      <section className="dashboard-recent" aria-label="Recent Analyses">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Analyses</h2>
            <p className="section-subtitle">
              Review and inspect previously generated geospatial intelligence briefings
            </p>
          </div>
          <Button
            variant="tertiary"
            onClick={() => navigate('/history')}
            icon={<ArrowRightIcon size={16} />}
          >
            View All ({history.length})
          </Button>
        </div>

        <div className="recent-analyses-grid">
          {history.slice(0, 3).map((item) => (
            <div key={item.id} className="recent-card card--lift">
              <div className="recent-card__thumb-wrapper">
                <img src={item.thumbnail} alt={item.title} className="recent-card__thumb" />
                <div className="recent-card__overlay">
                  <Badge variant="task">{item.taskType}</Badge>
                  <Badge variant="success">✓ {Math.round(item.confidence * 100)}% Conf.</Badge>
                </div>
              </div>

              <div className="recent-card__body">
                <div className="recent-card__time">{item.timestamp} &nbsp;·&nbsp; {item.modality}</div>
                <h3 className="recent-card__title" title={item.title}>
                  {item.title}
                </h3>
                <p className="recent-card__snippet">
                  "{item.query}"
                </p>

                <div className="recent-card__footer">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      loadHistoryItem(item);
                      navigate('/results');
                    }}
                    icon={<EyeIcon size={14} />}
                  >
                    Inspect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate('/workspace');
                    }}
                  >
                    Reanalyze
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

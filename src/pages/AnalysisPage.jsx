import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { analyzeImages } from '../services/api';
import { isSupportedFile, formatFileSize, isGeoTIFF, inferModality } from '../utils/fileUtils';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import {
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  LayersIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  XIcon,
} from '../components/common/Icons';

const PRESET_QUERIES = [
  { label: '💡 Urban Detection', text: 'Detect urban settlement footprint, commercial centers, and residential density.' },
  { label: '💡 Water Bodies', text: 'Identify and classify water bodies using optical reflectance and SAR specular signatures.' },
  { label: '💡 Infrastructure Change', text: 'What changed between these images? Highlight new construction, roads, and earthworks.' },
  { label: '💡 Vegetation Health', text: 'Assess vegetation canopy density, agricultural health index, and forest degradation.' },
];

export default function AnalysisPage() {
  const navigate = useNavigate();
  const {
    files,
    filePreviews,
    setFiles,
    removeFile,
    query,
    setQuery,
    selectedImageType,
    setImageType,
    isLoading,
    setLoading,
    loadingStep,
    setLoadingStep,
    loadingSteps,
    setResult,
    setError,
    zoomLevel,
    setZoom,
    panOffset,
    setPan,
    resetViewport,
    reset,
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [unsupportedErrorModal, setUnsupportedErrorModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processingError, setProcessingError] = useState(null);

  const fileInputRef = useRef(null);

  // Progressive loading simulation
  useEffect(() => {
    if (!isLoading) return;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < loadingSteps.length) {
        setLoadingStep(step);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [isLoading, loadingSteps, setLoadingStep]);

  const handleFiles = (incomingFiles) => {
    setValidationError('');
    setProcessingError(null);
    const fileList = Array.from(incomingFiles);
    const valid = fileList.filter((f) => isSupportedFile(f));
    const unsupported = fileList.length - valid.length;

    if (unsupported > 0) {
      setUnsupportedErrorModal(true);
    }

    if (valid.length > 0) {
      const merged = [...files, ...valid].slice(0, 2);
      setFiles(merged);
      if (!query.trim()) {
        setQuery('Describe the geographical features, infrastructure, and land cover in this satellite image.');
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setValidationError('Please upload at least one satellite image to analyze.');
      return;
    }
    const activeQuery = query.trim() || 'Describe the geographical features, infrastructure, and land cover in this satellite image.';
    if (!query.trim()) {
      setQuery(activeQuery);
    }

    setValidationError('');
    setProcessingError(null);
    setLoading(true);

    try {
      const result = await analyzeImages(files, activeQuery);
      if (result.error) {
        setLoading(false);
        setError(result.error);
      } else {
        setResult(result);
        navigate('/results');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err?.message);
      setLoading(false);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(zoomLevel + 0.25);
  const handleZoomOut = () => setZoom(zoomLevel - 0.25);
  const handleResetZoom = () => resetViewport();

  // Pan handlers
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsPanDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsPanDragging(false);

  const modality = inferModality(files);
  const geoCount = files.filter(isGeoTIFF).length;
  const canAnalyze = files.length > 0 && !isLoading;

  return (
    <div className="workspace-page fade-in">
      {/* ── Page Header ── */}
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">Analysis Workspace</h1>
          <p className="workspace-subtitle">
            Upload satellite images, configure modality inspection, and run natural language visual reasoning.
          </p>
        </div>
        <div className="workspace-header__actions">
          <Button variant="secondary" size="sm" onClick={reset}>
            Reset Workspace
          </Button>
        </div>
      </div>

      {/* ── Two Column Workspace Layout ── */}
      <div className="workspace-grid">
        {/* ── Left Column: Satellite Image Preview & Upload ── */}
        <div className="workspace-left-column">
          <Card className="workspace-preview-card">
            <div className="card-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayersIcon size={18} color="var(--color-secondary)" />
                <span>Satellite Image Preview</span>
              </div>
              <div className="preview-toolbar">
                <button
                  className="preview-tool-btn"
                  onClick={handleZoomIn}
                  title="Zoom in (25%)"
                  aria-label="Zoom in"
                >
                  <ZoomInIcon size={16} />
                </button>
                <button
                  className="preview-tool-btn"
                  onClick={handleZoomOut}
                  title="Zoom out (25%)"
                  aria-label="Zoom out"
                >
                  <ZoomOutIcon size={16} />
                </button>
                <button
                  className="preview-tool-btn"
                  onClick={handleResetZoom}
                  title="Reset viewport"
                  aria-label="Reset zoom and pan"
                >
                  <RotateCcwIcon size={16} />
                </button>
                <span className="preview-zoom-indicator">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
            </div>

            {/* Interactive Image Viewport */}
            <div
              className={`preview-viewport ${isPanDragging ? 'preview-viewport--dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {filePreviews.length > 0 ? (
                <div
                  className="preview-canvas-wrapper"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                    cursor: zoomLevel > 1 ? (isPanDragging ? 'grabbing' : 'grab') : 'default',
                  }}
                >
                  {filePreviews.length === 1 ? (
                    <img
                      src={filePreviews[0]}
                      alt="Uploaded satellite scene preview"
                      className="preview-img-active"
                    />
                  ) : (
                    <div className="preview-split-view">
                      <div className="split-view-pane">
                        <img src={filePreviews[0]} alt="Image 1 (T₁ / Optical)" />
                        <span className="split-pane-tag">Image 1 (T₁)</span>
                      </div>
                      <div className="split-view-pane">
                        <img src={filePreviews[1]} alt="Image 2 (T₂ / SAR)" />
                        <span className="split-pane-tag">Image 2 (T₂)</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty Upload Zone inside Preview Frame */
                <div
                  className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                >
                  <span className="dropzone__icon">🛰️</span>
                  <p className="dropzone__primary">
                    Drop satellite image here or <span className="dropzone__browse">browse</span>
                  </p>
                  <p className="dropzone__secondary">
                    GeoTIFF (.tif, .tiff), PNG, JPEG &nbsp;·&nbsp; Up to 2 scenes for bi-temporal change or optical+SAR fusion
                  </p>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".tiff,.tif,.png,.jpg,.jpeg,.geotiff"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Uploaded File Chips List */}
            {files.length > 0 && (
              <div className="uploaded-chips-row">
                {files.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="file-chip">
                    <span className="file-chip__icon">🛰️</span>
                    <span className="file-chip__name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="file-chip__size">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      className="file-chip__remove"
                      onClick={() => removeFile(idx)}
                      title="Remove scene"
                      aria-label={`Remove ${file.name}`}
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
                {files.length < 2 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<UploadIcon size={14} />}
                  >
                    Add 2nd Image (Pair)
                  </Button>
                )}
              </div>
            )}

            {/* Controls Bar: Image Type & Metadata Toggle */}
            <div className="preview-controls-bar">
              <div className="control-group">
                <label htmlFor="image-type-select" className="control-label">
                  Image Modality
                </label>
                <select
                  id="image-type-select"
                  className="select"
                  value={selectedImageType}
                  onChange={(e) => setImageType(e.target.value)}
                >
                  <option value="auto">Auto-detect ({modality})</option>
                  <option value="optical">Optical RGB (Sentinel-2 / Landsat-8)</option>
                  <option value="sar">Synthetic Aperture Radar (Sentinel-1 SAR)</option>
                  <option value="multispectral">Multispectral (13 Spectral Bands)</option>
                  <option value="fusion">Optical + SAR Fused</option>
                </select>
              </div>

              <div className="control-group" style={{ alignSelf: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                >
                  {isMetadataExpanded ? 'Hide Metadata ▲' : 'Metadata [Expand] ▼'}
                </Button>
              </div>
            </div>

            {/* Metadata Expander */}
            {isMetadataExpanded && (
              <div className="metadata-drawer slide-down">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-item__key">Modality Detected:</span>
                    <span className="metadata-item__val">{modality}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-item__key">GeoTIFF Formats:</span>
                    <span className="metadata-item__val">{geoCount > 0 ? `${geoCount} file(s) with CRS` : 'Standard raster (No CRS)'}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-item__key">Reference System:</span>
                    <span className="metadata-item__val monospace-data">EPSG:4326 (WGS 84)</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-item__key">Sampling Distance (GSD):</span>
                    <span className="metadata-item__val">10.0 meters / pixel</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-item__key">Spectral Channels:</span>
                    <span className="metadata-item__val">Red, Green, Blue, NIR</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-item__key">Temporal Baseline:</span>
                    <span className="metadata-item__val">{files.length === 2 ? 'Bi-temporal Pair (Δt ~ 30 days)' : 'Single Acquisition'}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right Column: Query & Execution ── */}
        <div className="workspace-right-column">
          <Card className="workspace-query-card">
            <h2 className="card-heading">
              <span>Natural Language Query</span>
              <span className="query-char-counter text-xs text-muted">
                {query.length} / 1000
              </span>
            </h2>

            {/* Validation Error Inline (Section 12 Error State) */}
            {validationError && (
              <div className="validation-error-inline" role="alert">
                <AlertCircleIcon size={16} />
                <span>{validationError}</span>
              </div>
            )}

            <div className="query-textarea-container">
              <textarea
                id="query-input"
                className={`textarea ${validationError ? 'input--error' : ''}`}
                placeholder="What would you like to know about this satellite image? Enter your query..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (validationError) setValidationError('');
                }}
                rows={6}
                maxLength={1000}
                aria-label="Satellite query input"
              />
            </div>

            {/* Presets / Prompt Chips (Section 2 & 3 Small Buttons) */}
            <div className="presets-container">
              <span className="card-subheading" style={{ display: 'block', marginBottom: '8px' }}>
                Prompt Presets:
              </span>
              <div className="presets-list">
                {PRESET_QUERIES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="btn btn--preset"
                    onClick={() => {
                      setQuery(preset.text);
                      if (validationError) setValidationError('');
                    }}
                    title={preset.text}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Indicator & Step Progress */}
            <div className="status-progress-box">
              <div className="status-progress-header">
                <span className="status-progress-label">STATUS:</span>
                <span className="status-progress-value">
                  {isLoading
                    ? `Analyzing (${loadingStep + 1}/${loadingSteps.length})`
                    : canAnalyze
                    ? 'Ready to analyze'
                    : files.length === 0
                    ? 'Awaiting image upload'
                    : 'Enter query to proceed'}
                </span>
              </div>

              {isLoading ? (
                <div className="loading-step-active-desc">
                  <Spinner size="sm" />
                  <span>{loadingSteps[loadingStep] || 'Processing neural inference...'}</span>
                </div>
              ) : (
                <div className="step-indicator">
                  <div className={`step-item ${files.length > 0 ? 'step-item--completed' : 'step-item--active'}`}>
                    <span className="step-item__dot">{files.length > 0 ? '✓' : '1'}</span>
                    <span>Upload</span>
                  </div>
                  <span className="step-item__divider" />
                  <div className={`step-item ${query.trim() ? 'step-item--completed' : files.length > 0 ? 'step-item--active' : ''}`}>
                    <span className="step-item__dot">{query.trim() ? '✓' : '2'}</span>
                    <span>Query</span>
                  </div>
                  <span className="step-item__divider" />
                  <div className={`step-item ${canAnalyze ? 'step-item--active' : ''}`}>
                    <span className="step-item__dot">3</span>
                    <span>Analyze</span>
                  </div>
                  <span className="step-item__divider" />
                  <div className="step-item">
                    <span className="step-item__dot">4</span>
                    <span>Results</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: [◉ ANALYSE] [○ Reset] */}
            <div className="workspace-action-row">
              <Button
                id="btn-analyze"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                aria-label="Run Satellite Analysis"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    ANALYZING SATELLITE SCENE...
                  </>
                ) : (
                  <>
                    <span>◉</span>
                    <span>ANALYSE</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                disabled={isLoading}
                onClick={() => {
                  reset();
                  setValidationError('');
                  setProcessingError(null);
                }}
                title="Reset query and files"
              >
                <span>○</span>
                <span>Reset</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ── File Type Error Modal (Section 12 Wireframe) ── */}
      <Modal
        isOpen={unsupportedErrorModal}
        onClose={() => setUnsupportedErrorModal(false)}
        variant="error"
        title="✗ Unsupported File Format"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUnsupportedErrorModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => { setUnsupportedErrorModal(false); fileInputRef.current?.click(); }}>
              Browse Files
            </Button>
          </>
        }
      >
        <div style={{ lineHeight: 1.6 }}>
          <p style={{ marginBottom: '12px' }}>
            The selected file format is not supported by the SatQuery AI raster ingestion pipeline.
          </p>
          <strong style={{ color: 'var(--color-heading)', display: 'block', marginBottom: '6px' }}>
            Supported formats:
          </strong>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px', color: 'var(--color-text-primary)' }}>
            <li>• GeoTIFF (<code>.tif</code>, <code>.tiff</code>, <code>.geotiff</code>)</li>
            <li>• Portable Network Graphics (<code>.png</code>)</li>
            <li>• JPEG / JPG (<code>.jpg</code>, <code>.jpeg</code>)</li>
          </ul>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Ensure your files contain standard geospatial metadata or RGB bands for best multimodal inference results.
          </p>
        </div>
      </Modal>
    </div>
  );
}

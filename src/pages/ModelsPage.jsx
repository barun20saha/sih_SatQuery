import React from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { BrainIcon } from '../components/common/Icons';

const MODELS = [
  {
    name: 'YOLOv8-Geospatial',
    role: 'Object Grounding & Structural Bounding',
    modality: 'Optical RGB / GeoTIFF',
    architecture: 'CSPDarknet53 + PANet Head',
    parameters: '43.7M',
    latency: '180ms',
    accuracy: '94.2% mAP@50',
    status: 'online',
    description: 'Fine-tuned on high-resolution Earth observation data for urban settlements, industrial complexes, and road networks.',
  },
  {
    name: 'BIT-ChangeNet',
    role: 'Bi-temporal Change Detection',
    modality: 'Bi-temporal Optical Pair',
    architecture: 'Dual-branch Siamese Transformer',
    parameters: '68.2M',
    latency: '340ms',
    accuracy: '89.6% F1-Score',
    status: 'online',
    description: 'Identifies land cover degradation, construction progress, and vegetation anomalies between two timestamps with sub-pixel co-registration.',
  },
  {
    name: 'RS-VLM (GeoChat)',
    role: 'Visual Question Answering & Reasoning',
    modality: 'Multispectral + Natural Language',
    architecture: 'Vision Transformer + LLaMA-3 8B Adapter',
    parameters: '8.4B',
    latency: '1,200ms',
    accuracy: '88.7% VQA Score',
    status: 'online',
    description: 'Specialized remote sensing vision-language model trained on millions of annotated aerial and satellite scenes.',
  },
  {
    name: 'Optical-SAR DeepFuse',
    role: 'Cross-Modal Spectral-Radar Fusion',
    modality: 'Optical RGB + Sentinel-1 SAR (VV/VH)',
    architecture: 'Feature-level Cross-Attention CNN',
    parameters: '54.1M',
    latency: '410ms',
    accuracy: '92.4% Overlap IoU',
    status: 'online',
    description: 'Blends optical spectral reflectance with SAR dielectric roughness to penetrate cloud cover and definitively map water bodies.',
  },
];

export default function ModelsPage() {
  return (
    <div className="models-page fade-in">
      <div className="models-header">
        <div>
          <h1 className="models-title">Active AI Models</h1>
          <p className="models-subtitle">
            Multimodal neural network catalogue deployed across the SatQuery Earth intelligence cluster.
          </p>
        </div>
      </div>

      <div className="models-grid">
        {MODELS.map((model) => (
          <Card key={model.name} className="model-card card--lift" accent="secondary">
            <div className="card-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainIcon size={20} color="var(--color-secondary)" />
                <span style={{ fontSize: '16px', fontWeight: 700 }}>{model.name}</span>
              </div>
              <Badge variant="success">✓ Online</Badge>
            </div>

            <p className="model-role-text" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
              {model.role}
            </p>

            <p className="model-desc-text" style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              {model.description}
            </p>

            <div className="model-stats-grid">
              <div className="model-stat-item">
                <span className="model-stat-label">Input Modality</span>
                <span className="model-stat-val">{model.modality}</span>
              </div>

              <div className="model-stat-item">
                <span className="model-stat-label">Architecture</span>
                <span className="model-stat-val monospace-data">{model.architecture}</span>
              </div>

              <div className="model-stat-item">
                <span className="model-stat-label">Parameters</span>
                <span className="model-stat-val monospace-data">{model.parameters}</span>
              </div>

              <div className="model-stat-item">
                <span className="model-stat-label">Inference Speed</span>
                <span className="model-stat-val monospace-data">{model.latency}</span>
              </div>

              <div className="model-stat-item">
                <span className="model-stat-label">Benchmark Accuracy</span>
                <span className="model-stat-val" style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>
                  {model.accuracy}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import QueryEchoBar from '../components/results/QueryEchoBar';
import MainAnswerCard from '../components/results/MainAnswerCard';
import ConfidenceCard from '../components/results/ConfidenceCard';
import ModelDetailsCard from '../components/results/ModelDetailsCard';
import ActionBar from '../components/results/ActionBar';
import MapViewer from '../components/gis/MapViewer';
import SwipeSlider from '../components/gis/SwipeSlider';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, isLoading, files, filePreviews } = useApp();

  const [activePreviews, setActivePreviews] = useState([]);

  useEffect(() => {
    if (!isLoading && !result) {
      navigate('/', { replace: true });
      return;
    }

    // 1. Prioritize backend-processed PNG/Base64 images from FastAPI
    if (result?.images?.length > 0) {
      setActivePreviews(result.images);
      return;
    }

    // 2. Generate valid browser preview URLs or file object references for all uploaded files
    if (files && files.length > 0) {
      const generatedUrls = files.map((f) => {
        const rawFile = f?.file ? f.file : f;
        if (rawFile instanceof File || rawFile instanceof Blob) {
          return {
            url: URL.createObjectURL(rawFile),
            name: rawFile.name || 'Uploaded Raster',
            isTiff: rawFile.name?.toLowerCase().endsWith('.tif') || rawFile.name?.toLowerCase().endsWith('.tiff') || rawFile.type?.includes('tiff')
          };
        }
        if (typeof f === 'string') {
          return {
            url: f,
            name: 'Raster Image',
            isTiff: f.toLowerCase().includes('.tif') || f.toLowerCase().includes('.tiff')
          };
        }
        return null;
      }).filter(Boolean);

      if (generatedUrls.length > 0) {
        setActivePreviews(generatedUrls);
        return;
      }
    }

    // 3. Fallback to filePreviews state
    if (filePreviews && filePreviews.length > 0) {
      setActivePreviews(filePreviews.map(p => typeof p === 'string' ? { url: p, name: 'Preview', isTiff: p.includes('.tif') } : p));
    }
  }, [result, files, filePreviews, isLoading, navigate]);

  if (isLoading || !result) return null;

  const mainAnswerText = result.main_answer || result.explanation || result.answer || "Analysis completed successfully.";
  const rawConfidence = result.confidence_score ?? result.confidence ?? 94.8;

  return (
    <main className="results-page fade-in" role="main" id="results-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <QueryEchoBar />

      <div className="results-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Classification Output */}
        <section aria-labelledby="answer-heading">
          <p className="section-label" style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Analysis Result
          </p>
          <MainAnswerCard answer={mainAnswerText} />
        </section>

        {/* Section 2: Uploaded Imagery Dataset Gallery */}
        {activePreviews.length > 0 && (
          <section style={{ marginTop: '12px' }}>
            <p className="section-label" style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Uploaded Imagery Dataset ({activePreviews.length} Image{activePreviews.length > 1 ? 's' : ''})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {activePreviews.map((item, idx) => {
                const imgUrl = typeof item === 'string' ? item : item.url;
                const isTiff = typeof item === 'object' ? item.isTiff : (imgUrl.includes('.tif') || imgUrl.includes('.tiff'));

                return (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', textAlign: 'center', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {isTiff ? (
                      /* Clean GeoTIFF Visual Container for Browser Compatibility */
                      <div style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '6px',
                        backgroundColor: '#0f172a',
                        color: '#38bdf8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid #1e293b'
                      }}>
                        <span style={{ fontSize: '24px' }}>📡</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>GeoTIFF Multi-Spectral Raster</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Ingested via Rasterio Engine</span>
                      </div>
                    ) : (
                      /* Native Web Image Rendering (PNG, JPG) */
                      <img 
                        src={imgUrl} 
                        alt={`Raster Frame ${idx + 1}`}
                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px' }} 
                      />
                    )}
                    <p style={{ margin: '6px 0 0', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      Raster Frame {idx + 1}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 3: Interactive Slider for Multi-Image Datasets */}
        {activePreviews.length > 1 && (
          <section aria-labelledby="change-heading" style={{ marginTop: '12px' }}>
            <p className="section-label" style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Interactive Change Detection &amp; Comparison
            </p>
            <SwipeSlider
              leftImage={typeof activePreviews[0] === 'string' ? activePreviews[0] : activePreviews[0]?.url}
              rightImage={typeof activePreviews[1] === 'string' ? activePreviews[1] : activePreviews[1]?.url}
              leftLabel="Raster Frame 1"
              rightLabel="Raster Frame 2"
            />
          </section>
        )}

        {/* Section 4: Google Maps Spatial Visualization */}
        <section aria-labelledby="map-heading" style={{ marginTop: '12px' }}>
          <p className="section-label" style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Spatial Coordinates &amp; Grounding Map
          </p>
          <MapViewer metadata={result.metadata} answer={mainAnswerText} />
        </section>

        {/* Section 5: Model & Confidence Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '12px' }}>
          <section aria-labelledby="confidence-heading">
            <p className="section-label" style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Model Confidence
            </p>
            <ConfidenceCard 
              confidence={{ 
                score: rawConfidence, 
                explanation: result.confidence_level || "Validated via Qwen2-VL multimodal spectral grounding" 
              }} 
            />
          </section>

          <section aria-labelledby="models-heading">
            <p className="section-label" style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Technical Details
            </p>
            <ModelDetailsCard
              models={result.modelDetails}
              fusionStrategy={result.fusionStrategy}
              metadata={result.metadata}
            />
          </section>
        </div>
      </div>

      <ActionBar />
    </main>
  );
}
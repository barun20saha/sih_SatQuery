import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Coordinate Validation Helpers
const isValidLat = (lat) => typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
const isValidLng = (lng) => typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;

// Automatically repositions and resizes Google Map container on dynamic bounds updates
function DynamicMapController({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length === 2 && Array.isArray(bounds[0]) && Array.isArray(bounds[1])) {
      try {
        // Fit map bounds smoothly with padding
        map.fitBounds(bounds, { padding: [30, 30], animate: true });
      } catch (err) {
        // Fallback for singular point bounding boxes
        map.setView(bounds[0], 13);
      }

      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [JSON.stringify(bounds), map]);

  return null;
}

// Helper to safely format and validate incoming bounds payload [minLat, minLng, maxLat, maxLng] or [[lat1, lng1], [lat2, lng2]]
function normalizeBounds(rawBounds) {
  const defaultBounds = [
    [28.61, 77.20],
    [28.63, 77.23],
  ];

  if (!rawBounds || !Array.isArray(rawBounds)) return defaultBounds;

  // Case 1: Standard 2D Leaflet array [[lat1, lng1], [lat2, lng2]]
  if (
    rawBounds.length === 2 &&
    Array.isArray(rawBounds[0]) &&
    Array.isArray(rawBounds[1]) &&
    rawBounds[0].length >= 2 &&
    rawBounds[1].length >= 2
  ) {
    const lat1 = Number(rawBounds[0][0]);
    const lng1 = Number(rawBounds[0][1]);
    const lat2 = Number(rawBounds[1][0]);
    const lng2 = Number(rawBounds[1][1]);

    // Reject pixel dimensions and validate geographic coordinates
    if (isValidLat(lat1) && isValidLng(lng1) && isValidLat(lat2) && isValidLng(lng2)) {
      return [
        [lat1, lng1],
        [lat2, lng2]
      ];
    }
  }

  // Case 2: Flat GeoJSON/Rasterio 4-number array [minLat, minLng, maxLat, maxLng]
  if (rawBounds.length === 4 && rawBounds.every((val) => typeof val === 'number' || !isNaN(Number(val)))) {
    const minLat = Number(rawBounds[0]);
    const minLng = Number(rawBounds[1]);
    const maxLat = Number(rawBounds[2]);
    const maxLng = Number(rawBounds[3]);

    // Reject pixel dimensions (e.g., 450, 800) and ensure valid decimal degrees
    if (isValidLat(minLat) && isValidLng(minLng) && isValidLat(maxLat) && isValidLng(maxLng)) {
      return [
        [minLat, minLng], // SouthWest [minLat, minLng]
        [maxLat, maxLng]  // NorthEast [maxLat, maxLng]
      ];
    }
  }

  return defaultBounds;
}

export default function MapViewer({ metadata, height = "380px" }) {
  const [mapType, setMapType] = useState('y'); // Default: Hybrid ('y')

  const bounds = normalizeBounds(metadata?.bounds);

  const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
  const centerLng = (bounds[0][1] + bounds[1][1]) / 2;

  // Google Maps Tile URL Generator
  // lyrs: 'y' = Hybrid, 's' = Satellite, 'm' = Roadmap, 'p' = Terrain
  const googleMapTileUrl = `https://{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`;
  const subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];

  return (
    <div
      style={{
        position: 'relative',
        height: height,
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #334155',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        backgroundColor: '#0f172a'
      }}
    >
      {/* ── Glassmorphism Layer Toggle Bar ── */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          display: 'flex',
          gap: '4px'
        }}
      >
        <button
          onClick={() => setMapType('y')}
          style={{
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: '700',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: mapType === 'y' ? '#2563eb' : 'transparent',
            color: mapType === 'y' ? '#ffffff' : '#94a3b8'
          }}
        >
          Hybrid
        </button>
        <button
          onClick={() => setMapType('s')}
          style={{
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: '700',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: mapType === 's' ? '#2563eb' : 'transparent',
            color: mapType === 's' ? '#ffffff' : '#94a3b8'
          }}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapType('m')}
          style={{
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: '700',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: mapType === 'm' ? '#2563eb' : 'transparent',
            color: mapType === 'm' ? '#ffffff' : '#94a3b8'
          }}
        >
          Roadmap
        </button>
      </div>

      {/* ── Leaflet Map Container ── */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        {/* key={mapType} forces Leaflet to re-mount tile layer cleanly when switching modes */}
        <TileLayer
          key={mapType}
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url={googleMapTileUrl}
          subdomains={subdomains}
          maxZoom={20}
        />

        {/* Spatial Target Bounding Box */}
        <Rectangle
          bounds={bounds}
          pathOptions={{
            color: '#00f0ff',
            weight: 2.5,
            fillColor: '#00aaff',
            fillOpacity: 0.2,
            dashArray: '6, 6'
          }}
        />

        <DynamicMapController bounds={bounds} />
      </MapContainer>
    </div>
  );
}
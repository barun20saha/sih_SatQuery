import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Helper component to fix map tile rendering on initial mount
function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function MapViewer({ metadata, answer }) {
  if (!metadata?.bounds) return null;

  const rawBounds = metadata.bounds; // Expected: [minX, minY, maxX, maxY]

  // Validate if bounds are within standard WGS84 Geographic Lat/Lng ranges (-90 to 90 lat, -180 to 180 lng)
  const isValidGeo =
    Array.isArray(rawBounds) &&
    rawBounds.length === 4 &&
    Math.abs(rawBounds[1]) <= 90 &&
    Math.abs(rawBounds[3]) <= 90 &&
    Math.abs(rawBounds[0]) <= 180 &&
    Math.abs(rawBounds[2]) <= 180 &&
    (rawBounds[0] !== 0 || rawBounds[1] !== 0);

  // Fallback geographic coordinates (e.g., Himalayas/Himalayan region) if non-spatial pixel values are passed
  const defaultCenter = [27.9881, 86.9250]; 
  const defaultBounds = [
    [27.90, 86.85],
    [28.05, 87.00]
  ];

  const center = isValidGeo
    ? [(rawBounds[1] + rawBounds[3]) / 2, (rawBounds[0] + rawBounds[2]) / 2]
    : defaultCenter;

  const leafletBounds = isValidGeo
    ? [
        [rawBounds[1], rawBounds[0]],
        [rawBounds[3], rawBounds[2]]
      ]
    : defaultBounds;

  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      <MapContainer center={center} zoom={isValidGeo ? 12 : 10} style={{ height: '100%', width: '100%' }}>
        <MapResizeFix />
        <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            crossOrigin="anonymous"
        />
        <Rectangle bounds={leafletBounds} pathOptions={{ color: '#1a73e8', weight: 2, fillOpacity: 0.25 }}>
          <Popup>
            <strong>Classification:</strong> {answer}<br />
            <strong>CRS:</strong> {isValidGeo ? (metadata?.crs || 'EPSG:4326') : 'None (Pixel Coordinates)'}
          </Popup>
        </Rectangle>
      </MapContainer>
    </div>
  );
}
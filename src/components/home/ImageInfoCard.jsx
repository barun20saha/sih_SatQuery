import { useApp } from '../../context/AppContext';
import Card from '../common/Card';
import { inferModality, isGeoTIFF } from '../../utils/fileUtils';

export default function ImageInfoCard() {
  const { files } = useApp();
  const hasFiles = files.length > 0;
  const modality = inferModality(files);
  const geoCount = files.filter(isGeoTIFF).length;

  return (
    <Card id="image-info-card">
      <h2 className="card-heading">Image Information</h2>

      {!hasFiles ? (
        <p className="text-sm text-muted">No images uploaded yet.</p>
      ) : (
        <div>
          <div className="image-info-stat">
            <span className="image-info-stat__label">Images</span>
            <span className="image-info-stat__value">
              {files.length} selected
            </span>
          </div>

          <div className="image-info-stat">
            <span className="image-info-stat__label">Modality</span>
            <span className="image-info-stat__value">{modality}</span>
          </div>

          <div className="image-info-stat">
            <span className="image-info-stat__label">GeoTIFF</span>
            <span className="image-info-stat__value">
              {geoCount > 0 ? `${geoCount} file${geoCount > 1 ? 's' : ''} detected` : 'None'}
            </span>
          </div>

          <div className="image-info-stat">
            <span className="image-info-stat__label">Region</span>
            <span className="image-info-stat__value" style={{ fontSize: '12px' }}>
              {geoCount > 0 ? 'Auto-detected from CRS' : 'No geolocation data'}
            </span>
          </div>

          {files.length === 2 && (
            <div className="image-info-stat">
              <span className="image-info-stat__label">Query Type</span>
              <span className="image-info-stat__value">
                {files.some(f => f.name.toLowerCase().includes('sar') || f.name.toLowerCase().includes('radar'))
                  ? 'Optical + SAR Fusion'
                  : 'Bi-temporal Change'}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

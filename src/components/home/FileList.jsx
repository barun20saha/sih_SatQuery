import { useApp } from '../../context/AppContext';
import { formatFileSize, getFileTypeLabel, getFileIcon } from '../../utils/fileUtils';

export default function FileList() {
  const { files, filePreviews, removeFile } = useApp();

  if (files.length === 0) return null;

  const isGeoTIFF = (fileName) => {
    const ext = fileName.toLowerCase();
    return ext.endsWith('.tif') || ext.endsWith('.tiff');
  };

  return (
    <div className="file-list" role="list" aria-label="Uploaded files">
      <p className="file-list__heading">Uploaded Images</p>
      {files.map((file, i) => {
        const isTiff = isGeoTIFF(file.name);

        return (
          <div key={`${file.name}-${i}`} className="file-item" role="listitem">
            {/* Thumbnail or satellite badge for GeoTIFFs */}
            <div className="file-item__thumb">
              {isTiff ? (
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f4f8',
                    borderRadius: '4px',
                    fontSize: '18px'
                  }}
                  title="GeoTIFF Raster File"
                >
                  🛰️
                </div>
              ) : filePreviews[i] ? (
                <img
                  src={filePreviews[i]}
                  alt={`Preview of ${file.name}`}
                />
              ) : (
                <span aria-hidden="true">{getFileIcon(file)}</span>
              )}
            </div>

            {/* File info */}
            <div className="file-item__info">
              <div className="file-item__name" title={file.name}>{file.name}</div>
              <div className="file-item__meta">
                {getFileTypeLabel(file)} · {formatFileSize(file.size)}
                {i === 0 && files.length === 2 && ' · Image 1 (Before / Optical)'}
                {i === 1 && files.length === 2 && ' · Image 2 (After / SAR)'}
              </div>
            </div>

            {/* Remove button */}
            <button
              className="file-item__remove"
              onClick={() => removeFile(i)}
              aria-label={`Remove ${file.name}`}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
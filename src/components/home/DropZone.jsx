import { useRef, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { isSupportedFile } from '../../utils/fileUtils';

const MAX_FILES = 2;

export default function DropZone() {
  const { files, setFiles } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const inputRef = useRef(null);

  const processFiles = useCallback((incoming) => {
    setErrorMsg('');
    const supported = Array.from(incoming).filter(f => isSupportedFile(f));
    const unsupported = Array.from(incoming).length - supported.length;

    if (unsupported > 0) {
      setErrorMsg(`${unsupported} file(s) skipped — unsupported format.`);
    }

    // Merge with existing, cap at MAX_FILES
    const merged = [...files, ...supported].slice(0, MAX_FILES);
    if (merged.length < files.length + supported.length) {
      setErrorMsg(`Maximum ${MAX_FILES} images allowed. Extra files were ignored.`);
    }

    if (merged.length > 0) setFiles(merged);
  }, [files, setFiles]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = ''; // allow re-selecting same file
  };

  const handleClick = () => {
    if (files.length < MAX_FILES) inputRef.current?.click();
  };

  const isAtMax = files.length >= MAX_FILES;

  return (
    <div>
      <div
        id="dropzone-area"
        className={`dropzone ${isDragging ? 'dropzone--active' : ''} ${isAtMax ? 'dropzone--disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={isAtMax ? -1 : 0}
        aria-label="Upload satellite images"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        style={{ cursor: isAtMax ? 'default' : 'pointer', opacity: isAtMax ? 0.6 : 1 }}
      >
        <span className="dropzone__icon" aria-hidden="true">🛰️</span>
        <p className="dropzone__primary">
          {isAtMax
            ? 'Maximum 2 images uploaded'
            : 'Drag satellite images here or '}
          {!isAtMax && (
            <span className="dropzone__browse">click to browse</span>
          )}
        </p>
        <p className="dropzone__secondary">
          Accepts: GeoTIFF, TIFF, PNG, JPEG &nbsp;·&nbsp; Max 2 images
        </p>

        {!isAtMax && (
          <input
            ref={inputRef}
            type="file"
            id="file-input"
            accept=".tiff,.tif,.png,.jpg,.jpeg,.geotiff,image/tiff,image/png,image/jpeg"
            multiple
            onChange={handleInputChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
      </div>

      {errorMsg && (
        <p className="file-limit-notice" role="alert" style={{ marginTop: '8px' }}>
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
}

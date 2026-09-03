/**
 * SatQuery AI — File Utilities
 */

const SUPPORTED_TYPES = [
  'image/tiff',
  'image/png',
  'image/jpeg',
  'image/jpg',
  // GeoTIFF often has non-standard MIME types
  'application/octet-stream',
];

const SUPPORTED_EXTENSIONS = ['.tiff', '.tif', '.png', '.jpg', '.jpeg', '.geotiff'];

/**
 * Checks if a file is a supported satellite image format.
 */
export function isSupportedFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return SUPPORTED_TYPES.includes(file.type) || SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Formats a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Returns the display file type label.
 */
export function getFileTypeLabel(file) {
  const ext = file.name.split('.').pop().toUpperCase();
  if (['TIFF', 'TIF', 'GEOTIFF'].includes(ext)) return 'GeoTIFF';
  return ext;
}

/**
 * Returns an emoji icon for a file based on its type.
 */
export function getFileIcon(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (['tiff', 'tif', 'geotiff'].includes(ext)) return '🛰️';
  if (ext === 'png') return '🖼️';
  if (['jpg', 'jpeg'].includes(ext)) return '📷';
  return '📄';
}

/**
 * Creates an object URL for previewing an image file.
 * Remember to call URL.revokeObjectURL(url) when done.
 */
export function createObjectURL(file) {
  return URL.createObjectURL(file);
}

/**
 * Infers modality description from uploaded files.
 */
export function inferModality(files) {
  if (!files || files.length === 0) return null;
  if (files.length === 1) {
    const ext = files[0].name.split('.').pop().toLowerCase();
    if (['tiff', 'tif', 'geotiff'].includes(ext)) return 'GeoTIFF · Optical';
    return 'Single Optical Image';
  }
  if (files.length === 2) {
    // Simple heuristic: if names contain 'sar' or 'radar', flag as SAR
    const names = files.map(f => f.name.toLowerCase());
    const hasSAR = names.some(n => n.includes('sar') || n.includes('radar') || n.includes('sentinel1'));
    if (hasSAR) return 'Optical + SAR';
    return 'Bi-temporal (2 images)';
  }
  return `${files.length} images`;
}

/**
 * Detects if a file is likely a GeoTIFF.
 */
export function isGeoTIFF(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  return ['tiff', 'tif', 'geotiff'].includes(ext);
}

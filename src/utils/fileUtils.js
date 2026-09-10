/**
 * SatQuery AI — File Utility Helper Methods
 */

/**
 * Safely formats byte sizes into human-readable strings (KB, MB, GB)
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return 'GeoTIFF / Raster';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Safely extracts file name or provides a default fallback string
 */
export function getSafeFileName(file, index = 0) {
  if (!file) return `Satellite_Image_${index + 1}.tif`;
  if (typeof file === 'string') {
    const parts = file.split('/');
    return parts[parts.length - 1] || `Satellite_Image_${index + 1}.tif`;
  }
  return file?.name || `Satellite_Image_${index + 1}.tif`;
}

/**
 * Infers sensor modality (SAR, Multispectral, GeoTIFF, RGB) safely from file metadata or filename
 */
export function inferModality(file) {
  if (!file) return 'RGB Optical';

  const fileName = getSafeFileName(file).toLowerCase();

  if (
    fileName.includes('sar') || 
    fileName.includes('sentinel1') || 
    fileName.includes('vv') || 
    fileName.includes('vh')
  ) {
    return 'SAR / Radar';
  }

  if (
    fileName.includes('nir') || 
    fileName.includes('ndvi') || 
    fileName.includes('multispectral') || 
    fileName.includes('sentinel2')
  ) {
    return 'Multispectral';
  }

  if (fileName.endsWith('.tif') || fileName.endsWith('.tiff')) {
    return 'GeoTIFF Raster';
  }

  return 'RGB Optical';
}

/**
 * Validates whether uploaded files are supported image or GIS formats
 */
export function isValidSatelliteFile(file) {
  if (!file) return false;

  const fileName = getSafeFileName(file).toLowerCase();
  const validExtensions = ['.tif', '.tiff', '.png', '.jpg', '.jpeg', '.webp'];

  return validExtensions.some((ext) => fileName.endsWith(ext));
}
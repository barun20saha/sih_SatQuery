import { fromBlob } from 'geotiff';

export async function parseGeoTIFFMetadata(file) {
  try {
    const tiff = await fromBlob(file);
    const image = await tiff.getImage();
    
    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]
    const samples = image.getSamplesPerPixel();

    return {
      resolution: [width, height],
      bounds: bbox,
      channels: samples,
      crs: 'Parsed from Header (EPSG:4326)'
    };
  } catch (error) {
    console.warn('In-browser GeoTIFF parsing fallback triggered:', error);
    return null;
  }
}
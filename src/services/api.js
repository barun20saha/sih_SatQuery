/**
 * SatQuery AI — API Service (v2 — Hybrid Architecture)
 *
 * Request flow:
 *   React UI  →  Spring Boot Gateway (8080)  →  Python FastAPI (8000)
 *              └─ /api/v1/analyze             └─ /api/v1/analyze
 *              └─ /api/v1/upload              └─ /api/v1/upload
 *              └─ /api/v1/history             └─ /api/v1/history
 *
 * To switch from mock to real backend:
 *   1. Set VITE_MOCK_MODE=false  in your .env file
 *   2. Start docker compose, Python backend on 8000, and Spring Boot on 8080
 *
 * CLOUD GPU:
 *   Set CLOUD_GPU_ENDPOINT=https://<ngrok-url> in the backend .env to route
 *   inference requests to Colab/Kaggle. Leave empty for mock responses.
 */

import axios from 'axios';
import { getMockResponse } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false';
const API_BASE  = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/** Axios client — all requests through the Spring Boot Gateway on port 8080 */
const client = axios.create({
  baseURL: API_BASE,
  timeout: 0, // No client-side timeout — ML inference can take minutes
});

// ─── Request/Response interceptors for unified logging ──────────────────────

client.interceptors.request.use((config) => {
  console.info(`[SatQuery] → ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

client.interceptors.response.use(
  (res) => {
    console.info(`[SatQuery] ← ${res.status} ${res.config.url}`);
    return res;
  },
  (err) => {
    console.error(`[SatQuery] ✗ ${err.response?.status ?? 'NET'} ${err.config?.url}`, err.message);
    return Promise.reject(err);
  }
);


// ─── analyzeImages ───────────────────────────────────────────────────────────

/**
 * Analyze satellite images with a natural language query.
 *
 * Routes through: Gateway (8080) → /api/v1/analyze → FastAPI (8000)
 *
 * @param {File[]}  files      - Array of File objects (1 or 2 satellite images)
 * @param {string}  query      - Natural language query string
 * @param {boolean} useCloud   - Force cloud GPU dispatch (default false)
 * @returns {Promise<Object>}  - Analysis result object
 */
export async function analyzeImages(files, query, useCloud = false) {
  if (MOCK_MODE) {
    console.info('[SatQuery] Mock mode active — using mock response');
    return getMockResponse(files, query);
  }

  try {
    const formData = new FormData();

    // Append images — v1 API expects image1 (required) and image2 (optional)
    if (files.length > 0) formData.append('image1', files[0]);
    if (files.length > 1) formData.append('image2', files[1]);

    formData.append('query', query || '');
    if (useCloud) formData.append('use_cloud', 'true');

    const response = await client.post('/api/v1/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (err) {
    // If backend returned a structured error, propagate it to the results UI
    if (err.response?.data && err.response.data.error) {
      return err.response.data;
    }
    const detail =
      err.response?.data?.detail ||
      err.message ||
      'Error connecting to the SatQuery backend. Is the Gateway running on port 8080?';
    throw new Error(detail);
  }
}


// ─── uploadImage ─────────────────────────────────────────────────────────────

/**
 * Upload a single satellite image to MinIO via the v1 upload endpoint.
 *
 * @param {File}  file  - Satellite image File object
 * @returns {Promise<{objectKey: string|null, presignedUrl: string|null, size: number}>}
 */
export async function uploadImage(file) {
  if (MOCK_MODE) {
    console.info('[SatQuery] Mock mode — skipping upload');
    return { objectKey: null, presignedUrl: null, size: file.size, message: 'Mock mode active' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/api/v1/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    console.error('[SatQuery] Upload failed:', err.message);
    return { objectKey: null, presignedUrl: null, size: file.size, message: err.message };
  }
}


// ─── getHistory ──────────────────────────────────────────────────────────────

/**
 * Retrieve recent query history from MongoDB.
 *
 * @param {number} limit - Max records to fetch (default 20)
 * @returns {Promise<{records: Array, count: number, source: string}>}
 */
export async function getHistory(limit = 20) {
  if (MOCK_MODE) return { records: [], count: 0, source: 'mock' };
  try {
    const response = await client.get(`/api/v1/history?limit=${limit}`);
    return response.data;
  } catch (err) {
    console.warn('[SatQuery] History fetch failed:', err.message);
    return { records: [], count: 0, source: 'unavailable' };
  }
}


// ─── getStorageStatus ────────────────────────────────────────────────────────

/**
 * Check storage service availability (MinIO, MongoDB, Redis, Cloud GPU).
 *
 * @returns {Promise<{redis, mongodb, minio, cloudGpu}>}
 */
export async function getStorageStatus() {
  if (MOCK_MODE) {
    return { redis: 'mock', mongodb: 'mock', minio: 'mock', cloudGpu: 'mock_mode' };
  }
  try {
    const response = await client.get('/api/v1/storage-status');
    return response.data;
  } catch {
    return { redis: 'unavailable', mongodb: 'unavailable', minio: 'unavailable', cloudGpu: 'unavailable' };
  }
}


// ─── checkHealth ─────────────────────────────────────────────────────────────

/**
 * Health check — pings the backend health endpoint.
 *
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
  if (MOCK_MODE) return true;
  try {
    await client.get('/api/health');
    return true;
  } catch {
    return false;
  }
}


// ─── Legacy compatibility export ─────────────────────────────────────────────
// Ensures existing components that import { analyzeImages } still work unchanged.
export default { analyzeImages, uploadImage, getHistory, getStorageStatus, checkHealth };

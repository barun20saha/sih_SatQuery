/**
 * SatQuery AI — API Service
 * 
 * All HTTP calls to the backend funnel through this module.
 * To switch from mock to real backend:
 *   1. Set VITE_MOCK_MODE=false in your .env file
 *   2. Set VITE_API_BASE_URL=http://your-backend-host:8080
 * 
 * The UI layer never needs to change — only this file and mockData.js matter.
 */

import axios from 'axios';
import { getMockResponse } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false';
const API_BASE  = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120_000, // 2 minute timeout for large image processing
});

/**
 * Analyze satellite images with a natural language query.
 * 
 * @param {File[]} files       - Array of File objects (1 or 2 satellite images)
 * @param {string} query       - Natural language query string
 * @returns {Promise<Object>}  - Analysis result matching the contract in mockData.js
 */
export async function analyzeImages(files, query) {
  if (MOCK_MODE) {
    console.info('[SatQuery] Mock mode active — using mock response');
    return getMockResponse(files, query);
  }

  // --- Real backend call ---
  const formData = new FormData();
  files.forEach((file, i) => formData.append(`image${i + 1}`, file));
  formData.append('query', query);

  const response = await client.post('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

/**
 * Health check for the backend (optional ping).
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

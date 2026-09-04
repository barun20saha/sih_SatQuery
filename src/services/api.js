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

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://unpleased-spinach-repeater.ngrok-free.dev';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120_000,
  headers: {
    'ngrok-skip-browser-warning': '69420',
  },
});

export async function analyzeImages(files, query) {
  if (MOCK_MODE) {
    return getMockResponse(files, query);
  }

  const formData = new FormData();
  
  if (files && files.length > 0) {
    formData.append('file', files[0]);
  }
  
  formData.append('query', query || 'Analyze land cover classification');

  const response = await client.post('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function checkHealth() {
  if (MOCK_MODE) return true;
  try {
    await client.get('/api/health');
    return true;
  } catch {
    return false;
  }
}
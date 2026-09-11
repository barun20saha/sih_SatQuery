import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

// Initial sample analyses matching Section 2 & 3 wireframes
const INITIAL_HISTORY = [
  {
    id: 'hist-1',
    title: 'Urban change detection',
    query: 'Detect urban settlements and estimate vegetation loss between acquisitions',
    taskType: 'VQA',
    status: 'completed',
    confidence: 0.87,
    timestamp: '2 hours ago',
    date: '2026-09-10',
    modality: 'Bi-temporal Optical',
    model: 'YOLOv8-Geospatial',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Landsat8-WRS2-014028-20130706-img.jpg/320px-Landsat8-WRS2-014028-20130706-img.jpg',
    answer: 'The image shows urban settlement expansion with mixed residential and commercial zones. Approximately 35% vegetation coverage remains in the surrounding perimeter.',
  },
  {
    id: 'hist-2',
    title: 'Water body classification',
    query: 'Use optical and SAR data to delineate reservoir boundaries',
    taskType: 'Captioning',
    status: 'completed',
    confidence: 0.93,
    timestamp: '5 hours ago',
    date: '2026-09-10',
    modality: 'Optical + SAR Fusion',
    model: 'SARChat & DeepFuse',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/SIR-C_image_of_the_Teotihuacan_pyramid_complex.jpg/320px-SIR-C_image_of_the_Teotihuacan_pyramid_complex.jpg',
    answer: 'Water body boundaries confirmed across 142 km² with high surface specular reflection in SAR and matching NDWI spectral signatures.',
  },
  {
    id: 'hist-3',
    title: 'Change analysis Delhi',
    query: 'Identify infrastructure development and road network expansion',
    taskType: 'Bi-temporal',
    status: 'completed',
    confidence: 0.85,
    timestamp: 'Yesterday',
    date: '2026-09-09',
    modality: 'Bi-temporal Sentinel-2',
    model: 'BIT-ChangeNet',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Landsat8-WRS2-014028-20130706-img.jpg/320px-Landsat8-WRS2-014028-20130706-img.jpg',
    answer: 'Identified 34 km² of newly surfaced road infrastructure and 18% increase in built-up footprint in the northern sector.',
  },
  {
    id: 'hist-4',
    title: 'Agricultural drought assessment',
    query: 'Assess soil moisture anomalies and crop stress indicators',
    taskType: 'Grounding',
    status: 'completed',
    confidence: 0.79,
    timestamp: '3 days ago',
    date: '2026-09-07',
    modality: 'Multispectral Landsat',
    model: 'GeoChat-CropNet',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Landsat8-WRS2-014028-20130706-img.jpg/320px-Landsat8-WRS2-014028-20130706-img.jpg',
    answer: 'Moderate crop stress detected across 42% of cultivated fields. Moisture deficit correlated with prolonged heatwave index.',
  },
];

const LOADING_STEPS = [
  'Validating imagery & checking ground sampling distance...',
  'Extracting GeoTIFF geospatial metadata & bands...',
  'Executing multi-modal neural feature extraction...',
  'Synthesizing spatial grounding & evidence overlays...',
  'Calculating confidence metrics & assembling intelligence report...',
];

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('satquery_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const initialState = {
  theme: getInitialTheme(),
  files: [],
  filePreviews: [],
  query: '',
  selectedImageType: 'auto',
  result: null,
  isLoading: false,
  error: null,
  loadingStep: 0,
  history: INITIAL_HISTORY,
  isSidebarCollapsed: false,
  isMobileNavOpen: false,
  isSettingsOpen: false,
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'TOGGLE_THEME': {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      return { ...state, theme: nextTheme };
    }

    case 'SET_FILES': {
      state.filePreviews.forEach((url) => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      return {
        ...state,
        files: action.files,
        filePreviews: action.previews,
        result: null,
        error: null,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
      };
    }

    case 'REMOVE_FILE': {
      const idx = action.index;
      if (state.filePreviews[idx]?.startsWith('blob:')) {
        URL.revokeObjectURL(state.filePreviews[idx]);
      }
      return {
        ...state,
        files: state.files.filter((_, i) => i !== idx),
        filePreviews: state.filePreviews.filter((_, i) => i !== idx),
      };
    }

    case 'SET_QUERY':
      return { ...state, query: action.query };

    case 'SET_IMAGE_TYPE':
      return { ...state, selectedImageType: action.imageType };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading, loadingStep: 0, error: null };

    case 'SET_LOADING_STEP':
      return { ...state, loadingStep: action.step };

    case 'SET_RESULT': {
      let updatedHistory = state.history;
      if (action.result && !action.result.error) {
        const newEntry = {
          id: `hist-${Date.now()}`,
          title: state.query.slice(0, 42) + (state.query.length > 42 ? '...' : ''),
          query: state.query,
          taskType: action.result.queryType ? action.result.queryType.toUpperCase() : 'VQA',
          status: 'completed',
          confidence: action.result.confidence?.score || 0.88,
          timestamp: 'Just now',
          date: new Date().toISOString().split('T')[0],
          modality: state.files.length > 1 ? 'Multi-modal / Multi-temporal' : 'Single Satellite Optical',
          model: action.result.modelDetails?.[0]?.name || 'RS-VLM (GeoChat)',
          thumbnail: state.filePreviews[0] || 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Landsat8-WRS2-014028-20130706-img.jpg/320px-Landsat8-WRS2-014028-20130706-img.jpg',
          answer: action.result.answer,
        };
        updatedHistory = [newEntry, ...state.history];
      }
      return {
        ...state,
        result: action.result,
        history: updatedHistory,
        isLoading: false,
        error: null,
      };
    }

    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };

    case 'SET_ZOOM':
      return { ...state, zoomLevel: Math.max(0.5, Math.min(3, action.zoom)) };

    case 'SET_PAN':
      return { ...state, panOffset: action.pan };

    case 'RESET_VIEWPORT':
      return { ...state, zoomLevel: 1, panOffset: { x: 0, y: 0 } };

    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };

    case 'SET_MOBILE_NAV':
      return { ...state, isMobileNavOpen: action.open };

    case 'SET_SETTINGS_OPEN':
      return { ...state, isSettingsOpen: action.open };

    case 'LOAD_HISTORY_ITEM':
      return {
        ...state,
        query: action.item.query,
        result: {
          answer: action.item.answer,
          confidence: {
            score: action.item.confidence,
            level: action.item.confidence >= 0.8 ? 'high' : 'medium',
            explanation: `Loaded from historical analysis record (${action.item.title}).`,
          },
          evidence: {
            type: action.item.taskType.toLowerCase() === 'sar' ? 'sar' :
                  action.item.taskType.toLowerCase() === 'bi-temporal' ? 'change' : 'vqa',
            originalImage: action.item.thumbnail,
            beforeImage: action.item.thumbnail,
            afterImage: action.item.thumbnail,
            groundingBoxes: [
              { label: 'Urban Settlement', x: 0.15, y: 0.12, w: 0.35, h: 0.30, color: '#1A3A52' },
              { label: 'Vegetation Canopy', x: 0.55, y: 0.22, w: 0.28, h: 0.32, color: '#2D9D78' },
            ],
          },
          executionTrace: {
            task: action.item.taskType,
            inputCount: '1-2 satellite scenes',
            modelsUsed: [action.item.model],
            steps: ['Loaded from cached intelligence run', 'Verified spatial telemetry', 'Displayed evidence'],
            duration: '0.04s (cached)',
            status: 'completed',
          },
          modelDetails: [
            { name: action.item.model, confidence: action.item.confidence.toString(), inputType: 'Satellite', role: 'Primary Inference' },
          ],
        },
      };

    case 'RESET':
      state.filePreviews.forEach((url) => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      return {
        ...initialState,
        theme: state.theme,
        history: state.history,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('satquery_theme', state.theme);
    } catch {}
  }, [state.theme]);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
  }, []);

  const setFiles = useCallback((files) => {
    const previews = files.map((f) => {
      try {
        return URL.createObjectURL(f);
      } catch {
        return null;
      }
    });
    dispatch({ type: 'SET_FILES', files, previews });
  }, []);

  const removeFile = useCallback((index) => {
    dispatch({ type: 'REMOVE_FILE', index });
  }, []);

  const setQuery = useCallback((query) => {
    dispatch({ type: 'SET_QUERY', query });
  }, []);

  const setImageType = useCallback((imageType) => {
    dispatch({ type: 'SET_IMAGE_TYPE', imageType });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: 'SET_LOADING', loading });
  }, []);

  const setLoadingStep = useCallback((step) => {
    dispatch({ type: 'SET_LOADING_STEP', step });
  }, []);

  const setResult = useCallback((result) => {
    dispatch({ type: 'SET_RESULT', result });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const setZoom = useCallback((zoom) => {
    dispatch({ type: 'SET_ZOOM', zoom });
  }, []);

  const setPan = useCallback((pan) => {
    dispatch({ type: 'SET_PAN', pan });
  }, []);

  const resetViewport = useCallback(() => {
    dispatch({ type: 'RESET_VIEWPORT' });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setMobileNav = useCallback((open) => {
    dispatch({ type: 'SET_MOBILE_NAV', open });
  }, []);

  const setSettingsOpen = useCallback((open) => {
    dispatch({ type: 'SET_SETTINGS_OPEN', open });
  }, []);

  const loadHistoryItem = useCallback((item) => {
    dispatch({ type: 'LOAD_HISTORY_ITEM', item });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = {
    ...state,
    loadingSteps: LOADING_STEPS,
    toggleTheme,
    setFiles,
    removeFile,
    setQuery,
    setImageType,
    setLoading,
    setLoadingStep,
    setResult,
    setError,
    setZoom,
    setPan,
    resetViewport,
    toggleSidebar,
    setMobileNav,
    setSettingsOpen,
    loadHistoryItem,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

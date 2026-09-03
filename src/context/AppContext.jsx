/**
 * SatQuery AI — App Context
 * 
 * Central state store for the entire application.
 * Components consume this via the useApp() hook.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
  // Uploaded files (max 2)
  files: [],
  // Object URLs for previewing uploaded files
  filePreviews: [],
  // The user's query string
  query: '',
  // Analysis result from backend (or mock)
  result: null,
  // Loading / error state
  isLoading: false,
  error: null,
  // Loading step index (for animated loading steps)
  loadingStep: 0,
};

const LOADING_STEPS = [
  'Validating images...',
  'Extracting metadata...',
  'Running AI analysis...',
  'Generating visual evidence...',
  'Synthesizing results...',
];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FILES': {
      // Revoke old object URLs to prevent memory leaks
      state.filePreviews.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      return {
        ...state,
        files: action.files,
        filePreviews: action.previews,
        result: null,
        error: null,
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
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading, loadingStep: 0, error: null };
    case 'SET_LOADING_STEP':
      return { ...state, loadingStep: action.step };
    case 'SET_RESULT':
      return { ...state, result: action.result, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'RESET':
      state.filePreviews.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      return { ...initialState };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setFiles = useCallback((files) => {
    const previews = files.map(f => {
      try { return URL.createObjectURL(f); }
      catch { return null; }
    });
    dispatch({ type: 'SET_FILES', files, previews });
  }, []);

  const removeFile = useCallback((index) => {
    dispatch({ type: 'REMOVE_FILE', index });
  }, []);

  const setQuery = useCallback((query) => {
    dispatch({ type: 'SET_QUERY', query });
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

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = {
    ...state,
    loadingSteps: LOADING_STEPS,
    setFiles,
    removeFile,
    setQuery,
    setLoading,
    setLoadingStep,
    setResult,
    setError,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

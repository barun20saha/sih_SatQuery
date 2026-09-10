import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [files, setFilesState] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [result, setResultState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);

  // Helper to revoke Blob URLs and prevent browser memory leaks
  const revokePreviews = (previewsToClean) => {
    previewsToClean.forEach((url) => {
      if (typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };

  // 1. Append new files and generate object previews safely
  const addFiles = (newFiles) => {
    const fileArray = Array.isArray(newFiles) ? newFiles : [newFiles];
    const cleanFiles = fileArray.map((f) => (f?.file ? f.file : f));
    setFilesState((prev) => [...prev, ...cleanFiles]);

    const newPreviews = cleanFiles.map((file) =>
      file instanceof File ? URL.createObjectURL(file) : file
    );
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  // 2. Remove file by array index with URL cleanup
  const removeFile = (index) => {
    setFilePreviews((prev) => {
      if (prev[index]) revokePreviews([prev[index]]);
      return prev.filter((_, i) => i !== index);
    });
    setFilesState((prev) => prev.filter((_, i) => i !== index));
    
    // Adjust active index if necessary
    setActiveFileIndex((prev) => (prev >= index && prev > 0 ? prev - 1 : prev));
  };

  // 3. Overwrite or reset entire files array
  const updateFiles = (newFiles) => {
    // Clean up existing previews first
    revokePreviews(filePreviews);

    if (Array.isArray(newFiles) && newFiles.length > 0) {
      const cleanFiles = newFiles.map((f) => (f?.file ? f.file : f));
      setFilesState(cleanFiles);
      setFilePreviews(
        cleanFiles.map((file) => (file instanceof File ? URL.createObjectURL(file) : file))
      );
      setActiveFileIndex(0);
    } else {
      setFilesState([]);
      setFilePreviews([]);
      setActiveFileIndex(0);
    }
  };

  // 4. Update analysis result and reset error state
  const setResult = (data) => {
    setError(null);
    setResultState(data);
  };

  // 5. Update loading flag
  const setLoading = (val) => {
    setIsLoading(val);
    if (val) setError(null);
  };

  // 6. Complete state reset for "New Query" navigation
  const clearAll = () => {
    revokePreviews(filePreviews);
    setFilesState([]);
    setFilePreviews([]);
    setActiveFileIndex(0);
    setQuery('');
    setResultState(null);
    setError(null);
    setLoadingStep(0);
    setIsLoading(false);
  };

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => revokePreviews(filePreviews);
  }, []);

  return (
    <AppContext.Provider
      value={{
        files,
        setFiles: updateFiles,
        addFiles,
        removeFile,
        filePreviews,
        activeFileIndex,
        setActiveFileIndex,
        query,
        setQuery,
        result,
        setResult,
        isLoading,
        setLoading,
        loadingStep,
        setLoadingStep,
        error,
        setError,
        clearAll,
        reset: clearAll, // Exported alias for ActionBar.jsx reset() calls
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
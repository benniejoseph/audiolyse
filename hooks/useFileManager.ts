'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FileWithId, BulkCallResult, ApiResult } from '@/lib/types';
import { PROCESSING_CONFIG } from '@/lib/constants';

interface UseFileManagerReturn {
  files: FileWithId[];
  fileUrls: Map<string, string>;
  bulkResults: BulkCallResult[];
  isLoading: boolean;
  addFiles: (newFiles: File[]) => void;
  removeFile: (id: string) => void;
  clearAll: () => void;
  processFiles: () => Promise<void>;
}

/**
 * Generate unique file ID
 */
function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Process a single file
 */
async function processFile(
  file: File, 
  id: string, 
  setFileUrls: React.Dispatch<React.SetStateAction<Map<string, string>>>
): Promise<BulkCallResult> {
  // Create blob URL for audio playback
  const audioUrl = URL.createObjectURL(file);
  setFileUrls(prev => new Map(prev).set(id, audioUrl));

  try {
    const formData = new FormData();
    formData.append('audio', file);
    
    const response = await fetch('/api/transcribe', { 
      method: 'POST', 
      body: formData 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to process audio');
    }
    
    const data: ApiResult = await response.json();
    
    return { 
      id, 
      fileName: file.name, 
      fileSize: file.size, 
      status: 'completed', 
      result: data, 
      audioUrl 
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    return { 
      id, 
      fileName: file.name, 
      fileSize: file.size, 
      status: 'error', 
      error: message, 
      audioUrl 
    };
  }
}

/**
 * Process files in parallel with concurrency control
 */
async function processFilesInParallel(
  files: FileWithId[],
  setFileUrls: React.Dispatch<React.SetStateAction<Map<string, string>>>,
  updateResult: (id: string, result: Partial<BulkCallResult>) => void,
  concurrency: number = PROCESSING_CONFIG.MAX_CONCURRENT
): Promise<void> {
  const queue = [...files];
  const activePromises: Promise<void>[] = [];

  const processNext = async (): Promise<void> => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      // Mark as processing
      updateResult(item.id, { status: 'processing' });

      // Process the file
      const result = await processFile(item.file, item.id, setFileUrls);
      
      // Update with result
      updateResult(item.id, result);
    }
  };

  // Start concurrent workers
  for (let i = 0; i < Math.min(concurrency, files.length); i++) {
    activePromises.push(processNext());
  }

  await Promise.all(activePromises);
}

/**
 * Custom hook for managing file uploads with proper blob URL cleanup
 */
export function useFileManager(): UseFileManagerReturn {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());
  const [bulkResults, setBulkResults] = useState<BulkCallResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track URLs for cleanup
  const urlsToCleanup = useRef<Set<string>>(new Set());

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      urlsToCleanup.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      fileUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback((newFiles: File[]) => {
    const filesWithIds: FileWithId[] = newFiles.map(file => ({
      id: generateFileId(),
      file,
    }));
    setFiles(prev => [...prev, ...filesWithIds]);
  }, []);

  const removeFile = useCallback((id: string) => {
    // Revoke the blob URL if it exists
    setFileUrls(prev => {
      const url = prev.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        urlsToCleanup.current.delete(url);
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    
    setFiles(prev => prev.filter(f => f.id !== id));
    setBulkResults(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    // Revoke all blob URLs
    fileUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    urlsToCleanup.current.clear();
    
    setFileUrls(new Map());
    setFiles([]);
    setBulkResults([]);
  }, [fileUrls]);

  const updateResult = useCallback((id: string, update: Partial<BulkCallResult>) => {
    setBulkResults(prev => prev.map(r => 
      r.id === id ? { ...r, ...update } : r
    ));
  }, []);

  const processFiles = useCallback(async () => {
    if (files.length === 0 || isLoading) return;

    setIsLoading(true);

    // Initialize results as pending
    const initialResults: BulkCallResult[] = files.map(({ id, file }) => ({
      id,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending',
    }));
    setBulkResults(initialResults);

    // Track URLs for cleanup
    fileUrls.forEach(url => urlsToCleanup.current.add(url));

    try {
      await processFilesInParallel(files, setFileUrls, updateResult);
    } finally {
      setIsLoading(false);
    }
  }, [files, isLoading, fileUrls, updateResult]);

  return {
    files,
    fileUrls,
    bulkResults,
    isLoading,
    addFiles,
    removeFile,
    clearAll,
    processFiles,
  };
}

export default useFileManager;

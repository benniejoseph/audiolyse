'use client';

import React, { useCallback } from 'react';
import { SUPPORTED_AUDIO_EXTENSIONS } from '@/lib/constants';

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  dragOver: boolean;
  setDragOver: (value: boolean) => void;
}

/**
 * Drag and drop zone for audio files
 */
export const FileDropzone = React.memo(function FileDropzone({
  onFilesAdded,
  dragOver,
  setDragOver,
}: FileDropzoneProps) {
  const onDrop = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDragOver(false);
    
    const droppedFiles = Array.from(ev.dataTransfer.files).filter(f => 
      f.type.startsWith('audio/') || 
      f.type.startsWith('video/') || 
      f.type === 'application/octet-stream' ||
      SUPPORTED_AUDIO_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    
    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles);
    }
  }, [onFilesAdded, setDragOver]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, [setDragOver]);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, [setDragOver]);

  const onFileInputChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(ev.target.files || []);
    if (selectedFiles.length > 0) {
      onFilesAdded(selectedFiles);
    }
    // Reset input so the same file can be selected again
    ev.target.value = '';
  }, [onFilesAdded]);

  const handleClick = useCallback(() => {
    document.getElementById('file-input')?.click();
  }, []);

  return (
    <div 
      className={`uploader ${dragOver ? 'dragover' : ''}`} 
      onDragOver={onDragOver} 
      onDragLeave={onDragLeave} 
      onDrop={onDrop}
    >
      <div className="upload-icon">📁</div>
      <p>Drag & drop audio files or click to browse</p>
      <div className="fileWrap">
        <button 
          type="button" 
          className="fileCTA" 
          onClick={handleClick}
        >
          Choose Files
        </button>
        <input 
          id="file-input" 
          type="file" 
          accept="audio/*,.mpeg,.mpga,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.amr,.3gp,.mp4,video/mpeg,audio/mpeg" 
          multiple 
          onChange={onFileInputChange} 
          style={{ display: 'none' }} 
        />
      </div>
    </div>
  );
});

export default FileDropzone;

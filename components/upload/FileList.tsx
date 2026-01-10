'use client';

import React from 'react';
import type { FileWithId } from '@/lib/types';

interface FileListProps {
  files: FileWithId[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
}

interface FileItemProps {
  file: FileWithId;
  onRemove: (id: string) => void;
}

/**
 * Single file item in the list
 */
const FileItem = React.memo(function FileItem({ file, onRemove }: FileItemProps) {
  return (
    <div className="file-item">
      <span className="file-icon">🎵</span>
      <span className="file-name">{file.file.name}</span>
      <span className="file-size">{Math.round(file.file.size / 1024)} KB</span>
      <button 
        className="remove-btn" 
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.file.name}`}
      >
        ×
      </button>
    </div>
  );
});

/**
 * List of uploaded files
 */
export const FileList = React.memo(function FileList({ 
  files, 
  onRemoveFile, 
  onClearAll 
}: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h4>Selected Files ({files.length})</h4>
        <button 
          className="clear-btn" 
          onClick={onClearAll}
        >
          Clear All
        </button>
      </div>
      <div className="file-items">
        {files.map((file) => (
          <FileItem 
            key={file.id} 
            file={file} 
            onRemove={onRemoveFile} 
          />
        ))}
      </div>
    </div>
  );
});

export default FileList;

import path from 'path';

// Supported formats by Gemini
const GEMINI_SUPPORTED_MIMES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
];

export interface ProcessedAudio {
  buffer: Buffer;
  mimeType: string;
  originalFormat: string;
}

/**
 * Normalize audio MIME type for Gemini
 * Gemini supports most audio formats directly
 */
export function processAudioForAnalysis(
  inputBuffer: Buffer,
  originalMimeType: string,
  originalFileName?: string
): ProcessedAudio {
  const normalizedMime = normalizeAudioMimeType(originalMimeType, originalFileName);
  
  console.log(`[Audio] Original MIME: ${originalMimeType}, Normalized: ${normalizedMime}`);
  
  return {
    buffer: inputBuffer,
    mimeType: normalizedMime,
    originalFormat: originalMimeType,
  };
}

/**
 * Normalize MIME type for Gemini
 */
function normalizeAudioMimeType(mimeType: string, fileName?: string): string {
  const mime = mimeType.toLowerCase();
  
  // Map common variations to standard types that Gemini accepts
  const mimeMap: Record<string, string> = {
    // MPEG variants -> audio/mpeg (Gemini supported)
    'audio/mpeg': 'audio/mpeg',
    'audio/mp3': 'audio/mpeg',
    'audio/x-mp3': 'audio/mpeg',
    'audio/x-mpeg': 'audio/mpeg',
    'audio/mpeg3': 'audio/mpeg',
    'video/mpeg': 'audio/mpeg', // Sometimes MPEG audio has video MIME
    
    // WAV variants
    'audio/wav': 'audio/wav',
    'audio/x-wav': 'audio/wav',
    'audio/wave': 'audio/wav',
    
    // AAC/M4A variants
    'audio/x-m4a': 'audio/mp4',
    'audio/m4a': 'audio/mp4',
    'audio/aac': 'audio/aac',
    'audio/x-aac': 'audio/aac',
    'audio/mp4': 'audio/mp4',
    
    // OGG variants
    'audio/ogg': 'audio/ogg',
    'audio/x-ogg': 'audio/ogg',
    
    // FLAC variants
    'audio/flac': 'audio/flac',
    'audio/x-flac': 'audio/flac',
    
    // WebM
    'audio/webm': 'audio/webm',
    
    // Mobile formats
    'audio/amr': 'audio/amr',
    'audio/3gpp': 'audio/3gpp',
    'video/3gpp': 'audio/3gpp',
    
    // Generic
    'application/octet-stream': 'audio/mpeg', // Default for unknown
  };

  // Check if we have a direct mapping
  if (mimeMap[mime]) {
    return mimeMap[mime];
  }

  // Try to infer from filename extension
  if (fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const extMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.mpeg': 'audio/mpeg',
      '.mpga': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.mp4': 'audio/mp4',
      '.webm': 'audio/webm',
      '.amr': 'audio/amr',
      '.3gp': 'audio/3gpp',
    };
    if (extMap[ext]) {
      return extMap[ext];
    }
  }

  // Default to audio/mpeg for unknown types
  return 'audio/mpeg';
}

/**
 * Check if file size is within Gemini limits
 */
export function checkFileSize(buffer: Buffer, maxSizeMB: number = 20): { ok: boolean; sizeMB: number } {
  const sizeMB = buffer.length / (1024 * 1024);
  return {
    ok: sizeMB <= maxSizeMB,
    sizeMB,
  };
}

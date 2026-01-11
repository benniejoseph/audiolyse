/**
 * Application-wide constants
 * Single source of truth for magic numbers and configuration values
 */

// ============ FILE LIMITS ============

export const FILE_LIMITS = {
  MAX_SIZE_MB: 20,
  MAX_SIZE_BYTES: 20 * 1024 * 1024,
  MAX_BATCH_SIZE: 10,
} as const;

// ============ API CONFIGURATION ============

export const API_CONFIG = {
  TIMEOUT_MS: 120000, // 2 minutes
  MAX_RETRIES: 3,
} as const;

// ============ SCORE THRESHOLDS ============

export const SCORE_THRESHOLDS = {
  EXCEPTIONAL: 90,
  VERY_GOOD: 80,
  GOOD: 70,
  AVERAGE: 60,
  BELOW_AVERAGE: 50,
  POOR: 0,
} as const;

// ============ COLORS ============

export const COLORS = {
  // Score colors
  SCORE_EXCELLENT: '#7cffc7',
  SCORE_GOOD: '#ffd166',
  SCORE_POOR: '#ff6b6b',
  
  // Risk colors
  RISK_HIGH: '#ff6b6b',
  RISK_MEDIUM: '#ffd166',
  RISK_LOW: '#7cffc7',
  
  // Severity colors
  SEVERITY_SEVERE: '#ff6b6b',
  SEVERITY_MODERATE: '#ffa94d',
  SEVERITY_MILD: '#ffd166',
  SEVERITY_NONE: '#7cffc7',
  
  // UI colors
  AGENT: '#8ea0ff',
  CUSTOMER: '#a78bfa',
  SILENCE: '#4b5563',
} as const;

// ============ AUDIO FORMATS ============

export const SUPPORTED_AUDIO_EXTENSIONS = [
  '.mp3', '.wav', '.m4a', '.aac', '.ogg', 
  '.flac', '.webm', '.amr', '.3gp', '.mpeg', 
  '.mpga', '.mp4'
] as const;

export const SUPPORTED_MIME_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
  'audio/x-m4a',
  'audio/3gpp',
  'audio/amr',
  'video/mpeg',
  'application/octet-stream',
] as const;

// Audio magic bytes for file validation
export const AUDIO_MAGIC_BYTES: Record<string, number[]> = {
  // MP3 frames start with sync word 0xFF 0xFB/0xFA/0xF3/0xF2
  mp3_frame: [0xFF, 0xFB],
  mp3_frame_alt1: [0xFF, 0xFA],
  mp3_frame_alt2: [0xFF, 0xF3],
  mp3_frame_alt3: [0xFF, 0xF2],
  // ID3v2 tag
  id3: [0x49, 0x44, 0x33], // "ID3"
  // WAV - RIFF header
  wav: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  // OGG - OggS
  ogg: [0x4F, 0x67, 0x67, 0x53], // "OggS"
  // FLAC
  flac: [0x66, 0x4C, 0x61, 0x43], // "fLaC"
  // AAC ADTS
  aac_adts: [0xFF, 0xF1],
  aac_adts_alt: [0xFF, 0xF9],
  // M4A/MP4 - ftyp
  mp4: [0x66, 0x74, 0x79, 0x70], // "ftyp" (at offset 4)
  // WebM - EBML
  webm: [0x1A, 0x45, 0xDF, 0xA3],
  // AMR
  amr: [0x23, 0x21, 0x41, 0x4D, 0x52], // "#!AMR"
} as const;

// ============ MOMENT ICONS ============

export const MOMENT_ICONS: Record<string, string> = {
  complaint: '😤',
  compliment: '😊',
  objection: '🤔',
  competitor_mention: '🏢',
  pricing_discussion: '💰',
  commitment: '✅',
  breakthrough: '💡',
  escalation_risk: '⚠️',
  pain_point: '😣',
  positive_signal: '👍',
} as const;

// ============ AI MODEL CONFIGURATION ============

export const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-001',
  'gemini-pro-latest',
  'gemini-2.5-pro',
] as const;

// ============ PARALLEL PROCESSING ============

export const PROCESSING_CONFIG = {
  MAX_CONCURRENT: 3, // Max files to process simultaneously
  RETRY_DELAY_MS: 1000,
} as const;

// ============ HELPER FUNCTIONS ============

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.VERY_GOOD) return COLORS.SCORE_EXCELLENT;
  if (score >= SCORE_THRESHOLDS.AVERAGE) return COLORS.SCORE_GOOD;
  return COLORS.SCORE_POOR;
}

/**
 * Get risk color based on level
 */
export function getRiskColor(risk: string): string {
  const level = (risk || 'low').toLowerCase();
  if (level === 'high') return COLORS.RISK_HIGH;
  if (level === 'medium') return COLORS.RISK_MEDIUM;
  return COLORS.RISK_LOW;
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  const level = (severity || 'none').toLowerCase();
  if (level === 'severe') return COLORS.SEVERITY_SEVERE;
  if (level === 'moderate') return COLORS.SEVERITY_MODERATE;
  if (level === 'mild') return COLORS.SEVERITY_MILD;
  return COLORS.SEVERITY_NONE;
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get moment icon by type
 */
export function getMomentIcon(type: string): string {
  return MOMENT_ICONS[type] || '📌';
}

// ============ SECURITY UTILITIES ============

/**
 * Sanitize file name to prevent path traversal and injection attacks
 * Removes dangerous characters and normalizes the filename
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'unnamed_file';
  
  // Remove path separators to prevent directory traversal
  let sanitized = fileName.replace(/[\\/]/g, '_');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove or replace dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.slice(sanitized.lastIndexOf('.'));
    sanitized = sanitized.slice(0, 255 - ext.length) + ext;
  }
  
  // Fallback if empty
  return sanitized || 'unnamed_file';
}

/**
 * Validate that a string is safe for use in SQL-like contexts
 * (Though parameterized queries should always be used)
 */
export function isValidIdentifier(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  // Allow alphanumeric, dash, underscore
  return /^[a-zA-Z0-9_-]+$/.test(str);
}

// ============ PAGINATION ============

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

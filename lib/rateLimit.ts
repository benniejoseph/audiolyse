/**
 * Simple in-memory rate limiter for API protection
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitRecord {
  count: number;
  lastReset: number;
}

// In-memory store - for production use Redis or similar
const rateLimitStore = new Map<string, RateLimitRecord>();

// Default configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10, // Max requests per window
  cleanupInterval: 5 * 60 * 1000, // Cleanup old entries every 5 minutes
};

// Endpoint-specific rate limits
export const RATE_LIMIT_PRESETS = {
  default: { windowMs: 60 * 1000, maxRequests: 10 },
  payment: { windowMs: 60 * 1000, maxRequests: 5 },
  auth: { windowMs: 60 * 1000, maxRequests: 5 },
  upload: { windowMs: 60 * 1000, maxRequests: 20 },
  api: { windowMs: 60 * 1000, maxRequests: 30 },
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;

// Periodic cleanup to prevent memory growth
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const expiry = RATE_LIMIT_CONFIG.windowMs * 2;
    
    for (const [key, record] of rateLimitStore.entries()) {
      if (now - record.lastReset > expiry) {
        rateLimitStore.delete(key);
      }
    }
  }, RATE_LIMIT_CONFIG.cleanupInterval);
}

// Start cleanup on module load
if (typeof window === 'undefined') {
  startCleanup();
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address)
 * @param preset - Optional preset name for endpoint-specific limits
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  preset?: RateLimitPreset
): RateLimitResult {
  const config = preset ? RATE_LIMIT_PRESETS[preset] : RATE_LIMIT_CONFIG;
  const key = preset ? `${identifier}:${preset}` : identifier;
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // No existing record or window expired - create new record
  if (!record || now - record.lastReset > config.windowMs) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }
  
  // Within window - check if limit exceeded
  if (record.count >= config.maxRequests) {
    const resetIn = config.windowMs - (now - record.lastReset);
    return {
      success: false,
      remaining: 0,
      resetIn,
    };
  }
  
  // Increment count
  record.count++;
  const resetIn = config.windowMs - (now - record.lastReset);
  
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetIn,
  };
}

/**
 * Get client identifier from request headers
 * Falls back to a generic identifier if IP cannot be determined
 */
export function getClientIdentifier(headers: Headers): string {
  // Try various headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Vercel-specific header
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }
  
  // Fallback
  return 'unknown-client';
}

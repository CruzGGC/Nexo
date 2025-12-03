/**
 * Simple in-memory rate limiting for API routes.
 * 
 * For production at scale, consider using Redis or a dedicated rate limiting service.
 * This implementation is suitable for moderate traffic and protects against basic abuse.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Note: This resets on server restart and doesn't share across serverless instances
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  
  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
  /** Optional identifier prefix for different endpoints */
  identifier?: string
}

interface RateLimitResult {
  /** Whether the request should be rate limited */
  rateLimited: boolean
  /** Number of remaining requests in the current window */
  remaining: number
  /** Unix timestamp (ms) when the rate limit resets */
  resetTime: number
  /** Total limit for the window */
  limit: number
}

/**
 * Extracts client IP from request headers.
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 */
function getClientIP(request: Request): string {
  // Vercel/Next.js
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // Take the first IP (original client)
    const firstIP = xForwardedFor.split(',')[0]?.trim()
    if (firstIP) return firstIP
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) return cfConnectingIP

  // Real IP header
  const xRealIP = request.headers.get('x-real-ip')
  if (xRealIP) return xRealIP

  // Fallback
  return 'unknown'
}

/**
 * Check if a request should be rate limited.
 * 
 * @example
 * ```typescript
 * import { checkRateLimit } from '@/lib/rate-limit'
 * 
 * export async function POST(request: Request) {
 *   const { rateLimited, remaining } = await checkRateLimit(request, {
 *     limit: 10,
 *     windowMs: 60 * 1000, // 1 minute
 *     identifier: 'scores-api'
 *   })
 * 
 *   if (rateLimited) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { status: 429 }
 *     )
 *   }
 *   // ... handle request
 * }
 * ```
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig = { limit: 60, windowMs: 60 * 1000 }
): Promise<RateLimitResult> {
  // Run cleanup periodically
  cleanupExpiredEntries()

  const { limit, windowMs, identifier = 'default' } = config
  const clientIP = getClientIP(request)
  const key = `${identifier}:${clientIP}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Create new entry or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  const rateLimited = entry.count > limit
  const remaining = Math.max(0, limit - entry.count)

  return {
    rateLimited,
    remaining,
    resetTime: entry.resetTime,
    limit
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimiters = {
  /** Standard API rate limit: 60 requests per minute */
  standard: { limit: 60, windowMs: 60 * 1000 },
  
  /** Strict rate limit for sensitive operations: 10 requests per minute */
  strict: { limit: 10, windowMs: 60 * 1000 },
  
  /** Very strict rate limit for expensive operations: 5 requests per minute */
  veryStrict: { limit: 5, windowMs: 60 * 1000 },
  
  /** Lenient rate limit for read operations: 120 requests per minute */
  lenient: { limit: 120, windowMs: 60 * 1000 },
  
  /** Score submission: 20 per minute (prevents spam but allows multiple games) */
  scoreSubmission: { limit: 20, windowMs: 60 * 1000, identifier: 'score-submit' },
  
  /** Puzzle generation: 10 per minute (expensive operation) */
  puzzleGeneration: { limit: 10, windowMs: 60 * 1000, identifier: 'puzzle-gen' },
  
  /** Duel creation: 5 per minute (expensive, generates puzzle) */
  duelCreation: { limit: 5, windowMs: 60 * 1000, identifier: 'duel-create' },
  
  /** Guest users: more restrictive limits */
  guestDuelCreation: { limit: 3, windowMs: 60 * 1000, identifier: 'guest-duel-create' },
  guestScoreSubmission: { limit: 10, windowMs: 60 * 1000, identifier: 'guest-score-submit' },
  
  /** Leaderboard reads: lenient but protected */
  leaderboard: { limit: 60, windowMs: 60 * 1000, identifier: 'leaderboard' },
  
  /** Puzzle fetch by ID: lenient */
  puzzleFetch: { limit: 100, windowMs: 60 * 1000, identifier: 'puzzle-fetch' },
} as const

export { getClientIP }

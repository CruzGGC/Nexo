/**
 * Glicko-2 Rating System for Nexo
 * Based on Mark Glickman's Glicko-2 algorithm
 * 
 * Default values:
 * - Rating: 1500
 * - Deviation (RD): 350
 * - Volatility: 0.06
 */

// System constant that constrains volatility change over time
const TAU = 0.5

// Conversion constant between Glicko-2 and Glicko-1 scale
const SCALE = 173.7178

// Maximum and minimum values
const MIN_RD = 30
const MAX_RD = 350
const DEFAULT_RATING = 1500
const DEFAULT_RD = 350
const DEFAULT_VOLATILITY = 0.06

export interface GlickoPlayer {
  rating: number
  deviation: number
  volatility: number
}

export interface RatingResult {
  newRating: number
  newDeviation: number
  newVolatility: number
  ratingChange: number
}

export interface RankTier {
  name: string
  icon: string
  minRating: number
  color: string
}

// Rank tiers based on rating
export const RANK_TIERS: RankTier[] = [
  { name: 'Bronze', icon: '🥉', minRating: 0, color: '#CD7F32' },
  { name: 'Prata', icon: '🥈', minRating: 1200, color: '#C0C0C0' },
  { name: 'Ouro', icon: '🥇', minRating: 1400, color: '#FFD700' },
  { name: 'Platina', icon: '💎', minRating: 1600, color: '#00D4FF' },
  { name: 'Diamante', icon: '💠', minRating: 1800, color: '#B9F2FF' },
  { name: 'Mestre', icon: '👑', minRating: 2000, color: '#9B59B6' },
  { name: 'Grão-Mestre', icon: '⭐', minRating: 2200, color: '#E74C3C' },
  { name: 'Lenda', icon: '🌟', minRating: 2500, color: '#F39C12' },
]

/**
 * Get rank tier for a given rating
 */
export function getRankTier(rating: number): RankTier {
  // Find the highest tier the player qualifies for
  const tier = [...RANK_TIERS].reverse().find(t => rating >= t.minRating)
  return tier || RANK_TIERS[0]
}

/**
 * Get progress to next rank tier (0-100)
 */
export function getRankProgress(rating: number): { current: RankTier; next: RankTier | null; progress: number } {
  const currentTier = getRankTier(rating)
  const currentIndex = RANK_TIERS.findIndex(t => t.name === currentTier.name)
  const nextTier = RANK_TIERS[currentIndex + 1] || null
  
  if (!nextTier) {
    return { current: currentTier, next: null, progress: 100 }
  }
  
  const rangeSize = nextTier.minRating - currentTier.minRating
  const playerProgress = rating - currentTier.minRating
  const progress = Math.min(100, Math.max(0, (playerProgress / rangeSize) * 100))
  
  return { current: currentTier, next: nextTier, progress }
}

// Convert from Glicko-1 to Glicko-2 scale
function toGlicko2(rating: number, rd: number): { mu: number; phi: number } {
  return {
    mu: (rating - DEFAULT_RATING) / SCALE,
    phi: rd / SCALE
  }
}

// Convert from Glicko-2 to Glicko-1 scale  
function fromGlicko2(mu: number, phi: number): { rating: number; rd: number } {
  return {
    rating: mu * SCALE + DEFAULT_RATING,
    rd: phi * SCALE
  }
}

// Calculate g(phi)
function g(phi: number): number {
  return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI))
}

// Calculate E(mu, muj, phij)
function E(mu: number, muj: number, phij: number): number {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)))
}

// Calculate v (estimated variance)
function calculateV(mu: number, opponents: { mu: number; phi: number }[]): number {
  let sum = 0
  for (const opp of opponents) {
    const gPhi = g(opp.phi)
    const e = E(mu, opp.mu, opp.phi)
    sum += gPhi * gPhi * e * (1 - e)
  }
  return 1 / sum
}

// Calculate delta
function calculateDelta(mu: number, v: number, opponents: { mu: number; phi: number; score: number }[]): number {
  let sum = 0
  for (const opp of opponents) {
    const gPhi = g(opp.phi)
    const e = E(mu, opp.mu, opp.phi)
    sum += gPhi * (opp.score - e)
  }
  return v * sum
}

// Find new volatility using Illinois algorithm
function findNewVolatility(sigma: number, phi: number, v: number, delta: number): number {
  const a = Math.log(sigma * sigma)
  const epsilon = 0.000001
  
  function f(x: number): number {
    const ex = Math.exp(x)
    const num = ex * (delta * delta - phi * phi - v - ex)
    const denom = 2 * Math.pow(phi * phi + v + ex, 2)
    return num / denom - (x - a) / (TAU * TAU)
  }
  
  // Set initial values
  let A = a
  let B: number
  
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v)
  } else {
    let k = 1
    while (f(a - k * TAU) < 0) {
      k++
    }
    B = a - k * TAU
  }
  
  // Illinois algorithm
  let fA = f(A)
  let fB = f(B)
  
  while (Math.abs(B - A) > epsilon) {
    const C = A + (A - B) * fA / (fB - fA)
    const fC = f(C)
    
    if (fC * fB <= 0) {
      A = B
      fA = fB
    } else {
      fA = fA / 2
    }
    
    B = C
    fB = fC
  }
  
  return Math.exp(A / 2)
}

/**
 * Calculate new rating after a match using Glicko-2
 * 
 * @param player - Current player's rating info
 * @param opponent - Opponent's rating info  
 * @param score - Match result: 1 = win, 0.5 = draw, 0 = loss
 * @returns Updated rating, deviation, volatility, and rating change
 */
export function calculateRating(
  player: GlickoPlayer,
  opponent: GlickoPlayer,
  score: number // 1 = win, 0.5 = draw, 0 = loss
): RatingResult {
  // Convert to Glicko-2 scale
  const { mu, phi } = toGlicko2(player.rating, player.deviation)
  const oppG2 = toGlicko2(opponent.rating, opponent.deviation)
  
  const opponents = [{ mu: oppG2.mu, phi: oppG2.phi, score }]
  
  // Step 3: Compute v
  const v = calculateV(mu, opponents)
  
  // Step 4: Compute delta
  const delta = calculateDelta(mu, v, opponents)
  
  // Step 5: Determine new volatility
  const sigmaNew = findNewVolatility(player.volatility, phi, v, delta)
  
  // Step 6: Update phi to phi*
  const phiStar = Math.sqrt(phi * phi + sigmaNew * sigmaNew)
  
  // Step 7: Update rating and RD
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v)
  
  let muNew = mu
  for (const opp of opponents) {
    const gPhi = g(opp.phi)
    const e = E(mu, opp.mu, opp.phi)
    muNew += phiNew * phiNew * gPhi * (opp.score - e)
  }
  
  // Convert back to Glicko-1 scale
  const result = fromGlicko2(muNew, phiNew)
  
  // Clamp RD to valid range
  result.rd = Math.max(MIN_RD, Math.min(MAX_RD, result.rd))
  
  return {
    newRating: Math.round(result.rating),
    newDeviation: Math.round(result.rd),
    newVolatility: sigmaNew,
    ratingChange: Math.round(result.rating - player.rating)
  }
}

/**
 * Simple ELO calculation as an alternative (K-factor based)
 * Useful for simpler visualizations
 */
export function calculateSimpleElo(
  playerRating: number,
  opponentRating: number,
  score: number, // 1 = win, 0.5 = draw, 0 = loss
  kFactor: number = 32
): { newRating: number; ratingChange: number } {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  const ratingChange = Math.round(kFactor * (score - expectedScore))
  
  return {
    newRating: playerRating + ratingChange,
    ratingChange
  }
}

/**
 * Create a default player rating
 */
export function createDefaultRating(): GlickoPlayer {
  return {
    rating: DEFAULT_RATING,
    deviation: DEFAULT_RD,
    volatility: DEFAULT_VOLATILITY
  }
}

/**
 * Format rating change for display
 */
export function formatRatingChange(change: number): string {
  if (change > 0) return `+${change}`
  return change.toString()
}

/**
 * Matchmaking Module (Legacy Re-exports)
 * 
 * This file re-exports from the new modular structure for backwards compatibility.
 * New code should import directly from '@/lib/matchmaking/index'
 */

// Re-export everything from the new modular structure
export * from './matchmaking/index'

// Keep the old imports working - import Profile from AuthProvider for the utils
import type { Profile } from '@/components/auth'
export type { Profile }

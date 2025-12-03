/**
 * Supabase client exports
 * 
 * NOTE: Server-side client is NOT exported here to avoid 'server-only' issues.
 * Import it directly from '@/lib/supabase/server' when needed.
 */
export { supabase } from './client'
export { getSupabaseBrowserClient } from './browser'
export type { Database, Json } from './database.types'

// DO NOT export server client here - it has 'server-only' import
// Use: import { createServiceSupabaseClient } from '@/lib/supabase/server'

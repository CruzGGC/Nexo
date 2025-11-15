// Supabase Edge Function: Matchmaking Worker
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SKILL_BRACKETS = ['bronze', 'prata', 'ouro', 'platina', 'diamante'] as const
const ADJACENT_BRACKET_AFTER_MS = 45_000
const ANY_BRACKET_AFTER_MS = 90_000
const CROSS_REGION_AFTER_MS = 60_000
const MAX_QUEUE_BATCH = 100

interface QueueEntry {
  id: string
  user_id: string
  game_type: string
  rating_snapshot: number
  skill_bracket: string | null
  region: string | null
  status: string
  metadata: Record<string, unknown> | string | null
  joined_at: string
  matched_at?: string | null
}

interface MatchPair {
  players: [QueueEntry, QueueEntry]
  reason: string
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  console.log(`[${requestId}] Matchmaking worker invoked`)

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    enforceCronSecret(req)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const { gameType } = await readParams(req)
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: queue, error: queueError } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'queued')
      .eq('game_type', gameType)
      .order('joined_at', { ascending: true })
      .limit(MAX_QUEUE_BATCH)

    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`)
    }

    if (!queue || queue.length < 2) {
      return respond({
        message: 'Not enough players queued',
        queueSize: queue?.length ?? 0,
        matchesCreated: 0,
        elapsedMs: Date.now() - startTime
      })
    }

    const matches = buildMatches(queue)

    if (!matches.length) {
      return respond({
        message: 'Queue processed but no compatible pairs were found',
        queueSize: queue.length,
        matchesCreated: 0,
        elapsedMs: Date.now() - startTime
      })
    }

    const warnings: string[] = []
    const rooms: Array<{ room_id: string; players: string[]; reason: string }> = []

    for (const match of matches) {
      const roomState = buildInitialState(match.players)
      const roomPayload = {
        host_id: match.players[0].user_id,
        game_type: match.players[0].game_type,
        puzzle_id: crypto.randomUUID(),
        game_state: roomState,
        status: 'waiting',
        max_players: 2
      }

      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert(roomPayload)
        .select('id')
        .single()

      if (roomError || !room) {
        warnings.push(`Failed to create room for ${match.players[0].id} vs ${match.players[1].id}: ${roomError?.message}`)
        continue
      }

      const nowIso = new Date().toISOString()
      const updates = match.players.map((player, idx) => ({
        id: player.id,
        status: 'matched',
        matched_at: nowIso,
        metadata: {
          ...ensureMetadata(player.metadata),
          room_id: room.id,
          role: idx === 0 ? 'host' : 'guest',
          symbol: idx === 0 ? 'X' : 'O',
          opponent_id: match.players[idx === 0 ? 1 : 0].user_id
        }
      }))

      const { error: queueUpdateError } = await supabase
        .from('matchmaking_queue')
        .upsert(updates, { onConflict: 'id' })

      if (queueUpdateError) {
        warnings.push(`Failed to update queue entries for room ${room.id}: ${queueUpdateError.message}`)
        await supabase
          .from('matchmaking_queue')
          .update({ status: 'queued', matched_at: null })
          .in('id', updates.map((u) => u.id))
        continue
      }

      rooms.push({
        room_id: room.id,
        players: match.players.map((p) => p.user_id),
        reason: match.reason
      })
    }

    const elapsedMs = Date.now() - startTime

    return respond({
      success: rooms.length > 0,
      queueSize: queue.length,
      attemptedMatches: matches.length,
      roomsCreated: rooms.length,
      warnings,
      rooms,
      elapsedMs
    }, warnings.length ? 207 : 200)
  } catch (error) {
    const elapsedMs = Date.now() - startTime
    console.error(`[${requestId}] Matchmaking worker failed`, error)
    return respond({
      error: (error as Error).message,
      elapsedMs,
      requestId
    }, 500)
  }
})

function respond(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

async function readParams(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch (_) {
    // ignore empty body
  }

  const url = new URL(req.url)
  const gameType = (body.gameType || url.searchParams.get('gameType') || 'tic_tac_toe') as string

  return { gameType }
}

function enforceCronSecret(req: Request) {
  const cronSecret = Deno.env.get('MATCHMAKING_CRON_SECRET')
  if (!cronSecret) return

  const header = req.headers.get('authorization') ?? ''
  const token = header.replace('Bearer', '').trim()
  if (!token || token !== cronSecret) {
    throw new Error('Unauthorized: invalid cron secret')
  }
}

function buildMatches(queue: QueueEntry[], now: Date = new Date()): MatchPair[] {
  const used = new Set<string>()
  const matches: MatchPair[] = []

  for (const entry of queue) {
    if (used.has(entry.id)) continue
    const candidate = findBestCandidate(entry, queue, used, now)
    if (candidate) {
      used.add(entry.id)
      used.add(candidate.id)
      matches.push({
        players: [entry, candidate],
        reason: describeReason(entry, candidate, now)
      })
    }
  }

  return matches
}

function findBestCandidate(source: QueueEntry, pool: QueueEntry[], used: Set<string>, now: Date) {
  let best: QueueEntry | null = null
  let bestScore = Number.POSITIVE_INFINITY

  for (const candidate of pool) {
    if (candidate.id === source.id || used.has(candidate.id)) continue

    const evaluation = evaluateCompatibility(source, candidate, now)
    if (!evaluation.compatible) continue

    if (evaluation.weight < bestScore) {
      best = candidate
      bestScore = evaluation.weight
    }
  }

  return best
}

function evaluateCompatibility(a: QueueEntry, b: QueueEntry, now: Date) {
  const waitA = now.getTime() - new Date(a.joined_at).getTime()
  const waitB = now.getTime() - new Date(b.joined_at).getTime()

  const regionA = normalizeRegion(a.region)
  const regionB = normalizeRegion(b.region)
  const sameRegion = regionA === regionB
  const crossRegionAllowed = waitA >= CROSS_REGION_AFTER_MS || waitB >= CROSS_REGION_AFTER_MS || regionA === 'global' || regionB === 'global'
  const regionOk = sameRegion || crossRegionAllowed

  if (!regionOk) {
    return { compatible: false, weight: Number.POSITIVE_INFINITY }
  }

  const bracketGap = Math.abs(bracketIndex(a.skill_bracket) - bracketIndex(b.skill_bracket))
  const allowAdjacent = waitA >= ADJACENT_BRACKET_AFTER_MS || waitB >= ADJACENT_BRACKET_AFTER_MS
  const allowAny = waitA >= ANY_BRACKET_AFTER_MS || waitB >= ANY_BRACKET_AFTER_MS

  const bracketOk =
    bracketGap === 0 ||
    (bracketGap === 1 && allowAdjacent) ||
    allowAny

  if (!bracketOk) {
    return { compatible: false, weight: Number.POSITIVE_INFINITY }
  }

  const ratingGap = Math.abs(a.rating_snapshot - b.rating_snapshot)
  const regionPenalty = sameRegion ? 0 : 5000
  const bracketPenalty = bracketGap * 1000
  const timePenalty = Math.abs(waitA - waitB) / 1000

  const weight = ratingGap + regionPenalty + bracketPenalty + timePenalty

  return { compatible: true, weight }
}

function describeReason(a: QueueEntry, b: QueueEntry, now: Date) {
  const waitA = now.getTime() - new Date(a.joined_at).getTime()
  const waitB = now.getTime() - new Date(b.joined_at).getTime()
  const bracketGap = Math.abs(bracketIndex(a.skill_bracket) - bracketIndex(b.skill_bracket))
  const sameRegion = normalizeRegion(a.region) === normalizeRegion(b.region)

  if (bracketGap === 0 && sameRegion) return 'strict'
  if (bracketGap === 0 && !sameRegion) return 'cross-region'
  if (bracketGap === 1 && (waitA >= ADJACENT_BRACKET_AFTER_MS || waitB >= ADJACENT_BRACKET_AFTER_MS)) return 'adjacent-bracket'
  if (waitA >= ANY_BRACKET_AFTER_MS || waitB >= ANY_BRACKET_AFTER_MS) return 'wide-open'
  return 'relaxed'
}

function normalizeRegion(region: string | null) {
  return (region || 'global').toLowerCase()
}

function bracketIndex(bracket: string | null) {
  const normalized = (bracket || 'bronze').toLowerCase()
  const idx = SKILL_BRACKETS.indexOf(normalized as typeof SKILL_BRACKETS[number])
  return idx === -1 ? 0 : idx
}

function ensureMetadata(metadata: QueueEntry['metadata']) {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed
      }
    } catch (_) {
      return {}
    }
  }

  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>
  }

  return {}
}

function buildInitialState(players: [QueueEntry, QueueEntry]) {
  return {
    board: Array(9).fill(''),
    participants: players.map((player, idx) => ({
      user_id: player.user_id,
      symbol: idx === 0 ? 'X' : 'O',
      rating_snapshot: player.rating_snapshot,
      skill_bracket: player.skill_bracket,
      region: player.region,
      joined_at: player.joined_at
    })),
    turn: players[0].user_id,
    moves: [],
    created_at: new Date().toISOString()
  }
}

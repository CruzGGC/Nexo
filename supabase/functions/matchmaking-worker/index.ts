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
const SUPPORTED_GAME_TYPES = new Set(['tic_tac_toe', 'battleship', 'crossword_duel', 'wordsearch_duel'])

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

interface MatchmakingMetadata {
  matchCode?: string
  match_code?: string
  room_code?: string
  mode?: 'public' | 'private'
  seat?: 'host' | 'guest'
  preferredRegion?: string
  [key: string]: unknown
}

type ExtendedQueueEntry = QueueEntry & { parsedMeta: MatchmakingMetadata }

interface MatchPair {
  players: [ExtendedQueueEntry, ExtendedQueueEntry]
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
    if (!SUPPORTED_GAME_TYPES.has(gameType)) {
      return respond({ error: `Unsupported gameType: ${gameType}` }, 400)
    }
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

    const extendedQueue: ExtendedQueueEntry[] = (queue ?? []).map((entry) => ({
      ...entry,
      parsedMeta: ensureMetadata(entry.metadata) as MatchmakingMetadata
    }))

    const matches = buildMatches(extendedQueue)

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
      const gameType = match.players[0].game_type
      const roomState = buildInitialState(gameType, match.players)
      const feasible = validateRoomState(roomState)
      if (!feasible.ok) {
        warnings.push(`State invalid for ${match.players[0].game_type}: ${feasible.reason}`)
        continue
      }

      const roomCode = roomState.room_code ?? generateRoomCode()
      const puzzleId = roomState.puzzle_id ?? crypto.randomUUID()
      roomState.room_code = roomCode
      roomState.puzzle_id = puzzleId

      const roomPayload = {
        host_id: match.players[0].user_id,
        game_type: gameType,
        puzzle_id: puzzleId,
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
      const updates = match.players.map((player, idx) => {
        const opponent = match.players[idx === 0 ? 1 : 0]
  const baseMeta = { ...player.parsedMeta }
        const symbol = player.game_type === 'tic_tac_toe' ? (idx === 0 ? 'X' : 'O') : undefined
        const payload: Record<string, unknown> = {
          ...baseMeta,
          room_id: room.id,
          room_code: roomCode,
          role: idx === 0 ? 'host' : 'guest',
          opponent_id: opponent.user_id,
          match_reason: match.reason
        }
        if (symbol) payload.symbol = symbol

        if (gameType === 'battleship') {
          payload.fleet_ready = Boolean(player.parsedMeta.fleet_ready)
        }

        return {
          id: player.id,
          status: 'matched',
          matched_at: nowIso,
          metadata: payload
        }
      })

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

function buildMatches(queue: ExtendedQueueEntry[], now: Date = new Date()): MatchPair[] {
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

function findBestCandidate(source: ExtendedQueueEntry, pool: ExtendedQueueEntry[], used: Set<string>, now: Date) {
  let best: ExtendedQueueEntry | null = null
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

function evaluateCompatibility(a: ExtendedQueueEntry, b: ExtendedQueueEntry, now: Date) {
  const waitA = now.getTime() - new Date(a.joined_at).getTime()
  const waitB = now.getTime() - new Date(b.joined_at).getTime()

  const metaA = a.parsedMeta
  const metaB = b.parsedMeta
  const matchCodeA = getMatchCode(metaA)
  const matchCodeB = getMatchCode(metaB)
  const privateLobby = Boolean(matchCodeA || matchCodeB)

  if (privateLobby && (!matchCodeA || !matchCodeB || matchCodeA !== matchCodeB)) {
    return { compatible: false, weight: Number.POSITIVE_INFINITY }
  }

  if (privateLobby && metaA.seat && metaB.seat && metaA.seat === metaB.seat) {
    return { compatible: false, weight: Number.POSITIVE_INFINITY }
  }

  const regionOverrideA = typeof metaA.preferredRegion === 'string' ? metaA.preferredRegion : null
  const regionOverrideB = typeof metaB.preferredRegion === 'string' ? metaB.preferredRegion : null
  const regionA = normalizeRegion(regionOverrideA ?? a.region)
  const regionB = normalizeRegion(regionOverrideB ?? b.region)
  const sameRegion = regionA === regionB
  const crossRegionAllowed = waitA >= CROSS_REGION_AFTER_MS || waitB >= CROSS_REGION_AFTER_MS || regionA === 'global' || regionB === 'global'
  const regionOk = privateLobby ? true : (sameRegion || crossRegionAllowed)

  if (!regionOk) {
    return { compatible: false, weight: Number.POSITIVE_INFINITY }
  }

  const bracketGap = Math.abs(bracketIndex(a.skill_bracket) - bracketIndex(b.skill_bracket))
  const allowAdjacent = waitA >= ADJACENT_BRACKET_AFTER_MS || waitB >= ADJACENT_BRACKET_AFTER_MS
  const allowAny = waitA >= ANY_BRACKET_AFTER_MS || waitB >= ANY_BRACKET_AFTER_MS

  const bracketOk =
    bracketGap === 0 ||
    (bracketGap === 1 && (allowAdjacent || privateLobby)) ||
    allowAny ||
    privateLobby

  if (!bracketOk) {
    return { compatible: false, weight: Number.POSITIVE_INFINITY }
  }

  const ratingGap = Math.abs(a.rating_snapshot - b.rating_snapshot)
  const regionPenalty = sameRegion ? 0 : 5000
  const bracketPenalty = bracketGap * 1000
  const timePenalty = Math.abs(waitA - waitB) / 1000

  const weight = (privateLobby ? 0 : ratingGap) + regionPenalty + bracketPenalty + timePenalty

  return { compatible: true, weight }
}

function describeReason(a: ExtendedQueueEntry, b: ExtendedQueueEntry, now: Date) {
  const waitA = now.getTime() - new Date(a.joined_at).getTime()
  const waitB = now.getTime() - new Date(b.joined_at).getTime()
  const bracketGap = Math.abs(bracketIndex(a.skill_bracket) - bracketIndex(b.skill_bracket))
  const sameRegion = normalizeRegion(a.region) === normalizeRegion(b.region)
  const metaA = a.parsedMeta
  const metaB = b.parsedMeta
  if (getMatchCode(metaA) && getMatchCode(metaB) && getMatchCode(metaA) === getMatchCode(metaB)) {
    return 'private-code'
  }

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

function ensureMetadata(metadata: QueueEntry['metadata']): MatchmakingMetadata {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as MatchmakingMetadata
      }
    } catch (_) {
      return {}
    }
  }

  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as MatchmakingMetadata
  }

  return {}
}

function buildInitialState(gameType: string, players: [ExtendedQueueEntry, ExtendedQueueEntry]) {
  const base = {
    room_code: generateRoomCode(),
    mode: gameType,
    created_at: new Date().toISOString()
  }

  if (gameType === 'battleship') {
    const boardSize = 10
    return {
      ...base,
      board_size: boardSize,
      phase: 'placement',
      turn: players[0].user_id,
      participants: players.map((player) => buildBattleshipParticipant(player, boardSize)),
      moves: [],
      puzzle_id: crypto.randomUUID()
    }
  }

  if (gameType === 'crossword_duel' || gameType === 'wordsearch_duel') {
    const puzzleType = gameType === 'crossword_duel' ? 'crossword' : 'wordsearch'
    const puzzleEndpoint = puzzleType === 'crossword' ? '/api/crossword/random' : '/api/wordsearch/random'
    const progress = players.reduce<Record<string, number>>((acc, player) => {
      acc[player.user_id] = 0
      return acc
    }, {})

    return {
      ...base,
      target_score: 100,
      puzzle: {
        type: puzzleType,
        source: puzzleEndpoint,
        assigned_at: base.created_at,
        seed: crypto.randomUUID()
      },
      progress,
      participants: players.map((player) => ({
        user_id: player.user_id,
        status: 'playing',
        rating_snapshot: player.rating_snapshot,
        skill_bracket: player.skill_bracket,
        region: player.region,
        joined_at: player.joined_at
      })),
      winner_id: null,
      events: [],
      puzzle_id: crypto.randomUUID()
    }
  }

  return {
    ...base,
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
    puzzle_id: crypto.randomUUID()
  }
}

function getMatchCode(meta: MatchmakingMetadata) {
  const raw = (meta.matchCode || meta.match_code)
  if (typeof raw !== 'string') return undefined
  return raw.trim().toUpperCase()
}

function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let output = ''
  for (let i = 0; i < length; i++) {
    output += chars[Math.floor(Math.random() * chars.length)]
  }
  return output
}

function validateRoomState(state: Record<string, unknown>) {
  if (!state) return { ok: false, reason: 'missing state' }
  if (!Array.isArray(state.participants) || state.participants.length < 2) {
    return { ok: false, reason: 'participants missing' }
  }
  return { ok: true }
}

const FLEET_BLUEPRINT = [
  { name: 'Porta-aviões', code: 'A', size: 5 },
  { name: 'Couraçado', code: 'B', size: 4 },
  { name: 'Cruzador', code: 'C', size: 3 },
  { name: 'Submarino', code: 'S', size: 3 },
  { name: 'Patrulha', code: 'P', size: 2 }
]

function buildBattleshipParticipant(player: ExtendedQueueEntry, size: number) {
  const placement = autoPlaceFleet(size)
  return {
    user_id: player.user_id,
    rating_snapshot: player.rating_snapshot,
    skill_bracket: player.skill_bracket,
    region: player.region,
    joined_at: player.joined_at,
    ready: false,
    ocean: placement.ocean,
    tracking: createEmptyBoard(size, ''),
    ships: placement.ships,
    hits: [],
    misses: []
  }
}

function createEmptyBoard(size: number, fill: string) {
  return Array.from({ length: size }, () => Array(size).fill(fill))
}

function autoPlaceFleet(size: number) {
  const ocean = createEmptyBoard(size, '~')
  const ships: Array<{ name: string; code: string; cells: Array<{ row: number; col: number }> }> = []

  for (const ship of FLEET_BLUEPRINT) {
    let placed = false
    let attempts = 0

    while (!placed && attempts < 100) {
      attempts++
      const horizontal = Math.random() > 0.5
      const maxRow = horizontal ? size : size - ship.size
      const maxCol = horizontal ? size - ship.size : size
      const row = Math.floor(Math.random() * maxRow)
      const col = Math.floor(Math.random() * maxCol)

      if (canPlaceShip(ocean, row, col, ship.size, horizontal)) {
        const cells: Array<{ row: number; col: number }> = []
        for (let i = 0; i < ship.size; i++) {
          const targetRow = row + (horizontal ? 0 : i)
          const targetCol = col + (horizontal ? i : 0)
          ocean[targetRow][targetCol] = ship.code
          cells.push({ row: targetRow, col: targetCol })
        }
        ships.push({ name: ship.name, code: ship.code, cells })
        placed = true
      }
    }
  }

  return { ocean, ships }
}

function canPlaceShip(ocean: string[][], row: number, col: number, size: number, horizontal: boolean) {
  for (let i = 0; i < size; i++) {
    const targetRow = row + (horizontal ? 0 : i)
    const targetCol = col + (horizontal ? i : 0)
    if (!ocean[targetRow] || ocean[targetRow][targetCol] !== '~') {
      return false
    }
  }
  return true
}

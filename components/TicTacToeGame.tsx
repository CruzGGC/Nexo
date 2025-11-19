'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { generateMatchCode } from '@/lib/matchmaking'
import { useAuth } from '@/components/AuthProvider'
import type { Json } from '@/lib/database.types'

type CellValue = 'X' | 'O' | null

type GameStatus = 'playing' | 'win' | 'draw'

type Mode = 'casual' | 'relampago'
type ViewMode = 'local' | 'matchmaking'
type SeriesLengthOption = 3 | 5

const WIN_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
] as const

const BOARD_LABELS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']

interface ConfettiBurst {
  id: string
  left: number
  delay: number
  color: string
}

type RoomParticipant = {
  id: string
  ready?: boolean
  marker?: CellValue
  display_name?: string
}

type RoundRecord = {
  id: string
  round: number
  winner: CellValue | null
  draw: boolean
  moves: number
  finishedAt: string
}

type SeriesState = {
  length: SeriesLengthOption
  wins: Record<'X' | 'O', number>
  draws: number
  rounds: RoundRecord[]
  winner?: CellValue | null
  awaitingReset?: boolean
  eloDelta?: Record<'X' | 'O', number>
}

type RoomGameState = {
  room_code?: string
  variant?: string
  phase?: 'waiting' | 'ready' | 'playing' | 'finished'
  participants?: RoomParticipant[]
  board?: CellValue[]
  currentPlayer?: CellValue
  status?: GameStatus
  winningLine?: number[] | null
  winner?: CellValue | null
  lastMoveAt?: string
  seriesState?: SeriesState
  roundMoves?: number
}

type NormalizedRoomState = RoomGameState & {
  board: CellValue[]
  currentPlayer: CellValue
  status: GameStatus
  phase: NonNullable<RoomGameState['phase']>
  winningLine: number[] | null
  winner: CellValue | null
  seriesState: SeriesState
  roundMoves: number
}

const FRIENDS = [
  { id: 'ines', name: 'Inês Duarte', status: 'disponível', rating: 1240 },
  { id: 'nuno', name: 'Nuno Gouveia', status: 'a jogar', rating: 1310 },
  { id: 'vera', name: 'Vera Monteiro', status: 'offline', rating: 1185 }
]

export default function TicTacToeGame() {
  const [selectedMode, setSelectedMode] = useState<ViewMode | null>(null)
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<CellValue>('X')
  const [status, setStatus] = useState<GameStatus>('playing')
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  const [stats, setStats] = useState({ X: 0, O: 0, draws: 0 })
  const [timeline, setTimeline] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('casual')
  const [streak, setStreak] = useState<{ player: CellValue; count: number }>({ player: null, count: 0 })
  const [bursts, setBursts] = useState<ConfettiBurst[]>([])
  const [generatedCode, setGeneratedCode] = useState(() => generateMatchCode())
  const [inviteCode, setInviteCode] = useState('')
  const [seriesChoice, setSeriesChoice] = useState<SeriesLengthOption>(3)
  const { user } = useAuth()

  const matchmaking = useMatchmaking('tic_tac_toe')
  const { status: queueStatus, queueEntry, room, joinQueue, leaveQueue, lobbyStats, updateRoomState } = matchmaking
  const topRegions = useMemo(
    () => Object.entries(lobbyStats.regions).sort((a, b) => b[1] - a[1]).slice(0, 3),
    [lobbyStats.regions]
  )
  const topBrackets = useMemo(
    () => Object.entries(lobbyStats.brackets).sort((a, b) => b[1] - a[1]).slice(0, 3),
    [lobbyStats.brackets]
  )

  const occupiedCells = board.filter(Boolean).length

  const statusLabel = useMemo(() => {
    if (status === 'win' && winningLine) {
      return `Vitória para ${currentPlayer === 'X' ? 'Jogador O' : 'Jogador X'}`
    }

    if (status === 'draw') {
      return 'Empate estratégico — ninguém conquistou a grelha'
    }

    return `Vez de ${currentPlayer === 'X' ? 'Jogador X' : 'Jogador O'}`
  }, [status, winningLine, currentPlayer])

  const handleCellClick = (index: number) => {
    if (board[index] || status !== 'playing' || !currentPlayer) return

    const nextBoard = board.map((value, idx) => (idx === index ? currentPlayer : value))
    const moveLabel = `Jogador ${currentPlayer} ocupou ${BOARD_LABELS[index]}`

    setBoard(nextBoard)
    setTimeline(prev => [moveLabel, ...prev].slice(0, 8))

    const combo = WIN_PATTERNS.find(pattern =>
      pattern.every(position => nextBoard[position] === currentPlayer)
    )

    if (combo) {
      setWinningLine([...combo])
      setStatus('win')
      setStats(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }))
      setStreak(prev => ({
        player: currentPlayer,
        count: prev.player === currentPlayer ? prev.count + 1 : 1
      }))
      triggerCelebration()
      return
    }

    if (nextBoard.every(Boolean)) {
      setStatus('draw')
      setStats(prev => ({ ...prev, draws: prev.draws + 1 }))
      setStreak({ player: null, count: 0 })
      return
    }

    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
  }

  const triggerCelebration = () => {
    const palette = ['#facc15', '#fb923c', '#f472b6', '#34d399']
    const generated = Array.from({ length: 7 }).map(() => ({
      id: crypto.randomUUID(),
      left: Math.random() * 70 + 10,
      delay: Math.random() * 0.6,
      color: palette[Math.floor(Math.random() * palette.length)]
    }))

    setBursts(generated)
    setTimeout(() => setBursts([]), 2000)
  }

  const handleReset = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setStatus('playing')
    setWinningLine(null)
  }

  const handleModeChange = (value: Mode) => {
    setMode(value)
    setTimeline(prev => [`Modo ${value === 'casual' ? 'Sereno' : 'Relâmpago'} ativado`, ...prev].slice(0, 8))
    handleReset()
  }

  const queueStatusLabel = {
    idle: 'Entrar na fila pública',
    joining: 'A iniciar sessão segura…',
    queued: 'A procurar adversário…',
    matched: 'Sala encontrada!',
    error: 'Falha — tenta novamente'
  }[queueStatus]

  const queueMetadata = useMemo(() => {
    if (!queueEntry?.metadata) return null
    if (typeof queueEntry.metadata === 'string') {
      try {
        return JSON.parse(queueEntry.metadata) as Record<string, unknown>
      } catch (err) {
        console.warn('Metadata inválida na fila', err)
        return null
      }
    }
    if (typeof queueEntry.metadata === 'object') {
      return queueEntry.metadata as Record<string, unknown>
    }
    return null
  }, [queueEntry])

  const preferredSeriesLength = useMemo<SeriesLengthOption>(() => {
    const incoming = queueMetadata?.series_length
    if (incoming === 5 || incoming === '5') return 5
    if (incoming === 3 || incoming === '3') return 3
    return seriesChoice
  }, [queueMetadata?.series_length, seriesChoice])

  const roomState = room?.game_state && typeof room.game_state === 'object' ? (room.game_state as RoomGameState) : null
  const playerSymbol: CellValue = queueMetadata?.symbol === 'O' ? 'O' : 'X'
  const opponentId = typeof queueMetadata?.opponent_id === 'string' ? (queueMetadata.opponent_id as string) : null
  const remoteBoard = useMemo(() => (Array.isArray(roomState?.board) && roomState.board.length === 9 ? (roomState.board as CellValue[]) : null), [roomState?.board])
  const remotePhase: RoomGameState['phase'] = roomState?.phase ?? (room ? 'waiting' : undefined)
  const remoteStatus = (roomState?.status ?? 'playing') as GameStatus
  const remoteWinningLine = Array.isArray(roomState?.winningLine) ? (roomState.winningLine as number[]) : null
  const remoteWinner = roomState?.winner === 'X' || roomState?.winner === 'O' ? roomState.winner : null
  const remoteCurrentPlayer: CellValue = roomState?.currentPlayer === 'O' ? 'O' : 'X'
  const remoteSeriesState = useMemo(() => hydrateSeriesState(roomState?.seriesState, preferredSeriesLength), [roomState?.seriesState, preferredSeriesLength])
  const remoteParticipants: RoomParticipant[] = Array.isArray(roomState?.participants)
    ? (roomState.participants as RoomParticipant[])
    : []
  const opponentSymbol: CellValue = playerSymbol === 'X' ? 'O' : 'X'
  const localPlayerId = queueEntry?.user_id ?? user?.id ?? null
  const playerParticipant = remoteParticipants.find(participant => participant.id === localPlayerId)
  const opponentParticipant = remoteParticipants.find(participant => participant.id && participant.id !== localPlayerId)
  const isPlayerTurn =
    queueStatus === 'matched' &&
    remotePhase === 'playing' &&
    remoteStatus === 'playing' &&
    remoteBoard !== null &&
    remoteCurrentPlayer === playerSymbol &&
    !remoteSeriesState.awaitingReset &&
    !remoteSeriesState.winner
  const remotePhaseNotPlayable = remotePhase !== undefined && remotePhase !== 'playing'
  const remoteStatusLabel = useMemo(() => {
    if (!room) return 'Sem sala sincronizada'
    if (!remoteBoard) return 'A preparar tabuleiro online…'
    if (remoteSeriesState.winner) {
      return remoteSeriesState.winner === playerSymbol ? 'Série vencida' : 'Série perdida'
    }
    if (remoteSeriesState.awaitingReset) {
      return 'Ronda concluída — prepara o reset'
    }
    if (remotePhase === 'finished' || remoteStatus === 'win' || remoteStatus === 'draw') {
      if (remoteStatus === 'draw') return 'Empate confirmado'
      return remoteWinner ? `Vitória de ${remoteWinner}` : 'Partida concluída'
    }
    if (remotePhase === 'waiting') return 'A aguardar ligação do adversário'
    return isPlayerTurn ? 'É a tua vez de jogar' : 'Aguardando jogada do adversário'
  }, [room, remoteBoard, remotePhase, remoteStatus, remoteWinner, isPlayerTurn, remoteSeriesState, playerSymbol])

  const roundsToWin = Math.ceil(remoteSeriesState.length / 2)
  const playerWins = remoteSeriesState.wins[playerSymbol]
  const opponentWins = remoteSeriesState.wins[opponentSymbol]
  const seriesSlots = useMemo(() => Array.from({ length: remoteSeriesState.length }, (_, index) => remoteSeriesState.rounds[index] ?? null), [remoteSeriesState])
  const totalRoundsPlayed = remoteSeriesState.rounds.length
  const totalMovesPlayed = useMemo(() => remoteSeriesState.rounds.reduce((sum, round) => sum + (round.moves ?? 0), 0), [remoteSeriesState])
  const fastestPlayerRound = useMemo(() => {
    const wins = remoteSeriesState.rounds.filter(round => round.winner === playerSymbol)
    if (wins.length === 0) return null
    return wins.reduce((best, round) => (best === null || round.moves < best ? round.moves : best), null as number | null)
  }, [remoteSeriesState, playerSymbol])
  const playerMaxStreak = useMemo(() => {
    let best = 0
    let currentCount = 0
    remoteSeriesState.rounds.forEach(round => {
      if (round.winner === playerSymbol) {
        currentCount += 1
        best = Math.max(best, currentCount)
      } else if (!round.draw) {
        currentCount = 0
      }
    })
    return best
  }, [remoteSeriesState, playerSymbol])
  const playerEloDelta = remoteSeriesState.eloDelta?.[playerSymbol] ?? 0
  const opponentEloDelta = remoteSeriesState.eloDelta?.[opponentSymbol] ?? 0
  const seriesComplete = Boolean(remoteSeriesState.winner)
  const playerSeriesVictory = remoteSeriesState.winner === playerSymbol
  const playerName = playerParticipant?.display_name ?? 'Tu'
  const opponentName = opponentParticipant?.display_name ?? 'Adversário'
  const boardMessage = useMemo(() => {
    if (seriesComplete) {
      return playerSeriesVictory
        ? 'Série encerrada — o teu Elo já foi atualizado.'
        : 'Derrota confirmada. Volta ao lobby para tentares novamente.'
    }
    if (remoteSeriesState.awaitingReset) {
      return 'Ronda fechada. Inicia a próxima para limpar o tabuleiro.'
    }
    if (!remoteBoard) {
      return 'A sincronizar tabuleiro remoto…'
    }
    return isPlayerTurn ? 'É a tua vez — joga com precisão.' : 'Aguardando a jogada do adversário.'
  }, [seriesComplete, playerSeriesVictory, remoteSeriesState.awaitingReset, remoteBoard, isPlayerTurn])

  const ensureRoomReady = useCallback(async () => {
    if (!room || !queueEntry || remoteBoard) return
    try {
      await updateRoomState(current => {
        const existing = (current ?? {}) as RoomGameState
        if (Array.isArray(existing.board) && existing.board.length === 9 && existing.seriesState) {
          return (current ?? ({} as Json)) as Json
        }
        const participants = mergeParticipants(existing.participants, localPlayerId, opponentId, playerSymbol)
        const seriesState = hydrateSeriesState(existing.seriesState, preferredSeriesLength)
        const nextState: RoomGameState = {
          ...existing,
          board: buildEmptyBoard(),
          currentPlayer: 'X',
          status: 'playing',
          phase: 'playing',
          participants,
          winningLine: null,
          winner: null,
          lastMoveAt: new Date().toISOString(),
          seriesState,
          roundMoves: 0
        }
        return nextState as unknown as Json
      })
    } catch (err) {
      console.error('Falha ao preparar estado remoto', err)
    }
  }, [room, queueEntry, remoteBoard, updateRoomState, localPlayerId, opponentId, playerSymbol, preferredSeriesLength])

  useEffect(() => {
    if (queueStatus !== 'matched') return
    if (!room || !queueEntry) return
    if (remoteBoard) return
    void ensureRoomReady()
  }, [queueStatus, room, queueEntry, remoteBoard, ensureRoomReady])

  const handleRemoteCellClick = useCallback(async (index: number) => {
    if (!room || !queueEntry || !remoteBoard) return
    if (remoteBoard[index]) return
    if (queueStatus !== 'matched') return
    if (remotePhase !== 'playing' || remoteStatus !== 'playing') return
    if (remoteCurrentPlayer !== playerSymbol) return
    if (remoteSeriesState.awaitingReset || remoteSeriesState.winner) return

    try {
      await updateRoomState(current => {
        const state = normalizeStateForUpdate(current, localPlayerId, opponentId, playerSymbol, preferredSeriesLength)
        if (state.phase !== 'playing' || state.status !== 'playing') {
          return state as unknown as Json
        }
        if (state.board[index] || state.currentPlayer !== playerSymbol) {
          return state as unknown as Json
        }

        const nextBoard = [...state.board]
        nextBoard[index] = playerSymbol
        const winningLine = findWinningLine(nextBoard, playerSymbol)
        const draw = !winningLine && nextBoard.every(Boolean)
        const moves = state.roundMoves + 1

        let nextSeriesState = state.seriesState
        let nextPhase: RoomGameState['phase'] = state.phase
        let nextStatus: GameStatus = 'playing'
        let nextWinner: CellValue | null = state.winner ?? null

        if (winningLine || draw) {
          nextSeriesState = concludeSeriesRound(state.seriesState, {
            winner: winningLine ? playerSymbol : null,
            draw,
            moves
          })
          nextPhase = nextSeriesState.winner ? 'finished' : 'ready'
          nextStatus = winningLine ? 'win' : 'draw'
          nextWinner = winningLine ? playerSymbol : null
        }

        const nextState: RoomGameState = {
          ...state,
          board: nextBoard,
          currentPlayer: playerSymbol === 'X' ? 'O' : 'X',
          status: nextStatus,
          phase: nextPhase,
          winningLine: winningLine ?? null,
          winner: nextWinner,
          lastMoveAt: new Date().toISOString(),
          seriesState: nextSeriesState,
          roundMoves: moves
        }
        return nextState as unknown as Json
      })
    } catch (err) {
      console.error('Falha ao enviar jogada remota', err)
    }
  }, [room, queueEntry, remoteBoard, queueStatus, remotePhase, remoteStatus, remoteCurrentPlayer, playerSymbol, updateRoomState, localPlayerId, opponentId, preferredSeriesLength, remoteSeriesState.awaitingReset, remoteSeriesState.winner])

  const handleStartNextRound = useCallback(async () => {
    if (!room || !queueEntry) return
    if (!remoteSeriesState.awaitingReset || remoteSeriesState.winner) return
    try {
      await updateRoomState(current => {
        const state = normalizeStateForUpdate(current, localPlayerId, opponentId, playerSymbol, preferredSeriesLength)
        if (!state.seriesState.awaitingReset || state.seriesState.winner) {
          return state as unknown as Json
        }
        const nextState: RoomGameState = {
          ...state,
          board: buildEmptyBoard(),
          currentPlayer: 'X',
          status: 'playing',
          phase: 'playing',
          winningLine: null,
          winner: null,
          lastMoveAt: new Date().toISOString(),
          seriesState: { ...state.seriesState, awaitingReset: false },
          roundMoves: 0
        }
        return nextState as unknown as Json
      })
    } catch (err) {
      console.error('Falha ao iniciar próxima ronda', err)
    }
  }, [room, queueEntry, remoteSeriesState.awaitingReset, remoteSeriesState.winner, updateRoomState, localPlayerId, opponentId, playerSymbol, preferredSeriesLength])
  const derivedRoomCode = typeof roomState?.room_code === 'string'
    ? roomState.room_code
    : typeof queueMetadata?.room_code === 'string'
      ? (queueMetadata.room_code as string)
      : null

  const handleJoinPublic = async () => {
    await joinQueue({ mode: 'public', metadata: { variant: mode, series_length: seriesChoice } })
  }

  const handleCreatePrivate = async () => {
    const code = generatedCode?.trim() || generateMatchCode()
    setGeneratedCode(code)
    await joinQueue({ mode: 'private', matchCode: code, seat: 'host', metadata: { variant: mode, room_code: code, series_length: seriesChoice } })
  }

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) return
    await joinQueue({ mode: 'private', matchCode: inviteCode.trim().toUpperCase(), seat: 'guest', metadata: { variant: mode, series_length: seriesChoice } })
  }

  const handleFriendInvite = async (friendId: string) => {
    const code = generateMatchCode()
    setGeneratedCode(code)
    await joinQueue({ mode: 'private', matchCode: code, seat: 'host', metadata: { invitee: friendId, variant: mode, room_code: code, series_length: seriesChoice } })
  }

  const resetLocalState = () => {
    handleReset()
    setStats({ X: 0, O: 0, draws: 0 })
    setTimeline([])
    setStreak({ player: null, count: 0 })
  }

  const handleSelectMode = (modeSelection: ViewMode) => {
    if (modeSelection === 'local') {
      resetLocalState()
    }
    setSelectedMode(modeSelection)
  }

  const handleBackToSelection = async () => {
    if (queueEntry) {
      await leaveQueue()
    }
    setSelectedMode(null)
    setInviteCode('')
    setGeneratedCode(generateMatchCode())
    resetLocalState()
  }

  if (!selectedMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 px-4 py-12 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-black dark:text-zinc-50">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white sm:text-5xl">Jogo do Galo</h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">Escolhe como queres jogar: partilha o ecrã ou ativa o matchmaking Supabase.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSelectMode('local')}
              className="group relative overflow-hidden rounded-3xl border-2 border-amber-100 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl dark:border-amber-500/40 dark:bg-zinc-900"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-4xl transition-transform group-hover:scale-110 dark:bg-amber-500/10">
                🤝
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Modo Local</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Dois jogadores no mesmo dispositivo com histórico, streak e modos Sereno/Relâmpago.</p>
              <ul className="mt-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <li>• Alterna automaticamente entre X e O</li>
                <li>• Estatísticas persistentes na sessão</li>
                <li>• UI animada com destaque de vitórias</li>
              </ul>
              <div className="absolute -right-6 bottom-0 h-24 w-24 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/20" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('matchmaking')}
              className="group relative overflow-hidden rounded-3xl border-2 border-sky-100 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl dark:border-sky-500/40 dark:bg-zinc-900"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-4xl transition-transform group-hover:scale-110 dark:bg-sky-500/10">
                🌐
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Modo Matchmaking</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Fila pública automática e códigos privados para desafiar amigos em segundos.</p>
              <ul className="mt-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <li>• Integração com `matchmaking_queue`</li>
                <li>• Configurações públicas e privadas</li>
                <li>• Lista de amigos com convites rápidos</li>
              </ul>
              <div className="absolute -left-6 top-0 h-24 w-24 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/20" />
            </button>
          </div>
          <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-400">Todos os modos em PT-PT com suporte total a dark mode.</p>
        </div>
      </div>
    )
  }

  if (selectedMode === 'matchmaking' && queueStatus === 'matched') {
    const seriesSubtitle = seriesComplete
      ? 'Série concluída — o Elo foi sincronizado automaticamente com a tua conta.'
      : `Primeiro a ${roundsToWin} vitórias vence a série.`

    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-slate-950 to-black px-4 py-10 text-zinc-50">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => void handleBackToSelection()}
              className="text-sm font-semibold text-zinc-300 transition hover:text-white"
            >
              ← Sair da série
            </button>
            <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-zinc-500">
              <span className="rounded-full border border-white/10 px-3 py-1">Melhor de {remoteSeriesState.length}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Sala {derivedRoomCode ?? room?.id ?? '—'}</span>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="space-y-6 lg:flex-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Série online</p>
                  <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">
                    {seriesComplete ? (playerSeriesVictory ? 'Série conquistada!' : 'Derrota honrosa') : remoteStatusLabel}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400">{seriesSubtitle}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={`rounded-2xl border px-5 py-4 ${playerSeriesVictory ? 'border-emerald-400/60 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-400">
                      <span>{playerName}</span>
                      <span className="font-mono text-base text-zinc-200">{playerSymbol}</span>
                    </div>
                    <p className="mt-3 text-4xl font-bold text-white">{playerWins}</p>
                    <p className="text-xs text-zinc-400">Vitórias</p>
                    {seriesComplete && (
                      <p className={`mt-3 text-sm font-semibold ${playerEloDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {playerEloDelta >= 0 ? `+${playerEloDelta}` : playerEloDelta} Elo
                      </p>
                    )}
                  </div>
                  <div className={`rounded-2xl border px-5 py-4 ${!playerSeriesVictory && seriesComplete ? 'border-rose-400/60 bg-rose-500/5' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-400">
                      <span>{opponentName}</span>
                      <span className="font-mono text-base text-zinc-200">{opponentSymbol}</span>
                    </div>
                    <p className="mt-3 text-4xl font-bold text-white">{opponentWins}</p>
                    <p className="text-xs text-zinc-400">Vitórias</p>
                    {seriesComplete && (
                      <p className={`mt-3 text-sm font-semibold ${opponentEloDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {opponentEloDelta >= 0 ? `+${opponentEloDelta}` : opponentEloDelta} Elo
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-500">
                    <span>Progresso da série</span>
                    <span>{playerWins} - {opponentWins}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seriesSlots.map((roundSlot, index) => {
                      const slotState = roundSlot?.draw
                        ? 'draw'
                        : roundSlot?.winner === playerSymbol
                          ? 'player'
                          : roundSlot?.winner === opponentSymbol
                            ? 'opponent'
                            : 'pending'
                      const slotClass =
                        slotState === 'player'
                          ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200'
                          : slotState === 'opponent'
                            ? 'border-rose-400/70 bg-rose-500/10 text-rose-200'
                            : slotState === 'draw'
                              ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
                              : 'border-white/15 text-zinc-500'
                      const slotLabel =
                        slotState === 'player'
                          ? `${playerName} venceu`
                          : slotState === 'opponent'
                            ? `${opponentName} venceu`
                            : slotState === 'draw'
                              ? 'Empate'
                              : 'Por disputar'
                      return (
                        <span
                          key={`serie-slot-${index}`}
                          title={slotLabel}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${slotClass}`}
                        >
                          {index + 1}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {!seriesComplete && remoteSeriesState.awaitingReset && (
                  <button
                    type="button"
                    onClick={() => void handleStartNextRound()}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    🔁 Iniciar próxima ronda
                  </button>
                )}
              </div>

              <div className="lg:w-[420px]">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6">
                  {remoteBoard ? (
                    <div className="grid grid-cols-3 gap-3">
                      {remoteBoard.map((cell, index) => {
                        const isWinning = remoteWinningLine?.includes(index)
                        const disableCell =
                          Boolean(cell) ||
                          !isPlayerTurn ||
                          remotePhaseNotPlayable ||
                          remoteStatus !== 'playing' ||
                          remoteSeriesState.awaitingReset ||
                          seriesComplete
                        return (
                          <button
                            key={`active-${index}`}
                            type="button"
                            aria-label={`Casa ${BOARD_LABELS[index]}`}
                            onClick={() => handleRemoteCellClick(index)}
                            disabled={disableCell}
                            className={`relative flex h-28 items-center justify-center rounded-2xl border text-5xl font-semibold transition-all duration-200 ${
                              cell
                                ? 'border-white/20 bg-white/10 text-white'
                                : 'border-dashed border-white/15 text-white/40 hover:border-white/40 hover:text-white'
                            } ${
                              isWinning
                                ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                                : ''
                            } ${disableCell ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            {cell && (
                              <span className={cell === 'X' ? 'text-emerald-300' : 'text-sky-300'}>{cell}</span>
                            )}
                            {isWinning && <span className="absolute inset-0 rounded-2xl border-2 border-emerald-300/60" />}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="h-28 rounded-2xl border border-white/10 bg-white/5" />
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-sm text-zinc-400">{boardMessage}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Histórico</p>
                <h2 className="text-xl font-semibold text-white">Rondas jogadas</h2>
              </div>
              <span className="text-xs text-zinc-500">Atualiza em tempo real via Realtime</span>
            </div>
            <div className="mt-4 space-y-3">
              {remoteSeriesState.rounds.length === 0 && (
                <p className="text-sm text-zinc-400">Ainda sem rondas concluídas — começa a primeira jogada!</p>
              )}
              {remoteSeriesState.rounds.map(round => {
                const label = round.draw
                  ? 'Empate tenso'
                  : round.winner === playerSymbol
                    ? `${playerName} venceu`
                    : `Vitória de ${opponentName}`
                const finishedDate = new Date(round.finishedAt)
                const timestamp = Number.isNaN(finishedDate.getTime())
                  ? '—'
                  : finishedDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div
                    key={round.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">Ronda {round.round}</p>
                      <p className="text-xs text-zinc-400">{label}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      <p>{round.moves} jogadas</p>
                      <p>{timestamp}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {seriesComplete && (
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/10 via-white/5 to-sky-500/10 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">Fim da série</p>
              <h3 className="mt-2 text-3xl font-bold text-white">
                {playerSeriesVictory ? 'Campeão confirmado' : 'Continua a treinar'}
              </h3>
              <p className="mt-2 text-sm text-zinc-300">
                {playerSeriesVictory
                  ? 'Partilha esta vitória com os amigos ou regressa ao lobby para procurar o próximo desafio.'
                  : 'Aprende com esta série e volta ao lobby para tentar recuperar o Elo perdido.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <div className={`rounded-2xl border px-5 py-4 text-lg font-semibold ${playerEloDelta >= 0 ? 'border-emerald-400/60 text-emerald-200' : 'border-rose-400/60 text-rose-200'}`}>
                  {playerEloDelta >= 0 ? `+${playerEloDelta}` : playerEloDelta} Elo
                  <p className="text-xs font-normal text-zinc-400">{playerName}</p>
                </div>
                <div className="rounded-2xl border border-white/10 px-5 py-4 text-sm text-zinc-200">
                  Adversário: {opponentEloDelta >= 0 ? `+${opponentEloDelta}` : opponentEloDelta} Elo
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: 'Rondas jogadas',
                    value: totalRoundsPlayed,
                    hint: `Máximo de ${remoteSeriesState.length}`
                  },
                  {
                    label: 'Jogadas totais',
                    value: totalMovesPlayed,
                    hint: `${totalRoundsPlayed ? Math.round(totalMovesPlayed / totalRoundsPlayed) : 0} por ronda`
                  },
                  {
                    label: 'Empates intensos',
                    value: remoteSeriesState.draws,
                    hint: `Streak máx: ${playerMaxStreak}`
                  },
                  {
                    label: 'Vitória mais rápida',
                    value: fastestPlayerRound ? `${fastestPlayerRound} jogadas` : '—',
                    hint: fastestPlayerRound ? 'Registada nesta série' : 'Ainda por registar'
                  }
                ].map(stat => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.hint}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleBackToSelection()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  ← Voltar ao lobby
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    )
  }

  if (selectedMode === 'matchmaking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 px-4 py-10 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-black dark:text-zinc-50">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => void handleBackToSelection()}
              className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              ← Mudar Modo
            </button>
            <span className="rounded-full bg-zinc-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white dark:bg-white dark:text-zinc-900">
              Matchmaking
            </span>
          </div>

          <header className="rounded-3xl border border-sky-100 bg-white/80 p-10 shadow-xl dark:border-sky-500/30 dark:bg-zinc-900/80">
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-4 py-1 text-sm font-medium text-sky-900 dark:bg-sky-500/10 dark:text-sky-200">
                  Matchmaking Supabase • Público & Código privado
                </p>
                <h1 className="text-4xl font-bold leading-tight text-zinc-900 dark:text-white sm:text-5xl">
                  Desafia amigos ou entra na fila global em segundos
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-300">
                  O novo RPC `matchmaking_join_and_create_room` valida rating, região e códigos privados em tempo real e abre salas instantâneas com presença Supabase.
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                    Fila pública automática
                  </span>
                  <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                    Códigos privados & invites
                  </span>
                  <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                    Preparado para Realtime
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-sky-200/60 bg-white/80 px-6 py-5 text-sm text-sky-900 shadow-lg dark:border-sky-500/20 dark:bg-zinc-900/90 dark:text-sky-200">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">Estado</p>
                <p className="mt-2 text-3xl font-semibold">{queueStatusLabel}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Atualizado automaticamente via Supabase Realtime</p>
                <div className="mt-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <p>
                    Jogadores ligados: <span className="font-semibold text-zinc-900 dark:text-white">{lobbyStats.total}</span>
                  </p>
                  {topRegions.length > 0 && (
                    <p>
                      Regiões em destaque: {topRegions.map(([region, count]) => `${region === 'global' ? 'Global' : region.toUpperCase()} (${count})`).join(' · ')}
                    </p>
                  )}
                  {topBrackets.length > 0 && (
                    <p>
                      Escalões ativos: {topBrackets.map(([bracket, count]) => `${bracket.charAt(0).toUpperCase()}${bracket.slice(1)} (${count})`).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
            <section className="rounded-3xl border border-zinc-200/60 bg-white/90 p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Fila pública</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">Matchmaking automático</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Emparelhamento instantâneo via RPC transacional e presença Realtime.</p>
                  </div>
                  <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                    <p>Estado atual</p>
                    <p className="text-xl font-semibold text-zinc-900 dark:text-white">{queueStatusLabel}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleJoinPublic}
                    disabled={queueStatus === 'joining' || queueStatus === 'queued'}
                    className="rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-4 text-left text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ⚡ Entrar na fila automática
                    <span className="mt-1 block text-xs font-normal text-sky-100">Rating e região sincronizados com o teu perfil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void leaveQueue()}
                    disabled={!queueEntry}
                    className="rounded-2xl border border-zinc-200 px-5 py-4 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    ✋ Cancelar procura
                    <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">Liberta a vaga quando quiseres</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Formato da série</p>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/80">Escolhe antes de entrares na fila pública ou de gerar códigos privados.</p>
                  <div className="mt-3 inline-flex rounded-2xl border border-amber-200 bg-white/80 p-1 text-sm font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-zinc-900/70 dark:text-amber-200">
                    {([3, 5] as SeriesLengthOption[]).map(length => (
                      <button
                        key={`series-${length}`}
                        type="button"
                        onClick={() => setSeriesChoice(length)}
                        className={`rounded-2xl px-4 py-2 transition ${
                          seriesChoice === length
                            ? 'bg-white text-amber-900 shadow-sm dark:bg-amber-500/20 dark:text-white'
                            : 'text-amber-600/70 dark:text-amber-200/70'
                        }`}
                      >
                        Melhor de {length}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[0.7rem] text-amber-900/70 dark:text-amber-100/70">Partilhamos esta escolha com o adversário assim que a sala fica ativa.</p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Sala ativa</p>
                  {room ? (
                    <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                      <p>
                        ID: <span className="font-mono text-base text-zinc-900 dark:text-white">{room.id}</span>
                      </p>
                      <p>
                        Código: <span className="font-mono text-lg text-amber-500">{derivedRoomCode ?? '—'}</span>
                      </p>
                      <p>
                        Participantes: {roomState?.participants?.length ?? 2} • Fase {roomState?.phase ?? 'preparação'}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Sem sala sincronizada. Junta-te à fila ou cria um código.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
                  <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">Monitor do lobby</p>
                  <p className="mt-1 text-3xl font-bold text-sky-900 dark:text-white">{lobbyStats.total}</p>
                  <p className="text-xs text-sky-700 dark:text-sky-200">Jogadores preparados neste modo</p>
                  <div className="mt-4 space-y-2 text-xs text-sky-900 dark:text-sky-100">
                    <p>
                      Regiões: {topRegions.length > 0 ? topRegions.map(([region, count]) => `${region === 'global' ? 'Global' : region.toUpperCase()} (${count})`).join(' · ') : 'A aguardar ligações'}
                    </p>
                    <p>
                      Escalões: {topBrackets.length > 0 ? topBrackets.map(([bracket, count]) => `${bracket.charAt(0).toUpperCase()}${bracket.slice(1)} (${count})`).join(' · ') : 'Sem dados suficientes'}
                    </p>
                  </div>
                </div>

                {room && (
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-sky-50/40 p-6 shadow-xl dark:border-indigo-500/30 dark:from-zinc-900 dark:via-slate-900 dark:to-slate-900/60">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-200">Sala encontrada</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{remoteStatusLabel}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Sala {derivedRoomCode ?? room.id}</p>
                      </div>
                      <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                        <p>O teu símbolo</p>
                        <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{playerSymbol}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <p>
                        Tu: {playerParticipant?.marker ?? playerSymbol} • Adversário: {opponentParticipant?.marker ?? opponentSymbol}
                      </p>
                    </div>

                    {remoteBoard ? (
                      <>
                        <div className="mt-6 grid grid-cols-3 gap-3">
                          {remoteBoard.map((cell, index) => {
                            const isWinning = remoteWinningLine?.includes(index)
                            return (
                              <button
                                key={`remote-${index}`}
                                type="button"
                                aria-label={`Casa remota ${BOARD_LABELS[index]}`}
                                onClick={() => handleRemoteCellClick(index)}
                                disabled={Boolean(cell) || !isPlayerTurn || remotePhaseNotPlayable || remoteStatus !== 'playing'}
                                className={`relative flex h-24 items-center justify-center rounded-2xl border text-4xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-white ${
                                  cell
                                    ? 'border-indigo-200 bg-white text-indigo-700 shadow-inner dark:border-slate-700 dark:bg-slate-900'
                                    : 'border-dashed border-indigo-200 text-indigo-200 hover:-translate-y-1 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-700 dark:text-slate-500 dark:hover:border-indigo-400'
                                } ${
                                  isWinning
                                    ? 'border-indigo-400 bg-indigo-50/70 shadow-[0_0_30px_rgba(79,70,229,0.35)] dark:bg-indigo-500/10'
                                    : ''
                                } ${
                                  !isPlayerTurn || remoteStatus !== 'playing' || remotePhaseNotPlayable
                                    ? 'cursor-not-allowed opacity-70'
                                    : ''
                                }`}
                              >
                                {cell && (
                                  <span className={cell === 'X' ? 'text-indigo-500' : 'text-emerald-400'}>
                                    {cell}
                                  </span>
                                )}
                                {isWinning && <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400/70 animate-pulse" />}
                              </button>
                            )
                          })}
                        </div>
                        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {remotePhase === 'finished' || remoteStatus !== 'playing'
                            ? remoteStatus === 'draw'
                              ? 'Empate confirmado. Podes regressar ao lobby para nova partida.'
                              : remoteWinner
                                ? `Vitória para ${remoteWinner}.`
                                : 'Partida concluída.'
                            : isPlayerTurn
                              ? 'É a tua vez — escolhe a melhor jogada.'
                              : 'À espera da jogada do adversário.'}
                        </p>
                      </>
                    ) : (
                      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-300">A sincronizar tabuleiro…</p>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Código privado</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Cria ou usa um código para desafiar amigos.</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={generatedCode}
                        onChange={event => setGeneratedCode(event.target.value.toUpperCase())}
                        className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center font-mono text-sm uppercase tracking-[0.4em] text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreatePrivate}
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                      >
                        Criar
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={inviteCode}
                        onChange={event => setInviteCode(event.target.value.toUpperCase())}
                        placeholder="Código"
                        className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center font-mono text-sm uppercase tracking-[0.4em] text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleJoinWithCode}
                        className="rounded-xl border border-amber-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-600 transition hover:bg-amber-50 dark:border-amber-500/50 dark:text-amber-200"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200/60 bg-white/90 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Lista de amigos</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">Desafios rápidos</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">Beta</span>
                </div>
                <ul className="mt-4 space-y-3">
                  {FRIENDS.map(friend => (
                    <li key={friend.id} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{friend.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{friend.status} • {friend.rating} MMR</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFriendInvite(friend.id)}
                        className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200"
                      >
                        Desafiar
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  O convite cria automaticamente um código privado e envia através das notificações Supabase (roadmap Q1).
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-zinc-50 via-white to-amber-50 p-6 text-sm shadow-xl dark:border-zinc-800 dark:from-zinc-900 dark:via-black dark:to-amber-900/10">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Checklist do modo online</h3>
                <ul className="mt-4 space-y-3 text-zinc-600 dark:text-zinc-300">
                  <li>• RPC `matchmaking_join_and_create_room` funcional (ver em `pg_proc`).</li>
                  <li>• Sala atualizada via `updateRoomState` assim que ambos marcam “Pronto”.</li>
                  <li>• Próximo passo: sincronizar jogadas em tempo real quando o puzzle 3x3 estiver em modo duel.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-4 py-12 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-black dark:text-zinc-50">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => void handleBackToSelection()}
            className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            ← Mudar Modo
          </button>
          <span className="rounded-full bg-zinc-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white dark:bg-white dark:text-zinc-900">
            Modo Local
          </span>
        </div>

        <header className="relative overflow-hidden rounded-3xl border border-yellow-100/60 bg-white/80 p-10 shadow-xl dark:border-yellow-500/20 dark:bg-zinc-900/70">
          <div className="pointer-events-none absolute inset-0 opacity-50 blur-3xl">
            <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-amber-200 via-pink-200 to-emerald-200 dark:from-yellow-500/30 dark:via-pink-500/20 dark:to-emerald-500/30" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-1 text-sm font-medium text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                Modo Local • 2 jogadores no mesmo dispositivo
              </p>
              <h1 className="text-4xl font-bold leading-tight text-zinc-900 dark:text-white sm:text-5xl">
                Partilha o ecrã e domina as diagonais
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                Passa o dispositivo ao parceiro, acompanha o histórico e desbloqueia combos relâmpago no modo Sereno ou Relâmpago.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                  PT-PT • Tabuleiro 3x3
                </span>
                <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                  Turnos partilhados no mesmo ecrã
                </span>
                <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                  UI animada com Tailwind v4
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200/60 bg-white/80 px-6 py-5 text-sm text-amber-900 shadow-lg dark:border-amber-500/20 dark:bg-zinc-900/90 dark:text-amber-200">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-600 dark:text-amber-300">Série atual</p>
              <p className="mt-2 text-4xl font-semibold">
                {streak.count} <span className="text-base font-medium">vitórias</span>
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {streak.player ? `Jogador ${streak.player}` : 'À espera do próximo campeão'}
              </p>
              <div className="mt-4 h-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min((streak.count / 5) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
          {bursts.map(burst => (
            <span
              key={burst.id}
              className="pointer-events-none absolute -top-4 h-3 w-3 rounded-full opacity-80 animate-ping"
              style={{ left: `${burst.left}%`, animationDelay: `${burst.delay}s`, animationDuration: '1.6s', backgroundColor: burst.color }}
            />
          ))}
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <section className="relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/90 p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-amber-100 to-pink-100 opacity-30 blur-3xl dark:from-amber-500/20 dark:to-pink-500/20" />
            <div className="absolute bottom-12 left-0 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 opacity-30 blur-3xl dark:from-emerald-500/20 dark:to-amber-500/20" />
            <div className="relative z-10 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-300">Estado da partida</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{statusLabel}</p>
                </div>
                <div className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm dark:border-zinc-700 dark:text-zinc-200">
                  {mode === 'casual' ? 'Modo Sereno' : 'Modo Relâmpago'}
                </div>
              </div>

              <div className="inline-flex rounded-2xl border border-zinc-200 bg-zinc-50 p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                {(
                  [
                    { key: 'casual', label: 'Sereno' },
                    { key: 'relampago', label: 'Relâmpago' }
                  ] satisfies Array<{ key: Mode; label: string }>
                ).map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleModeChange(option.key)}
                    className={`rounded-2xl px-4 py-2 font-medium transition-all ${
                      mode === option.key
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {board.map((cell, index) => {
                  const isWinning = winningLine?.includes(index)
                  return (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Casa ${BOARD_LABELS[index]}`}
                      onClick={() => handleCellClick(index)}
                      className={`relative flex h-28 items-center justify-center rounded-2xl border text-5xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-white ${
                        cell
                          ? 'border-zinc-200 bg-white text-zinc-900 shadow-inner dark:border-zinc-700 dark:bg-zinc-900'
                          : 'border-dashed border-zinc-200 text-zinc-400 hover:-translate-y-1 hover:border-amber-300 hover:text-amber-400 dark:border-zinc-700 dark:text-zinc-600 dark:hover:border-amber-400'
                      } ${
                        isWinning
                          ? 'bg-amber-100/70 shadow-[0_0_35px_rgba(251,191,36,0.5)] dark:bg-amber-400/20'
                          : ''
                      }`}
                      disabled={Boolean(cell) || status !== 'playing'}
                    >
                      {cell && (
                        <span className={`drop-shadow-lg ${cell === 'X' ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {cell}
                        </span>
                      )}
                      {isWinning && <span className="absolute inset-0 rounded-2xl border-2 border-amber-400/60 animate-pulse" />}
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/70">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">Jogador X</p>
                  <p className="mt-1 text-3xl font-semibold text-amber-500">{stats.X}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/70">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">Jogador O</p>
                  <p className="mt-1 text-3xl font-semibold text-emerald-500">{stats.O}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/70">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">Empates</p>
                  <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-white">{stats.draws}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Progresso da partida</span>
                  <span>{Math.round((occupiedCells / 9) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-emerald-400 transition-all"
                    style={{ width: `${(occupiedCells / 9) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  🔁 Reiniciar tabuleiro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStats({ X: 0, O: 0, draws: 0 })
                    setTimeline(['Estatísticas limpas — vamos recomeçar de fresco!'])
                    setStreak({ player: null, count: 0 })
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
                >
                  ✨ Limpar estatísticas
                </button>
              </div>
            </div>
          </section>
          <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200/60 bg-white/85 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/80">
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Linha temporal</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {timeline.length === 0 && <li>Faz a primeira jogada para ver os eventos aqui.</li>}
                  {timeline.map((entry, index) => (
                    <li key={`${entry}-${index}`} className="rounded-2xl border border-zinc-100/60 bg-zinc-50/70 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/70">
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 text-zinc-800 shadow-xl dark:border-emerald-500/20 dark:from-emerald-900/30 dark:via-zinc-900 dark:to-amber-900/20 dark:text-zinc-100">
                <h3 className="text-lg font-semibold">Guias rápidos</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <strong>Centro primeiro:</strong> mantém controlo de ângulos e força o adversário a defender cedo.
                  </li>
                  <li>
                    <strong>Modo Relâmpago:</strong> perfeito para partidas best-of-3 com animações mais rápidas.
                  </li>
                  <li>
                    <strong>Partilha:</strong> guarda GIFs da grelha e envia aos amigos diretamente do Nexo (roadmap Q1).
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
  )
}

function buildEmptyBoard(): CellValue[] {
  return Array.from({ length: 9 }, () => null as CellValue)
}

function createEmptySeriesState(length: SeriesLengthOption): SeriesState {
  return {
    length,
    wins: { X: 0, O: 0 },
    draws: 0,
    rounds: [],
    awaitingReset: false,
    eloDelta: { X: 0, O: 0 }
  }
}

function hydrateSeriesState(raw: unknown, fallbackLength: SeriesLengthOption): SeriesState {
  if (!raw || typeof raw !== 'object') {
    return createEmptySeriesState(fallbackLength)
  }

  const candidate = raw as Partial<SeriesState>
  const length = candidate.length === 5 ? 5 : 3
  const safeRounds = Array.isArray(candidate.rounds)
    ? candidate.rounds.map((round, index) => ({
        id: typeof round?.id === 'string' ? round.id : crypto.randomUUID(),
        round: typeof round?.round === 'number' ? round.round : index + 1,
        winner: round?.winner === 'X' || round?.winner === 'O' ? round.winner : null,
        draw: Boolean(round?.draw),
        moves: typeof round?.moves === 'number' ? round.moves : 0,
        finishedAt: typeof round?.finishedAt === 'string' ? round.finishedAt : new Date().toISOString()
      }))
    : []

  return {
    length,
    wins: {
      X: typeof candidate.wins?.X === 'number' ? candidate.wins.X : 0,
      O: typeof candidate.wins?.O === 'number' ? candidate.wins.O : 0
    },
    draws: typeof candidate.draws === 'number' ? candidate.draws : 0,
    rounds: safeRounds,
    winner: candidate.winner === 'X' || candidate.winner === 'O' ? candidate.winner : undefined,
    awaitingReset: Boolean(candidate.awaitingReset),
    eloDelta: {
      X: typeof candidate.eloDelta?.X === 'number' ? candidate.eloDelta.X : 0,
      O: typeof candidate.eloDelta?.O === 'number' ? candidate.eloDelta.O : 0
    }
  }
}

function concludeSeriesRound(series: SeriesState, result: { winner: CellValue | null; draw: boolean; moves: number }): SeriesState {
  const wins = { ...series.wins }
  let draws = series.draws
  if (result.winner) {
    wins[result.winner] += 1
  } else if (result.draw) {
    draws += 1
  }

  const nextRounds = [
    ...series.rounds,
    {
      id: crypto.randomUUID(),
      round: series.rounds.length + 1,
      winner: result.winner,
      draw: result.draw,
      moves: result.moves,
      finishedAt: new Date().toISOString()
    }
  ]

  const target = Math.ceil(series.length / 2)
  let resolvedWinner: CellValue | null = series.winner ?? null
  if (!resolvedWinner) {
    if (wins.X >= target) resolvedWinner = 'X'
    if (wins.O >= target) resolvedWinner = 'O'
  }

  const eloDelta = resolvedWinner ? computeSeriesEloDelta(series.length, resolvedWinner) : series.eloDelta ?? { X: 0, O: 0 }

  return {
    ...series,
    wins,
    draws,
    rounds: nextRounds,
    winner: resolvedWinner ?? undefined,
    awaitingReset: resolvedWinner ? false : true,
    eloDelta
  }
}

function computeSeriesEloDelta(length: SeriesLengthOption, winner: CellValue): Record<'X' | 'O', number> {
  const swing = length === 5 ? 30 : 24
  return winner === 'X' ? { X: swing, O: -swing } : { X: -swing, O: swing }
}

function mergeParticipants(
  existing: RoomParticipant[] | undefined,
  selfId: string | null,
  opponentId: string | null,
  playerSymbol: CellValue
): RoomParticipant[] {
  const snapshot = Array.isArray(existing) ? existing.map(participant => ({ ...participant })) : []
  const ensureEntry = (id: string | null, marker: CellValue) => {
    if (!id) return
    const current = snapshot.find(participant => participant.id === id)
    if (current) {
      if (!current.marker) current.marker = marker
      if (current.ready === undefined) current.ready = true
    } else {
      snapshot.push({ id, marker, ready: true })
    }
  }

  ensureEntry(selfId, playerSymbol)
  ensureEntry(opponentId, playerSymbol === 'X' ? 'O' : 'X')
  return snapshot
}

function normalizeStateForUpdate(
  current: Json | null,
  selfId: string | null,
  opponentId: string | null,
  playerSymbol: CellValue,
  preferredSeriesLength: SeriesLengthOption
): NormalizedRoomState {
  const base = (current ?? {}) as RoomGameState
  const board = Array.isArray(base.board) && base.board.length === 9 ? [...(base.board as CellValue[])] : buildEmptyBoard()
  const participants = mergeParticipants(base.participants, selfId, opponentId, playerSymbol)
  const phase: NonNullable<RoomGameState['phase']> = base.phase ?? 'playing'
  const status: GameStatus = base.status ?? 'playing'
  const winningLine = Array.isArray(base.winningLine) ? [...(base.winningLine as number[])] : null
  const winner: CellValue | null = base.winner === 'X' || base.winner === 'O' ? base.winner : null
  const currentPlayer: CellValue = base.currentPlayer === 'O' ? 'O' : 'X'
  const seriesState = hydrateSeriesState(base.seriesState, preferredSeriesLength)
  const roundMoves = typeof base.roundMoves === 'number' ? base.roundMoves : countFilledCells(board)

  return {
    ...base,
    board,
    participants,
    phase,
    status,
    winningLine,
    winner,
    currentPlayer,
    seriesState,
    roundMoves
  }
}

function findWinningLine(board: CellValue[], symbol: CellValue): number[] | null {
  for (const pattern of WIN_PATTERNS) {
    if (pattern.every(position => board[position] === symbol)) {
      return [...pattern]
    }
  }
  return null
}

function countFilledCells(board: CellValue[]) {
  return board.filter(Boolean).length
}

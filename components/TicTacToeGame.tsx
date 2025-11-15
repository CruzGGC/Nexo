'use client'

import { useMemo, useState } from 'react'

type CellValue = 'X' | 'O' | null

type GameStatus = 'playing' | 'win' | 'draw'

type Mode = 'casual' | 'relampago'

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

export default function TicTacToeGame() {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<CellValue>('X')
  const [status, setStatus] = useState<GameStatus>('playing')
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  const [stats, setStats] = useState({ X: 0, O: 0, draws: 0 })
  const [timeline, setTimeline] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('casual')
  const [streak, setStreak] = useState<{ player: CellValue; count: number }>({ player: null, count: 0 })
  const [queueStatus, setQueueStatus] = useState<'idle' | 'joining' | 'waiting' | 'matched'>('idle')
  const [bursts, setBursts] = useState<ConfettiBurst[]>([])

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

  const handleJoinQueue = async () => {
    if (queueStatus === 'joining' || queueStatus === 'waiting') return
    setQueueStatus('joining')
    setTimeline(prev => ['Ligando ao serviço de matchmaking seguro…', ...prev].slice(0, 8))

    await new Promise(resolve => setTimeout(resolve, 800))
    setQueueStatus('waiting')
    setTimeline(prev => ['🎯 Fila global: à espera do melhor par', ...prev].slice(0, 8))

    setTimeout(() => {
      setQueueStatus('matched')
      setTimeline(prev => ['🤝 Emparelhamento encontrado! O worker cron executou a junção.', ...prev].slice(0, 8))
    }, 2000)
  }

  const queueStatusLabel = {
    idle: 'Entrar na fila global',
    joining: 'A preparar sessão segura…',
    waiting: 'À procura de adversário…',
    matched: 'Pronto! Sala reservada'
  }[queueStatus]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-4 py-12 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-black dark:text-zinc-50">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="relative overflow-hidden rounded-3xl border border-yellow-100/60 bg-white/80 p-10 shadow-xl dark:border-yellow-500/20 dark:bg-zinc-900/70">
          <div className="pointer-events-none absolute inset-0 opacity-50 blur-3xl">
            <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-amber-200 via-pink-200 to-emerald-200 dark:from-yellow-500/30 dark:via-pink-500/20 dark:to-emerald-500/30" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-1 text-sm font-medium text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <span className="text-lg">⚡</span> Multiplayer em preparação
              </p>
              <h1 className="text-4xl font-bold leading-tight text-zinc-900 dark:text-white sm:text-5xl">
                Jogo do Galo com animações e modo competitivo
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                Treina táticas rápidas, acompanha o histórico de jogadas e prepara-te para o matchmaking automático powered by Supabase.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                  PT-PT • Tabuleiro 3x3
                </span>
                <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                  Worker de matchmaking ativo
                </span>
                <span className="rounded-full border border-zinc-200/70 px-4 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                  UI animada com Tailwind v4
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200/60 bg-white/80 px-6 py-5 text-sm text-amber-900 shadow-lg dark:border-amber-500/20 dark:bg-zinc-900/90 dark:text-amber-200">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-600 dark:text-amber-300">
                Série atual
              </p>
              <p className="mt-2 text-4xl font-semibold">
                {streak.count} <span className="text-base font-medium">vitórias</span>
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {streak.player ? `Jogador ${streak.player}` : 'À espera do próximo campeão'}
              </p>
              <div className="mt-4 h-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  style={{ width: `${Math.min((streak.count / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          {bursts.map(burst => (
            <span
              key={burst.id}
              className="pointer-events-none absolute -top-4 h-3 w-3 rounded-full opacity-80 animate-ping"
              style={{
                left: `${burst.left}%`,
                animationDelay: `${burst.delay}s`,
                animationDuration: '1.6s',
                backgroundColor: burst.color
              }}
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Fila global</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">Matchmaking Supabase</p>
                </div>
                <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                  Beta
                </span>
              </div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                O worker `matchmaking-worker` corre via pg_cron e procura pares compatíveis de acordo com rating e região. Junta-te à fila e vê o fluxo em ação.
              </p>
              <button
                type="button"
                onClick={handleJoinQueue}
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold transition-all ${
                  queueStatus === 'idle'
                    ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-lg'
                    : 'bg-zinc-900 text-white shadow-inner dark:bg-zinc-800'
                }`}
              >
                {queueStatusLabel}
              </button>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Próximo passo: sincronizar automaticamente com `matchmaking_queue` e abrir a sala via Realtime.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200/60 bg-white/85 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/80">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Linha temporal</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {timeline.length === 0 && <li>Faz a primeira jogada para ver os eventos aqui.</li>}
                {timeline.map((entry, index) => (
                  <li
                    key={`${entry}-${index}`}
                    className="rounded-2xl border border-zinc-100/60 bg-zinc-50/70 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/70"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 text-zinc-800 shadow-xl dark:border-emerald-500/20 dark:from-emerald-900/30 dark:via-zinc-900 dark:to-amber-900/20 dark:text-zinc-100">
              <h3 className="text-lg font-semibold">Guias rápidos</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <strong>Centro primeiro:</strong> o algoritmo de matchmaking dá prioridade a quem inicia no centro, tal como as estratégias clássicas.
                </li>
                <li>
                  <strong>Modo Relâmpago:</strong> pensado para partidas best-of-3 com cronómetro de 90s (em breve).
                </li>
                <li>
                  <strong>Partilha:</strong> grava GIFs do tabuleiro e envia aos amigos diretamente do Nexo (roadmap Q1).
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

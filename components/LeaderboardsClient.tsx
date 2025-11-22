'use client'

import { useEffect, useMemo, useState } from 'react'

type LeaderboardType = 'crossword' | 'wordsearch' | 'ratings'

type ScoreEntry = {
  avatar_url: string | null
  completed_at: string | null
  display_name: string | null
  puzzle_id: string | null
  rank: number | null
  time_ms: number | null
  username: string | null
}

type RatingEntry = {
  avatar_url: string | null
  deviation: number | null
  display_name: string | null
  game_type: string | null
  matches_played: number | null
  rank: number | null
  rating: number | null
  username: string | null
  win_rate: number | null
}

const ratingGameTypes = [
  { id: 'tic_tac_toe', label: 'Jogo do Galo' },
  { id: 'battleship', label: 'Batalha Naval' },
  { id: 'crossword_duel', label: 'Duelo Cruzadas' },
  { id: 'wordsearch_duel', label: 'Duelo Sopa' }
] as const

type RatingGameType = (typeof ratingGameTypes)[number]['id']

const leaderboardTabs: Array<{
  id: LeaderboardType
  title: string
  description: string
}> = [
  {
    id: 'crossword',
    title: 'Diário de Palavras Cruzadas',
    description: 'Top 10 tempos oficiais do puzzle diário'
  },
  {
    id: 'wordsearch',
    title: 'Sopa de Letras',
    description: 'Melhores tempos na sopa diária'
  },
  {
    id: 'ratings',
    title: 'Multiplayer & Elo',
    description: 'Ranking global baseado em Elo/Glicko'
  }
]

const formatTime = (value: number | null | undefined) => {
  if (!value && value !== 0) return '—'
  const minutes = Math.floor(value / 60000)
  const seconds = Math.floor((value % 60000) / 1000)
  const millis = Math.floor((value % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}:${millis.toString().padStart(2, '0')}`
}

const formatWinRate = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value * 100)}%`
}

const formatDate = (value: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

const formatPuzzleDate = (value: string | null) => {
  if (!value) return null
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value))
}

type LeaderboardPayload =
  | {
      type: 'ratings'
      entries: RatingEntry[]
    }
  | {
      type: 'crossword' | 'wordsearch'
      entries: ScoreEntry[]
      puzzleId: string | null
      puzzleDate: string | null
    }

export default function LeaderboardsClient() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('crossword')
  const [ratingFilter, setRatingFilter] = useState<RatingGameType>(ratingGameTypes[0].id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [ratings, setRatings] = useState<RatingEntry[]>([])
  const [puzzleMeta, setPuzzleMeta] = useState<{ id: string | null; date: string | null }>({ id: null, date: null })

  const query = useMemo(() => {
    const params = new URLSearchParams({ type: activeTab })
    if (activeTab === 'ratings') {
      params.set('game_type', ratingFilter)
    }
    return `/api/leaderboards?${params.toString()}`
  }, [activeTab, ratingFilter])

  useEffect(() => {
    const controller = new AbortController()
    async function loadData() {
      setLoading(true)
      setError(null)
      if (activeTab === 'ratings') {
        setScores([])
        setPuzzleMeta({ id: null, date: null })
      } else {
        setRatings([])
      }
      try {
        const response = await fetch(query, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) {
          throw new Error('Falha ao carregar leaderboard')
        }
        const payload = (await response.json()) as LeaderboardPayload
        if (payload.type === 'ratings') {
          setRatings(payload.entries)
        } else {
          setScores(payload.entries)
          setPuzzleMeta({ id: payload.puzzleId ?? null, date: payload.puzzleDate ?? null })
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError('Não foi possível carregar os dados. Tenta novamente em instantes.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
    return () => controller.abort()
  }, [activeTab, query])

  const renderScores = () => (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Puzzle diário:{' '}
          <span className="font-semibold">
            {formatPuzzleDate(puzzleMeta.date) ?? 'A aguardar publicação'}
          </span>
        </p>
        {puzzleMeta.id && <p className="font-mono text-[11px] text-amber-800/80 dark:text-amber-100/70">ID: {puzzleMeta.id}</p>}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      <table className="min-w-full divide-y divide-zinc-100 text-left text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Jogador</th>
            <th className="px-4 py-3">Tempo</th>
            <th className="px-4 py-3">Terminado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {scores.map(entry => (
            <tr key={`${entry.puzzle_id}-${entry.rank ?? 'x'}`} className="bg-white/40 text-zinc-900 dark:bg-zinc-900/40 dark:text-zinc-50">
              <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-200">{entry.rank ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-200 text-center text-sm leading-8 dark:bg-zinc-800">
                    {entry.display_name?.[0]?.toUpperCase() ?? '👤'}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{entry.display_name ?? entry.username ?? 'Jogador'}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">@{entry.username ?? 'anónimo'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-lg text-amber-600 dark:text-amber-400">{formatTime(entry.time_ms)}</td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(entry.completed_at)}</td>
            </tr>
          ))}
          {!loading && scores.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                Ainda não há tempos registados hoje. Sê o primeiro!
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  )

  const renderRatings = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Filtrar jogo:</p>
        <div className="flex flex-wrap gap-2">
          {ratingGameTypes.map(option => (
            <button
              key={option.id}
              onClick={() => setRatingFilter(option.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                ratingFilter === option.id
                  ? 'bg-amber-500 text-white shadow'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <table className="min-w-full divide-y divide-zinc-100 text-left text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Jogador</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Desvio</th>
              <th className="px-4 py-3">Jogos</th>
              <th className="px-4 py-3">Vitórias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {ratings.map(entry => (
              <tr key={`${entry.game_type}-${entry.rank ?? 'x'}-${entry.username}`} className="bg-white/40 text-zinc-900 dark:bg-zinc-900/40 dark:text-zinc-50">
                <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-200">{entry.rank ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 text-center text-sm leading-8 dark:bg-zinc-800">
                      {entry.display_name?.[0]?.toUpperCase() ?? '👤'}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{entry.display_name ?? entry.username ?? 'Jogador'}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">@{entry.username ?? 'anónimo'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{Math.round(entry.rating ?? 0)}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">±{Math.round(entry.deviation ?? 0)}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{entry.matches_played ?? 0}</td>
                <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">{formatWinRate(entry.win_rate)}</td>
              </tr>
            ))}
            {!loading && ratings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Ainda não existem partidas ranqueadas. Prepara-te para ser o primeiro campeão!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {leaderboardTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-amber-500 text-white shadow'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {leaderboardTabs.find(tab => tab.id === activeTab)?.description}
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-6 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
          A carregar leaderboard...
        </div>
      )}

      {!loading && activeTab !== 'ratings' && renderScores()}
      {!loading && activeTab === 'ratings' && renderRatings()}
    </section>
  )
}



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
      puzzle: { id: string; date: string }
    }

export function LeaderboardsClient() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('crossword')
  const [ratingFilter, setRatingFilter] = useState<RatingGameType>('tic_tac_toe')
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [ratings, setRatings] = useState<RatingEntry[]>([])
  const [puzzleMeta, setPuzzleMeta] = useState<{ id: string | null; date: string | null }>({
    id: null,
    date: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set('type', activeTab)
    if (activeTab === 'ratings') {
      params.set('game', ratingFilter)
    }
    return params.toString()
  }, [activeTab, ratingFilter])

  useEffect(() => {
    const controller = new AbortController()
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/leaderboards?${query}`, {
          signal: controller.signal
        })
        if (!res.ok) throw new Error('Falha ao carregar dados')
        const data = (await res.json()) as LeaderboardPayload

        if (data.type === 'ratings') {
          setRatings(data.entries)
        } else {
          setScores(data.entries)
          setPuzzleMeta(data.puzzle)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error(err)
        setError('Não foi possível carregar a classificação.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
    return () => controller.abort()
  }, [activeTab, query])

  const renderScores = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 rounded-2xl border border-amber-100 bg-amber-50/60 px-6 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          Puzzle diário:{' '}
          <span className="font-bold">
            {formatPuzzleDate(puzzleMeta.date) ?? 'A aguardar publicação'}
          </span>
        </p>
        {puzzleMeta.id && <p className="font-mono text-xs text-amber-800/80 dark:text-amber-100/70">ID: {puzzleMeta.id}</p>}
      </div>
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100 text-left text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-bold">#</th>
                <th className="px-6 py-4 font-bold">Jogador</th>
                <th className="px-6 py-4 font-bold">Tempo</th>
                <th className="px-6 py-4 font-bold">Terminado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {scores.map((entry, index) => (
                <tr 
                  key={`${entry.puzzle_id}-${entry.rank ?? 'x'}`} 
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-6 py-4">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {entry.rank ?? index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {entry.display_name?.[0]?.toUpperCase() ?? '👤'}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-50">{entry.display_name ?? entry.username ?? 'Jogador'}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">@{entry.username ?? 'anónimo'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-lg font-bold text-amber-600 dark:text-amber-400">{formatTime(entry.time_ms)}</td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{formatDate(entry.completed_at)}</td>
                </tr>
              ))}
              {!loading && scores.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🏆</span>
                      <p className="font-medium">Ainda não há tempos registados hoje.</p>
                      <p className="text-sm">Sê o primeiro a completar o puzzle!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderRatings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Filtrar jogo:</p>
        <div className="flex flex-wrap gap-2">
          {ratingGameTypes.map(option => (
            <button
              key={option.id}
              onClick={() => setRatingFilter(option.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                ratingFilter === option.id
                  ? 'bg-amber-500 text-white shadow-md scale-105'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100 text-left text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-bold">#</th>
                <th className="px-6 py-4 font-bold">Jogador</th>
                <th className="px-6 py-4 font-bold">Rating</th>
                <th className="px-6 py-4 font-bold">Desvio</th>
                <th className="px-6 py-4 font-bold">Jogos</th>
                <th className="px-6 py-4 font-bold">Vitórias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {ratings.map((entry, index) => (
                <tr 
                  key={`${entry.game_type}-${entry.rank ?? 'x'}-${entry.username}`} 
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-6 py-4">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {entry.rank ?? index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {entry.display_name?.[0]?.toUpperCase() ?? '👤'}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-50">{entry.display_name ?? entry.username ?? 'Jogador'}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">@{entry.username ?? 'anónimo'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">{Math.round(entry.rating ?? 0)}</td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">±{Math.round(entry.deviation ?? 0)}</td>
                  <td className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">{entry.matches_played ?? 0}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{formatWinRate(entry.win_rate)}</td>
                </tr>
              ))}
              {!loading && ratings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🏅</span>
                      <p className="font-medium">Ainda não existem partidas ranqueadas.</p>
                      <p className="text-sm">Prepara-te para ser o primeiro campeão!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <section className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-wrap gap-3 rounded-3xl bg-white p-2 shadow-lg dark:bg-zinc-900">
        {leaderboardTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-white shadow-md scale-[1.02]'
                : 'bg-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
          {leaderboardTabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-bold">Erro</p>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-zinc-200 bg-white/70 py-24 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-amber-500 dark:border-zinc-800 dark:border-t-amber-500"></div>
          <p className="font-bold text-zinc-500 dark:text-zinc-400">A carregar classificações...</p>
        </div>
      )}

      {!loading && activeTab !== 'ratings' && renderScores()}
      {!loading && activeTab === 'ratings' && renderRatings()}
    </section>
  )
}



'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Calendar, Filter, Search, Crown, Timer, Hash } from 'lucide-react'

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

// Union type para entries do Podium - elimina uso de 'any'
type PodiumEntry = ScoreEntry | RatingEntry

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
  icon: React.FC<{ className?: string; size?: number }>
}> = [
    {
      id: 'crossword',
      title: 'Cruzadas',
      description: 'Os mais rápidos a resolver o puzzle de hoje.',
      icon: Timer
    },
    {
      id: 'wordsearch',
      title: 'Sopa de Letras',
      description: 'Mestres da observação no desafio diário.',
      icon: Search
    },
    {
      id: 'ratings',
      title: 'Ranking Global',
      description: 'Os melhores jogadores em partidas competitivas.',
      icon: Trophy
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

const Podium = ({ first, second, third, type }: { first?: PodiumEntry, second?: PodiumEntry, third?: PodiumEntry, type: 'score' | 'rating' }) => {
  const getDisplayName = (entry: PodiumEntry | undefined) => entry?.display_name ?? entry?.username ?? 'Jogador'
  const getValue = (entry: PodiumEntry | undefined) => {
    if (!entry) return '—'
    if (type === 'score' && 'time_ms' in entry) {
      return formatTime(entry.time_ms)
    }
    if (type === 'rating' && 'rating' in entry) {
      return Math.round(entry.rating ?? 0)
    }
    return '—'
  }

  return (
    <div className="flex items-end justify-center gap-4 mb-12 min-h-[280px]">
      {/* 2nd Place */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-3 w-1/3 max-w-[140px]"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-gray-300 bg-gray-900 overflow-hidden shadow-[0_0_30px_rgba(209,213,219,0.2)]">
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300 bg-gradient-to-br from-gray-800 to-black">
              {second?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
            #2
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-white truncate w-full text-sm">{second ? getDisplayName(second) : '—'}</p>
          <p className="text-gray-400 font-mono text-sm">{second ? getValue(second) : '—'}</p>
        </div>
        <div className="w-full h-24 bg-gradient-to-t from-gray-500/20 to-transparent rounded-t-lg border-t border-gray-500/30" />
      </motion.div>

      {/* 1st Place */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 w-1/3 max-w-[160px] -mt-8"
      >
        <div className="relative">
          <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={32} />
          <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-yellow-900 overflow-hidden shadow-[0_0_40px_rgba(250,204,21,0.3)]">
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-yellow-400 bg-gradient-to-br from-yellow-900 to-black">
              {first?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-0.5 rounded-full shadow-lg">
            #1
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-white truncate w-full">{first ? getDisplayName(first) : '—'}</p>
          <p className="text-yellow-400 font-mono font-bold">{first ? getValue(first) : '—'}</p>
        </div>
        <div className="w-full h-32 bg-gradient-to-t from-yellow-500/20 to-transparent rounded-t-lg border-t border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)]" />
      </motion.div>

      {/* 3rd Place */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-3 w-1/3 max-w-[140px]"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-orange-400 bg-orange-900 overflow-hidden shadow-[0_0_30px_rgba(251,146,60,0.2)]">
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-orange-400 bg-gradient-to-br from-orange-900 to-black">
              {third?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-400 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
            #3
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-white truncate w-full text-sm">{third ? getDisplayName(third) : '—'}</p>
          <p className="text-orange-400 font-mono text-sm">{third ? getValue(third) : '—'}</p>
        </div>
        <div className="w-full h-16 bg-gradient-to-t from-orange-500/20 to-transparent rounded-t-lg border-t border-orange-500/30" />
      </motion.div>
    </div>
  )
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
  const [searchQuery, setSearchQuery] = useState('')

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
          setPuzzleMeta(data.puzzle || { id: null, date: null })
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

  const filteredScores = useMemo(() => {
    return scores.filter(s =>
      (s.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (s.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  }, [scores, searchQuery])

  const filteredRatings = useMemo(() => {
    return ratings.filter(r =>
      (r.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (r.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  }, [ratings, searchQuery])

  const renderScores = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {!loading && scores.length > 0 && !searchQuery && (
        <Podium
          first={scores[0]}
          second={scores[1]}
          third={scores[2]}
          type="score"
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Puzzle de Hoje</p>
            <p className="text-white font-bold text-lg">{formatPuzzleDate(puzzleMeta?.date) ?? 'A aguardar publicação'}</p>
          </div>
        </div>
        {puzzleMeta?.id && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60">
            <Hash size={12} />
            ID: {puzzleMeta.id}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {filteredScores.map((entry, index) => (
          <motion.div
            key={`${entry.puzzle_id}-${entry.rank ?? 'x'}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-blue-600/0 group-hover:via-blue-600/5 group-hover:to-blue-600/10 transition-all duration-500" />

            <div className="relative flex items-center gap-4 p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${(entry.rank ?? index + 1) === 1 ? 'text-yellow-400 bg-yellow-400/10' :
                  (entry.rank ?? index + 1) === 2 ? 'text-gray-300 bg-gray-300/10' :
                    (entry.rank ?? index + 1) === 3 ? 'text-orange-400 bg-orange-400/10' :
                      'text-white/20 bg-white/5'
                }`}>
                {entry.rank ?? index + 1}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-bold">
                {entry.display_name?.[0]?.toUpperCase() ?? '👤'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {entry.display_name ?? entry.username ?? 'Jogador'}
                  </p>
                  {(entry.rank ?? index + 1) <= 3 && (
                    <Crown size={14} className={
                      (entry.rank ?? index + 1) === 1 ? 'text-yellow-400' :
                        (entry.rank ?? index + 1) === 2 ? 'text-gray-300' :
                          'text-orange-400'
                    } />
                  )}
                </div>
                <p className="text-xs text-white/40 truncate">@{entry.username ?? 'anónimo'}</p>
              </div>

              <div className="text-right">
                <p className="font-mono text-lg font-bold text-blue-400 group-hover:text-blue-300 transition-colors drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  {formatTime(entry.time_ms)}
                </p>
                <p className="text-xs text-white/30">
                  {formatDate(entry.completed_at)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {!loading && filteredScores.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="text-white/20" size={32} />
            </div>
            <p className="font-bold text-white text-lg">Nenhum resultado encontrado</p>
            <p className="text-white/40">Tenta ajustar a tua pesquisa.</p>
          </div>
        )}
      </div>
    </motion.div>
  )

  const renderRatings = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {!loading && ratings.length > 0 && !searchQuery && (
        <Podium
          first={ratings[0]}
          second={ratings[1]}
          third={ratings[2]}
          type="rating"
        />
      )}

      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white/60 mb-2">
          <Filter size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">Modo de Jogo:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ratingGameTypes.map(option => (
            <button
              key={option.id}
              onClick={() => setRatingFilter(option.id)}
              className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all overflow-hidden ${ratingFilter === option.id
                ? 'text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
            >
              {ratingFilter === option.id && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredRatings.map((entry, index) => (
          <motion.div
            key={`${entry.game_type}-${entry.rank ?? 'x'}-${entry.username}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-purple-600/0 group-hover:via-purple-600/5 group-hover:to-purple-600/10 transition-all duration-500" />

            <div className="relative flex items-center gap-4 p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${(entry.rank ?? index + 1) === 1 ? 'text-yellow-400 bg-yellow-400/10' :
                  (entry.rank ?? index + 1) === 2 ? 'text-gray-300 bg-gray-300/10' :
                    (entry.rank ?? index + 1) === 3 ? 'text-orange-400 bg-orange-400/10' :
                      'text-white/20 bg-white/5'
                }`}>
                {entry.rank ?? index + 1}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-bold">
                {entry.display_name?.[0]?.toUpperCase() ?? '👤'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                    {entry.display_name ?? entry.username ?? 'Jogador'}
                  </p>
                  {(entry.rank ?? index + 1) <= 3 && (
                    <Crown size={14} className={
                      (entry.rank ?? index + 1) === 1 ? 'text-yellow-400' :
                        (entry.rank ?? index + 1) === 2 ? 'text-gray-300' :
                          'text-orange-400'
                    } />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>@{entry.username ?? 'anónimo'}</span>
                  <span>•</span>
                  <span>{entry.matches_played ?? 0} jogos</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                    {Math.round(entry.rating ?? 0)}
                  </span>
                  <span className="text-xs text-white/30 font-mono">
                    ±{Math.round(entry.deviation ?? 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: formatWinRate(entry.win_rate) }}
                    />
                  </div>
                  <span className="text-white/60 font-bold">{formatWinRate(entry.win_rate)} WR</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {!loading && filteredRatings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="text-white/20" size={32} />
            </div>
            <p className="font-bold text-white text-lg">Nenhum resultado encontrado</p>
            <p className="text-white/40">Tenta ajustar a tua pesquisa.</p>
          </div>
        )}
      </div>
    </motion.div>
  )

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
          {leaderboardTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all relative overflow-hidden ${activeTab === tab.id
                ? 'text-white shadow-lg'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon size={16} className="relative z-10" />
              <span className="relative z-10">{tab.title}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input
            type="text"
            placeholder="Procurar jogador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      <div className="text-center py-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg font-medium text-white/60"
          >
            {leaderboardTabs.find(tab => tab.id === activeTab)?.description}
          </motion.p>
        </AnimatePresence>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
          <p className="font-bold">Erro</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"></div>
          <p className="font-bold text-white/40">A carregar classificações...</p>
        </div>
      ) : (
        <div className="min-h-[400px]">
          {activeTab !== 'ratings' ? renderScores() : renderRatings()}
        </div>
      )}
    </section>
  )
}

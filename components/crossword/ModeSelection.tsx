import Link from 'next/link'
import type { GameMode } from '@/lib/types/games'
import { motion } from 'framer-motion'

type SoundType = 'click' | 'hover' | 'start' | 'place' | 'rotate' | 'shoot' | 'hit' | 'miss' | 'sink' | 'win' | 'lose'

interface ModeSelectionProps {
  gameMode: GameMode
  isLoading: boolean
  error: string | null
  onSelectMode: (mode: GameMode) => void | Promise<void>
  playSound?: (type: SoundType) => void
}

const loadingCopy: Record<GameMode, string> = {
  daily: 'A carregar puzzle diário...',
  random: 'A gerar puzzle aleatório...',
  duel: 'A preparar duelo...'
}

export function ModeSelection({ gameMode, isLoading, error, onSelectMode, playSound }: ModeSelectionProps) {
  const handlePlaySound = (type: SoundType) => {
    if (playSound) playSound(type)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030014] py-12 overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#bc13fe]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00f3ff]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16 text-center space-y-4 relative z-10"
      >
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-slate-400 sm:text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          PALAVRAS CRUZADAS
        </h1>
        <p className="text-xl text-zinc-400 max-w-md mx-auto">
          O clássico jogo de palavras. Desafia o teu vocabulário.
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center backdrop-blur-md"
        >
          <p className="text-sm font-medium text-red-200">{error}</p>
        </motion.div>
      )}

      <div className="grid gap-8 w-full max-w-6xl sm:grid-cols-3 px-6 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => {
            handlePlaySound('click')
            onSelectMode('daily')
          }}
          onMouseEnter={() => handlePlaySound('hover')}
          disabled={isLoading}
          className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center transition-all hover:border-yellow-400/50 hover:bg-white/10 hover:shadow-[0_0_50px_rgba(250,204,21,0.2)] hover:-translate-y-1 disabled:opacity-50 backdrop-blur-xl"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 transition-all duration-500 group-hover:from-yellow-500/10 group-hover:to-orange-600/10" />

          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 p-[1px] shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/50 backdrop-blur-md">
              <span className="text-5xl">📅</span>
            </div>
          </div>

          <div className="relative">
            <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">Modo Diário</h3>
            <p className="text-zinc-400 group-hover:text-zinc-200 transition-colors">
              O mesmo puzzle para todos. Novo desafio à meia-noite.
            </p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => {
            handlePlaySound('click')
            onSelectMode('random')
          }}
          onMouseEnter={() => handlePlaySound('hover')}
          disabled={isLoading}
          className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center transition-all hover:border-blue-400/50 hover:bg-white/10 hover:shadow-[0_0_50px_rgba(96,165,250,0.2)] hover:-translate-y-1 disabled:opacity-50 backdrop-blur-xl"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 transition-all duration-500 group-hover:from-blue-500/10 group-hover:to-cyan-600/10" />

          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-600 p-[1px] shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/50 backdrop-blur-md">
              <span className="text-5xl">🎲</span>
            </div>
          </div>

          <div className="relative">
            <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Modo Aleatório</h3>
            <p className="text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Puzzle novo a cada jogo. Treino ilimitado!
            </p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            handlePlaySound('click')
            onSelectMode('duel')
          }}
          onMouseEnter={() => handlePlaySound('hover')}
          disabled={isLoading}
          className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center transition-all hover:border-purple-400/50 hover:bg-white/10 hover:shadow-[0_0_50px_rgba(192,132,252,0.2)] hover:-translate-y-1 disabled:opacity-50 backdrop-blur-xl"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 transition-all duration-500 group-hover:from-purple-500/10 group-hover:to-pink-600/10" />

          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 p-[1px] shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/50 backdrop-blur-md">
              <span className="text-5xl">⚔️</span>
            </div>
          </div>

          <div className="relative">
            <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Duelo</h3>
            <p className="text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Desafia um amigo para ver quem resolve mais rápido.
            </p>
          </div>
        </motion.button>
      </div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center relative z-10"
        >
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.5)]" />
          <p className="text-zinc-400">{loadingCopy[gameMode]}</p>
        </motion.div>
      )}

      <div className="mt-12 relative z-10">
        <Link
          href="/"
          onClick={() => handlePlaySound('click')}
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-white flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Menu
        </Link>
      </div>
    </div>
  )
}

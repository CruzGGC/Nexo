import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import type { GameMode } from '@/lib/types/games'

interface ModeSelectionProps {
  gameMode: GameMode | null
  isLoading: boolean
  error: string | null
  onSelectMode: (mode: GameMode) => void | Promise<void>
  playSound?: (type: 'hover' | 'click') => void
}

const loadingCopy: Record<GameMode, string> = {
  daily: 'A carregar sopa de letras diária...',
  random: 'A gerar sopa de letras aleatória...',
  duel: 'A preparar duelo...'
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
}

export function ModeSelection({ gameMode, isLoading, error, onSelectMode, playSound }: ModeSelectionProps) {
  const handlePlaySound = (type: 'hover' | 'click') => {
    if (playSound) playSound(type)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030014] py-12">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
      <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 container mx-auto px-4"
      >
        <div className="mb-16 text-center space-y-4">
          <motion.h1
            variants={itemVariants}
            className="text-6xl font-black tracking-tighter text-white sm:text-8xl md:text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              SOPA DE
            </span>
            <br />
            LETRAS
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xl text-zinc-400 max-w-md mx-auto"
          >
            Encontra as palavras escondidas no caos.
            <br />
            Treina a tua observação.
          </motion.p>
        </div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center backdrop-blur-md"
          >
            <p className="text-sm font-medium text-red-200">{error}</p>
          </motion.div>
        )}

        <div className="grid gap-8 w-full max-w-6xl mx-auto sm:grid-cols-3">
          {/* Daily Mode */}
          <motion.button
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              handlePlaySound('click')
              onSelectMode('daily')
            }}
            onMouseEnter={() => handlePlaySound('hover')}
            disabled={isLoading}
            className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl transition-all hover:bg-white/10 hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(234,179,8,0.2)] disabled:opacity-50"
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

          {/* Random Mode */}
          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
              handlePlaySound('click')
              onSelectMode('random')
            }}
            onMouseEnter={() => handlePlaySound('hover')}
            disabled={isLoading}
            className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl transition-all hover:bg-white/10 hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] disabled:opacity-50"
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

          {/* Duel Mode */}
          <motion.button
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              handlePlaySound('click')
              onSelectMode('duel')
            }}
            onMouseEnter={() => handlePlaySound('hover')}
            disabled={isLoading}
            className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl transition-all hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] disabled:opacity-50"
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
            <span className="absolute top-6 right-6 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
            </span>
          </motion.button>
        </div>

        {isLoading && gameMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center"
          >
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
            <p className="text-zinc-400 animate-pulse">{loadingCopy[gameMode]}</p>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="mt-16 text-center"
        >
          <Link
            href="/"
            onClick={() => handlePlaySound('click')}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-white hover:underline underline-offset-4"
          >
            ← Voltar ao Menu
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import type { GameMode } from '@/lib/types/games'

interface ModeSelectionProps {
  gameMode: GameMode | null
  isLoading: boolean
  error: string | null
  onSelectMode: (mode: GameMode) => void | Promise<void>
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

export function ModeSelection({ gameMode, isLoading, error, onSelectMode }: ModeSelectionProps) {
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
            className="text-5xl font-black tracking-tighter text-white sm:text-7xl md:text-8xl"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              SOPA DE
            </span>
            <br />
            LETRAS
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg text-zinc-400 max-w-md mx-auto"
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

        <motion.div
          variants={itemVariants}
          className="grid gap-6 w-full max-w-5xl mx-auto sm:grid-cols-3"
        >
          {/* Daily Mode */}
          <button
            onClick={() => onSelectMode('daily')}
            disabled={isLoading}
            className="group relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all hover:scale-105 hover:border-yellow-500/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] disabled:opacity-50"
          >
            <div className="rounded-2xl bg-yellow-500/20 p-4 text-4xl shadow-[0_0_20px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform duration-300">
              📅
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">Modo Diário</h3>
              <p className="mt-2 text-sm text-zinc-400 group-hover:text-zinc-300">
                O mesmo puzzle para todos. Novo desafio à meia-noite.
              </p>
            </div>
          </button>

          {/* Random Mode */}
          <button
            onClick={() => onSelectMode('random')}
            disabled={isLoading}
            className="group relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all hover:scale-105 hover:border-blue-500/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] disabled:opacity-50"
          >
            <div className="rounded-2xl bg-blue-500/20 p-4 text-4xl shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-300">
              🎲
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Modo Aleatório</h3>
              <p className="mt-2 text-sm text-zinc-400 group-hover:text-zinc-300">
                Puzzle novo a cada jogo. Treino ilimitado!
              </p>
            </div>
          </button>

          {/* Duel Mode */}
          <button
            onClick={() => onSelectMode('duel')}
            disabled={isLoading}
            className="group relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl transition-all hover:scale-105 hover:border-purple-500/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] disabled:opacity-50"
          >
            <div className="rounded-2xl bg-purple-500/20 p-4 text-4xl shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform duration-300">
              ⚔️
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Duelo</h3>
              <p className="mt-2 text-sm text-zinc-400 group-hover:text-zinc-300">
                Desafia um amigo para ver quem resolve mais rápido.
              </p>
            </div>
          </button>
        </motion.div>

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
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-white hover:underline underline-offset-4"
          >
            ← Voltar ao Menu
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

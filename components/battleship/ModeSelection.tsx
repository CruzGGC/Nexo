import { motion } from 'framer-motion'

interface ModeSelectionProps {
  onSelectMode: (mode: 'local' | 'online') => void
}

export function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-12 py-12">
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
        >
          BATALHA NAVAL
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-400 max-w-md mx-auto"
        >
          Domina os oceanos cibernéticos.
        </motion.p>
      </div>

      <div className="grid gap-8 w-full max-w-4xl md:grid-cols-2">
        {/* Local Mode */}
        <motion.button
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onSelectMode('local')}
          className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl transition-all hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_50px_rgba(6,182,212,0.2)]"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 transition-all duration-500 group-hover:from-cyan-500/10 group-hover:to-blue-600/10" />

          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/50 backdrop-blur-md">
              <span className="text-5xl">👥</span>
            </div>
          </div>

          <div className="relative">
            <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">Modo Local</h3>
            <p className="text-slate-400 group-hover:text-slate-200 transition-colors">
              1v1 no mesmo dispositivo
            </p>
          </div>
        </motion.button>

        {/* Online Mode */}
        <motion.button
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => onSelectMode('online')}
          className="group relative flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl transition-all hover:bg-white/10 hover:border-purple-400/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)]"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 transition-all duration-500 group-hover:from-purple-500/10 group-hover:to-pink-600/10" />

          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 p-[1px] shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/50 backdrop-blur-md">
              <span className="text-5xl">⚔️</span>
            </div>
          </div>

          <div className="relative">
            <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Online</h3>
            <p className="text-slate-400 group-hover:text-slate-200 transition-colors">
              Desafia o mundo
            </p>
          </div>

          <span className="absolute top-6 right-6 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
          </span>
        </motion.button>
      </div>
    </div>
  )
}


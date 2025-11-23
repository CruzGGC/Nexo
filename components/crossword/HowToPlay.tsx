import type { GameMode, CrosswordPuzzle } from '@/lib/types/games'
import { motion } from 'framer-motion'

interface HowToPlayProps {
  gameMode: GameMode
  puzzle: CrosswordPuzzle | null
  onStart: () => void
}

export function HowToPlay({ gameMode, puzzle, onStart }: HowToPlayProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-md animate-in fade-in zoom-in duration-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-4"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#00f3ff]/10 text-4xl shadow-[0_0_20px_rgba(0,243,255,0.2)] border border-[#00f3ff]/30">
          📝
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">Como Jogar</h2>
        <p className="text-zinc-400 max-w-md mx-auto">
          Preenche a grelha com as palavras correspondentes às pistas.
        </p>
      </motion.div>

      <div className="mb-8 grid gap-4 text-left sm:grid-cols-2 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/5 p-4 border border-white/10"
        >
          <h3 className="mb-2 font-bold text-white flex items-center gap-2">
            <span className="text-xl">⌨️</span> Computador
          </h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• Clica numa célula para selecionar</li>
            <li>• Clica novamente para mudar direção</li>
            <li>• Usa as setas para navegar</li>
            <li>• Tab muda a direção</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/5 p-4 border border-white/10"
        >
          <h3 className="mb-2 font-bold text-white flex items-center gap-2">
            <span className="text-xl">📱</span> Telemóvel
          </h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• Toca numa célula para selecionar</li>
            <li>• Toca novamente para mudar direção</li>
            <li>• Teclado virtual aparece automaticamente</li>
            <li>• Navegação automática ao escrever</li>
          </ul>
        </motion.div>
      </div>

      <div className="mb-8 w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-4 rounded-xl bg-yellow-500/10 p-4 border border-yellow-500/20">
          <div className="text-2xl">⏱️</div>
          <div className="text-left">
            <h4 className="font-bold text-yellow-200">Contra o Relógio</h4>
            <p className="text-sm text-yellow-200/70">
              O tempo começa a contar assim que clicares em &quot;Começar Jogo&quot;.
            </p>
          </div>
        </div>

        {gameMode === 'daily' && puzzle && (
          <div className="flex items-center gap-4 rounded-xl bg-blue-500/10 p-4 border border-blue-500/20">
            <div className="text-2xl">📅</div>
            <div className="text-left">
              <h4 className="font-bold text-blue-200">
                Puzzle Diário {puzzle.servedForDate ? `(${new Date(puzzle.servedForDate).toLocaleDateString('pt-PT')})` : ''}
              </h4>
              <p className="text-sm text-blue-200/70">
                Completa o puzzle de hoje para ganhares pontos e subires no ranking!
              </p>
            </div>
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="rounded-xl bg-[#00f3ff] px-12 py-4 text-lg font-black text-black shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all hover:bg-[#bc13fe] hover:text-white hover:shadow-[0_0_30px_rgba(188,19,254,0.4)]"
      >
        Começar Jogo
      </motion.button>
    </div>
  )
}

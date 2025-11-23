import type { Category } from '@/lib/types/games'
import { motion } from 'framer-motion'

interface CategorySelectionProps {
  categories: Category[]
  isLoading: boolean
  onSelectCategory: (categorySlug: string | null) => void
  onBack: () => void
}

export function CategorySelection({ categories, isLoading, onSelectCategory, onBack }: CategorySelectionProps) {

  return (
    <div className="flex min-h-screen flex-col bg-[#030014] overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#bc13fe]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00f3ff]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={() => {
              onBack()
            }}
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
          </button>
          <h1 className="text-xl font-bold text-white">Escolher Tema</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16 relative z-10">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center space-y-4"
          >
            <h2 className="text-4xl font-black tracking-tighter text-white sm:text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Escolha um Tema
            </h2>
            <p className="text-lg text-zinc-400 max-w-md mx-auto">
              Selecione uma categoria temática ou jogue com todas as palavras
            </p>
          </motion.div>

          {isLoading && (
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.5)]" />
              <p className="text-zinc-400">A gerar puzzle...</p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => {
                onSelectCategory(null)
              }}
              disabled={isLoading}
              className="group relative flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 disabled:opacity-50 backdrop-blur-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl transition-transform group-hover:scale-110 shadow-inner">
                🎲
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00f3ff] transition-colors">Todas as Palavras</h3>
                <p className="mt-1 text-sm text-zinc-400">Puzzle com palavras de todos os temas</p>
              </div>
            </motion.button>

            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => {
                  onSelectCategory(category.slug)
                }}
                disabled={isLoading || category.word_count < 10}
                className="group relative flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:bg-white/10 hover:-translate-y-1 disabled:opacity-50 backdrop-blur-md"
                style={{
                  borderColor: category.word_count >= 10 ? `${category.color}30` : undefined,
                  boxShadow: `0 0 0 0 ${category.color}00`
                }}
                onMouseOver={(e) => {
                  if (category.word_count >= 10) {
                    e.currentTarget.style.borderColor = `${category.color}80`
                    e.currentTarget.style.boxShadow = `0 0 30px ${category.color}20`
                  }
                }}
                onMouseOut={(e) => {
                  if (category.word_count >= 10) {
                    e.currentTarget.style.borderColor = `${category.color}30`
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110 shadow-inner"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white" style={{ color: category.word_count >= 10 ? undefined : 'inherit' }}>
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">{category.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-medium text-zinc-300">
                      {category.word_count} palavras
                    </span>
                    {category.word_count < 10 && (
                      <span className="text-xs font-medium text-red-400">
                        Mínimo 10 palavras
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

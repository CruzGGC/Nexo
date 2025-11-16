import type { Category } from '@/lib/types/games'

interface CategorySelectionProps {
  categories: Category[]
  isLoading: boolean
  onSelectCategory: (categorySlug: string | null) => void
  onBack: () => void
}

export function CategorySelection({ categories, isLoading, onSelectCategory, onBack }: CategorySelectionProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Voltar
          </button>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Escolher Tema</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Modo Aleatório - Escolha um Tema</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Selecione uma categoria temática ou jogue com todas as palavras</p>
          </div>

          {isLoading && (
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
              <p className="text-zinc-600 dark:text-zinc-400">A gerar puzzle...</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => onSelectCategory(null)}
              disabled={isLoading}
              className="group relative overflow-hidden rounded-xl border-2 border-zinc-300 bg-white p-6 text-left transition-all hover:border-zinc-500 hover:shadow-lg disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-2xl transition-transform group-hover:scale-110 dark:bg-zinc-800">
                🎲
              </div>
              <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">Todas as Palavras</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Puzzle com palavras de todos os temas</p>
            </button>

            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.slug)}
                disabled={isLoading || category.word_count < 10}
                className="group relative overflow-hidden rounded-xl border-2 border-zinc-200 bg-white p-6 text-left transition-all hover:border-zinc-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                style={{ borderColor: category.word_count >= 10 ? `${category.color}30` : undefined }}
              >
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>
                <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{category.name}</h3>
                <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">{category.description}</p>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">{category.word_count} palavras</span>
                {category.word_count < 10 && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">Mínimo 10 palavras necessário</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

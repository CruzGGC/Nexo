import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 font-sans dark:from-zinc-950 dark:to-black">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 px-6 py-16">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-7xl">
            Nexo
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Jogos de palavras e cartas em português
          </p>
        </div>

        {/* Game Cards */}
  <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Crosswords Card */}
          <Link
            href="/palavras-cruzadas"
            className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 text-3xl transition-transform group-hover:scale-110 dark:bg-zinc-800">
              📝
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Palavras Cruzadas
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Desafio diário • Dicionário PT-PT • Leaderboards
              </p>
            </div>
          </Link>

          {/* Word Search Card - NEW! */}
          <Link
            href="/sopa-de-letras"
            className="group flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm transition-all hover:shadow-md hover:border-emerald-300 dark:border-emerald-800 dark:from-emerald-950 dark:to-zinc-900 dark:hover:border-emerald-700"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 text-3xl transition-transform group-hover:scale-110 dark:bg-emerald-900">
              🔍
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Sopa de Letras
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Encontra palavras • 8 direções • Animações
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              NOVO! ✨
            </span>
          </Link>

          {/* Tic Tac Toe Card */}
          <Link
            href="/jogo-do-galo"
            className="group flex flex-col gap-4 rounded-2xl border border-yellow-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-yellow-800 dark:from-amber-950 dark:via-zinc-950 dark:to-rose-950"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100 text-3xl transition-transform group-hover:scale-110 dark:bg-amber-900">
              ✖️
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Jogo do Galo
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                UI animada • Modos Casual & Relâmpago • Matchmaking preparado
              </p>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500">
              Alpha ⚡
            </span>
          </Link>

          {/* Battleship Card */}
          <Link
            href="/batalha-naval"
            className="group flex flex-col gap-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-sky-800 dark:from-sky-950 dark:via-zinc-950 dark:to-indigo-950"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-sky-100 text-3xl transition-transform group-hover:scale-110 dark:bg-sky-900">
              🚢
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Batalha Naval
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Matchmaking público • Código privado • Tabuleiro 1v1
              </p>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-sky-500">
              NEW 💥
            </span>
          </Link>

          {/* Card Games Card - Coming Soon */}
          <div className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 opacity-60 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 text-3xl dark:bg-zinc-800">
              🃏
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Jogos de Cartas
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Em breve • Multiplayer
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
              BREVEMENTE
            </span>
          </div>
        </div>

        {/* Quick Access */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/leaderboards"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Ver Leaderboards
          </Link>
          <Link
            href="/sobre"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Sobre o Nexo
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 py-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p>© 2025 Nexo • Feito em Portugal 🇵🇹</p>
      </footer>
    </div>
  );
}

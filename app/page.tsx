import Link from "next/link";
import Image from "next/image";
import AuthCallout from "@/components/AuthCallout";
import NavbarAuth from "@/components/NavbarAuth";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-indigo-500/10 blur-[120px] animate-float dark:bg-indigo-500/20" />
        <div className="absolute top-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-rose-500/10 blur-[120px] animate-float [animation-delay:2s] dark:bg-rose-500/20" />
        <div className="absolute -bottom-[20%] left-[20%] h-[60%] w-[60%] rounded-full bg-emerald-500/10 blur-[120px] animate-float [animation-delay:4s] dark:bg-emerald-500/20" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex w-full items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/NexoPreto.png" alt="Nexo Logo" fill className="object-contain dark:hidden" />
            <Image src="/NexoBranco.png" alt="Nexo Logo" fill className="object-contain hidden dark:block" />
          </div>
          <span className="text-xl font-bold tracking-tight">Nexo</span>
        </div>
        <div className="flex items-center gap-4">
          <NavbarAuth />
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-20 pt-8 md:px-12 lg:pt-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-4 py-1.5 text-sm font-medium text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Novos jogos disponíveis
          </div>
          
          <h1 className="mb-6 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            <span className="block text-zinc-900 dark:text-white">Jogos clássicos,</span>
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 bg-clip-text text-transparent animate-gradient-xy">
              reinventados.
            </span>
          </h1>
          
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            A plataforma definitiva para jogos de palavras e estratégia em Português.
            Desafia a tua mente, compete nos leaderboards e diverte-te.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 lg:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:200ms]">
          
          {/* Featured: Crosswords (Large) */}
          <Link
            href="/palavras-cruzadas"
            className="group relative col-span-1 row-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02] dark:border-zinc-800 dark:bg-zinc-900 md:col-span-2 md:row-span-2 lg:p-10"
          >
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl transition-all group-hover:bg-indigo-500/20" />
            
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                🔥 Destaque do Dia
              </div>
              <h2 className="mb-2 text-4xl font-bold text-zinc-900 dark:text-white">Palavras Cruzadas</h2>
              <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
                O clássico intemporal. Resolve o puzzle diário gerado automaticamente e compete pelo melhor tempo no ranking nacional.
              </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-zinc-100 dark:border-zinc-900 dark:bg-zinc-800" />
                ))}
              </div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                +1.2k jogadores hoje
              </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute bottom-0 right-0 opacity-10 transition-opacity group-hover:opacity-20 dark:opacity-20 dark:group-hover:opacity-30">
              <div className="grid grid-cols-4 gap-1 p-8">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`h-12 w-12 rounded-md ${[0, 2, 5, 8, 10, 15].includes(i) ? "bg-zinc-900 dark:bg-white" : "border-2 border-zinc-900 dark:border-white"}`} />
                ))}
              </div>
            </div>
          </Link>

          {/* Word Search */}
          <Link
            href="/sopa-de-letras"
            className="group relative col-span-1 row-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02] dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
            
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-500/20">
                  🔍
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  NOVO
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">Sopa de Letras</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Encontra as palavras escondidas em todas as direções.
              </p>
            </div>
          </Link>

          {/* Battleship */}
          <Link
            href="/batalha-naval"
            className="group relative col-span-1 row-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02] dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl transition-all group-hover:bg-sky-500/20" />
            
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl dark:bg-sky-500/20">
                  🚢
                </div>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                  MULTIPLAYER
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">Batalha Naval</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Estratégia clássica. Afunda a frota do teu oponente.
              </p>
            </div>
          </Link>

          {/* Tic Tac Toe */}
          <Link
            href="/jogo-do-galo"
            className="group relative col-span-1 row-span-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02] dark:border-zinc-800 dark:bg-zinc-900 md:col-span-1"
          >
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
            
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-500/20">
                  ❌
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  RÁPIDO
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">Jogo do Galo</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                O jogo rápido perfeito para decidir quem paga o café.
              </p>
            </div>
          </Link>

        </div>

        {/* Auth Engagement */}
        <div id="auth-section" className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:300ms]">
          <AuthCallout />
        </div>

        {/* Features / Trust */}
        <div className="grid grid-cols-2 gap-8 border-t border-zinc-200 pt-16 dark:border-zinc-800 md:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:400ms]">
          {[
            { label: "Jogadores", value: "10k+" },
            { label: "Puzzles Resolvidos", value: "50k+" },
            { label: "Palavras no Dicionário", value: "120k" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 bg-white/50 py-12 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-12">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/NexoPreto.png" alt="Nexo Logo" fill className="object-contain dark:hidden" />
              <Image src="/NexoBranco.png" alt="Nexo Logo" fill className="object-contain hidden dark:block" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">Nexo</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/sobre" className="hover:text-zinc-900 dark:hover:text-white">Sobre</Link>
            <Link href="/leaderboards" className="hover:text-zinc-900 dark:hover:text-white">Leaderboards</Link>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Privacidade</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Termos</a>
          </div>
          <div className="text-sm text-zinc-500">
            © 2025 Nexo. Feito com ❤️ em Portugal.
          </div>
        </div>
      </footer>
    </div>
  );
}

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import GameCard from "@/components/GameCard";
import Features from "@/components/Features";
import BackgroundGrid from "@/components/BackgroundGrid";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden selection:bg-blue-500/30">
      <BackgroundGrid />
      <Navbar />

      <Hero />

      <section id="games" className="py-32 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-20">
            <h2 className="text-4xl md:text-7xl font-black text-center mb-6 text-white tracking-tighter">
              ESCOLHE O TEU <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 neon-text-blue">DESAFIO</span>
            </h2>
            <p className="text-white/40 text-lg md:text-xl max-w-2xl text-center font-light">
              Quatro jogos clássicos. Infinitas possibilidades. Escolhe o teu favorito e começa a subir no ranking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 px-4">
            <GameCard
              title="Batalha Naval"
              description="Estratégia pura. Posiciona a tua frota e destrói o inimigo."
              href="/batalha-naval"
              color="#3b82f6" // Blue
              iconName="crosshair"
              delay={0}
            />
            <GameCard
              title="Jogo do Galo"
              description="Rápido e tático. O clássico duelo de X e O."
              href="/jogo-do-galo"
              color="#a855f7" // Purple
              iconName="hash"
              delay={0.1}
            />
            <GameCard
              title="Sopa de Letras"
              description="Olhos de águia. Encontra as palavras antes que o tempo acabe."
              href="/sopa-de-letras"
              color="#ec4899" // Pink
              iconName="search"
              delay={0.2}
            />
            <GameCard
              title="Palavras Cruzadas"
              description="Desafia o teu intelecto. Completa a grelha diária."
              href="/palavras-cruzadas"
              color="#22c55e" // Green
              iconName="grid"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      <Features />

      <footer className="py-12 text-center text-white/20 text-sm border-t border-white/5 relative z-10 backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} Nexo. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}

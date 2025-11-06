export default function SobrePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="max-w-2xl">
        <h1 className="mb-6 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Sobre o Nexo
        </h1>
        <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
          <p>
            O Nexo é uma plataforma de jogos web focada em jogos de palavras e
            cartas em português de Portugal (PT-PT).
          </p>
          <p>
            Começamos com palavras cruzadas, oferecendo desafios diários e um
            modo de jogo livre com dicionário PT-PT completo.
          </p>
          <p>
            Em breve: jogos de cartas multiplayer como Sueca e Solitário.
          </p>
        </div>
      </div>
    </div>
  );
}

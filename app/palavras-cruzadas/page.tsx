'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CrosswordGrid, { type Cell, type Clue } from '@/components/CrosswordGrid';
import Timer from '@/components/Timer';
import Link from 'next/link';

export default function PalavrasCruzadasPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [puzzle, setPuzzle] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  // Exemplo de puzzle (vamos buscar da API depois)
  useEffect(() => {
    // Por agora, vamos criar um puzzle de exemplo
    // TODO: Buscar da API quando tivermos puzzles na base de dados
    const examplePuzzle = createExamplePuzzle();
    setPuzzle(examplePuzzle);
    setIsLoading(false);
  }, []);

  const createExamplePuzzle = () => {
    // Puzzle de exemplo simples 5x5
    const grid: Cell[][] = [
      [
        { value: '', correct: 'C', number: 1, isBlack: false, row: 0, col: 0 },
        { value: '', correct: 'A', isBlack: false, row: 0, col: 1 },
        { value: '', correct: 'S', isBlack: false, row: 0, col: 2 },
        { value: '', correct: 'A', isBlack: false, row: 0, col: 3 },
        { value: '', correct: '', isBlack: true, row: 0, col: 4 },
      ],
      [
        { value: '', correct: 'A', isBlack: false, row: 1, col: 0 },
        { value: '', correct: '', isBlack: true, row: 1, col: 1 },
        { value: '', correct: 'O', number: 2, isBlack: false, row: 1, col: 2 },
        { value: '', correct: 'L', isBlack: false, row: 1, col: 3 },
        { value: '', correct: 'A', isBlack: false, row: 1, col: 4 },
      ],
      [
        { value: '', correct: 'F', number: 3, isBlack: false, row: 2, col: 0 },
        { value: '', correct: 'A', isBlack: false, row: 2, col: 1 },
        { value: '', correct: 'D', isBlack: false, row: 2, col: 2 },
        { value: '', correct: 'O', isBlack: false, row: 2, col: 3 },
        { value: '', correct: '', isBlack: true, row: 2, col: 4 },
      ],
      [
        { value: '', correct: 'E', isBlack: false, row: 3, col: 0 },
        { value: '', correct: '', isBlack: true, row: 3, col: 1 },
        { value: '', correct: 'A', isBlack: false, row: 3, col: 2 },
        { value: '', correct: '', isBlack: true, row: 3, col: 3 },
        { value: '', correct: '', isBlack: true, row: 3, col: 4 },
      ],
      [
        { value: '', correct: '', isBlack: true, row: 4, col: 0 },
        { value: '', correct: '', isBlack: true, row: 4, col: 1 },
        { value: '', correct: 'R', isBlack: false, row: 4, col: 2 },
        { value: '', correct: '', isBlack: true, row: 4, col: 3 },
        { value: '', correct: '', isBlack: true, row: 4, col: 4 },
      ],
    ];

    const clues = {
      across: [
        {
          number: 1,
          text: 'Habitação, moradia',
          answer: 'CASA',
          startRow: 0,
          startCol: 0,
          direction: 'across' as const,
        },
        {
          number: 2,
          text: 'Saudação informal',
          answer: 'OLA',
          startRow: 1,
          startCol: 2,
          direction: 'across' as const,
        },
        {
          number: 3,
          text: 'Destino, género musical português',
          answer: 'FADO',
          startRow: 2,
          startCol: 0,
          direction: 'across' as const,
        },
      ],
      down: [
        {
          number: 1,
          text: 'Bebida estimulante',
          answer: 'CAFE',
          startRow: 0,
          startCol: 0,
          direction: 'down' as const,
        },
        {
          number: 2,
          text: 'Nota musical + Lá + Ré',
          answer: 'SOLAR',
          startRow: 0,
          startCol: 2,
          direction: 'down' as const,
        },
      ],
    };

    return {
      id: 1,
      grid_data: grid,
      clues,
      type: 'standard_pt',
    };
  };

  const handleStartGame = () => {
    setShowInstructions(false);
    setIsPlaying(true);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    setIsComplete(true);
  };

  const handleTimeUpdate = (timeMs: number) => {
    setFinalTime(timeMs);
  };

  const handleRestart = () => {
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50"></div>
          <p className="text-zinc-600 dark:text-zinc-400">A carregar puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      {/* Cabeçalho */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-50"
          >
            ← Nexo
          </Link>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Tempo</div>
              <Timer isRunning={isPlaying} onTimeUpdate={handleTimeUpdate} />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {showInstructions && (
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Como Jogar
            </h2>
            <ul className="mb-6 space-y-2 text-zinc-700 dark:text-zinc-300">
              <li>• Clique numa célula para começar a escrever</li>
              <li>• Use as <strong>setas</strong> do teclado para navegar</li>
              <li>• Prima <strong>Tab</strong> para alternar entre horizontal/vertical</li>
              <li>• Prima <strong>Backspace</strong> para apagar</li>
              <li>• Clique nas pistas para saltar para essa palavra</li>
              <li>• O temporizador começa quando clicar em &quot;Iniciar Jogo&quot;</li>
            </ul>
            <button
              onClick={handleStartGame}
              className="rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Iniciar Jogo
            </button>
          </div>
        )}

        {!showInstructions && !isComplete && puzzle && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CrosswordGrid
              grid={puzzle.grid_data}
              clues={puzzle.clues}
              onComplete={handleComplete}
              onCellChange={() => {
                // Feedback visual opcional
              }}
            />
          </div>
        )}

        {isComplete && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 text-6xl">🎉</div>
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Parabéns!
            </h2>
            <p className="mb-6 text-lg text-zinc-700 dark:text-zinc-300">
              Completou o puzzle em
            </p>
            <div className="mb-8 font-mono text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatTime(finalTime)}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={handleRestart}
                className="rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Jogar Novamente
              </button>
              <Link
                href="/leaderboards"
                className="rounded-full border border-zinc-300 px-8 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Ver Classificações
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
}

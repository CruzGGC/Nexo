'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CrosswordGrid, { type Cell, type Clue } from '@/components/CrosswordGrid';
import Timer from '@/components/Timer';
import Link from 'next/link';

type GameMode = 'daily' | 'random';

export default function PalavrasCruzadasPage() {
  const router = useRouter();
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [puzzle, setPuzzle] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPuzzle = async (mode: GameMode) => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'daily' ? '/api/crossword/daily' : '/api/crossword/random';
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar puzzle');
      }

      const data = await response.json();
      setPuzzle(data);
      setShowModeSelection(false);
    } catch (err) {
      console.error('Erro ao buscar puzzle:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar puzzle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    fetchPuzzle(mode);
  };

  const handleStartGame = () => {
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
    if (gameMode === 'random') {
      // Generate new random puzzle
      fetchPuzzle('random');
      setIsPlaying(false);
      setIsComplete(false);
      setFinalTime(0);
    } else {
      // Reload daily puzzle
      router.refresh();
    }
  };

  const handleChangMode = () => {
    setPuzzle(null);
    setShowModeSelection(true);
    setIsPlaying(false);
    setIsComplete(false);
    setFinalTime(0);
    setError(null);
  };

  // Mode Selection Screen
  if (showModeSelection) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              ← Voltar
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Palavras Cruzadas
            </h1>
            <div className="w-20"></div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Escolha o Modo de Jogo
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Selecione como quer jogar palavras cruzadas
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Daily Mode */}
              <button
                onClick={() => handleSelectMode('daily')}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-all hover:border-yellow-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-yellow-600"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-100 text-4xl transition-transform group-hover:scale-110 dark:bg-yellow-900">
                  📅
                </div>
                <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Modo Diário
                </h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  O mesmo puzzle para todos os jogadores. Novo puzzle todos os dias à meia-noite.
                </p>
                <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                  <li>✓ Competição global</li>
                  <li>✓ Leaderboard partilhada</li>
                  <li>✓ 1 puzzle por dia</li>
                </ul>
                <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-yellow-200 opacity-20 transition-transform group-hover:scale-150 dark:bg-yellow-800"></div>
              </button>

              {/* Random Mode */}
              <button
                onClick={() => handleSelectMode('random')}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-all hover:border-blue-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-4xl transition-transform group-hover:scale-110 dark:bg-blue-900">
                  🎲
                </div>
                <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Modo Aleatório
                </h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Puzzle novo gerado automaticamente a cada jogo. Treino ilimitado!
                </p>
                <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                  <li>✓ Puzzles infinitos</li>
                  <li>✓ Prática sem pressão</li>
                  <li>✓ Sem limite de tempo</li>
                </ul>
                <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-blue-200 opacity-20 transition-transform group-hover:scale-150 dark:bg-blue-800"></div>
              </button>
            </div>

            {isLoading && (
              <div className="mt-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50"></div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {gameMode === 'daily' ? 'A carregar puzzle diário...' : 'A gerar puzzle aleatório...'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

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
          <button
            onClick={handleChangMode}
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Mudar Modo
          </button>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {gameMode === 'daily' ? '📅 Diário' : '🎲 Aleatório'}
            </span>
            <div className="text-center">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Tempo</div>
              <Timer isRunning={isPlaying} onTimeUpdate={handleTimeUpdate} />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {!isPlaying && !isComplete && puzzle && (
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
            {gameMode === 'daily' && puzzle.isFromPreviousDay && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Este é o puzzle de um dia anterior. O puzzle de hoje será gerado à meia-noite.
                </p>
              </div>
            )}
            <button
              onClick={handleStartGame}
              className="rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Iniciar Jogo
            </button>
          </div>
        )}

        {isPlaying && !isComplete && puzzle && (
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
            <p className="mb-2 text-lg text-zinc-700 dark:text-zinc-300">
              Completou o puzzle {gameMode === 'daily' ? 'diário' : 'aleatório'} em
            </p>
            <div className="mb-8 font-mono text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatTime(finalTime)}
            </div>
            
            {gameMode === 'random' && (
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Modo aleatório não conta para a leaderboard global
              </p>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={handleRestart}
                className="rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {gameMode === 'daily' ? 'Jogar Novamente' : 'Novo Puzzle Aleatório'}
              </button>
              {gameMode === 'daily' && (
                <Link
                  href="/leaderboards"
                  className="rounded-full border border-zinc-300 px-8 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  Ver Classificações
                </Link>
              )}
              <button
                onClick={handleChangMode}
                className="rounded-full border border-zinc-300 px-8 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Mudar Modo
              </button>
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


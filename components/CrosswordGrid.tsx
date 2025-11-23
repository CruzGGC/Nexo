'use client';

/**
 * Crossword Grid with Mobile Support
 * 
 * Features:
 * - Desktop: Keyboard navigation with arrow keys
 * - Mobile: Touch input with virtual keyboard
 * - Error tracking and visual feedback
 * - Accessible color coding for different cell states
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { CrosswordCell, CrosswordClue } from '@/lib/types/crossword';
import { equalsNormalized } from '@/lib/text';
import { motion } from 'framer-motion';

export type Cell = CrosswordCell;
export type Clue = CrosswordClue;

interface CrosswordGridProps {
  grid: Cell[][];
  clues: {
    across: Clue[];
    down: Clue[];
  };
  onComplete: () => void;
  onCellChange?: () => void;
}

export default function CrosswordGrid({
  grid: initialGrid,
  clues,
  onComplete,
  onCellChange
}: CrosswordGridProps) {
  const [grid, setGrid] = useState<Cell[][]>(initialGrid);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const errorCount = useMemo(() => {
    let errors = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell.isBlack || !cell.correct || cell.correct.trim() === '') continue;

        const cellValue = (cell.value || '').trim();
        const correctValue = cell.correct.trim();

        if (cellValue && !equalsNormalized(cellValue, correctValue)) {
          errors++;
        }
      }
    }
    return errors;
  }, [grid]);

  const selectedClue = useMemo(() => {
    if (!selectedCell) return null;

    const findClueForCell = (row: number, col: number, dir: 'across' | 'down') => {
      const clueList = dir === 'across' ? clues.across : clues.down;

      for (const clue of clueList) {
        if (dir === 'across') {
          if (
            row === clue.startRow &&
            col >= clue.startCol &&
            col < clue.startCol + clue.answer.length
          ) {
            return clue;
          }
        } else {
          if (
            col === clue.startCol &&
            row >= clue.startRow &&
            row < clue.startRow + clue.answer.length
          ) {
            return clue;
          }
        }
      }
      return null;
    };

    return findClueForCell(selectedCell.row, selectedCell.col, direction);
  }, [selectedCell, direction, clues]);

  // Scroll active clue into view
  useEffect(() => {
    if (selectedClue) {
      const element = document.getElementById(`clue-${selectedClue.number}-${direction}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedClue, direction]);

  // Focus hidden input when cell is selected (mobile support)
  useEffect(() => {
    if (selectedCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedCell]);

  // Helper function to check if puzzle is complete (accepts grid as parameter)
  const checkIsComplete = (gridToCheck: Cell[][]): boolean => {
    let totalCells = 0;
    let correctCells = 0;

    for (let row = 0; row < gridToCheck.length; row++) {
      for (let col = 0; col < gridToCheck[row].length; col++) {
        const cell = gridToCheck[row][col];

        // Skip black cells AND cells without a correct answer (structural empty cells)
        if (cell.isBlack || !cell.correct || cell.correct.trim() === '') {
          continue;
        }

        totalCells++;

        const cellValue = (cell.value || '').trim();
        const correctValue = cell.correct.trim();

        if (cellValue && equalsNormalized(cellValue, correctValue)) {
          correctCells++;
        }
      }
    }

    const isComplete = correctCells === totalCells && totalCells > 0;
    return isComplete;
  };

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    // Skip black cells AND structural empty cells (no correct answer)
    if (cell.isBlack || !cell.correct || cell.correct.trim() === '') return;

    // Se clicar na mesma célula, muda a direção
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setDirection((prev) => (prev === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell({ row, col });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const newGrid = grid.map((r) => [...r]); // Deep copy
      if (newGrid[row][col].value !== '') {
        newGrid[row][col] = { ...newGrid[row][col], value: '' };
        setGrid(newGrid);
        onCellChange?.();
      } else {
        // Move backwards if empty
        moveToNextCell(row, col, true);
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      setDirection((prev) => (prev === 'across' ? 'down' : 'across'));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveVertical(row, col, -1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveVertical(row, col, 1);
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveHorizontal(row, col, -1);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveHorizontal(row, col, 1);
      return;
    }

    // Aceita apenas letras
    if (e.key.length === 1 && /[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(e.key)) {
      e.preventDefault();
      handleLetterInput(e.key.toUpperCase());
    }
  };

  // Handle mobile input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCell) return;

    const value = e.target.value.slice(-1).toUpperCase(); // Get last character
    if (value && /[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(value)) {
      handleLetterInput(value);
    }

    // Clear input for next character
    e.target.value = '';
  };

  const handleLetterInput = (letter: string) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const newGrid = grid.map((r) => [...r]); // Deep copy

    newGrid[row][col] = {
      ...newGrid[row][col],
      value: letter,
    };
    setGrid(newGrid);
    onCellChange?.();

    // Verifica se está completo com o novo grid
    const isComplete = checkIsComplete(newGrid);
    if (isComplete) {
      setTimeout(() => {
        onComplete();
      }, 100);
    }

    // Move para a próxima célula
    moveToNextCell(row, col, false);
  };

  const moveToNextCell = (row: number, col: number, backwards: boolean) => {
    const delta = backwards ? -1 : 1;

    if (direction === 'across') {
      let newCol = col + delta;
      while (newCol >= 0 && newCol < grid[row].length) {
        const cell = grid[row][newCol];
        // Skip black cells AND structural empty cells
        if (!cell.isBlack && cell.correct && cell.correct.trim() !== '') {
          setSelectedCell({ row, col: newCol });
          return;
        }
        newCol += delta;
      }
    } else {
      let newRow = row + delta;
      while (newRow >= 0 && newRow < grid.length) {
        const cell = grid[newRow][col];
        // Skip black cells AND structural empty cells
        if (!cell.isBlack && cell.correct && cell.correct.trim() !== '') {
          setSelectedCell({ row: newRow, col });
          return;
        }
        newRow += delta;
      }
    }
  };

  const moveHorizontal = (row: number, col: number, delta: number) => {
    let newCol = col + delta;
    while (newCol >= 0 && newCol < grid[row].length) {
      const cell = grid[row][newCol];
      // Skip black cells AND structural empty cells
      if (!cell.isBlack && cell.correct && cell.correct.trim() !== '') {
        setSelectedCell({ row, col: newCol });
        setDirection('across');
        return;
      }
      newCol += delta;
    }
  };

  const moveVertical = (row: number, col: number, delta: number) => {
    let newRow = row + delta;
    while (newRow >= 0 && newRow < grid.length) {
      const cell = grid[newRow][col];
      // Skip black cells AND structural empty cells
      if (!cell.isBlack && cell.correct && cell.correct.trim() !== '') {
        setSelectedCell({ row: newRow, col });
        setDirection('down');
        return;
      }
      newRow += delta;
    }
  };

  const isCellInCurrentWord = (row: number, col: number): boolean => {
    if (!selectedClue) return false;

    if (direction === 'across') {
      return (
        row === selectedClue.startRow &&
        col >= selectedClue.startCol &&
        col < selectedClue.startCol + selectedClue.answer.length
      );
    } else {
      return (
        col === selectedClue.startCol &&
        row >= selectedClue.startRow &&
        row < selectedClue.startRow + selectedClue.answer.length
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-500">
      {/* Hidden input for mobile keyboard */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="sr-only"
        aria-hidden="true"
      />

      {/* Error counter and toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white/5 p-4 shadow-sm border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-sm font-medium text-zinc-400">Erros:</span>
            <span className={`text-sm font-bold ${errorCount > 0 ? 'text-red-400' : 'text-zinc-50'}`}>
              {errorCount}
            </span>
          </div>
          <button
            onClick={() => {
              setShowOnlyErrors(!showOnlyErrors)
            }}
            className={`
              rounded-full px-4 py-1.5 text-xs font-medium transition-all
              ${showOnlyErrors
                ? 'bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-zinc-200'}
            `}
          >
            {showOnlyErrors ? '👁️ Mostrar Tudo' : '❌ Mostrar Apenas Erros'}
          </button>
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]"></div>
            <span className="text-zinc-400">Selecionada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
            <span className="text-zinc-400">Erro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            <span className="text-zinc-400">Correta</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Grelha */}
        <div className="flex-1 flex flex-col items-center w-full">
          <div
            className="grid gap-[1px] bg-zinc-800/50 p-[1px] shadow-2xl rounded-lg overflow-hidden w-full max-w-2xl mx-auto border border-white/10"
            style={{
              gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected =
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isInCurrentWord = isCellInCurrentWord(rowIndex, colIndex);
                const isStructural = !cell.correct || cell.correct.trim() === '';

                // Check if cell has error
                const cellValue = (cell.value || '').trim();
                const correctValue = (cell.correct || '').trim();
                const hasLetters = Boolean(cellValue && correctValue);
                const isCorrect = hasLetters && equalsNormalized(cellValue, correctValue);
                const hasError = hasLetters && !isCorrect;

                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    layout
                    className={`
                      relative aspect-square flex items-center justify-center text-base sm:text-lg font-bold select-none
                      transition-colors duration-200
                      ${cell.isBlack || isStructural
                        ? 'bg-black/80'
                        : isSelected
                          ? 'bg-[#00f3ff] text-black z-10 shadow-[0_0_15px_rgba(0,243,255,0.5)]'
                          : hasError && showOnlyErrors
                            ? 'bg-red-900/50 text-red-400'
                            : hasError
                              ? 'bg-red-900/30 text-red-400'
                              : isCorrect && showOnlyErrors
                                ? 'bg-emerald-900/50 text-emerald-400'
                                : isInCurrentWord
                                  ? 'bg-[#00f3ff]/20 text-white'
                                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                      }
                      ${!cell.isBlack && !isStructural && 'cursor-pointer'}
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell.number && (
                      <span className={`absolute left-0.5 top-0.5 text-[0.6rem] sm:text-[0.7rem] font-medium leading-none ${isSelected ? 'text-black/70' : 'text-zinc-600'}`}>
                        {cell.number}
                      </span>
                    )}
                    {!cell.isBlack && !isStructural && (
                      <span className={`transform transition-transform ${cellValue ? 'scale-100' : 'scale-0'}`}>
                        {cell.value}
                      </span>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
          <p className="mt-6 text-sm font-medium text-zinc-400 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            💡 Toque numa célula para escrever • Use as setas para navegar
          </p>
        </div>

        {/* Pistas */}
        <div className="w-full space-y-8 lg:w-80 lg:shrink-0">
          <div className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10 backdrop-blur-md">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-xl">➡️</span> Horizontais
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {clues.across.map((clue) => (
                <button
                  key={clue.number}
                  id={`clue-${clue.number}-across`}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setDirection('across');
                  }}
                  className={`
                    w-full rounded-xl p-3 text-left text-sm transition-all duration-200 border
                    ${selectedClue?.number === clue.number && direction === 'across'
                      ? 'bg-[#00f3ff]/20 border-[#00f3ff]/50 text-white shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                      : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                    }
                  `}
                >
                  <span className={`font-bold ${selectedClue?.number === clue.number && direction === 'across' ? 'text-[#00f3ff]' : 'text-zinc-500'}`}>
                    {clue.number}.
                  </span>{' '}
                  <span>{clue.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10 backdrop-blur-md">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-xl">⬇️</span> Verticais
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {clues.down.map((clue) => (
                <button
                  key={clue.number}
                  id={`clue-${clue.number}-down`}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setDirection('down');
                  }}
                  className={`
                    w-full rounded-xl p-3 text-left text-sm transition-all duration-200 border
                    ${selectedClue?.number === clue.number && direction === 'down'
                      ? 'bg-[#00f3ff]/20 border-[#00f3ff]/50 text-white shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                      : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                    }
                  `}
                >
                  <span className={`font-bold ${selectedClue?.number === clue.number && direction === 'down' ? 'text-[#00f3ff]' : 'text-zinc-500'}`}>
                    {clue.number}.
                  </span>{' '}
                  <span>{clue.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

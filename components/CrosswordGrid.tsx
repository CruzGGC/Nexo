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
  onCellChange,
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
      newGrid[row][col] = { ...newGrid[row][col], value: '' };
      setGrid(newGrid);
      onCellChange?.();
      
      // Move para a célula anterior
      moveToNextCell(row, col, true);
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Erros:</span>
            <span className={`text-sm font-bold ${errorCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
              {errorCount}
            </span>
          </div>
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={`
              rounded-full px-4 py-1.5 text-xs font-medium transition-all
              ${showOnlyErrors 
                ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200' 
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}
            `}
          >
            {showOnlyErrors ? '👁️ Mostrar Tudo' : '❌ Mostrar Apenas Erros'}
          </button>
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-sm"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Selecionada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-sm"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Erro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-sm"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Correta</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Grelha */}
        <div className="flex-1 flex flex-col items-center w-full">
          <div
            className="grid gap-[1px] bg-zinc-300 p-[1px] shadow-xl rounded-lg overflow-hidden dark:bg-zinc-700 w-full max-w-2xl mx-auto"
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
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      relative aspect-square flex items-center justify-center text-base sm:text-lg font-bold select-none
                      transition-all duration-200
                      ${
                        cell.isBlack || isStructural
                          ? 'bg-zinc-900 dark:bg-zinc-950'
                          : isSelected
                          ? 'bg-yellow-400 text-zinc-900 z-10 scale-105 shadow-lg rounded-md'
                          : hasError && showOnlyErrors
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : hasError
                          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          : isCorrect && showOnlyErrors
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : isInCurrentWord
                          ? 'bg-yellow-100 text-zinc-900 dark:bg-yellow-900/30 dark:text-zinc-100'
                          : 'bg-white text-zinc-900 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
                      }
                      ${!cell.isBlack && !isStructural && 'cursor-pointer'}
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell.number && (
                      <span className={`absolute left-0.5 top-0.5 text-[0.6rem] sm:text-[0.7rem] font-medium leading-none ${isSelected ? 'text-zinc-800/70' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {cell.number}
                      </span>
                    )}
                    {!cell.isBlack && !isStructural && (
                      <span className={`transform transition-transform ${cellValue ? 'scale-100' : 'scale-0'}`}>
                        {cell.value}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <p className="mt-6 text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-full">
            💡 Toque numa célula para escrever • Use as setas para navegar
          </p>
        </div>

        {/* Pistas */}
        <div className="w-full space-y-8 lg:w-80 lg:shrink-0">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              <span className="text-xl">➡️</span> Horizontais
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
              {clues.across.map((clue) => (
                <button
                  key={clue.number}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setDirection('across');
                  }}
                  className={`
                    w-full rounded-xl p-3 text-left text-sm transition-all duration-200
                    ${
                      selectedClue?.number === clue.number && direction === 'across'
                        ? 'bg-yellow-400 text-zinc-900 shadow-md scale-[1.02]'
                        : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  <span className={`font-bold ${selectedClue?.number === clue.number && direction === 'across' ? 'text-zinc-900' : 'text-zinc-900 dark:text-zinc-200'}`}>
                    {clue.number}.
                  </span>{' '}
                  <span>{clue.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              <span className="text-xl">⬇️</span> Verticais
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
              {clues.down.map((clue) => (
                <button
                  key={clue.number}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setDirection('down');
                  }}
                  className={`
                    w-full rounded-xl p-3 text-left text-sm transition-all duration-200
                    ${
                      selectedClue?.number === clue.number && direction === 'down'
                        ? 'bg-yellow-400 text-zinc-900 shadow-md scale-[1.02]'
                        : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  <span className={`font-bold ${selectedClue?.number === clue.number && direction === 'down' ? 'text-zinc-900' : 'text-zinc-900 dark:text-zinc-200'}`}>
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

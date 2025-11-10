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

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Cell {
  value: string;
  correct: string;
  number?: number;
  isBlack: boolean;
  row: number;
  col: number;
}

export interface Clue {
  number: number;
  text: string;
  answer: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
}

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
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus hidden input when cell is selected (mobile support)
  useEffect(() => {
    if (selectedCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedCell]);

  // Calculate error count
  useEffect(() => {
    let errors = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell.isBlack || !cell.correct || cell.correct.trim() === '') continue;
        
        const cellValue = (cell.value || '').trim().toUpperCase();
        const correctValue = cell.correct.trim().toUpperCase();
        
        if (cellValue && cellValue !== correctValue) {
          errors++;
        }
      }
    }
    setErrorCount(errors);
  }, [grid]);

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
        
        const cellValue = (cell.value || '').trim().toUpperCase();
        const correctValue = cell.correct.trim().toUpperCase();
        
        if (cellValue === correctValue) {
          correctCells++;
        }
      }
    }
    
    const isComplete = correctCells === totalCells && totalCells > 0;
    return isComplete;
  };

  // Verifica se o puzzle está completo (uses current state)
  const checkComplete = useCallback(() => {
    return checkIsComplete(grid);
  }, [grid]);

  // Encontra a pista associada à célula selecionada
  useEffect(() => {
    if (!selectedCell) return;

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

    const clue = findClueForCell(selectedCell.row, selectedCell.col, direction);
    setSelectedClue(clue);
  }, [selectedCell, direction, clues]);

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
    <div className="flex flex-col gap-6">
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
      <div className="flex items-center justify-between rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              Erros: {errorCount}
            </span>
          </div>
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className="rounded-md bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            {showOnlyErrors ? '👁️ Mostrar Tudo' : '❌ Mostrar Apenas Erros'}
          </button>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-yellow-200 dark:bg-yellow-900"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Selecionada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-red-200 dark:bg-red-900"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Erro</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-200 dark:bg-green-900"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Correta</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Grelha */}
        <div className="flex-1">
          <div
            className="inline-grid gap-0 border-2 border-zinc-900 dark:border-zinc-50"
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
                const cellValue = (cell.value || '').trim().toUpperCase();
                const correctValue = (cell.correct || '').trim().toUpperCase();
                const hasError = cellValue && correctValue && cellValue !== correctValue;
                const isCorrect = cellValue && correctValue && cellValue === correctValue;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      relative flex h-10 w-10 items-center justify-center border border-zinc-300 text-lg font-bold
                      transition-colors dark:border-zinc-700 sm:h-12 sm:w-12
                      ${
                        cell.isBlack || isStructural
                          ? 'bg-zinc-900 dark:bg-zinc-950'
                          : isSelected
                          ? 'bg-yellow-200 dark:bg-yellow-900'
                          : hasError && showOnlyErrors
                          ? 'bg-red-200 dark:bg-red-900'
                          : hasError
                          ? 'bg-red-100 dark:bg-red-950'
                          : isCorrect && showOnlyErrors
                          ? 'bg-green-200 dark:bg-green-900'
                          : isInCurrentWord
                          ? 'bg-yellow-100 dark:bg-yellow-950'
                          : 'bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800'
                      }
                      ${!cell.isBlack && !isStructural && 'cursor-pointer'}
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell.number && (
                      <span className="absolute left-0.5 top-0 text-[10px] text-zinc-600 dark:text-zinc-400">
                        {cell.number}
                      </span>
                    )}
                    {!cell.isBlack && !isStructural && (
                      <span className={`${hasError ? 'text-red-700 dark:text-red-300' : isCorrect ? 'text-green-700 dark:text-green-300' : 'text-zinc-900 dark:text-zinc-50'}`}>
                        {cell.value}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            💡 Toque numa célula para escrever • Use as setas para navegar • Tab para mudar direção
          </p>
        </div>

        {/* Pistas */}
        <div className="w-full space-y-6 lg:w-80">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Horizontais
            </h3>
            <div className="space-y-2">
              {clues.across.map((clue) => (
                <button
                  key={clue.number}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setDirection('across');
                  }}
                  className={`
                    w-full rounded-lg p-3 text-left text-sm transition-colors
                    ${
                      selectedClue?.number === clue.number && direction === 'across'
                        ? 'bg-yellow-100 dark:bg-yellow-950'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    }
                  `}
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {clue.number}.
                  </span>{' '}
                  <span className="text-zinc-700 dark:text-zinc-300">{clue.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Verticais
            </h3>
            <div className="space-y-2">
              {clues.down.map((clue) => (
                <button
                  key={clue.number}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setDirection('down');
                  }}
                  className={`
                    w-full rounded-lg p-3 text-left text-sm transition-colors
                    ${
                      selectedClue?.number === clue.number && direction === 'down'
                        ? 'bg-yellow-100 dark:bg-yellow-950'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    }
                  `}
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {clue.number}.
                  </span>{' '}
                  <span className="text-zinc-700 dark:text-zinc-300">{clue.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

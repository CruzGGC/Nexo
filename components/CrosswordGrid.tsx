'use client';

/**
 * DEBUG MODE: Extensive console logging enabled
 * 
 * IMPORTANT FIX: Only cells with `correct` value are counted as playable.
 * Cells with empty `correct` are "structural" (padding) and treated like black cells.
 * 
 * Logs to watch:
 * - 🎮 Grid loaded: Shows dimensions, playable vs structural cells
 * - ✅ Playable cell: Has correct answer, can be clicked/filled
 * - ⬜ Structural cell: Empty padding, treated as black (unclickable)
 * - ⌨️ Letter input: Shows each letter typed vs expected value
 * - ⌫ Backspace: Shows when cells are cleared
 * - 🔍 Checking completion: Validation start (only checks playable cells)
 * - ❌ Cell mismatch: Individual incorrect cells with values
 * - 📊 Statistics: Total playable, filled, correct counts
 * - ✅ Is Complete: Final completion status
 * - 🎉 Puzzle completed: When onComplete callback fires
 */

import { useState, useEffect, useCallback } from 'react';

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
      const newGrid = grid.map(r => [...r]); // Deep copy
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
      const newGrid = grid.map(r => [...r]); // Deep copy
      
      newGrid[row][col] = {
        ...newGrid[row][col],
        value: e.key.toUpperCase(),
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
    }
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
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {cell.value}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Use as setas para navegar • Tab para mudar de direção • Escreva para preencher
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
  );
}

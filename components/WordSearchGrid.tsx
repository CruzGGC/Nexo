'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import type { WordPlacement } from '@/lib/wordsearch-generator'
import { validateSelection } from '@/lib/wordsearch-generator'

interface Selection {
  startRow: number
  startCol: number
  currentRow: number
  currentCol: number
}

interface FoundWord {
  word: string
  cells: { row: number; col: number }[]
}

interface WordSearchGridProps {
  grid: string[][]
  words: WordPlacement[]
  onComplete?: (foundWords: string[]) => void
}

const getCellKey = (row: number, col: number) => `${row}-${col}`

function getSelectionCells(sel: Selection): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = []
  const rowDiff = sel.currentRow - sel.startRow
  const colDiff = sel.currentCol - sel.startCol
  const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff)) + 1

  const dRow = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff)
  const dCol = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff)

  for (let i = 0; i < length; i++) {
    cells.push({
      row: sel.startRow + i * dRow,
      col: sel.startCol + i * dCol
    })
  }

  return cells
}

export default function WordSearchGrid({ grid, words, onComplete }: WordSearchGridProps) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [foundWords, setFoundWords] = useState<FoundWord[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [successCells, setSuccessCells] = useState<Set<string>>(() => new Set())
  const gridRef = useRef<HTMLDivElement>(null)
  const successTimeouts = useRef<number[]>([])

  const selectedCells = useMemo(() => (selection ? getSelectionCells(selection) : []), [selection])
  const selectedCellKeys = useMemo(() => {
    const keys = new Set<string>()
    selectedCells.forEach(cell => keys.add(getCellKey(cell.row, cell.col)))
    return keys
  }, [selectedCells])

  const foundCellKeys = useMemo(() => {
    const keys = new Set<string>()
    foundWords.forEach(fw => {
      fw.cells.forEach(cell => keys.add(getCellKey(cell.row, cell.col)))
    })
    return keys
  }, [foundWords])

  useEffect(() => {
    const timeoutsRef = successTimeouts.current
    return () => {
      timeoutsRef.forEach(timeoutId => window.clearTimeout(timeoutId))
    }
  }, [])

  // Verificar se puzzle está completo
  useEffect(() => {
    if (foundWords.length === words.length && words.length > 0) {
      setTimeout(() => {
        if (onComplete) {
          onComplete(foundWords.map(fw => fw.word))
        }
      }, 500)
    }
  }, [foundWords, words, onComplete])

  const handleMouseDown = (row: number, col: number) => {
    setIsSelecting(true)
    setSelection({
      startRow: row,
      startCol: col,
      currentRow: row,
      currentCol: col
    })
  }

  const handleMouseEnter = (row: number, col: number) => {
    setHoveredCell({ row, col })
    if (isSelecting) {
      setSelection(prev =>
        prev
          ? {
              ...prev,
              currentRow: row,
              currentCol: col
            }
          : prev
      )
    }
  }

  const handleMouseUp = () => {
    if (!isSelecting || !selection) return

    // Validar seleção
    const { word, direction } = validateSelection(
      grid,
      selection.startRow,
      selection.startCol,
      selection.currentRow,
      selection.currentCol
    )

    if (word && direction) {
      // Verificar se palavra existe na lista
      const foundWord = words.find(w => w.word === word)
      
      if (foundWord && !foundWords.some(fw => fw.word === word)) {
        // Adicionar palavra encontrada
        const cells = getSelectionCells(selection)
        setFoundWords([...foundWords, { word, cells }])
        
        // Animação de sucesso
        triggerSuccessAnimation(cells)
      }
    }

    setIsSelecting(false)
    setSelection(null)
  }

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    e.preventDefault()
    handleMouseDown(row, col)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!isSelecting) return

    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    
    if (element && element.hasAttribute('data-cell')) {
      const row = parseInt(element.getAttribute('data-row') || '0')
      const col = parseInt(element.getAttribute('data-col') || '0')
      handleMouseEnter(row, col)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseUp()
  }

  const triggerSuccessAnimation = (cells: { row: number; col: number }[]) => {
    setSuccessCells(prev => {
      const next = new Set(prev)
      cells.forEach(cell => next.add(getCellKey(cell.row, cell.col)))
      return next
    })

    cells.forEach((cell, index) => {
      const timeoutId = window.setTimeout(() => {
        setSuccessCells(prev => {
          const next = new Set(prev)
          next.delete(getCellKey(cell.row, cell.col))
          return next
        })
      }, 450 + index * 50)
      successTimeouts.current.push(timeoutId)
    })
  }

  const isWordFound = (word: string): boolean => {
    return foundWords.some(fw => fw.word === word)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in zoom-in duration-500">
      {/* Grid Container */}
      <div className="flex-1 flex justify-center items-start">
        <div
          ref={gridRef}
          className="grid gap-1 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 select-none touch-none"
          style={{
            gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => {
              const cellKey = getCellKey(rowIndex, colIndex)
              const inSelection = selectedCellKeys.has(cellKey)
              const inFoundWords = foundCellKeys.has(cellKey)
              const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex
              const isCelebrating = successCells.has(cellKey)

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  data-cell
                  data-row={rowIndex}
                  data-col={colIndex}
                  className={`
                    relative flex items-center justify-center
                    w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11
                    text-lg sm:text-xl font-bold rounded-lg
                    transition-all duration-200 cursor-pointer
                    ${inFoundWords 
                      ? 'bg-emerald-500 text-white shadow-md scale-105 z-10' 
                      : inSelection
                        ? 'bg-yellow-400 text-zinc-900 shadow-md scale-110 z-20'
                        : isHovered
                          ? 'bg-zinc-100 dark:bg-zinc-800 scale-110 z-10'
                          : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }
                    ${isCelebrating ? 'animate-bounce' : ''}
                  `}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                >
                  {letter}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Progress Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Progresso</h3>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {foundWords.length}/{words.length}
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{
                width: `${(foundWords.length / words.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Words List */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">Palavras</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
            {words.map((word, index) => {
              const found = isWordFound(word.word)
              return (
                <div
                  key={index}
                  className={`
                    p-3 rounded-xl transition-all duration-300 border
                    ${found 
                      ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' 
                      : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {found && (
                      <span className="text-emerald-500 dark:text-emerald-400 text-lg">✓</span>
                    )}
                    <span
                      className={`
                        font-bold text-sm
                        ${found 
                          ? 'text-emerald-700 dark:text-emerald-400 line-through decoration-2 decoration-emerald-500/30' 
                          : 'text-zinc-700 dark:text-zinc-300'
                        }
                      `}
                    >
                      {word.word}
                    </span>
                  </div>
                  {word.definition && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {word.definition}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

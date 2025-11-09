'use client'

import { useState, useRef, useEffect } from 'react'
import type { WordPlacement } from '@/lib/wordsearch-generator'
import { validateSelection } from '@/lib/wordsearch-generator'

interface Cell {
  letter: string
  row: number
  col: number
}

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

export default function WordSearchGrid({ grid, words, onComplete }: WordSearchGridProps) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [foundWords, setFoundWords] = useState<FoundWord[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Animação de entrada em cascata
  const [visibleCells, setVisibleCells] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Animar entrada das células em cascata
    const totalCells = grid.length * grid[0].length
    let count = 0
    const interval = setInterval(() => {
      if (count < totalCells) {
        const row = Math.floor(count / grid[0].length)
        const col = count % grid[0].length
        setVisibleCells(prev => new Set(prev).add(`${row}-${col}`))
        count++
      } else {
        clearInterval(interval)
      }
    }, 15) // 15ms entre cada célula para efeito cascata

    return () => clearInterval(interval)
  }, [grid])

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
    if (isSelecting && selection) {
      setSelection({
        ...selection,
        currentRow: row,
        currentCol: col
      })
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

  const getSelectionCells = (sel: Selection): { row: number; col: number }[] => {
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

  const isCellInSelection = (row: number, col: number): boolean => {
    if (!selection) return false
    const cells = getSelectionCells(selection)
    return cells.some(c => c.row === row && c.col === col)
  }

  const isCellInFoundWords = (row: number, col: number): boolean => {
    return foundWords.some(fw => 
      fw.cells.some(c => c.row === row && c.col === col)
    )
  }

  const triggerSuccessAnimation = (cells: { row: number; col: number }[]) => {
    cells.forEach((cell, index) => {
      setTimeout(() => {
        const element = document.querySelector(
          `[data-row="${cell.row}"][data-col="${cell.col}"]`
        )
        if (element) {
          element.classList.add('animate-bounce')
          setTimeout(() => {
            element.classList.remove('animate-bounce')
          }, 500)
        }
      }, index * 50)
    })
  }

  const isWordFound = (word: string): boolean => {
    return foundWords.some(fw => fw.word === word)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Grid */}
      <div className="flex-1">
        <div
          ref={gridRef}
          className="inline-grid gap-1 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-lg"
          style={{
            gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
            touchAction: 'none'
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => {
              const isVisible = visibleCells.has(`${rowIndex}-${colIndex}`)
              const inSelection = isCellInSelection(rowIndex, colIndex)
              const inFoundWords = isCellInFoundWords(rowIndex, colIndex)
              const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  data-cell
                  data-row={rowIndex}
                  data-col={colIndex}
                  className={`
                    aspect-square flex items-center justify-center
                    text-base sm:text-lg lg:text-xl font-bold
                    rounded-lg cursor-pointer select-none
                    transition-all duration-200
                    ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                    ${inFoundWords 
                      ? 'bg-emerald-400 dark:bg-emerald-600 text-white shadow-lg scale-110' 
                      : inSelection
                        ? 'bg-yellow-300 dark:bg-yellow-600 text-zinc-900 dark:text-white shadow-md scale-105'
                        : isHovered
                          ? 'bg-zinc-100 dark:bg-zinc-800 scale-105'
                          : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }
                    ${inSelection && isSelecting ? 'animate-pulse' : ''}
                  `}
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    transitionDelay: isVisible ? '0ms' : `${(rowIndex * grid[0].length + colIndex) * 15}ms`
                  }}
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

      {/* Lista de Palavras */}
      <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">
          Palavras ({foundWords.length}/{words.length})
        </h3>
        <div className="space-y-3">
          {words.map((word, index) => {
            const found = isWordFound(word.word)
            return (
              <div
                key={index}
                className={`
                  p-3 rounded-lg transition-all duration-300
                  ${found 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 scale-105' 
                    : 'bg-zinc-100 dark:bg-zinc-800'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  {found && (
                    <span className="text-emerald-600 dark:text-emerald-400 animate-bounce">
                      ✓
                    </span>
                  )}
                  <span
                    className={`
                      font-bold text-base
                      ${found 
                        ? 'line-through text-emerald-700 dark:text-emerald-300' 
                        : 'text-zinc-900 dark:text-white'
                      }
                    `}
                  >
                    {word.word}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {word.definition}
                </p>
              </div>
            )
          })}
        </div>

        {/* Progresso */}
        <div className="mt-6">
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out"
              style={{
                width: `${(foundWords.length / words.length) * 100}%`
              }}
            />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 text-center">
            {Math.round((foundWords.length / words.length) * 100)}% completo
          </p>
        </div>
      </div>
    </div>
  )
}

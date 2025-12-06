'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WordPlacement } from '@/lib/games/wordsearch'
import { validateSelection } from '@/lib/games/wordsearch'

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
  onWordFound?: (foundWords: string[], totalWords: number) => void
  hintRequest?: number
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

export default function WordSearchGrid({ grid, words, onComplete, onWordFound, hintRequest }: WordSearchGridProps) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [foundWords, setFoundWords] = useState<FoundWord[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [successCells, setSuccessCells] = useState<Set<string>>(() => new Set())
  const [hintedCell, setHintedCell] = useState<{ row: number; col: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const successTimeouts = useRef<number[]>([])
  const lastProcessedHintRef = useRef<number>(0)

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

  // DEBUG: Press 'D' to show all word locations in console
  // TODO: REMOVE THIS BEFORE PRODUCTION
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        console.log('🔍 CHEAT MODE - Word Locations:')
        words.forEach(w => {
          const isFound = foundWords.some(fw => fw.word === w.word)
          console.log(
            `${isFound ? '✅' : '❌'} ${w.word}: start(${w.startRow},${w.startCol}) → ${w.direction}`
          )
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [words, foundWords])

  // Handle Hint Request
  useEffect(() => {
    if (hintRequest && hintRequest > lastProcessedHintRef.current) {
      lastProcessedHintRef.current = hintRequest

      // Find a word that hasn't been found yet
      const unFoundWord = words.find(w => !foundWords.some(fw => fw.word === w.word))

      if (unFoundWord) {
        // Highlight the starting cell of the word
        // Wrap in setTimeout to avoid synchronous state update warning
        const startTimeout = setTimeout(() => {
          setHintedCell({ row: unFoundWord.startRow, col: unFoundWord.startCol })
        }, 0)

        // Clear hint after 3 seconds
        const endTimeout = setTimeout(() => {
          setHintedCell(null)
        }, 3000)

        return () => {
          clearTimeout(startTimeout)
          clearTimeout(endTimeout)
        }
      }
    }
  }, [hintRequest, words, foundWords])

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
        const newFoundWords = [...foundWords, { word, cells }]
        setFoundWords(newFoundWords)

        // Notify progress
        if (onWordFound) {
          onWordFound(newFoundWords.map(fw => fw.word), words.length)
        }

        // Animação de sucesso
        triggerSuccessAnimation(cells)
      }
    }

    setIsSelecting(false)
    setSelection(null)
  }

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    // e.preventDefault() // Removed to allow scrolling if needed, but might need it back for game
    void e
    handleMouseDown(row, col)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // e.preventDefault()
    if (!isSelecting) return

    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)

    if (element && element.hasAttribute('data-cell')) {
      const row = parseInt(element.getAttribute('data-row') || '0')
      const col = parseInt(element.getAttribute('data-col') || '0')
      handleMouseEnter(row, col)
    }
  }

  const handleTouchEnd = () => {
    // e.preventDefault()
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
          className="grid gap-1 p-4 bg-white/5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.3)] border border-white/10 select-none touch-none backdrop-blur-md"
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
              const isHinted = hintedCell?.row === rowIndex && hintedCell?.col === colIndex

              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  data-cell
                  data-row={rowIndex}
                  data-col={colIndex}
                  initial={false}
                  animate={{
                    scale: isCelebrating ? [1, 1.2, 1] : isHinted ? [1, 1.1, 1] : inSelection ? 1.1 : 1,
                    backgroundColor: inFoundWords
                      ? 'rgba(6,182,212,0.2)'
                      : inSelection
                        ? 'rgba(234,179,8,0.2)'
                        : isHinted
                          ? 'rgba(234,179,8,0.4)'
                          : isHovered
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(255,255,255,0.02)',
                    color: inFoundWords
                      ? '#22d3ee'
                      : inSelection
                        ? '#fde047'
                        : isHinted
                          ? '#fde047'
                          : 'rgba(255,255,255,0.8)',
                    borderColor: inFoundWords
                      ? '#06b6d4'
                      : inSelection
                        ? '#eab308'
                        : isHinted
                          ? '#eab308'
                          : 'transparent',
                    boxShadow: isHinted ? '0 0 15px rgba(234,179,8,0.5)' : 'none',
                  }}
                  transition={{
                    scale: isHinted ? { repeat: Infinity, duration: 1 } : {}
                  }}
                  className={`
                    relative flex items-center justify-center
                    w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11
                    text-lg sm:text-xl font-bold rounded-lg
                    transition-colors duration-200 cursor-pointer
                    border
                    ${isCelebrating || isHinted ? 'z-20' : 'z-0'}
                  `}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                >
                  {letter}
                  {inFoundWords && (
                    <motion.div
                      layoutId={`glow-${cellKey}`}
                      className="absolute inset-0 rounded-lg bg-cyan-500/20 blur-sm -z-10"
                    />
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Progress Card */}
        <div className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Progresso</h3>
            <span className="text-sm font-medium text-zinc-400">
              {foundWords.length}/{words.length}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(foundWords.length / words.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>
        </div>

        {/* Words List */}
        <div className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4">Palavras</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <AnimatePresence>
              {words.map((word, index) => {
                const found = isWordFound(word.word)
                return (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{
                      backgroundColor: found ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: found ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)',
                      scale: found ? 1.02 : 1,
                    }}
                    className={`
                      p-3 rounded-xl border transition-all
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {found && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-cyan-400 text-lg"
                        >
                          ✓
                        </motion.span>
                      )}
                      <span
                        className={`
                          font-bold text-sm
                          ${found
                            ? 'text-cyan-300 line-through decoration-2 decoration-cyan-500/30'
                            : 'text-zinc-300'
                          }
                        `}
                      >
                        {word.word}
                      </span>
                    </div>
                    {word.definition && (
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                        {word.definition}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { BattleshipBoard, BattleshipCell, DEFAULT_FLEET, canPlaceShip } from '@/lib/games/battleship'

interface PlacementBoardProps {
  board: BattleshipBoard
  placedShips: Array<{ code: BattleshipCell }>
  onPlaceShip: (code: BattleshipCell, row: number, col: number, horizontal: boolean) => void
  onRemoveShip: (code: BattleshipCell) => void
  onShuffle: () => void
  onReset: () => void
  onConfirm: () => void
  isComplete: boolean
}

export function PlacementBoard({
  board,
  placedShips,
  onPlaceShip,
  onRemoveShip,
  onShuffle,
  onReset,
  onConfirm,
  isComplete
}: PlacementBoardProps) {
  const [selectedShipCode, setSelectedShipCode] = useState<BattleshipCell | null>(null)
  const [isHorizontal, setIsHorizontal] = useState(true)
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)

  // Handle rotation with 'R' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setIsHorizontal(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCellClick = (row: number, col: number) => {
    if (selectedShipCode) {
      onPlaceShip(selectedShipCode, row, col, isHorizontal)
      setSelectedShipCode(null) // Deselect after placement
    } else {
      // If clicking a placed ship, pick it up (remove and select)
      const cellContent = board[row][col]
      if (cellContent !== '~') {
        onRemoveShip(cellContent)
        setSelectedShipCode(cellContent)
      }
    }
  }

  const getPreviewCells = () => {
    if (!selectedShipCode || !hoverCell) return []
    const ship = DEFAULT_FLEET.find(s => s.code === selectedShipCode)
    if (!ship) return []

    const cells = []
    for (let i = 0; i < ship.size; i++) {
      const r = hoverCell.row + (isHorizontal ? 0 : i)
      const c = hoverCell.col + (isHorizontal ? i : 0)
      if (r < 10 && c < 10) {
        cells.push({ row: r, col: c })
      }
    }
    return cells
  }

  const previewCells = getPreviewCells()
  const isValidPlacement = selectedShipCode && hoverCell 
    ? canPlaceShip(board, hoverCell.row, hoverCell.col, DEFAULT_FLEET.find(s => s.code === selectedShipCode)!.size, isHorizontal)
    : false

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Posiciona a tua Frota</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Arrasta os navios para o tabuleiro. Pressiona <kbd className="rounded bg-slate-200 px-2 py-1 text-xs font-bold dark:bg-slate-700">R</kbd> para rodar.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Grid */}
        <div 
          className="relative rounded-xl bg-blue-50 p-4 shadow-xl dark:bg-slate-800/50 border-2 border-blue-100 dark:border-slate-700"
          onMouseLeave={() => setHoverCell(null)}
        >
          <div className="grid grid-cols-10 gap-1">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isPreview = previewCells.some(p => p.row === rowIndex && p.col === colIndex)
                const isShip = cell !== '~'
                
                let cellClass = "h-8 w-8 sm:h-10 sm:w-10 rounded transition-all duration-200 flex items-center justify-center text-xs font-bold cursor-pointer "
                
                if (isPreview) {
                  cellClass += isValidPlacement 
                    ? "bg-green-400/60 ring-2 ring-green-500 " 
                    : "bg-red-400/60 ring-2 ring-red-500 "
                } else if (isShip) {
                  cellClass += "bg-slate-700 text-white shadow-lg scale-95 "
                } else {
                  cellClass += "bg-white hover:bg-blue-100 dark:bg-slate-900 dark:hover:bg-slate-800 "
                }

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cellClass}
                    onMouseEnter={() => setHoverCell({ row: rowIndex, col: colIndex })}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {isShip && cell}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Dock */}
        <div className="flex flex-col gap-6 w-full max-w-xs">
          <div className="flex flex-col gap-3 rounded-xl bg-slate-100 p-6 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Estaleiro</h3>
              <button
                onClick={() => setIsHorizontal(!isHorizontal)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {isHorizontal ? '↔️ Horizontal' : '↕️ Vertical'}
              </button>
            </div>
            
            {DEFAULT_FLEET.map((ship) => {
              const isPlaced = placedShips.some(s => s.code === ship.code)
              const isSelected = selectedShipCode === ship.code

              return (
                <button
                  key={ship.code}
                  onClick={() => !isPlaced && setSelectedShipCode(ship.code as BattleshipCell)}
                  disabled={isPlaced}
                  className={`
                    relative flex items-center gap-3 rounded-lg p-3 transition-all text-left
                    ${isPlaced ? 'opacity-40 grayscale cursor-not-allowed bg-slate-200 dark:bg-slate-800' : 'hover:bg-white dark:hover:bg-slate-800 cursor-pointer'}
                    ${isSelected ? 'ring-2 ring-indigo-500 bg-white shadow-md dark:bg-slate-800' : ''}
                  `}
                >
                  <div className={`flex gap-1 ${!isHorizontal && isSelected ? 'flex-col' : ''}`}>
                    {Array.from({ length: ship.size }).map((_, i) => (
                      <div key={i} className="h-4 w-4 rounded bg-slate-700"></div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{ship.name}</div>
                    <div className="text-xs text-slate-500">{ship.size} espaços</div>
                  </div>
                  {isPlaced && <span className="text-green-600 font-bold">✓</span>}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={onShuffle}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Aleatório
              </button>
              <button
                onClick={onReset}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Limpar
              </button>
            </div>
            
            <button
              onClick={onConfirm}
              disabled={!isComplete}
              className="w-full rounded-xl bg-green-600 py-4 font-bold text-white shadow-lg transition hover:bg-green-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComplete ? 'Iniciar Batalha! 🚀' : 'Posiciona todos os navios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

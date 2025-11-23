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
    <div className="flex flex-col gap-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold text-white">POSICIONA A TUA FROTA</h2>
        <p className="text-slate-400">
          Arrasta os navios para o tabuleiro. Pressiona <kbd className="rounded bg-white/10 px-2 py-1 text-xs font-bold text-white border border-white/20">R</kbd> para rodar.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
        {/* Grid */}
        <div
          className="relative rounded-2xl bg-blue-900/20 p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-blue-500/30 backdrop-blur-sm"
          onMouseLeave={() => setHoverCell(null)}
        >
          {/* Grid Lines Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:10%_10%] rounded-2xl" />

          <div className="grid grid-cols-10 gap-1 relative z-10">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isPreview = previewCells.some(p => p.row === rowIndex && p.col === colIndex)
                const isShip = cell !== '~'

                let cellClass = "h-8 w-8 sm:h-10 sm:w-10 rounded-sm transition-all duration-200 flex items-center justify-center text-xs font-bold cursor-pointer border border-white/5 "

                if (isPreview) {
                  cellClass += isValidPlacement
                    ? "bg-green-500/50 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)] "
                    : "bg-red-500/50 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] "
                } else if (isShip) {
                  cellClass += "bg-blue-600 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)] text-white scale-95 "
                } else {
                  cellClass += "hover:bg-white/10 hover:border-white/20 "
                }

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cellClass}
                    onMouseEnter={() => {
                      setHoverCell({ row: rowIndex, col: colIndex })
                    }}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {isShip && (
                      <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Dock */}
        <div className="flex flex-col gap-6 w-full max-w-xs">
          <div className="flex flex-col gap-4 rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-white tracking-wider">ESTALEIRO</h3>
              <button
                onClick={() => {
                  setIsHorizontal(!isHorizontal)
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
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
                  onClick={() => {
                    if (!isPlaced) {
                      setSelectedShipCode(ship.code as BattleshipCell)
                    }
                  }}
                  disabled={isPlaced}
                  className={`
                    relative flex items-center gap-4 rounded-xl p-3 transition-all text-left border
                    ${isPlaced
                      ? 'opacity-30 grayscale cursor-not-allowed bg-black/20 border-transparent'
                      : 'hover:bg-white/10 cursor-pointer border-white/5 hover:border-white/20'}
                    ${isSelected ? 'ring-2 ring-cyan-500 bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : ''}
                  `}
                >
                  <div className={`flex gap-1 ${!isHorizontal && isSelected ? 'flex-col' : ''}`}>
                    {Array.from({ length: ship.size }).map((_, i) => (
                      <div key={i} className={`h-3 w-3 rounded-sm ${isPlaced ? 'bg-slate-500' : 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]'}`}></div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white">{ship.name}</div>
                    <div className="text-xs text-slate-400">{ship.size} espaços</div>
                  </div>
                  {isPlaced && <span className="text-green-400 font-bold text-lg">✓</span>}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={onShuffle}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
              >
                ALEATÓRIO
              </button>
              <button
                onClick={onReset}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
              >
                LIMPAR
              </button>
            </div>

            <button
              onClick={onConfirm}
              disabled={!isComplete}
              className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 font-black text-white shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isComplete ? 'INICIAR BATALHA 🚀' : 'POSICIONA A FROTA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


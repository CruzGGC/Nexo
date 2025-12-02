'use client'

/**
 * ClueList - Crossword clue list component
 * 
 * Features:
 * - Horizontal and vertical clues
 * - Auto-scroll to active clue
 * - Clickable clues to select cells
 */

import { useEffect } from 'react'
import type { CrosswordClue } from '@/lib/types/crossword'

type Clue = CrosswordClue
type Direction = 'across' | 'down'

interface ClueListProps {
  /** All clues */
  clues: {
    across: Clue[]
    down: Clue[]
  }
  /** Currently selected clue number */
  selectedClueNumber?: number
  /** Current direction */
  selectedDirection?: Direction
  /** Called when a clue is clicked */
  onClueClick: (clue: Clue, direction: Direction) => void
}

interface ClueListSectionProps {
  title: string
  icon: string
  clues: Clue[]
  direction: Direction
  selectedClueNumber?: number
  selectedDirection?: Direction
  onClueClick: (clue: Clue, direction: Direction) => void
}

function ClueListSection({
  title,
  icon,
  clues,
  direction,
  selectedClueNumber,
  selectedDirection,
  onClueClick
}: ClueListSectionProps) {
  const isActiveSection = selectedDirection === direction

  return (
    <div className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10 backdrop-blur-md">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <span className="text-xl">{icon}</span> {title}
      </h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {clues.map((clue) => {
          const isSelected = isActiveSection && selectedClueNumber === clue.number

          return (
            <button
              key={clue.number}
              id={`clue-${clue.number}-${direction}`}
              onClick={() => onClueClick(clue, direction)}
              className={`
                w-full rounded-xl p-3 text-left text-sm transition-all duration-200 border
                ${isSelected
                  ? 'bg-[#00f3ff]/20 border-[#00f3ff]/50 text-white shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                  : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                }
              `}
            >
              <span className={`font-bold ${isSelected ? 'text-[#00f3ff]' : 'text-zinc-500'}`}>
                {clue.number}.
              </span>{' '}
              <span>{clue.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ClueList({
  clues,
  selectedClueNumber,
  selectedDirection,
  onClueClick
}: ClueListProps) {
  // Auto-scroll to selected clue
  useEffect(() => {
    if (selectedClueNumber && selectedDirection) {
      const element = document.getElementById(`clue-${selectedClueNumber}-${selectedDirection}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedClueNumber, selectedDirection])

  return (
    <div className="w-full space-y-8 lg:w-80 lg:shrink-0">
      <ClueListSection
        title="Horizontais"
        icon="➡️"
        clues={clues.across}
        direction="across"
        selectedClueNumber={selectedClueNumber}
        selectedDirection={selectedDirection}
        onClueClick={onClueClick}
      />
      <ClueListSection
        title="Verticais"
        icon="⬇️"
        clues={clues.down}
        direction="down"
        selectedClueNumber={selectedClueNumber}
        selectedDirection={selectedDirection}
        onClueClick={onClueClick}
      />
    </div>
  )
}

export default ClueList

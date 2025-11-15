export interface CrosswordCell {
  value: string
  correct: string
  number?: number
  isBlack: boolean
  row: number
  col: number
}

export interface CrosswordClue {
  number: number
  text: string
  answer: string
  startRow: number
  startCol: number
  direction: 'across' | 'down'
}

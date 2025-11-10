/**
 * Crossword Generator - Generates Portuguese crossword puzzles automatically
 * 
 * Algorithm:
 * 1. Select random words from dictionary (filtered by length constraints)
 * 2. Place first word horizontally in center
 * 3. For each subsequent word, try to find intersection with existing words
 * 4. Build grid with black cells and numbered cells
 * 5. Generate clues from word definitions
 */

import type { Cell, Clue } from '@/components/CrosswordGrid';

export interface WordEntry {
  word: string;
  definition: string;
}

interface PlacedWord {
  word: string;
  definition: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  number?: number;
}

interface GridCell {
  letter: string;
  isBlack: boolean;
  number?: number;
}

export class CrosswordGenerator {
  private grid: GridCell[][];
  private placedWords: PlacedWord[] = [];
  private gridSize: number;

  constructor(gridSize: number = 15) {
    this.gridSize = gridSize;
    this.grid = this.initializeGrid();
  }

  private initializeGrid(): GridCell[][] {
    return Array(this.gridSize)
      .fill(null)
      .map(() =>
        Array(this.gridSize)
          .fill(null)
          .map(() => ({ letter: '', isBlack: false }))
      );
  }

  /**
   * Generate a crossword puzzle from a list of words
   * Now includes quality metrics and intersection scoring
   */
  generate(words: WordEntry[], maxWords: number = 10): {
    grid: Cell[][];
    clues: { across: Clue[]; down: Clue[] };
    quality: { intersections: number; density: number; score: number };
  } | null {
    // Filter words by suitable length (3-10 characters)
    const filteredWords = words
      .filter((w) => w.word.length >= 3 && w.word.length <= 10)
      .slice(0, maxWords * 3); // Get more words than needed for flexibility

    if (filteredWords.length === 0) {
      return null;
    }

    // Shuffle words for variety
    const shuffled = this.shuffleArray(filteredWords);

    // Place first word horizontally in the middle
    const firstWord = shuffled[0];
    const startRow = Math.floor(this.gridSize / 2);
    const startCol = Math.floor((this.gridSize - firstWord.word.length) / 2);

    if (!this.placeWord(firstWord, startRow, startCol, 'across')) {
      return null;
    }

    // Try to place remaining words
    let wordsPlaced = 1;
    let totalIntersections = 0;
    
    for (let i = 1; i < shuffled.length && wordsPlaced < maxWords; i++) {
      const intersections = this.tryPlaceWordWithScore(shuffled[i]);
      if (intersections > 0) {
        wordsPlaced++;
        totalIntersections += intersections;
      }
    }

    // Quality check: need at least 5 words and good intersection ratio
    if (wordsPlaced < 5) {
      return null;
    }

    // Calculate quality metrics
    const avgIntersections = totalIntersections / wordsPlaced;
    const minIntersections = 0.4; // At least 40% of words should intersect
    
    if (avgIntersections < minIntersections) {
      console.log(`❌ Puzzle rejected: avg intersections ${avgIntersections.toFixed(2)} < ${minIntersections}`);
      return null;
    }

    // Trim grid to minimum size and add black cells
    this.trimGrid();
    
    // Assign numbers to starting positions
    this.assignNumbers();

    // Calculate density (filled cells / total cells)
    const filledCells = this.placedWords.reduce((sum, word) => sum + word.word.length, 0);
    const totalCells = this.grid.length * this.grid[0].length;
    const density = filledCells / totalCells;

    // Calculate overall quality score (0-100)
    const qualityScore = Math.min(100, Math.round(
      (wordsPlaced * 10) + // More words = better
      (avgIntersections * 50) + // More intersections = better
      (density * 30) // Higher density = better
    ));

    // Convert to Cell format and generate clues
    const puzzle = this.buildPuzzle();
    
    return {
      ...puzzle,
      quality: {
        intersections: totalIntersections,
        density: Math.round(density * 100) / 100,
        score: qualityScore
      }
    };
  }

  private placeWord(
    word: WordEntry,
    row: number,
    col: number,
    direction: 'across' | 'down'
  ): boolean {
    const wordUpper = word.word.toUpperCase();

    // Check if word fits
    if (direction === 'across') {
      if (col + wordUpper.length > this.gridSize) return false;
    } else {
      if (row + wordUpper.length > this.gridSize) return false;
    }

    // Check for conflicts
    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;

      if (this.grid[r][c].letter && this.grid[r][c].letter !== wordUpper[i]) {
        return false; // Conflict
      }
    }

    // Place the word
    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      this.grid[r][c].letter = wordUpper[i];
    }

    this.placedWords.push({
      word: wordUpper,
      definition: word.definition,
      row,
      col,
      direction,
    });

    return true;
  }

  private tryPlaceWord(word: WordEntry): boolean {
    const wordUpper = word.word.toUpperCase();

    // Try to find intersection with existing words
    for (const placed of this.placedWords) {
      // Try both directions
      for (const direction of ['across', 'down'] as const) {
        // Skip if same direction as placed word
        if (direction === placed.direction) continue;

        // Find common letters
        for (let i = 0; i < wordUpper.length; i++) {
          for (let j = 0; j < placed.word.length; j++) {
            if (wordUpper[i] === placed.word[j]) {
              // Calculate position
              let newRow: number, newCol: number;

              if (direction === 'across') {
                newRow = placed.direction === 'across' 
                  ? placed.row 
                  : placed.row + j;
                newCol = placed.direction === 'across' 
                  ? placed.col + j - i 
                  : placed.col;
              } else {
                newRow = placed.direction === 'across' 
                  ? placed.row 
                  : placed.row + j - i;
                newCol = placed.direction === 'across' 
                  ? placed.col + j 
                  : placed.col;
              }

              // Try to place
              if (
                newRow >= 0 &&
                newCol >= 0 &&
                newRow < this.gridSize &&
                newCol < this.gridSize
              ) {
                if (this.placeWord(word, newRow, newCol, direction)) {
                  return true;
                }
              }
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Try to place word and return number of intersections (quality metric)
   */
  private tryPlaceWordWithScore(word: WordEntry): number {
    const wordUpper = word.word.toUpperCase();
    let bestIntersections = 0;
    let bestPlacement: { row: number; col: number; direction: 'across' | 'down' } | null = null;

    // Try to find intersection with existing words
    for (const placed of this.placedWords) {
      // Try both directions
      for (const direction of ['across', 'down'] as const) {
        // Skip if same direction as placed word
        if (direction === placed.direction) continue;

        // Find common letters (count intersections)
        for (let i = 0; i < wordUpper.length; i++) {
          for (let j = 0; j < placed.word.length; j++) {
            if (wordUpper[i] === placed.word[j]) {
              // Calculate position
              let newRow: number, newCol: number;

              if (direction === 'across') {
                newRow = placed.direction === 'across' 
                  ? placed.row 
                  : placed.row + j;
                newCol = placed.direction === 'across' 
                  ? placed.col + j - i 
                  : placed.col;
              } else {
                newRow = placed.direction === 'across' 
                  ? placed.row 
                  : placed.row + j - i;
                newCol = placed.direction === 'across' 
                  ? placed.col + j 
                  : placed.col;
              }

              // Check if position is valid
              if (
                newRow >= 0 &&
                newCol >= 0 &&
                newRow < this.gridSize &&
                newCol < this.gridSize
              ) {
                // Count potential intersections at this position
                const intersections = this.countIntersections(word, newRow, newCol, direction);
                if (intersections > bestIntersections) {
                  bestIntersections = intersections;
                  bestPlacement = { row: newRow, col: newCol, direction };
                }
              }
            }
          }
        }
      }
    }

    // Place word at best position if found
    if (bestPlacement && this.placeWord(word, bestPlacement.row, bestPlacement.col, bestPlacement.direction)) {
      return bestIntersections;
    }

    return 0;
  }

  /**
   * Count how many intersections a word would have at a given position
   */
  private countIntersections(
    word: WordEntry,
    row: number,
    col: number,
    direction: 'across' | 'down'
  ): number {
    const wordUpper = word.word.toUpperCase();
    let intersections = 0;

    // Check if word fits
    if (direction === 'across') {
      if (col + wordUpper.length > this.gridSize) return 0;
    } else {
      if (row + wordUpper.length > this.gridSize) return 0;
    }

    // Count intersections (matching letters with existing grid)
    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;

      if (this.grid[r][c].letter) {
        if (this.grid[r][c].letter === wordUpper[i]) {
          intersections++;
        } else {
          // Conflict! This placement is invalid
          return 0;
        }
      }
    }

    return intersections;
  }

  private trimGrid(): GridCell[][] {
    // Find bounds of placed words
    let minRow = this.gridSize,
      maxRow = 0,
      minCol = this.gridSize,
      maxCol = 0;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c].letter) {
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        }
      }
    }

    // Add padding
    minRow = Math.max(0, minRow - 1);
    maxRow = Math.min(this.gridSize - 1, maxRow + 1);
    minCol = Math.max(0, minCol - 1);
    maxCol = Math.min(this.gridSize - 1, maxCol + 1);

    // Create trimmed grid
    const trimmed: GridCell[][] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row: GridCell[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const cell = this.grid[r][c];
        row.push({
          letter: cell.letter,
          isBlack: !cell.letter,
          number: cell.number,
        });
      }
      trimmed.push(row);
    }

    // Update placed words coordinates
    this.placedWords = this.placedWords.map((word) => ({
      ...word,
      row: word.row - minRow,
      col: word.col - minCol,
    }));

    this.grid = trimmed;
    this.gridSize = trimmed.length; // Update grid size

    return trimmed;
  }

  private assignNumbers(): void {
    let number = 1;
    const numbered = new Set<string>();

    // Sort placed words by position (top-to-bottom, left-to-right)
    const sorted = [...this.placedWords].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    for (const word of sorted) {
      // Include direction in the key to allow both across and down at same position
      const key = `${word.row},${word.col},${word.direction}`;
      if (!numbered.has(key)) {
        // Check if this position already has a number (from another direction)
        const positionKey = `${word.row},${word.col}`;
        const existingNumber = this.grid[word.row][word.col].number;
        
        if (existingNumber) {
          // Reuse the existing number for this position
          word.number = existingNumber;
        } else {
          // Assign new number
          word.number = number;
          this.grid[word.row][word.col].number = number;
          number++;
        }
        
        numbered.add(key);
      }
    }
  }

  private buildPuzzle(): {
    grid: Cell[][];
    clues: { across: Clue[]; down: Clue[] };
  } {
    // First, mark all cells that belong to placed words
    const validCells = new Set<string>();
    for (const word of this.placedWords) {
      for (let i = 0; i < word.word.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i;
        const c = word.direction === 'across' ? word.col + i : word.col;
        validCells.add(`${r},${c}`);
      }
    }

    // Build grid, only including cells that belong to placed words
    const grid: Cell[][] = this.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const key = `${rowIndex},${colIndex}`;
        const isValid = validCells.has(key);
        
        return {
          value: '',
          correct: isValid ? cell.letter : '', // Only set correct value for valid cells
          number: cell.number,
          isBlack: !isValid || cell.isBlack, // Mark invalid cells as black
          row: rowIndex,
          col: colIndex,
        };
      })
    );

    const across: Clue[] = [];
    const down: Clue[] = [];

    for (const word of this.placedWords) {
      if (!word.number) continue;

      const clue: Clue = {
        number: word.number,
        text: word.definition,
        answer: word.word,
        startRow: word.row,
        startCol: word.col,
        direction: word.direction,
      };

      if (word.direction === 'across') {
        across.push(clue);
      } else {
        down.push(clue);
      }
    }

    // Sort clues by number
    across.sort((a, b) => a.number - b.number);
    down.sort((a, b) => a.number - b.number);

    return { grid, clues: { across, down } };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Gerador de Sopa de Letras (Word Search Puzzle Generator)
 * 
 * Gera puzzles de sopa de letras com palavras escondidas em 8 direções:
 * - Horizontal: → (direita) e ← (esquerda)
 * - Vertical: ↓ (baixo) e ↑ (cima)
 * - Diagonal: ↘ ↙ ↗ ↖ (4 direções diagonais)
 */

export type Direction = 'E' | 'W' | 'S' | 'N' | 'SE' | 'SW' | 'NE' | 'NW';

export interface WordPlacement {
  word: string;
  definition: string;
  startRow: number;
  startCol: number;
  direction: Direction;
}

export interface WordSearchPuzzle {
  grid: string[][];
  words: WordPlacement[];
  size: number;
}

export interface WordEntry {
  word: string;
  definition: string;
}

/**
 * Direções possíveis e seus vetores de movimento
 */
const DIRECTIONS: Record<Direction, { row: number; col: number; name: string }> = {
  E: { row: 0, col: 1, name: 'Direita' },      // →
  W: { row: 0, col: -1, name: 'Esquerda' },    // ←
  S: { row: 1, col: 0, name: 'Baixo' },        // ↓
  N: { row: -1, col: 0, name: 'Cima' },        // ↑
  SE: { row: 1, col: 1, name: 'Diagonal ↘' },  // ↘
  SW: { row: 1, col: -1, name: 'Diagonal ↙' }, // ↙
  NE: { row: -1, col: 1, name: 'Diagonal ↗' }, // ↗
  NW: { row: -1, col: -1, name: 'Diagonal ↖' } // ↖
};

/**
 * Letras comuns em português para preenchimento
 * Incluindo caracteres acentuados portugueses
 * Ponderadas por frequência aproximada
 */
const PT_LETTERS = [
  'A', 'A', 'A', 'E', 'E', 'E', 'O', 'O', 'I', 'I',
  'S', 'R', 'N', 'D', 'M', 'U', 'T', 'C', 'L', 'P',
  'V', 'G', 'H', 'Q', 'B', 'F', 'Z', 'J', 'X', 'K',
  'Á', 'É', 'Í', 'Ó', 'Ú', 'Â', 'Ê', 'Ô', 'Ã', 'Õ', 'Ç'
];

export class WordSearchGenerator {
  private gridSize: number;
  private grid: string[][];
  private placedWords: WordPlacement[];

  constructor(gridSize: number = 15) {
    this.gridSize = gridSize;
    this.grid = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill('')
    );
    this.placedWords = [];
  }

  /**
   * Gera uma sopa de letras com as palavras fornecidas
   */
  generate(words: WordEntry[], maxWords: number = 10): WordSearchPuzzle {
    // Filtrar palavras válidas (4-12 caracteres)
    const validWords = words
      .filter(w => w.word.length >= 4 && w.word.length <= 12)
      .slice(0, maxWords);

    // Normalizar palavras (uppercase, sem acentos para matching)
    const normalizedWords = validWords.map(w => ({
      ...w,
      word: this.normalizeWord(w.word)
    }));

    // Ordenar por tamanho (maiores primeiro para melhor colocação)
    normalizedWords.sort((a, b) => b.word.length - a.word.length);

    // Tentar colocar cada palavra
    for (const wordEntry of normalizedWords) {
      this.placeWord(wordEntry);
    }

    // Preencher células vazias com letras aleatórias
    this.fillEmptyCells();

    return {
      grid: this.grid,
      words: this.placedWords,
      size: this.gridSize
    };
  }

  /**
   * Normaliza palavra: apenas uppercase, PRESERVA acentos portugueses
   */
  private normalizeWord(word: string): string {
    return word.toUpperCase();
  }

  /**
   * Tenta colocar uma palavra no grid
   */
  private placeWord(wordEntry: WordEntry): boolean {
    const { word } = wordEntry;
    const directions = Object.keys(DIRECTIONS) as Direction[];
    
    // Embaralhar direções para variedade
    const shuffledDirections = this.shuffle(directions);

    // Tentar cada direção
    for (const direction of shuffledDirections) {
      // Tentar 50 posições aleatórias
      for (let attempt = 0; attempt < 50; attempt++) {
        const startRow = Math.floor(Math.random() * this.gridSize);
        const startCol = Math.floor(Math.random() * this.gridSize);

        if (this.canPlaceWord(word, startRow, startCol, direction)) {
          this.setWord(word, startRow, startCol, direction);
          this.placedWords.push({
            word,
            definition: wordEntry.definition,
            startRow,
            startCol,
            direction
          });
          return true;
        }
      }
    }

    return false; // Não conseguiu colocar a palavra
  }

  /**
   * Verifica se pode colocar palavra na posição e direção
   */
  private canPlaceWord(
    word: string,
    startRow: number,
    startCol: number,
    direction: Direction
  ): boolean {
    const { row: dRow, col: dCol } = DIRECTIONS[direction];

    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * dRow;
      const col = startCol + i * dCol;

      // Verifica limites
      if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
        return false;
      }

      // Verifica se célula está vazia ou tem a mesma letra
      const cellValue = this.grid[row][col];
      if (cellValue !== '' && cellValue !== word[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Coloca palavra no grid
   */
  private setWord(
    word: string,
    startRow: number,
    startCol: number,
    direction: Direction
  ): void {
    const { row: dRow, col: dCol } = DIRECTIONS[direction];

    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * dRow;
      const col = startCol + i * dCol;
      this.grid[row][col] = word[i];
    }
  }

  /**
   * Preenche células vazias com letras aleatórias
   */
  private fillEmptyCells(): void {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === '') {
          this.grid[row][col] = this.getRandomLetter();
        }
      }
    }
  }

  /**
   * Retorna letra aleatória ponderada
   */
  private getRandomLetter(): string {
    return PT_LETTERS[Math.floor(Math.random() * PT_LETTERS.length)];
  }

  /**
   * Embaralha array (Fisher-Yates)
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Função auxiliar para validar seleção do usuário
 */
export function validateSelection(
  grid: string[][],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): { word: string; direction: Direction | null } {
  // Calcular diferença
  const rowDiff = endRow - startRow;
  const colDiff = endCol - startCol;

  // Determinar direção
  let direction: Direction | null = null;
  
  if (rowDiff === 0 && colDiff > 0) direction = 'E';
  else if (rowDiff === 0 && colDiff < 0) direction = 'W';
  else if (colDiff === 0 && rowDiff > 0) direction = 'S';
  else if (colDiff === 0 && rowDiff < 0) direction = 'N';
  else if (rowDiff === colDiff && rowDiff > 0) direction = 'SE';
  else if (rowDiff === -colDiff && rowDiff > 0) direction = 'SW';
  else if (rowDiff === colDiff && rowDiff < 0) direction = 'NW';
  else if (rowDiff === -colDiff && rowDiff < 0) direction = 'NE';

  if (!direction) {
    return { word: '', direction: null };
  }

  // Extrair palavra
  const { row: dRow, col: dCol } = DIRECTIONS[direction];
  const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff)) + 1;
  let word = '';

  for (let i = 0; i < length; i++) {
    const row = startRow + i * dRow;
    const col = startCol + i * dCol;
    word += grid[row][col];
  }

  return { word, direction };
}

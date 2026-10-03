export const GRID_SIZE = 5;
export const TOTAL_NUMBERS = 25;
export const WINNING_LINES_COUNT = 5;
export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

export const BINGO_LETTER_COLORS: Record<string, string> = {
  B: '#EC4899', // Hot Pink
  I: '#8B5CF6', // Vivid Purple
  N: '#3B82F6', // Electric Blue
  G: '#10B981', // Emerald Green
  O: '#F59E0B', // Amber Gold
};

// 12 lines: 5 rows, 5 columns, 2 diagonals
export const BINGO_LINE_INDICES: number[][] = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],

  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],

  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export function validateBoard(board?: number[] | null): { valid: boolean; reason?: string } {
  if (!board || !Array.isArray(board)) {
    return { valid: false, reason: 'Board must be an array of 25 numbers.' };
  }
  if (board.length !== TOTAL_NUMBERS) {
    return { valid: false, reason: `Board must contain 25 numbers, but got ${board.length}.` };
  }

  const seen = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    const num = board[i];
    if (typeof num !== 'number' || !Number.isInteger(num)) {
      return { valid: false, reason: `Cell ${i + 1} is empty or invalid.` };
    }
    if (num < 1 || num > TOTAL_NUMBERS) {
      return { valid: false, reason: `Number ${num} is out of range (1-25).` };
    }
    if (seen.has(num)) {
      return { valid: false, reason: `Duplicate number ${num} found.` };
    }
    seen.add(num);
  }

  if (seen.size !== TOTAL_NUMBERS) {
    return { valid: false, reason: 'Board is missing numbers between 1 and 25.' };
  }

  return { valid: true };
}

export function generateRandomBoard(): number[] {
  const numbers: number[] = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = numbers[i];
    numbers[i] = numbers[j];
    numbers[j] = temp;
  }
  return numbers;
}

export function checkCompletedLines(
  board: number[],
  markedNumbers: number[] | Set<number>
): {
  completedLines: number[][];
  count: number;
  completedCellIndices: number[];
  letters: string[];
} {
  const markedSet = markedNumbers instanceof Set ? markedNumbers : new Set(markedNumbers);
  const completedLines: number[][] = [];
  const completedCellIndicesSet = new Set<number>();

  for (const line of BINGO_LINE_INDICES) {
    let allMarked = true;
    for (const cellIdx of line) {
      const cellNum = board[cellIdx];
      if (!markedSet.has(cellNum)) {
        allMarked = false;
        break;
      }
    }

    if (allMarked) {
      completedLines.push(line);
      for (const cellIdx of line) {
        completedCellIndicesSet.add(cellIdx);
      }
    }
  }

  const count = completedLines.length;
  const letters = getBingoLetters(count);

  return {
    completedLines,
    count,
    completedCellIndices: Array.from(completedCellIndicesSet),
    letters,
  };
}

export function getBingoLetters(linesCount: number): string[] {
  const activeCount = Math.min(BINGO_LETTERS.length, Math.max(0, linesCount));
  return BINGO_LETTERS.slice(0, activeCount) as unknown as string[];
}

export function isWinningScore(linesCount: number): boolean {
  return linesCount >= WINNING_LINES_COUNT;
}

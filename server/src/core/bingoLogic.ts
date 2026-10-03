export const GRID_SIZE = 5;
export const TOTAL_NUMBERS = 25;
export const WINNING_LINES_COUNT = 5;
export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

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

/**
 * Validates that a 5x5 board contains numbers 1..25 exactly once.
 */
export function validateBoard(board?: number[] | null): { valid: boolean; reason?: string } {
  if (!board || !Array.isArray(board)) {
    return { valid: false, reason: 'Board must be an array of 25 numbers.' };
  }
  if (board.length !== TOTAL_NUMBERS) {
    return { valid: false, reason: `Board must contain exactly ${TOTAL_NUMBERS} numbers, but got ${board.length}.` };
  }

  const seen = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    const num = board[i];
    if (typeof num !== 'number' || !Number.isInteger(num)) {
      return { valid: false, reason: `Cell at index ${i} contains non-integer value: ${num}.` };
    }
    if (num < 1 || num > TOTAL_NUMBERS) {
      return { valid: false, reason: `Number ${num} is out of range (1-${TOTAL_NUMBERS}).` };
    }
    if (seen.has(num)) {
      return { valid: false, reason: `Duplicate number detected: ${num}.` };
    }
    seen.add(num);
  }

  if (seen.size !== TOTAL_NUMBERS) {
    return { valid: false, reason: 'Board is missing numbers between 1 and 25.' };
  }

  return { valid: true };
}

/**
 * Generates a randomized 5x5 board containing numbers 1..25 exactly once.
 * Uses Fisher-Yates shuffle.
 */
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

/**
 * Checks completed lines on a board given a list or set of marked numbers.
 * Returns completed lines, line count, and cell indices that are part of any completed line.
 */
export function checkCompletedLines(
  board: number[],
  markedNumbers: number[] | Set<number>
): {
  completedLines: number[][]; // indices array of completed lines
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

/**
 * Returns B-I-N-G-O letters achieved based on completed lines count.
 */
export function getBingoLetters(linesCount: number): string[] {
  const activeCount = Math.min(BINGO_LETTERS.length, Math.max(0, linesCount));
  return BINGO_LETTERS.slice(0, activeCount) as unknown as string[];
}

/**
 * Checks if the line count satisfies the win condition (>= 5 lines).
 */
export function isWinningScore(linesCount: number): boolean {
  return linesCount >= WINNING_LINES_COUNT;
}

/**
 * AI move decision engine for Offline mode.
 * Evaluates board state and returns the optimal number (1-25) to call.
 */
export function calculateAIMove(
  aiBoard: number[],
  calledNumbers: number[],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): number {
  const calledSet = new Set(calledNumbers);
  const uncalledOnBoard = aiBoard.filter((num) => !calledSet.has(num));

  if (uncalledOnBoard.length === 0) {
    // Fallback if all numbers on board are called
    const allNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const uncalled = allNumbers.filter((n) => !calledSet.has(n));
    return uncalled[Math.floor(Math.random() * uncalled.length)];
  }

  // Easy mode: pick random uncalled number
  if (difficulty === 'easy') {
    return uncalledOnBoard[Math.floor(Math.random() * uncalledOnBoard.length)];
  }

  // Map each number to its board index
  const numToIndex = new Map<number, number>();
  aiBoard.forEach((num, idx) => numToIndex.set(num, idx));

  // Medium / Hard evaluation: score each uncalled number
  const scoredMoves: { number: number; score: number }[] = [];

  for (const num of uncalledOnBoard) {
    const cellIdx = numToIndex.get(num)!;
    let score = 0;

    // Check all lines that pass through this cell
    for (const line of BINGO_LINE_INDICES) {
      if (!line.includes(cellIdx)) continue;

      let markedInLine = 0;
      for (const idx of line) {
        if (calledSet.has(aiBoard[idx])) {
          markedInLine++;
        }
      }

      // If markedInLine == 4, calling this number COMPLETES the line! (High priority)
      if (markedInLine === 4) {
        score += 100;
      } else if (markedInLine === 3) {
        score += 25;
      } else if (markedInLine === 2) {
        score += 8;
      } else if (markedInLine === 1) {
        score += 2;
      } else {
        score += 1;
      }
    }

    if (difficulty === 'hard') {
      // Cell intersection bonus: Center cell (12) is in 4 lines, corners in 3 lines
      const lineCountForCell = BINGO_LINE_INDICES.filter((l) => l.includes(cellIdx)).length;
      score += lineCountForCell * 3;

      // Small jitter to prevent deterministic play in ties
      score += Math.random() * 2;
    }

    scoredMoves.push({ number: num, score });
  }

  // Sort by score descending
  scoredMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'medium') {
    // In medium, 75% chance best move, 25% chance top 3
    if (Math.random() > 0.25 || scoredMoves.length === 1) {
      return scoredMoves[0].number;
    }
    const pickIdx = Math.min(scoredMoves.length - 1, Math.floor(Math.random() * 3));
    return scoredMoves[pickIdx].number;
  }

  // Hard: best move always
  return scoredMoves[0].number;
}

/**
 * Generates an intuitive 5-character alphanumeric room code (e.g., "BG7X2")
 * Excludes ambiguous characters like 0, O, 1, I for clarity.
 */
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

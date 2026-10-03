import { BINGO_LINE_INDICES, TOTAL_NUMBERS } from './bingoLogic';
import { AIDifficulty } from '../types';

export function calculateAIMove(
  aiBoard: number[],
  calledNumbers: number[],
  difficulty: AIDifficulty = 'medium'
): number {
  const calledSet = new Set(calledNumbers);
  const uncalledOnBoard = aiBoard.filter((num) => !calledSet.has(num));

  if (uncalledOnBoard.length === 0) {
    const allNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const uncalled = allNumbers.filter((n) => !calledSet.has(n));
    return uncalled[Math.floor(Math.random() * uncalled.length)];
  }

  // Easy mode: pick random uncalled number
  if (difficulty === 'easy') {
    return uncalledOnBoard[Math.floor(Math.random() * uncalledOnBoard.length)];
  }

  const numToIndex = new Map<number, number>();
  aiBoard.forEach((num, idx) => numToIndex.set(num, idx));

  // Score each candidate number
  const scoredMoves: { number: number; score: number }[] = [];

  for (const num of uncalledOnBoard) {
    const cellIdx = numToIndex.get(num)!;
    let score = 0;

    for (const line of BINGO_LINE_INDICES) {
      if (!line.includes(cellIdx)) continue;

      let markedInLine = 0;
      for (const idx of line) {
        if (calledSet.has(aiBoard[idx])) {
          markedInLine++;
        }
      }

      // If markedInLine == 4, calling this number COMPLETES the line!
      if (markedInLine === 4) {
        score += 120;
      } else if (markedInLine === 3) {
        score += 30;
      } else if (markedInLine === 2) {
        score += 10;
      } else if (markedInLine === 1) {
        score += 3;
      } else {
        score += 1;
      }
    }

    if (difficulty === 'hard') {
      // Cell intersection bonus: Center cell is in 4 lines, corners in 3 lines
      const lineCountForCell = BINGO_LINE_INDICES.filter((l) => l.includes(cellIdx)).length;
      score += lineCountForCell * 4;

      // Small jitter for unpredictability among tied moves
      score += Math.random() * 2;
    }

    scoredMoves.push({ number: num, score });
  }

  scoredMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'medium') {
    // 75% best move, 25% top 3
    if (Math.random() > 0.25 || scoredMoves.length === 1) {
      return scoredMoves[0].number;
    }
    const pickIdx = Math.min(scoredMoves.length - 1, Math.floor(Math.random() * 3));
    return scoredMoves[pickIdx].number;
  }

  // Hard: best move always
  return scoredMoves[0].number;
}

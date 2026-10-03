import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBoard,
  generateRandomBoard,
  checkCompletedLines,
  getBingoLetters,
  isWinningScore,
  calculateAIMove,
  generateRoomCode,
  TOTAL_NUMBERS,
} from '../src/core/bingoLogic.js';

describe('Bingo 25 Core Logic', () => {
  it('generates a valid random 5x5 board', () => {
    const board = generateRandomBoard();
    assert.equal(board.length, TOTAL_NUMBERS);
    const validation = validateBoard(board);
    assert.equal(validation.valid, true);

    const sorted = [...board].sort((a, b) => a - b);
    for (let i = 1; i <= 25; i++) {
      assert.equal(sorted[i - 1], i);
    }
  });

  describe('Board Validation', () => {
    it('accepts valid 1-25 permutation', () => {
      const validBoard = Array.from({ length: 25 }, (_, i) => i + 1);
      assert.equal(validateBoard(validBoard).valid, true);
    });

    it('rejects board with wrong length', () => {
      const shortBoard = [1, 2, 3, 4, 5];
      const res = validateBoard(shortBoard);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /25 numbers/);
    });

    it('rejects board with duplicate numbers', () => {
      const dupBoard = Array.from({ length: 25 }, (_, i) => i + 1);
      dupBoard[24] = dupBoard[0]; // duplicate 1
      const res = validateBoard(dupBoard);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /Duplicate/);
    });

    it('rejects board with numbers out of 1-25 range', () => {
      const outOfRange = Array.from({ length: 25 }, (_, i) => i + 1);
      outOfRange[0] = 26;
      const res = validateBoard(outOfRange);
      assert.equal(res.valid, false);
      assert.match(res.reason || '', /out of range/);
    });

    it('rejects non-integer / invalid cells', () => {
      const invalid = Array.from({ length: 25 }, (_, i) => i + 1) as any[];
      invalid[0] = 'hello';
      assert.equal(validateBoard(invalid).valid, false);
    });
  });

  describe('Line Completion & BINGO Letters', () => {
    const sequentialBoard = Array.from({ length: 25 }, (_, i) => i + 1);

    it('detects 0 lines when no numbers or partial numbers are marked', () => {
      const marked = [1, 2, 3, 4];
      const res = checkCompletedLines(sequentialBoard, marked);
      assert.equal(res.count, 0);
      assert.deepEqual(res.letters, []);
      assert.equal(isWinningScore(res.count), false);
    });

    it('detects completed row 0', () => {
      const marked = [1, 2, 3, 4, 5];
      const res = checkCompletedLines(sequentialBoard, marked);
      assert.equal(res.count, 1);
      assert.deepEqual(res.letters, ['B']);
      assert.equal(isWinningScore(res.count), false);
    });

    it('detects completed column 0', () => {
      const marked = [1, 6, 11, 16, 21];
      const res = checkCompletedLines(sequentialBoard, marked);
      assert.equal(res.count, 1);
      assert.deepEqual(res.letters, ['B']);
    });

    it('detects completed diagonals', () => {
      const mainDiag = [1, 7, 13, 19, 25];
      const res1 = checkCompletedLines(sequentialBoard, mainDiag);
      assert.equal(res1.count, 1);

      const antiDiag = [5, 9, 13, 17, 21];
      const res2 = checkCompletedLines(sequentialBoard, antiDiag);
      assert.equal(res2.count, 1);

      const bothDiags = [1, 7, 13, 19, 25, 5, 9, 17, 21];
      const resBoth = checkCompletedLines(sequentialBoard, bothDiags);
      assert.equal(resBoth.count, 2);
      assert.deepEqual(resBoth.letters, ['B', 'I']);
    });

    it('awards B-I-N-G-O progression and win condition at 5+ lines', () => {
      const marked = [
        1, 2, 3, 4, 5,      // Row 0
        6, 7, 8, 9, 10,     // Row 1
        11, 12, 13, 14, 15, // Row 2
        16, 21,             // completes Col 0 [1, 6, 11, 16, 21] and Anti-diagonal [5, 9, 13, 17, 21]
        17, 22,             // completes Col 1 [2, 7, 12, 17, 22]
      ];
      const res = checkCompletedLines(sequentialBoard, marked);
      assert.ok(res.count >= 5);
      assert.deepEqual(res.letters, ['B', 'I', 'N', 'G', 'O']);
      assert.equal(isWinningScore(res.count), true);
    });

    it('returns up to 5 letters for B-I-N-G-O even if more than 5 lines', () => {
      assert.deepEqual(getBingoLetters(3), ['B', 'I', 'N']);
      assert.deepEqual(getBingoLetters(5), ['B', 'I', 'N', 'G', 'O']);
      assert.deepEqual(getBingoLetters(8), ['B', 'I', 'N', 'G', 'O']);
    });
  });

  describe('AI Logic', () => {
    const sequentialBoard = Array.from({ length: 25 }, (_, i) => i + 1);

    it('easy AI selects an uncalled number', () => {
      const called = [1, 2, 3];
      const move = calculateAIMove(sequentialBoard, called, 'easy');
      assert.equal(called.includes(move), false);
      assert.ok(move >= 1 && move <= 25);
    });

    it('hard AI prioritizes completing a 4-mark line', () => {
      const called = [1, 2, 3, 4];
      const move = calculateAIMove(sequentialBoard, called, 'hard');
      assert.equal(move, 5);
    });
  });

  describe('Room Code Generator', () => {
    it('generates 5 character room code with valid chars', () => {
      const code = generateRoomCode();
      assert.equal(code.length, 5);
      assert.match(code, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);
    });
  });
});

import { GameRoom, Player, AIDifficulty } from '../types';
import {
  generateRandomBoard,
  checkCompletedLines,
  isWinningScore,
  validateBoard,
} from '../core/bingoLogic';
import { calculateAIMove } from '../core/aiPlayer';

export type OfflineMode = 'ai' | 'pass_and_play';

export interface OfflineGameConfig {
  mode: OfflineMode;
  playerNames: string[];
  aiDifficulty?: AIDifficulty;
  humanBoards: Map<number, number[]>; // playerIndex -> board
}

export class OfflineGameEngine {
  public room: GameRoom;
  public config: OfflineGameConfig;
  public isAiThinking: boolean = false;
  private onStateChange: (room: GameRoom) => void;

  constructor(config: OfflineGameConfig, onStateChange: (room: GameRoom) => void) {
    this.config = config;
    this.onStateChange = onStateChange;

    const AVATAR_COLORS = ['#4F46E5', '#059669', '#D97706', '#E11D48'];

    const players: Player[] = config.playerNames.map((name, idx) => ({
      id: `offline_player_${idx}`,
      name,
      isHost: idx === 0,
      isReady: true,
      board: config.humanBoards.get(idx) || generateRandomBoard(),
      completedLinesCount: 0,
      completedLinesIndices: [],
      markedNumbers: [],
      connected: true,
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    }));

    this.room = {
      code: 'OFFLINE',
      status: 'playing',
      maxPlayers: players.length,
      players,
      currentTurnPlayerId: players[0].id,
      turnIndex: 0,
      calledNumbers: [],
      winnerPlayerIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turnTimeoutSeconds: 0,
      turnStartedAt: Date.now(),
    };
  }

  public getRoom(): GameRoom {
    return this.room;
  }

  public getCurrentPlayer(): Player {
    return this.room.players[this.room.turnIndex];
  }

  public callNumber(number: number): { success: boolean; error?: string } {
    if (this.room.status !== 'playing') {
      return { success: false, error: 'Game is not currently active.' };
    }

    if (number < 1 || number > 25) {
      return { success: false, error: 'Number must be between 1 and 25.' };
    }

    if (this.room.calledNumbers.includes(number)) {
      return { success: false, error: `Number ${number} was already called.` };
    }

    // Add to called numbers history
    this.room.calledNumbers.push(number);

    // Update all players
    const winners: Player[] = [];
    for (const p of this.room.players) {
      if (!p.markedNumbers.includes(number)) {
        p.markedNumbers.push(number);
      }
      if (p.board && p.board.length === 25) {
        const res = checkCompletedLines(p.board, p.markedNumbers);
        p.completedLinesCount = res.count;
        p.completedLinesIndices = res.completedLines;

        if (isWinningScore(res.count)) {
          winners.push(p);
        }
      }
    }

    if (winners.length > 0) {
      this.room.status = 'ended';
      this.room.winnerPlayerIds = winners.map((w) => w.id);
      this.triggerUpdate();
      return { success: true };
    }

    // Advance turn
    this.room.turnIndex = (this.room.turnIndex + 1) % this.room.players.length;
    this.room.currentTurnPlayerId = this.room.players[this.room.turnIndex].id;
    this.room.turnStartedAt = Date.now();
    this.triggerUpdate();

    // Check if next turn is AI
    this.checkNextTurnForAi();

    return { success: true };
  }

  private checkNextTurnForAi() {
    if (this.config.mode !== 'ai' || this.room.status !== 'playing') {
      return;
    }

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.name.includes('AI') || currentPlayer.id.includes('ai')) {
      this.isAiThinking = true;
      this.triggerUpdate();

      // Realistic thinking delay between 900ms and 1500ms
      const delay = 900 + Math.floor(Math.random() * 600);
      setTimeout(() => {
        if (this.room.status !== 'playing') return;

        const aiMove = calculateAIMove(
          currentPlayer.board || generateRandomBoard(),
          this.room.calledNumbers,
          this.config.aiDifficulty || 'medium'
        );

        this.isAiThinking = false;
        this.callNumber(aiMove);
      }, delay);
    }
  }

  public restartGame(newBoards?: Map<number, number[]>) {
    this.room.calledNumbers = [];
    this.room.winnerPlayerIds = [];
    this.room.turnIndex = 0;
    this.room.status = 'playing';
    this.room.currentTurnPlayerId = this.room.players[0].id;
    this.isAiThinking = false;

    this.room.players.forEach((p, idx) => {
      p.markedNumbers = [];
      p.completedLinesCount = 0;
      p.completedLinesIndices = [];
      if (newBoards && newBoards.has(idx)) {
        p.board = newBoards.get(idx)!;
      }
    });

    this.triggerUpdate();
  }

  private triggerUpdate() {
    this.room.updatedAt = Date.now();
    this.onStateChange({ ...this.room });
  }
}

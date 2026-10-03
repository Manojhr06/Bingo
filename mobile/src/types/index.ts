export type GameMode = 'online' | 'offline_ai' | 'offline_pass_and_play';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type RoomStatus = 'waiting' | 'setting_board' | 'playing' | 'ended';

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  isHost: boolean;
  isReady: boolean;
  board?: number[];
  completedLinesCount: number;
  completedLinesIndices: number[][];
  markedNumbers: number[];
  connected: boolean;
  disconnectedAt?: number;
  reconnectToken?: string;
  avatarColor: string;
}

export interface GameRoom {
  code: string;
  status: RoomStatus;
  maxPlayers: number;
  players: Player[];
  currentTurnPlayerId?: string;
  turnIndex: number;
  calledNumbers: number[];
  winnerPlayerIds: string[];
  createdAt: number;
  updatedAt: number;
  turnTimeoutSeconds: number;
  turnStartedAt?: number;
}

export type ScreenType =
  | 'home'
  | 'mode_select'
  | 'online_lobby'
  | 'board_setup'
  | 'game'
  | 'pass_and_play_setup'
  | 'ai_setup';

export type GameMode = 'online' | 'offline_ai' | 'offline_pass_and_play';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type RoomStatus = 'waiting' | 'setting_board' | 'playing' | 'ended';

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  isHost: boolean;
  isReady: boolean;
  board?: number[]; // 25 numbers
  completedLinesCount: number;
  completedLinesIndices: number[][]; // Which lines are completed
  markedNumbers: number[];
  connected: boolean;
  disconnectedAt?: number;
  reconnectToken: string;
  avatarColor: string;
}

export interface GameRoom {
  code: string; // 5-6 uppercase letters/numbers
  status: RoomStatus;
  maxPlayers: number; // 2, 3, or 4
  players: Player[];
  currentTurnPlayerId?: string;
  turnIndex: number;
  calledNumbers: number[];
  winnerPlayerIds: string[]; // Can be tied if completed in same turn
  createdAt: number;
  updatedAt: number;
  turnTimeoutSeconds: number;
  turnStartedAt?: number;
}

// Client -> Server events
export interface ClientToServerEvents {
  create_room: (
    data: { playerName: string; maxPlayers?: number },
    callback: (response: { success: boolean; room?: GameRoom; playerId?: string; reconnectToken?: string; error?: string }) => void
  ) => void;
  join_room: (
    data: { roomCode: string; playerName: string; playerId?: string; reconnectToken?: string },
    callback: (response: { success: boolean; room?: GameRoom; playerId?: string; reconnectToken?: string; error?: string }) => void
  ) => void;
  reconnect_session: (
    data: { roomCode: string; playerId: string; reconnectToken: string },
    callback: (response: { success: boolean; room?: GameRoom; error?: string }) => void
  ) => void;
  set_board: (
    data: { roomCode: string; playerId: string; board: number[] },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  start_game: (
    data: { roomCode: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  call_number: (
    data: { roomCode: string; playerId: string; number: number },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  send_reaction: (
    data: { roomCode: string; playerId: string; emoji: string }
  ) => void;
  request_rematch: (
    data: { roomCode: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  leave_room: (
    data: { roomCode: string; playerId: string },
    callback: (response: { success: boolean }) => void
  ) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  room_updated: (room: GameRoom) => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string, reason?: string) => void;
  game_started: (room: GameRoom) => void;
  number_called: (data: {
    number: number;
    calledByPlayerId: string;
    calledByPlayerName: string;
    nextTurnPlayerId: string;
    room: GameRoom;
  }) => void;
  line_completed: (data: {
    playerId: string;
    playerName: string;
    completedLinesCount: number;
    letters: string[];
  }) => void;
  game_over: (data: {
    winners: Player[];
    room: GameRoom;
  }) => void;
  reaction_received: (data: {
    playerId: string;
    playerName: string;
    emoji: string;
  }) => void;
  player_disconnected: (data: { playerId: string; playerName: string; graceRemainingMs: number }) => void;
  player_reconnected: (data: { playerId: string; playerName: string }) => void;
  turn_timeout_warning: (data: { secondsRemaining: number }) => void;
  error_message: (message: string) => void;
}

import mongoose, { Schema, Document } from 'mongoose';
import { GameRoom } from '../types.js';

export interface RoomDocument extends Document, Omit<GameRoom, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    socketId: { type: String },
    isHost: { type: Boolean, default: false },
    isReady: { type: Boolean, default: false },
    board: { type: [Number], default: [] },
    completedLinesCount: { type: Number, default: 0 },
    completedLinesIndices: { type: [[Number]], default: [] },
    markedNumbers: { type: [Number], default: [] },
    connected: { type: Boolean, default: true },
    disconnectedAt: { type: Number },
    reconnectToken: { type: String, required: true },
    avatarColor: { type: String, default: '#6366F1' },
  },
  { _id: false }
);

const RoomSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['waiting', 'setting_board', 'playing', 'ended'],
      default: 'waiting',
    },
    maxPlayers: { type: Number, default: 4, min: 2, max: 4 },
    players: { type: [PlayerSchema], default: [] },
    currentTurnPlayerId: { type: String },
    turnIndex: { type: Number, default: 0 },
    calledNumbers: { type: [Number], default: [] },
    winnerPlayerIds: { type: [String], default: [] },
    turnTimeoutSeconds: { type: Number, default: 30 },
    turnStartedAt: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Auto-expire abandoned rooms after 24 hours in MongoDB
RoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

export const RoomModel = mongoose.model<RoomDocument>('Room', RoomSchema);

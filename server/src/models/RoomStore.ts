import { GameRoom, Player } from '../types.js';
import { RoomModel } from './Room.js';
import mongoose from 'mongoose';

export class RoomStore {
  private inMemoryRooms = new Map<string, GameRoom>();
  private isMongoConnected = false;

  constructor() {
    this.checkMongoStatus();
  }

  public setMongoConnected(connected: boolean) {
    this.isMongoConnected = connected;
    if (connected) {
      console.log('📦 RoomStore: MongoDB connected. Syncing active rooms...');
    }
  }

  private checkMongoStatus() {
    this.isMongoConnected = mongoose.connection.readyState === 1;
  }

  public async getRoom(code: string): Promise<GameRoom | undefined> {
    const uppercaseCode = code.toUpperCase().trim();
    // 1. Check in-memory fast cache
    if (this.inMemoryRooms.has(uppercaseCode)) {
      return this.inMemoryRooms.get(uppercaseCode);
    }

    // 2. Fallback to MongoDB if connected
    if (this.isMongoConnected) {
      try {
        const doc = await RoomModel.findOne({ code: uppercaseCode });
        if (doc) {
          const room: GameRoom = {
            code: doc.code,
            status: doc.status,
            maxPlayers: doc.maxPlayers,
            players: doc.players as Player[],
            currentTurnPlayerId: doc.currentTurnPlayerId,
            turnIndex: doc.turnIndex,
            calledNumbers: doc.calledNumbers,
            winnerPlayerIds: doc.winnerPlayerIds,
            turnTimeoutSeconds: doc.turnTimeoutSeconds,
            turnStartedAt: doc.turnStartedAt,
            createdAt: doc.createdAt ? doc.createdAt.getTime() : Date.now(),
            updatedAt: doc.updatedAt ? doc.updatedAt.getTime() : Date.now(),
          };
          this.inMemoryRooms.set(uppercaseCode, room);
          return room;
        }
      } catch (err) {
        console.error('Error fetching room from MongoDB:', err);
      }
    }

    return undefined;
  }

  public async saveRoom(room: GameRoom): Promise<void> {
    const uppercaseCode = room.code.toUpperCase().trim();
    room.updatedAt = Date.now();
    this.inMemoryRooms.set(uppercaseCode, room);

    // Asynchronously persist to MongoDB without blocking real-time tick
    if (this.isMongoConnected) {
      try {
        await RoomModel.findOneAndUpdate(
          { code: uppercaseCode },
          {
            $set: {
              code: uppercaseCode,
              status: room.status,
              maxPlayers: room.maxPlayers,
              players: room.players,
              currentTurnPlayerId: room.currentTurnPlayerId,
              turnIndex: room.turnIndex,
              calledNumbers: room.calledNumbers,
              winnerPlayerIds: room.winnerPlayerIds,
              turnTimeoutSeconds: room.turnTimeoutSeconds,
              turnStartedAt: room.turnStartedAt,
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error(`Error saving room ${uppercaseCode} to MongoDB:`, err);
      }
    }
  }

  public async deleteRoom(code: string): Promise<void> {
    const uppercaseCode = code.toUpperCase().trim();
    this.inMemoryRooms.delete(uppercaseCode);
    if (this.isMongoConnected) {
      try {
        await RoomModel.deleteOne({ code: uppercaseCode });
      } catch (err) {
        console.error(`Error deleting room ${uppercaseCode} from MongoDB:`, err);
      }
    }
  }

  public findRoomBySocketId(socketId: string): GameRoom | undefined {
    for (const room of this.inMemoryRooms.values()) {
      if (room.players.some((p) => p.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  public getAllRooms(): GameRoom[] {
    return Array.from(this.inMemoryRooms.values());
  }
}

export const roomStore = new RoomStore();

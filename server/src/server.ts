import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ClientToServerEvents, ServerToClientEvents } from './types.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { roomStore } from './models/RoomStore.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bingo25';

export function createServerApp() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'Bingo 25 Game Server',
      uptime: process.uptime(),
      activeRooms: roomStore.getAllRooms().length,
      mongoConnected: mongoose.connection.readyState === 1,
      timestamp: Date.now(),
    });
  });

  // Rooms inspection endpoint
  app.get('/api/rooms', (_req, res) => {
    const rooms = roomStore.getAllRooms().map((r) => ({
      code: r.code,
      status: r.status,
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      calledNumbersCount: r.calledNumbers.length,
      createdAt: r.createdAt,
    }));
    res.json({ total: rooms.length, rooms });
  });

  app.get('/api/rooms/:code', async (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = await roomStore.getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Return sanitized view (without internal secret reconnect tokens)
    const sanitized = {
      ...room,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isReady: p.isReady,
        completedLinesCount: p.completedLinesCount,
        connected: p.connected,
        avatarColor: p.avatarColor,
      })),
    };
    res.json(sanitized);
  });

  const httpServer = http.createServer(app);

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 20000,
  });

  setupSocketHandlers(io);

  return { app, httpServer, io };
}

// Connect to MongoDB
async function initDatabase() {
  try {
    console.log(`📡 Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000, // Quick timeout for graceful fallback
    });
    console.log('✅ Connected to MongoDB successfully.');
    roomStore.setMongoConnected(true);
  } catch (err: any) {
    console.warn(`⚠️ MongoDB connection unavailable (${err.message}). Running with in-memory store.`);
    roomStore.setMongoConnected(false);
  }
}

// Start server only when executed directly as main script
const isMainModule = Boolean(
  process.argv[1] &&
    (process.argv[1].endsWith('server.ts') ||
      process.argv[1].endsWith('server.js') ||
      process.argv[1].endsWith('server.mjs'))
);

if (isMainModule && process.env.NODE_ENV !== 'test') {
  initDatabase().then(() => {
    const { httpServer } = createServerApp();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🎉 ==============================================`);
      console.log(`   🎯 BINGO 25 REAL-TIME GAME SERVER IS READY`);
      console.log(`   🚀 Listening on: http://0.0.0.0:${PORT}`);
      console.log(`   🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`   🎲 Game mode: 5x5 1-25 Real-Time Multiplayer`);
      console.log(`==============================================\n`);
    });

    const shutdown = async () => {
      console.log('Stopping server gracefully...');
      httpServer.close(async () => {
        if (mongoose.connection.readyState === 1) {
          await mongoose.disconnect();
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}

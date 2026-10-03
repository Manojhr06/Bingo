import { Server, Socket } from 'socket.io';
import { randomUUID } from 'node:crypto';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameRoom,
  Player,
} from '../types.js';
import {
  generateRoomCode,
  validateBoard,
  checkCompletedLines,
  isWinningScore,
  getBingoLetters,
} from '../core/bingoLogic.js';
import { roomStore } from '../models/RoomStore.js';

const AVATAR_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#0284C7', // Sky
];

// Map of playerId -> timeout timer
const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // --- CREATE ROOM ---
    socket.on('create_room', async ({ playerName, maxPlayers = 4 }, callback) => {
      try {
        const cleanName = (playerName || 'Player').trim().substring(0, 18);
        const validMax = Math.min(4, Math.max(2, maxPlayers));

        let code = generateRoomCode();
        while (await roomStore.getRoom(code)) {
          code = generateRoomCode();
        }

        const playerId = randomUUID();
        const reconnectToken = randomUUID();

        const hostPlayer: Player = {
          id: playerId,
          name: cleanName,
          socketId: socket.id,
          isHost: true,
          isReady: false,
          board: [],
          completedLinesCount: 0,
          completedLinesIndices: [],
          markedNumbers: [],
          connected: true,
          reconnectToken,
          avatarColor: AVATAR_COLORS[0],
        };

        const room: GameRoom = {
          code,
          status: 'waiting',
          maxPlayers: validMax,
          players: [hostPlayer],
          turnIndex: 0,
          calledNumbers: [],
          winnerPlayerIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          turnTimeoutSeconds: 30,
        };

        await roomStore.saveRoom(room);
        socket.join(code);

        console.log(`🏠 Room created: [${code}] by ${cleanName} (${playerId})`);

        callback({
          success: true,
          room,
          playerId,
          reconnectToken,
        });

        io.to(code).emit('room_updated', room);
      } catch (err: any) {
        console.error('Error creating room:', err);
        callback({ success: false, error: err.message || 'Failed to create room' });
      }
    });

    // --- JOIN ROOM ---
    socket.on('join_room', async ({ roomCode, playerName, playerId, reconnectToken }, callback) => {
      try {
        const uppercaseCode = (roomCode || '').toUpperCase().trim();
        const room = await roomStore.getRoom(uppercaseCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found. Check the code and try again.' });
        }

        // Check if reconnecting existing player
        if (playerId && reconnectToken) {
          const existingPlayer = room.players.find(
            (p) => p.id === playerId && p.reconnectToken === reconnectToken
          );
          if (existingPlayer) {
            // Cancel disconnect timer if any
            if (disconnectTimers.has(playerId)) {
              clearTimeout(disconnectTimers.get(playerId)!);
              disconnectTimers.delete(playerId);
            }

            existingPlayer.connected = true;
            existingPlayer.socketId = socket.id;
            delete existingPlayer.disconnectedAt;

            socket.join(uppercaseCode);
            await roomStore.saveRoom(room);

            console.log(`🔄 Player reconnected: ${existingPlayer.name} (${playerId}) to room [${uppercaseCode}]`);

            io.to(uppercaseCode).emit('player_reconnected', {
              playerId: existingPlayer.id,
              playerName: existingPlayer.name,
            });
            io.to(uppercaseCode).emit('room_updated', room);

            return callback({
              success: true,
              room,
              playerId: existingPlayer.id,
              reconnectToken: existingPlayer.reconnectToken,
            });
          }
        }

        // New player joining
        if (room.status !== 'waiting' && room.status !== 'setting_board') {
          return callback({
            success: false,
            error: 'Game has already started in this room.',
          });
        }

        if (room.players.length >= room.maxPlayers) {
          return callback({
            success: false,
            error: `Room is full (max ${room.maxPlayers} players).`,
          });
        }

        const cleanName = (playerName || 'Player').trim().substring(0, 18);
        const newPlayerId = randomUUID();
        const newReconnectToken = randomUUID();
        const colorIdx = room.players.length % AVATAR_COLORS.length;

        const newPlayer: Player = {
          id: newPlayerId,
          name: cleanName,
          socketId: socket.id,
          isHost: false,
          isReady: false,
          board: [],
          completedLinesCount: 0,
          completedLinesIndices: [],
          markedNumbers: [],
          connected: true,
          reconnectToken: newReconnectToken,
          avatarColor: AVATAR_COLORS[colorIdx],
        };

        room.players.push(newPlayer);
        await roomStore.saveRoom(room);
        socket.join(uppercaseCode);

        console.log(`👋 Player ${cleanName} joined room [${uppercaseCode}]`);

        io.to(uppercaseCode).emit('player_joined', newPlayer);
        io.to(uppercaseCode).emit('room_updated', room);

        callback({
          success: true,
          room,
          playerId: newPlayerId,
          reconnectToken: newReconnectToken,
        });
      } catch (err: any) {
        console.error('Error joining room:', err);
        callback({ success: false, error: err.message || 'Failed to join room' });
      }
    });

    // --- RECONNECT SESSION ---
    socket.on('reconnect_session', async ({ roomCode, playerId, reconnectToken }, callback) => {
      try {
        const uppercaseCode = (roomCode || '').toUpperCase().trim();
        const room = await roomStore.getRoom(uppercaseCode);

        if (!room) {
          return callback({ success: false, error: 'Room expired or not found.' });
        }

        const player = room.players.find(
          (p) => p.id === playerId && p.reconnectToken === reconnectToken
        );

        if (!player) {
          return callback({ success: false, error: 'Invalid reconnect session credentials.' });
        }

        if (disconnectTimers.has(playerId)) {
          clearTimeout(disconnectTimers.get(playerId)!);
          disconnectTimers.delete(playerId);
        }

        player.connected = true;
        player.socketId = socket.id;
        delete player.disconnectedAt;

        socket.join(uppercaseCode);
        await roomStore.saveRoom(room);

        io.to(uppercaseCode).emit('player_reconnected', {
          playerId: player.id,
          playerName: player.name,
        });
        io.to(uppercaseCode).emit('room_updated', room);

        callback({ success: true, room });
      } catch (err: any) {
        callback({ success: false, error: err.message || 'Reconnect failed.' });
      }
    });

    // --- SET BOARD ---
    socket.on('set_board', async ({ roomCode, playerId, board }, callback) => {
      try {
        const uppercaseCode = (roomCode || '').toUpperCase().trim();
        const room = await roomStore.getRoom(uppercaseCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found.' });
        }

        const player = room.players.find((p) => p.id === playerId);
        if (!player) {
          return callback({ success: false, error: 'Player not found in room.' });
        }

        const validation = validateBoard(board);
        if (!validation.valid) {
          return callback({ success: false, error: validation.reason || 'Invalid board numbers.' });
        }

        player.board = board;
        player.isReady = true;

        // If everyone has set their board and is ready, status can become ready to start
        const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady);
        if (allReady && room.status === 'setting_board') {
          // Ready to start!
        }

        await roomStore.saveRoom(room);
        io.to(uppercaseCode).emit('room_updated', room);

        callback({ success: true });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    // --- START GAME ---
    socket.on('start_game', async ({ roomCode, playerId }, callback) => {
      try {
        const uppercaseCode = (roomCode || '').toUpperCase().trim();
        const room = await roomStore.getRoom(uppercaseCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found.' });
        }

        const player = room.players.find((p) => p.id === playerId);
        if (!player || !player.isHost) {
          return callback({ success: false, error: 'Only the host can start the game.' });
        }

        if (room.players.length < 2) {
          return callback({ success: false, error: 'At least 2 players are needed to play.' });
        }

        // Transition from lobby to board setup if needed
        if (room.status === 'waiting') {
          room.status = 'setting_board';
          await roomStore.saveRoom(room);
          io.to(uppercaseCode).emit('room_updated', room);
          return callback({ success: true });
        }

        // Transition from setting_board to playing
        if (room.status === 'setting_board') {
          const notReady = room.players.filter((p) => !p.isReady);
          if (notReady.length > 0) {
            return callback({
              success: false,
              error: `Waiting for ${notReady.map((p) => p.name).join(', ')} to finish board setup.`,
            });
          }

          room.status = 'playing';
          room.turnIndex = 0;
          room.currentTurnPlayerId = room.players[0].id;
          room.calledNumbers = [];
          room.winnerPlayerIds = [];
          room.turnStartedAt = Date.now();

          // Reset marked numbers for all players
          room.players.forEach((p) => {
            p.markedNumbers = [];
            p.completedLinesCount = 0;
            p.completedLinesIndices = [];
          });

          await roomStore.saveRoom(room);
          io.to(uppercaseCode).emit('game_started', room);
          io.to(uppercaseCode).emit('room_updated', room);

          console.log(`🎮 Game started in room [${uppercaseCode}]! First turn: ${room.players[0].name}`);

          return callback({ success: true });
        }

        callback({ success: false, error: 'Invalid game state transition.' });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    // --- CALL NUMBER ---
    socket.on('call_number', async ({ roomCode, playerId, number }, callback) => {
      try {
        const uppercaseCode = (roomCode || '').toUpperCase().trim();
        const room = await roomStore.getRoom(uppercaseCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found.' });
        }

        if (room.status !== 'playing') {
          return callback({ success: false, error: 'Game is not currently active.' });
        }

        if (room.currentTurnPlayerId !== playerId) {
          return callback({ success: false, error: 'It is not your turn!' });
        }

        const caller = room.players.find((p) => p.id === playerId);
        if (!caller) {
          return callback({ success: false, error: 'Player not found.' });
        }

        if (typeof number !== 'number' || number < 1 || number > 25) {
          return callback({ success: false, error: 'Number must be between 1 and 25.' });
        }

        if (room.calledNumbers.includes(number)) {
          return callback({ success: false, error: `Number ${number} has already been called!` });
        }

        // Add called number to room history
        room.calledNumbers.push(number);

        // Update all players' marked numbers and line completions
        const winners: Player[] = [];

        for (const p of room.players) {
          if (!p.markedNumbers.includes(number)) {
            p.markedNumbers.push(number);
          }

          if (p.board && p.board.length === 25) {
            const prevCount = p.completedLinesCount;
            const res = checkCompletedLines(p.board, p.markedNumbers);
            p.completedLinesCount = res.count;
            p.completedLinesIndices = res.completedLines;

            if (res.count > prevCount) {
              // Notify line completion
              io.to(uppercaseCode).emit('line_completed', {
                playerId: p.id,
                playerName: p.name,
                completedLinesCount: res.count,
                letters: res.letters,
              });
            }

            if (isWinningScore(res.count)) {
              winners.push(p);
            }
          }
        }

        // Check if game is won
        if (winners.length > 0) {
          room.status = 'ended';
          room.winnerPlayerIds = winners.map((w) => w.id);

          await roomStore.saveRoom(room);

          console.log(`🏆 Game Over in [${uppercaseCode}]! Winner(s): ${winners.map((w) => w.name).join(', ')}`);

          io.to(uppercaseCode).emit('number_called', {
            number,
            calledByPlayerId: caller.id,
            calledByPlayerName: caller.name,
            nextTurnPlayerId: '',
            room,
          });

          io.to(uppercaseCode).emit('game_over', {
            winners,
            room,
          });
          io.to(uppercaseCode).emit('room_updated', room);

          return callback({ success: true });
        }

        // Determine next turn player
        let nextIndex = (room.turnIndex + 1) % room.players.length;
        // Skip disconnected players if possible
        let attempts = 0;
        while (!room.players[nextIndex].connected && attempts < room.players.length) {
          nextIndex = (nextIndex + 1) % room.players.length;
          attempts++;
        }

        room.turnIndex = nextIndex;
        room.currentTurnPlayerId = room.players[nextIndex].id;
        room.turnStartedAt = Date.now();

        await roomStore.saveRoom(room);

        io.to(uppercaseCode).emit('number_called', {
          number,
          calledByPlayerId: caller.id,
          calledByPlayerName: caller.name,
          nextTurnPlayerId: room.currentTurnPlayerId,
          room,
        });
        io.to(uppercaseCode).emit('room_updated', room);

        callback({ success: true });
      } catch (err: any) {
        console.error('Error calling number:', err);
        callback({ success: false, error: err.message || 'Failed to call number' });
      }
    });

    // --- SEND REACTION ---
    socket.on('send_reaction', async ({ roomCode, playerId, emoji }) => {
      const uppercaseCode = (roomCode || '').toUpperCase().trim();
      const room = await roomStore.getRoom(uppercaseCode);
      if (!room) return;

      const player = room.players.find((p) => p.id === playerId);
      if (!player) return;

      io.to(uppercaseCode).emit('reaction_received', {
        playerId: player.id,
        playerName: player.name,
        emoji,
      });
    });

    // --- REMATCH ---
    socket.on('request_rematch', async ({ roomCode, playerId }, callback) => {
      try {
        const uppercaseCode = (roomCode || '').toUpperCase().trim();
        const room = await roomStore.getRoom(uppercaseCode);
        if (!room) {
          return callback({ success: false, error: 'Room not found.' });
        }

        // Reset to board setup
        room.status = 'setting_board';
        room.calledNumbers = [];
        room.winnerPlayerIds = [];
        room.turnIndex = 0;
        room.currentTurnPlayerId = undefined;

        room.players.forEach((p) => {
          p.isReady = false;
          p.markedNumbers = [];
          p.completedLinesCount = 0;
          p.completedLinesIndices = [];
          // Keep previous board or allow reconfiguration
        });

        await roomStore.saveRoom(room);
        io.to(uppercaseCode).emit('room_updated', room);

        callback({ success: true });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    // --- LEAVE ROOM ---
    socket.on('leave_room', async ({ roomCode, playerId }, callback) => {
      try {
        const uppercaseCode = (roomCode || '').toUpperCase().trim();
        const room = await roomStore.getRoom(uppercaseCode);

        if (room) {
          await handlePlayerExit(io, room, playerId);
        }
        socket.leave(uppercaseCode);
        callback({ success: true });
      } catch (err) {
        callback({ success: false });
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', async () => {
      console.log(`⚡ Client disconnected: ${socket.id}`);
      const room = roomStore.findRoomBySocketId(socket.id);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      player.connected = false;
      player.disconnectedAt = Date.now();
      await roomStore.saveRoom(room);

      const GRACE_PERIOD_MS = 60000; // 60 seconds reconnection window
      io.to(room.code).emit('player_disconnected', {
        playerId: player.id,
        playerName: player.name,
        graceRemainingMs: GRACE_PERIOD_MS,
      });
      io.to(room.code).emit('room_updated', room);

      // If it's currently this player's turn, advance after 15 seconds to keep game flowing
      if (room.status === 'playing' && room.currentTurnPlayerId === player.id) {
        const skipTimer = setTimeout(async () => {
          const currentRoom = await roomStore.getRoom(room.code);
          if (
            currentRoom &&
            currentRoom.status === 'playing' &&
            currentRoom.currentTurnPlayerId === player.id &&
            !player.connected
          ) {
            console.log(`⏱️ Turn skipped for disconnected player: ${player.name}`);
            let nextIndex = (currentRoom.turnIndex + 1) % currentRoom.players.length;
            currentRoom.turnIndex = nextIndex;
            currentRoom.currentTurnPlayerId = currentRoom.players[nextIndex].id;
            currentRoom.turnStartedAt = Date.now();
            await roomStore.saveRoom(currentRoom);
            io.to(currentRoom.code).emit('room_updated', currentRoom);
          }
        }, 15000);
        skipTimer.unref();
      }

      // Reconnection timeout: Remove player if not reconnected within grace period
      const timer = setTimeout(async () => {
        const freshRoom = await roomStore.getRoom(room.code);
        if (freshRoom) {
          const p = freshRoom.players.find((x) => x.id === player.id);
          if (p && !p.connected) {
            console.log(`⌛ Grace period expired for ${p.name}. Removing from room [${freshRoom.code}].`);
            await handlePlayerExit(io, freshRoom, player.id);
          }
        }
        disconnectTimers.delete(player.id);
      }, GRACE_PERIOD_MS);

      timer.unref();
      disconnectTimers.set(player.id, timer);
    });
  });
}

/**
 * Handles graceful player exit or removal from a room, including host migration.
 */
async function handlePlayerExit(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  room: GameRoom,
  playerId: string
) {
  const index = room.players.findIndex((p) => p.id === playerId);
  if (index === -1) return;

  const [removedPlayer] = room.players.splice(index, 1);
  console.log(`🚪 Player ${removedPlayer.name} removed from room [${room.code}]`);

  // If room is empty, delete room
  if (room.players.length === 0) {
    console.log(`🗑️ Room [${room.code}] is empty. Deleting.`);
    await roomStore.deleteRoom(room.code);
    return;
  }

  // Host migration if host left
  if (removedPlayer.isHost) {
    // Find next connected player or first player
    const newHost = room.players.find((p) => p.connected) || room.players[0];
    newHost.isHost = true;
    console.log(`👑 Host migrated to ${newHost.name} in room [${room.code}]`);
  }

  // If game in progress and only 1 player remains, remaining player wins
  if (room.status === 'playing' && room.players.length === 1) {
    room.status = 'ended';
    room.winnerPlayerIds = [room.players[0].id];
    io.to(room.code).emit('game_over', {
      winners: [room.players[0]],
      room,
    });
  } else if (room.status === 'playing' && room.currentTurnPlayerId === playerId) {
    // If it was the leaving player's turn, advance turn
    room.turnIndex = room.turnIndex % room.players.length;
    room.currentTurnPlayerId = room.players[room.turnIndex].id;
  }

  await roomStore.saveRoom(room);
  io.to(room.code).emit('player_left', playerId, `${removedPlayer.name} has left the room.`);
  io.to(room.code).emit('room_updated', room);
}

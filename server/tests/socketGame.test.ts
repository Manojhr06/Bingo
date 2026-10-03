import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as Client, Socket } from 'socket.io-client';
import { createServerApp } from '../src/server.js';
import { generateRandomBoard } from '../src/core/bingoLogic.js';
import { ClientToServerEvents, ServerToClientEvents } from '../src/types.js';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

describe('Real-Time Multiplayer Socket Game Tests', () => {
  let httpServer: any;
  let port: number;
  let client1: ClientSocket;
  let client2: ClientSocket;

  before(async () => {
    process.env.NODE_ENV = 'test';
    const serverInstance = createServerApp();
    httpServer = serverInstance.httpServer;

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });
  });

  after(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it('runs complete multiplayer flow: create room, join, setup boards, take turns, prevent duplicate calls', async () => {
    const serverUrl = `http://localhost:${port}`;

    // Connect Client 1
    client1 = Client(serverUrl, { transports: ['websocket'] }) as ClientSocket;
    await new Promise<void>((resolve) => client1.on('connect', resolve));

    // 1. Client 1 creates room
    let roomCode = '';
    let player1Id = '';
    await new Promise<void>((resolve, reject) => {
      client1.emit('create_room', { playerName: 'Alice', maxPlayers: 2 }, (res) => {
        if (!res.success || !res.room || !res.playerId) {
          return reject(new Error(res.error || 'Failed to create room'));
        }
        roomCode = res.room.code;
        player1Id = res.playerId;
        assert.equal(res.room.players.length, 1);
        assert.equal(res.room.status, 'waiting');
        resolve();
      });
    });

    assert.ok(roomCode.length >= 5);

    // Connect Client 2
    client2 = Client(serverUrl, { transports: ['websocket'] }) as ClientSocket;
    await new Promise<void>((resolve) => client2.on('connect', resolve));

    // 2. Client 2 joins room
    let player2Id = '';
    await new Promise<void>((resolve, reject) => {
      client2.emit('join_room', { roomCode, playerName: 'Bob' }, (res) => {
        if (!res.success || !res.room || !res.playerId) {
          return reject(new Error(res.error || 'Failed to join room'));
        }
        player2Id = res.playerId;
        assert.equal(res.room.players.length, 2);
        resolve();
      });
    });

    // 3. Host starts board setup
    await new Promise<void>((resolve, reject) => {
      client1.emit('start_game', { roomCode, playerId: player1Id }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve();
      });
    });

    // 4. Both players submit boards
    const board1 = generateRandomBoard();
    const board2 = generateRandomBoard();

    await new Promise<void>((resolve, reject) => {
      client1.emit('set_board', { roomCode, playerId: player1Id, board: board1 }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      client2.emit('set_board', { roomCode, playerId: player2Id, board: board2 }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve();
      });
    });

    // 5. Host starts game
    await new Promise<void>((resolve, reject) => {
      client1.emit('start_game', { roomCode, playerId: player1Id }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve();
      });
    });

    // 6. Test taking a turn: calling a number
    // Alice's turn: Alice calls number 7
    const callPromise = new Promise<void>((resolve) => {
      client2.once('number_called', (data) => {
        assert.equal(data.number, 7);
        assert.equal(data.calledByPlayerId, player1Id);
        assert.equal(data.nextTurnPlayerId, player2Id); // Turn advanced to Bob!
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      client1.emit('call_number', { roomCode, playerId: player1Id, number: 7 }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve();
      });
    });

    await callPromise;

    // 7. Test out-of-turn rejection: Alice tries to call again immediately
    await new Promise<void>((resolve) => {
      client1.emit('call_number', { roomCode, playerId: player1Id, number: 12 }, (res) => {
        assert.equal(res.success, false);
        assert.match(res.error || '', /not your turn/i);
        resolve();
      });
    });

    // 8. Test duplicate number rejection: Bob tries to call 7 (which was already called)
    await new Promise<void>((resolve) => {
      client2.emit('call_number', { roomCode, playerId: player2Id, number: 7 }, (res) => {
        assert.equal(res.success, false);
        assert.match(res.error || '', /already been called/i);
        resolve();
      });
    });

    // 9. Bob calls valid uncalled number: 15
    await new Promise<void>((resolve, reject) => {
      client2.emit('call_number', { roomCode, playerId: player2Id, number: 15 }, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve();
      });
    });
  });
});

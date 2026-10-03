import { io, Socket } from 'socket.io-client';
import { generateRandomBoard } from '../src/core/bingoLogic.js';

const SERVER_URL = 'http://localhost:3000';

async function runLiveMatchDemo() {
  console.log('🎮 ========================================================');
  console.log('   🚀 BINGO 25: LIVE REAL-TIME MULTIPLAYER SIMULATION');
  console.log('========================================================\n');

  console.log(`Connecting Player 1 (Alice) to ${SERVER_URL}...`);
  const client1 = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((res) => client1.on('connect', res));
  console.log(`✅ Alice connected: Socket ID [${client1.id}]`);

  // 1. Alice creates room
  const createRes: any = await new Promise((res) => {
    client1.emit('create_room', { playerName: 'Alice', maxPlayers: 2 }, res);
  });

  if (!createRes.success) {
    throw new Error(createRes.error);
  }

  const roomCode = createRes.room.code;
  const aliceId = createRes.playerId;
  console.log(`🏠 Room Created: [${roomCode}] (Max: ${createRes.room.maxPlayers} players)`);

  // 2. Bob joins room
  console.log(`\nConnecting Player 2 (Bob) to ${SERVER_URL}...`);
  const client2 = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((res) => client2.on('connect', res));
  console.log(`✅ Bob connected: Socket ID [${client2.id}]`);

  const joinRes: any = await new Promise((res) => {
    client2.emit('join_room', { roomCode, playerName: 'Bob' }, res);
  });

  if (!joinRes.success) {
    throw new Error(joinRes.error);
  }
  const bobId = joinRes.playerId;
  console.log(`👋 Bob successfully joined room [${roomCode}]!`);

  // 3. Host proceeds to board setup
  console.log(`\n📋 Host (Alice) initiates 5x5 Board Setup phase...`);
  await new Promise((res) => client1.emit('start_game', { roomCode, playerId: aliceId }, res));

  // 4. Setup boards
  // Let's give Alice a board where row 0 is 1..5, row 1 is 6..10, row 2 is 11..15, row 3 is 16..20, row 4 is 21..25
  const aliceBoard = Array.from({ length: 25 }, (_, i) => i + 1);
  const bobBoard = generateRandomBoard();

  console.log('📝 Alice locked in custom 5x5 board.');
  await new Promise((res) =>
    client1.emit('set_board', { roomCode, playerId: aliceId, board: aliceBoard }, res)
  );

  console.log('📝 Bob locked in random 5x5 board.');
  await new Promise((res) =>
    client2.emit('set_board', { roomCode, playerId: bobId, board: bobBoard }, res)
  );

  // 5. Host launches the game
  console.log('\n🎯 Both players ready! Alice starts the game...');
  await new Promise((res) => client1.emit('start_game', { roomCode, playerId: aliceId }, res));
  console.log('🎉 Match is LIVE! Real-time turns begin.\n');

  // Register real-time event listeners
  client1.on('line_completed', (data: any) => {
    console.log(
      `   ✨ LINE COMPLETED by ${data.playerName}! Total Lines: ${data.completedLinesCount} | Letters: [${data.letters.join(
        ' - '
      )}]`
    );
  });

  client2.on('line_completed', (data: any) => {
    console.log(
      `   ✨ LINE COMPLETED by ${data.playerName}! Total Lines: ${data.completedLinesCount} | Letters: [${data.letters.join(
        ' - '
      )}]`
    );
  });

  client1.on('game_over', (data: any) => {
    console.log('\n🏆 ==============================================');
    console.log(`   🎊 GAME OVER! WINNER: ${data.winners.map((w: any) => w.name).join(' & ')}`);
    console.log(`   🎲 Total Numbers Called: ${data.room.calledNumbers.length}`);
    console.log(`   📜 Called Numbers History: ${data.room.calledNumbers.join(', ')}`);
    console.log('==============================================\n');
  });

  // 6. Simulate turns calling numbers
  // Sequence of numbers:
  // Row 0: 1, 2, 3, 4, 5 (1 line: B)
  // Row 1: 6, 7, 8, 9, 10 (2 lines: B-I)
  // Row 2: 11, 12, 13, 14, 15 (3 lines: B-I-N)
  // Col 0: 16, 21 (4 lines: B-I-N-G) + diagonal!
  // Col 1: 17, 22 (5+ lines: B-I-N-G-O -> WIN!)

  const numbersToCall = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 21, 17, 22];

  let currentTurnPlayer = aliceId;
  let moveCount = 1;

  for (const num of numbersToCall) {
    const callerName = currentTurnPlayer === aliceId ? 'Alice' : 'Bob';
    const callerSocket = currentTurnPlayer === aliceId ? client1 : client2;

    process.stdout.write(`Turn ${moveCount++}: ${callerName} calls [${num}]... `);

    const callRes: any = await new Promise((res) => {
      callerSocket.emit('call_number', { roomCode, playerId: currentTurnPlayer, number: num }, res);
    });

    if (callRes.success) {
      console.log('✅ Marked on all boards');
      // Alternate turn
      currentTurnPlayer = currentTurnPlayer === aliceId ? bobId : aliceId;
    } else {
      console.log(`❌ Error: ${callRes.error}`);
      break;
    }

    // Small delay for realistic demonstration
    await new Promise((r) => setTimeout(r, 60));
  }

  // Disconnect sockets cleanly
  client1.disconnect();
  client2.disconnect();
}

runLiveMatchDemo().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});

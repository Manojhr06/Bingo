import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/components/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { OnlineLobbyScreen } from './src/screens/OnlineLobbyScreen';
import { BoardSetupScreen } from './src/screens/BoardSetupScreen';
import { GameScreen } from './src/screens/GameScreen';
import { socketService } from './src/services/socketService';
import { OfflineGameEngine } from './src/services/offlineGameEngine';
import { GameRoom, ScreenType, AIDifficulty } from './src/types';
import { generateRandomBoard } from './src/core/bingoLogic';

function AppContent() {
  const { theme, isDarkMode } = useTheme();

  // Screen flow navigation
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [initialModeSelect, setInitialModeSelect] = useState<'online' | 'offline'>('online');

  // Game state
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myPlayerName, setMyPlayerName] = useState<string>('Player 1');
  const [myBoard, setMyBoard] = useState<number[]>(() => generateRandomBoard());

  // Offline Engine State
  const [offlineEngine, setOfflineEngine] = useState<OfflineGameEngine | null>(null);
  const [isPassAndPlay, setIsPassAndPlay] = useState<boolean>(false);

  // Pass and Play setup queue
  const [passPlayerNames, setPassPlayerNames] = useState<string[]>([]);
  const [passSetupIndex, setPassSetupIndex] = useState<number>(0);
  const [passBoards, setPassBoards] = useState<Map<number, number[]>>(new Map());

  // Real-time Reaction Toast
  const [reactionToast, setReactionToast] = useState<{ playerName: string; emoji: string } | null>(null);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    const socket = socketService.connect();

    const handleRoomUpdated = (updatedRoom: GameRoom) => {
      console.log('Room updated state:', updatedRoom.status);
      setRoom(updatedRoom);

      // Handle transitions
      if (updatedRoom.status === 'setting_board') {
        setCurrentScreen('board_setup');
      } else if (updatedRoom.status === 'playing') {
        setCurrentScreen('game');
      }
    };

    const handleGameStarted = (startedRoom: GameRoom) => {
      setRoom(startedRoom);
      setCurrentScreen('game');
    };

    const handleReaction = (data: { playerName: string; emoji: string }) => {
      setReactionToast(data);
      setTimeout(() => setReactionToast(null), 3000);
    };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('game_started', handleGameStarted);
    socket.on('reaction_received', handleReaction);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
      socket.off('game_started', handleGameStarted);
      socket.off('reaction_received', handleReaction);
    };
  }, []);

  // --- ONLINE HANDLERS ---

  const handleSelectOnline = () => {
    setInitialModeSelect('online');
    setCurrentScreen('mode_select');
  };

  const handleSelectOffline = () => {
    setInitialModeSelect('offline');
    setCurrentScreen('mode_select');
  };

  const handleOnlineRoomJoined = (joinedRoom: GameRoom, playerId: string) => {
    setIsOnline(true);
    setIsPassAndPlay(false);
    setRoom(joinedRoom);
    setMyPlayerId(playerId);

    const me = joinedRoom.players.find((p) => p.id === playerId);
    if (me) setMyPlayerName(me.name);

    if (joinedRoom.status === 'setting_board') {
      setCurrentScreen('board_setup');
    } else {
      setCurrentScreen('online_lobby');
    }
  };

  const handleProceedToBoardSetup = () => {
    if (isOnline && room) {
      socketService.startGame(room.code, myPlayerId);
      setCurrentScreen('board_setup');
    }
  };

  const handleOnlineBoardSubmitted = async (board: number[]) => {
    setMyBoard(board);
    if (isOnline && room) {
      await socketService.setBoard(room.code, myPlayerId, board);
    }
  };

  const handleHostStartGame = async () => {
    if (isOnline && room) {
      await socketService.startGame(room.code, myPlayerId);
    }
  };

  // --- OFFLINE AI HANDLERS ---

  const handleStartOfflineAi = (playerName: string, difficulty: AIDifficulty) => {
    setIsOnline(false);
    setIsPassAndPlay(false);
    setMyPlayerName(playerName);
    setMyPlayerId('offline_player_0');

    // Create AI match after human completes board setup
    setCurrentScreen('board_setup');
  };

  const handleOfflineAiBoardConfirmed = (board: number[]) => {
    setMyBoard(board);

    const boardsMap = new Map<number, number[]>();
    boardsMap.set(0, board);
    boardsMap.set(1, generateRandomBoard()); // AI board

    const engine = new OfflineGameEngine(
      {
        mode: 'ai',
        playerNames: [myPlayerName, '🤖 Smart AI'],
        aiDifficulty: 'medium',
        humanBoards: boardsMap,
      },
      (updatedRoom) => setRoom({ ...updatedRoom })
    );

    setOfflineEngine(engine);
    setRoom(engine.getRoom());
    setCurrentScreen('game');
  };

  // --- OFFLINE PASS & PLAY HANDLERS ---

  const handleStartPassAndPlay = (names: string[]) => {
    setIsOnline(false);
    setIsPassAndPlay(true);
    setPassPlayerNames(names);
    setPassSetupIndex(0);
    setPassBoards(new Map());
    setCurrentScreen('pass_and_play_setup');
  };

  const handlePassAndPlayBoardConfirmed = (board: number[]) => {
    const updatedBoards = new Map(passBoards);
    updatedBoards.set(passSetupIndex, board);
    setPassBoards(updatedBoards);

    if (passSetupIndex + 1 < passPlayerNames.length) {
      // Move to next player in queue
      setPassSetupIndex((prev) => prev + 1);
    } else {
      // All players have configured their boards! Start game
      const engine = new OfflineGameEngine(
        {
          mode: 'pass_and_play',
          playerNames: passPlayerNames,
          humanBoards: updatedBoards,
        },
        (updatedRoom) => setRoom({ ...updatedRoom })
      );

      setOfflineEngine(engine);
      setRoom(engine.getRoom());
      setMyPlayerId(engine.getRoom().players[0].id);
      setMyBoard(updatedBoards.get(0)!);
      setCurrentScreen('game');
    }
  };

  // --- GAME ACTIONS (Turns, Calls, Rematch, Exit) ---

  const handleCallNumber = (num: number) => {
    if (isOnline && room) {
      socketService.callNumber(room.code, myPlayerId, num);
    } else if (offlineEngine) {
      offlineEngine.callNumber(num);
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (isOnline && room) {
      socketService.sendReaction(room.code, myPlayerId, emoji);
    }
  };

  const handleRematch = async () => {
    if (isOnline && room) {
      await socketService.requestRematch(room.code, myPlayerId);
      setCurrentScreen('board_setup');
    } else if (offlineEngine) {
      offlineEngine.restartGame();
    }
  };

  const handleExitMatch = () => {
    if (isOnline && room) {
      socketService.leaveRoom(room.code, myPlayerId);
    }
    setRoom(null);
    setOfflineEngine(null);
    setCurrentScreen('home');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Screen 1: Home */}
      {currentScreen === 'home' && (
        <HomeScreen
          onSelectOnline={handleSelectOnline}
          onSelectOffline={handleSelectOffline}
        />
      )}

      {/* Screen 2: Mode Select (Create / Join / AI / Pass & Play) */}
      {currentScreen === 'mode_select' && (
        <ModeSelectScreen
          initialMode={initialModeSelect}
          onBack={() => setCurrentScreen('home')}
          onOnlineRoomJoined={handleOnlineRoomJoined}
          onStartOfflineAi={handleStartOfflineAi}
          onStartPassAndPlay={handleStartPassAndPlay}
        />
      )}

      {/* Screen 3: Online Lobby */}
      {currentScreen === 'online_lobby' && room && (
        <OnlineLobbyScreen
          room={room}
          myPlayerId={myPlayerId}
          onProceedToBoardSetup={handleProceedToBoardSetup}
          onLeaveRoom={handleExitMatch}
        />
      )}

      {/* Screen 4: Board Setup (Online or Offline AI) */}
      {currentScreen === 'board_setup' && (
        <BoardSetupScreen
          playerName={myPlayerName}
          isOnline={isOnline}
          room={room || undefined}
          myPlayerId={myPlayerId}
          onBoardSubmitted={
            isOnline ? handleOnlineBoardSubmitted : handleOfflineAiBoardConfirmed
          }
          onHostStartGame={handleHostStartGame}
        />
      )}

      {/* Screen 4B: Pass & Play Board Setup Queue */}
      {currentScreen === 'pass_and_play_setup' && (
        <BoardSetupScreen
          key={`pass_setup_${passSetupIndex}`}
          playerName={passPlayerNames[passSetupIndex] || `Player ${passSetupIndex + 1}`}
          isOnline={false}
          onBoardSubmitted={handlePassAndPlayBoardConfirmed}
        />
      )}

      {/* Screen 5: Game Arena */}
      {currentScreen === 'game' && room && (
        <GameScreen
          room={room}
          myPlayerId={myPlayerId}
          myBoard={myBoard}
          isOnline={isOnline}
          isAiThinking={offlineEngine?.isAiThinking || false}
          isPassAndPlay={isPassAndPlay}
          onCallNumber={handleCallNumber}
          onRematch={handleRematch}
          onExit={handleExitMatch}
          onSendReaction={handleSendReaction}
          reactionToast={reactionToast}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

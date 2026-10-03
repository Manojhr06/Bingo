import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { audioEffects } from '../components/AudioEffects';
import { BingoBoard } from '../components/BingoBoard';
import { BingoProgress } from '../components/BingoProgress';
import { TurnIndicator } from '../components/TurnIndicator';
import { CalledNumbersTray } from '../components/CalledNumbersTray';
import { PlayerScoreCard } from '../components/PlayerScoreCard';
import { VictoryModal } from '../components/VictoryModal';
import { PassDeviceModal } from './PassDeviceModal';
import { SettingsModal } from './SettingsModal';
import { GameRoom, Player } from '../types';
import { checkCompletedLines } from '../core/bingoLogic';

interface GameScreenProps {
  room: GameRoom;
  myPlayerId: string;
  myBoard: number[];
  isOnline: boolean;
  isAiThinking?: boolean;
  isPassAndPlay?: boolean;
  onCallNumber: (num: number) => void;
  onRematch: () => void;
  onExit: () => void;
  onSendReaction?: (emoji: string) => void;
  reactionToast?: { playerName: string; emoji: string } | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  myPlayerId,
  myBoard,
  isOnline,
  isAiThinking = false,
  isPassAndPlay = false,
  onCallNumber,
  onRematch,
  onExit,
  onSendReaction,
  reactionToast,
}) => {
  const { theme } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [lastTurnPlayerId, setLastTurnPlayerId] = useState<string | undefined>(
    room.currentTurnPlayerId
  );

  const REACTION_EMOJIS = ['🔥', '😂', '👏', '😱', '🎉', '👑'];

  // Current turn info
  const currentTurnPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  const isMyTurn = isPassAndPlay
    ? true // In pass and play, whoever holds the phone plays the current turn
    : room.currentTurnPlayerId === myPlayerId;

  // Active player's board
  // In Pass & Play, the active player's board is used:
  const activeBoard = isPassAndPlay
    ? currentTurnPlayer?.board || myBoard
    : myBoard;

  // Line calculations for current board
  const lineResult = checkCompletedLines(activeBoard, room.calledNumbers);

  // Sound cue on line complete
  const prevLinesCount = React.useRef(lineResult.count);
  useEffect(() => {
    if (lineResult.count > prevLinesCount.current) {
      audioEffects.playLineComplete();
      prevLinesCount.current = lineResult.count;
    }
  }, [lineResult.count]);

  // Handle Pass & Play handover between turns
  useEffect(() => {
    if (
      isPassAndPlay &&
      room.status === 'playing' &&
      room.currentTurnPlayerId !== lastTurnPlayerId &&
      room.calledNumbers.length > 0
    ) {
      setShowPassModal(true);
      setLastTurnPlayerId(room.currentTurnPlayerId);
    }
  }, [room.currentTurnPlayerId, isPassAndPlay]);

  const handleCellPress = (num: number) => {
    if (!isMyTurn) return;
    audioEffects.playNumberCalled();
    onCallNumber(num);
  };

  const handleLeaveConfirm = () => {
    Alert.alert('Leave Match?', 'Are you sure you want to exit to the main menu?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: onExit },
    ]);
  };

  const winners = room.players.filter((p) => room.winnerPlayerIds.includes(p.id));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleLeaveConfirm}>
          <Text style={[styles.exitBtnText, { color: theme.danger }]}>✕ LEAVE</Text>
        </TouchableOpacity>

        <View style={styles.roomBadge}>
          <Text style={[styles.roomBadgeText, { color: theme.primaryLight }]}>
            {isOnline ? `ROOM: ${room.code}` : isPassAndPlay ? 'PASS & PLAY' : 'VS AI'}
          </Text>
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsVisible(true)}>
          <Text style={styles.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Floating Reaction Toast */}
        {reactionToast && (
          <View style={styles.reactionToastContainer}>
            <Text style={styles.reactionToastEmoji}>{reactionToast.emoji}</Text>
            <Text style={styles.reactionToastText}>{reactionToast.playerName}</Text>
          </View>
        )}

        {/* B-I-N-G-O Progress Bar */}
        <BingoProgress completedLinesCount={lineResult.count} />

        {/* Turn Indicator */}
        <TurnIndicator
          isMyTurn={isMyTurn}
          currentTurnPlayerName={currentTurnPlayer?.name || 'Next Player'}
          isAiThinking={isAiThinking}
        />

        {/* 5x5 Bingo Board */}
        <BingoBoard
          board={activeBoard}
          markedNumbers={room.calledNumbers}
          completedCellIndices={lineResult.completedCellIndices}
          isMyTurn={isMyTurn && !isAiThinking}
          onCellPress={handleCellPress}
          disabled={room.status !== 'playing' || isAiThinking}
        />

        {/* Called Numbers Tray */}
        <CalledNumbersTray calledNumbers={room.calledNumbers} />

        {/* Emoji Reaction Drawer (Online only) */}
        {isOnline && onSendReaction && (
          <View style={styles.reactionsBar}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.emojiBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  audioEffects.playTap();
                  onSendReaction(emoji);
                }}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Players Scoreboard HUD */}
        <PlayerScoreCard
          players={room.players}
          currentTurnPlayerId={room.currentTurnPlayerId}
          myPlayerId={isPassAndPlay ? currentTurnPlayer?.id : myPlayerId}
        />
      </ScrollView>

      {/* Victory Celebration Modal */}
      <VictoryModal
        visible={room.status === 'ended'}
        winners={winners.length > 0 ? winners : [room.players[0]]}
        room={room}
        onRematch={onRematch}
        onExit={onExit}
      />

      {/* Pass Device Modal for Pass & Play */}
      <PassDeviceModal
        visible={showPassModal}
        nextPlayerName={currentTurnPlayer?.name || 'Next Player'}
        onReady={() => setShowPassModal(false)}
      />

      {/* Settings Modal */}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  roomBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E1B4B',
  },
  roomBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  settingsBtn: {
    padding: 6,
  },
  settingsBtnText: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  reactionToastContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 4,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  reactionToastEmoji: {
    fontSize: 22,
  },
  reactionToastText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '800',
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
});

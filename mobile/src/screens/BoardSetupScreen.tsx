import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { ManualBoardBuilder } from '../components/ManualBoardBuilder';
import { audioEffects } from '../components/AudioEffects';
import { GameRoom } from '../types';

interface BoardSetupScreenProps {
  playerName: string;
  onBoardSubmitted: (board: number[]) => void;
  isOnline?: boolean;
  room?: GameRoom;
  myPlayerId?: string;
  onHostStartGame?: () => void;
}

export const BoardSetupScreen: React.FC<BoardSetupScreenProps> = ({
  playerName,
  onBoardSubmitted,
  isOnline = false,
  room,
  myPlayerId,
  onHostStartGame,
}) => {
  const { theme } = useTheme();

  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const me = room?.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost || false;
  const allPlayersReady =
    isOnline && room ? room.players.every((p) => p.isReady) : false;

  const handleConfirm = async (board: number[]) => {
    setSubmitting(true);
    try {
      await onBoardSubmitted(board);
      setHasSubmitted(true);
    } catch (err) {
      audioEffects.playError();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>BOARD SETUP</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Setting board for: <Text style={{ color: theme.primaryLight, fontWeight: '800' }}>{playerName}</Text>
          </Text>
        </View>
      </View>

      {!hasSubmitted ? (
        <ManualBoardBuilder onBoardConfirmed={handleConfirm} />
      ) : (
        /* Waiting Room when submitted in Online Mode */
        <View style={styles.waitingContainer}>
          <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.checkIcon}>✅</Text>
            <Text style={[styles.readyTitle, { color: theme.text }]}>BOARD READY!</Text>
            <Text style={[styles.readySubtitle, { color: theme.textSecondary }]}>
              Your 5×5 arrangement is locked in.
            </Text>

            {isOnline && room ? (
              <View style={styles.readyList}>
                <Text style={[styles.readyListHeader, { color: theme.textSecondary }]}>
                  PLAYER READINESS:
                </Text>
                {room.players.map((p) => (
                  <View key={p.id} style={styles.readyRow}>
                    <Text style={[styles.readyPlayerName, { color: theme.text }]}>
                      {p.name} {p.id === myPlayerId && '(You)'}
                    </Text>
                    <Text style={{ color: p.isReady ? theme.success : theme.warning, fontWeight: '700' }}>
                      {p.isReady ? '✅ READY' : '⏳ SETTING UP...'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {isOnline && isHost && (
              <TouchableOpacity
                style={[
                  styles.hostStartBtn,
                  {
                    backgroundColor: allPlayersReady ? theme.primary : theme.border,
                    opacity: allPlayersReady ? 1 : 0.6,
                  },
                ]}
                disabled={!allPlayersReady}
                onPress={onHostStartGame}
              >
                <Text style={styles.hostStartBtnText}>
                  {allPlayersReady
                    ? '🎮 ALL READY! START GAME NOW'
                    : 'WAITING FOR ALL PLAYERS...'}
                </Text>
              </TouchableOpacity>
            )}

            {isOnline && !isHost && (
              <View style={styles.guestNotice}>
                <ActivityIndicator color={theme.primary} size="small" />
                <Text style={[styles.guestNoticeText, { color: theme.textSecondary }]}>
                  Waiting for host to launch the game...
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  readySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  readyList: {
    width: '100%',
    marginVertical: 20,
    gap: 8,
  },
  readyListHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  readyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  readyPlayerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  hostStartBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  hostStartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guestNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  guestNoticeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

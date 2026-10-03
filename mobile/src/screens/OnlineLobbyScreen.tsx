import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../components/ThemeContext';
import { audioEffects } from '../components/AudioEffects';
import { GameRoom, Player } from '../types';

interface OnlineLobbyScreenProps {
  room: GameRoom;
  myPlayerId: string;
  onProceedToBoardSetup: () => void;
  onLeaveRoom: () => void;
}

export const OnlineLobbyScreen: React.FC<OnlineLobbyScreenProps> = ({
  room,
  myPlayerId,
  onProceedToBoardSetup,
  onLeaveRoom,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState<boolean>(false);

  const me = room.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost || false;
  const canStartSetup = isHost && room.players.length >= 2;

  const handleCopyCode = async () => {
    audioEffects.playTap();
    await Clipboard.setStringAsync(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    audioEffects.playTap();
    try {
      await Share.share({
        message: `Join my Bingo 25 game room with code: ${room.code} !`,
      });
    } catch (e) {}
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.leaveBtn, { borderColor: theme.border }]}
          onPress={onLeaveRoom}
        >
          <Text style={[styles.leaveBtnText, { color: theme.danger }]}>✕ LEAVE</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>ONLINE LOBBY</Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Code Card */}
        <View style={[styles.codeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.codeCardSubtitle, { color: theme.textSecondary }]}>ROOM CODE</Text>
          <Text style={[styles.codeCardValue, { color: theme.primaryLight }]}>{room.code}</Text>

          <View style={styles.codeActionsRow}>
            <TouchableOpacity
              style={[styles.codeActionBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              onPress={handleCopyCode}
            >
              <Text style={[styles.codeActionText, { color: theme.text }]}>
                {copied ? '✅ COPIED!' : '📋 COPY CODE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.codeActionBtn, { backgroundColor: theme.primary }]}
              onPress={handleShare}
            >
              <Text style={[styles.codeActionText, { color: '#FFFFFF' }]}>🔗 SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Players Slot List */}
        <View style={styles.playersSection}>
          <View style={styles.playersHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              CONNECTED PLAYERS ({room.players.length} / {room.maxPlayers})
            </Text>
            {room.players.length < 2 && (
              <Text style={[styles.minNotice, { color: theme.warning }]}>
                Min 2 players required to start
              </Text>
            )}
          </View>

          <View style={styles.slotsList}>
            {/* Joined Players */}
            {room.players.map((p) => {
              const isThisPlayerMe = p.id === myPlayerId;
              return (
                <View
                  key={p.id}
                  style={[
                    styles.playerSlot,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isThisPlayerMe ? theme.primaryLight : theme.border,
                      borderWidth: isThisPlayerMe ? 1.5 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: p.avatarColor || theme.primary },
                    ]}
                  >
                    <Text style={styles.avatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.nameBadgeRow}>
                      <Text
                        style={[
                          styles.playerName,
                          { color: theme.text, fontWeight: isThisPlayerMe ? '800' : '600' },
                        ]}
                      >
                        {p.name} {isThisPlayerMe && '(You)'}
                      </Text>
                      {p.isHost && (
                        <View style={styles.hostPill}>
                          <Text style={styles.hostPillText}>👑 HOST</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.readyStatus,
                        { color: p.isReady ? theme.success : theme.textMuted },
                      ]}
                    >
                      {p.isReady ? 'Ready for game' : 'Waiting in lobby'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: p.connected ? theme.success : theme.danger },
                    ]}
                  />
                </View>
              );
            })}

            {/* Empty Slots */}
            {Array.from(
              { length: Math.max(0, room.maxPlayers - room.players.length) },
              (_, i) => (
                <View
                  key={`empty_${i}`}
                  style={[
                    styles.emptySlot,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.emptySlotIcon, { color: theme.textMuted }]}>👤</Text>
                  <Text style={[styles.emptySlotText, { color: theme.textMuted }]}>
                    Waiting for player to join...
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Start / Proceed Button */}
        {isHost ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.startSetupBtn,
              {
                backgroundColor: canStartSetup ? theme.primary : theme.border,
                opacity: canStartSetup ? 1 : 0.6,
              },
            ]}
            disabled={!canStartSetup}
            onPress={() => {
              audioEffects.playNumberCalled();
              onProceedToBoardSetup();
            }}
          >
            <Text style={styles.startSetupBtnText}>
              {canStartSetup
                ? 'PROCEED TO BOARD SETUP →'
                : 'WAITING FOR 2ND PLAYER TO JOIN...'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.guestWaitingBox, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.guestWaitingText, { color: theme.textSecondary }]}>
              ⏳ Waiting for Host to proceed to board setup...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  leaveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  codeCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    marginVertical: 12,
  },
  codeCardSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  codeCardValue: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    marginVertical: 6,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  codeActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeActionText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playersSection: {
    width: '100%',
    maxWidth: 400,
    marginTop: 10,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  minNotice: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotsList: {
    gap: 10,
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  playerInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 14,
  },
  hostPill: {
    backgroundColor: '#78350F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostPillText: {
    color: '#FDE68A',
    fontSize: 9,
    fontWeight: '800',
  },
  readyStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptySlotIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  emptySlotText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  startSetupBtn: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  startSetupBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  guestWaitingBox: {
    width: '100%',
    maxWidth: 400,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  guestWaitingText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

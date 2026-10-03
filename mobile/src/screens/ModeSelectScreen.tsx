import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { audioEffects } from '../components/AudioEffects';
import { socketService } from '../services/socketService';
import { GameRoom, AIDifficulty } from '../types';

interface ModeSelectScreenProps {
  initialMode: 'online' | 'offline';
  onBack: () => void;
  onOnlineRoomJoined: (room: GameRoom, playerId: string) => void;
  onStartOfflineAi: (playerName: string, difficulty: AIDifficulty) => void;
  onStartPassAndPlay: (playerNames: string[]) => void;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({
  initialMode,
  onBack,
  onOnlineRoomJoined,
  onStartOfflineAi,
  onStartPassAndPlay,
}) => {
  const { theme } = useTheme();

  const [mode, setMode] = useState<'online' | 'offline'>(initialMode);

  // Online Form State
  const [onlineTab, setOnlineTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [onlineLoading, setOnlineLoading] = useState<boolean>(false);
  const [onlineError, setOnlineError] = useState<string>('');

  // Offline AI Form State
  const [offlineTab, setOfflineTab] = useState<'ai' | 'pass_and_play'>('ai');
  const [aiPlayerName, setAiPlayerName] = useState<string>('Player');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');

  // Pass & Play Form State
  const [passCount, setPassCount] = useState<number>(2);
  const [passNames, setPassNames] = useState<string[]>([
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);

  // --- ONLINE HANDLERS ---

  const handleCreateRoom = async () => {
    audioEffects.playTap();
    setOnlineError('');
    setOnlineLoading(true);

    try {
      if (!socketService.isConnected) {
        socketService.connect();
        // Give socket a second to establish handshake
        await new Promise((r) => setTimeout(r, 600));
      }

      const res = await socketService.createRoom(playerName.trim() || 'Player 1', maxPlayers);
      audioEffects.playNumberCalled();
      onOnlineRoomJoined(res.room, res.playerId);
    } catch (err: any) {
      setOnlineError(err.message || 'Failed to create room. Is the server running?');
      audioEffects.playError();
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    audioEffects.playTap();
    setOnlineError('');

    const cleanCode = roomCodeInput.toUpperCase().trim();
    if (!cleanCode || cleanCode.length < 4) {
      setOnlineError('Please enter a valid 5-character room code.');
      audioEffects.playError();
      return;
    }

    setOnlineLoading(true);

    try {
      if (!socketService.isConnected) {
        socketService.connect();
        await new Promise((r) => setTimeout(r, 600));
      }

      const res = await socketService.joinRoom(cleanCode, playerName.trim() || 'Player');
      audioEffects.playNumberCalled();
      onOnlineRoomJoined(res.room, res.playerId);
    } catch (err: any) {
      setOnlineError(err.message || 'Room not found or game already in progress.');
      audioEffects.playError();
    } finally {
      setOnlineLoading(false);
    }
  };

  // --- OFFLINE HANDLERS ---

  const handleStartAi = () => {
    audioEffects.playTap();
    onStartOfflineAi(aiPlayerName.trim() || 'Player', aiDifficulty);
  };

  const handleStartPassAndPlay = () => {
    audioEffects.playTap();
    const activeNames = passNames.slice(0, passCount).map((n, i) => n.trim() || `Player ${i + 1}`);
    onStartPassAndPlay(activeNames);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          onPress={onBack}
        >
          <Text style={[styles.backBtnText, { color: theme.text }]}>← BACK</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {mode === 'online' ? 'ONLINE MULTIPLAYER' : 'OFFLINE MODE'}
        </Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ONLINE MODE UI */}
        {mode === 'online' ? (
          <View style={styles.formContainer}>
            {/* Create vs Join Tabs */}
            <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  onlineTab === 'create' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setOnlineTab('create')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: onlineTab === 'create' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  Create Room
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  onlineTab === 'join' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setOnlineTab('join')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: onlineTab === 'join' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  Join with Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* Player Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>YOUR DISPLAY NAME</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={18}
                placeholder="Enter your name"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {onlineTab === 'create' ? (
              <>
                {/* Max Players Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    MAX PLAYERS (2 – 4)
                  </Text>
                  <View style={styles.countSelector}>
                    {[2, 3, 4].map((count) => (
                      <TouchableOpacity
                        key={`max_${count}`}
                        style={[
                          styles.countBtn,
                          {
                            backgroundColor:
                              maxPlayers === count ? theme.primary : theme.surface,
                            borderColor:
                              maxPlayers === count ? theme.primaryLight : theme.border,
                          },
                        ]}
                        onPress={() => {
                          audioEffects.playTap();
                          setMaxPlayers(count);
                        }}
                      >
                        <Text
                          style={[
                            styles.countBtnText,
                            { color: maxPlayers === count ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {count} Players
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {onlineError ? (
                  <Text style={[styles.errorText, { color: theme.danger }]}>{onlineError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  disabled={onlineLoading}
                  onPress={handleCreateRoom}
                >
                  {onlineLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>CREATE ROOM & GET CODE</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Room Code Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    5-CHARACTER ROOM CODE
                  </Text>
                  <TextInput
                    style={[
                      styles.codeLargeInput,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.primaryLight,
                      },
                    ]}
                    value={roomCodeInput}
                    onChangeText={(val) => setRoomCodeInput(val.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="e.g. 7BG4K"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                {onlineError ? (
                  <Text style={[styles.errorText, { color: theme.danger }]}>{onlineError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  disabled={onlineLoading}
                  onPress={handleJoinRoom}
                >
                  {onlineLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>JOIN ROOM</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          /* OFFLINE MODE UI */
          <View style={styles.formContainer}>
            {/* Sub-mode switch */}
            <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  offlineTab === 'ai' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setOfflineTab('ai')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: offlineTab === 'ai' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  🤖 vs AI Player
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  offlineTab === 'pass_and_play' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setOfflineTab('pass_and_play')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: offlineTab === 'pass_and_play' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  📱 Pass & Play
                </Text>
              </TouchableOpacity>
            </View>

            {offlineTab === 'ai' ? (
              <>
                {/* AI Player Settings */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>YOUR NAME</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={aiPlayerName}
                    onChangeText={setAiPlayerName}
                    maxLength={18}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    AI DIFFICULTY
                  </Text>
                  <View style={styles.countSelector}>
                    {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                      <TouchableOpacity
                        key={diff}
                        style={[
                          styles.countBtn,
                          {
                            backgroundColor:
                              aiDifficulty === diff ? theme.primary : theme.surface,
                            borderColor:
                              aiDifficulty === diff ? theme.primaryLight : theme.border,
                          },
                        ]}
                        onPress={() => {
                          audioEffects.playTap();
                          setAiDifficulty(diff);
                        }}
                      >
                        <Text
                          style={[
                            styles.countBtnText,
                            {
                              color: aiDifficulty === diff ? '#FFFFFF' : theme.text,
                              textTransform: 'capitalize',
                            },
                          ]}
                        >
                          {diff}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleStartAi}
                >
                  <Text style={styles.actionBtnText}>PROCEED TO BOARD SETUP →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Pass & Play Settings */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    NUMBER OF PLAYERS
                  </Text>
                  <View style={styles.countSelector}>
                    {[2, 3, 4].map((cnt) => (
                      <TouchableOpacity
                        key={`pass_${cnt}`}
                        style={[
                          styles.countBtn,
                          {
                            backgroundColor:
                              passCount === cnt ? theme.primary : theme.surface,
                            borderColor:
                              passCount === cnt ? theme.primaryLight : theme.border,
                          },
                        ]}
                        onPress={() => {
                          audioEffects.playTap();
                          setPassCount(cnt);
                        }}
                      >
                        <Text
                          style={[
                            styles.countBtnText,
                            { color: passCount === cnt ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {cnt} Players
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Player Names Inputs */}
                {Array.from({ length: passCount }, (_, i) => (
                  <View key={`player_name_${i}`} style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      PLAYER {i + 1} NAME
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                      value={passNames[i]}
                      onChangeText={(val) => {
                        const updated = [...passNames];
                        updated[i] = val;
                        setPassNames(updated);
                      }}
                      maxLength={18}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleStartPassAndPlay}
                >
                  <Text style={styles.actionBtnText}>PROCEED TO BOARD SETUP →</Text>
                </TouchableOpacity>
              </>
            )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  formContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  codeLargeInput: {
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
  },
  countSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  countBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  countBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import { Player } from '../types';
import { BINGO_LETTERS, BINGO_LETTER_COLORS } from '../core/bingoLogic';

interface PlayerScoreCardProps {
  players: Player[];
  currentTurnPlayerId?: string;
  myPlayerId?: string;
}

export const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  players,
  currentTurnPlayerId,
  myPlayerId,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {players.map((p) => {
        const isCurrentTurn = p.id === currentTurnPlayerId;
        const isMe = p.id === myPlayerId;

        return (
          <View
            key={p.id}
            style={[
              styles.playerRow,
              {
                backgroundColor: theme.surface,
                borderColor: isCurrentTurn ? theme.primaryLight : theme.border,
                borderWidth: isCurrentTurn ? 2 : 1,
              },
            ]}
          >
            {/* Avatar */}
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: p.avatarColor || theme.primary,
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {p.name.charAt(0).toUpperCase()}
              </Text>
              {/* Online status indicator */}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: p.connected ? theme.success : theme.danger },
                ]}
              />
            </View>

            {/* Name & Role */}
            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.playerName,
                    {
                      color: theme.text,
                      fontWeight: isCurrentTurn ? '800' : '600',
                    },
                  ]}
                >
                  {p.name} {isMe && '(You)'}
                </Text>
                {p.isHost && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>👑 HOST</Text>
                  </View>
                )}
              </View>

              {/* B-I-N-G-O letters preview */}
              <View style={styles.miniBingoRow}>
                {BINGO_LETTERS.map((letter, idx) => {
                  const hasLetter = idx < p.completedLinesCount;
                  const color = BINGO_LETTER_COLORS[letter];
                  return (
                    <View
                      key={letter}
                      style={[
                        styles.miniLetter,
                        {
                          backgroundColor: hasLetter ? color : theme.surfaceElevated,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.miniLetterText,
                          {
                            color: hasLetter ? '#FFFFFF' : theme.textMuted,
                            fontWeight: hasLetter ? '800' : '500',
                          },
                        ]}
                      >
                        {letter}
                      </Text>
                    </View>
                  );
                })}
                <Text style={[styles.linesCountText, { color: theme.textSecondary }]}>
                  {p.completedLinesCount} / 5
                </Text>
              </View>
            </View>

            {/* Turn Tag */}
            {isCurrentTurn && (
              <View style={[styles.turnTag, { backgroundColor: theme.primary }]}>
                <Text style={styles.turnTagText}>TURN</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    gap: 6,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0B0F19',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 13,
    maxWidth: 160,
  },
  hostBadge: {
    backgroundColor: '#78350F',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hostBadgeText: {
    color: '#FDE68A',
    fontSize: 9,
    fontWeight: '800',
  },
  miniBingoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  miniLetter: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLetterText: {
    fontSize: 9,
  },
  linesCountText: {
    fontSize: 11,
    marginLeft: 6,
    fontWeight: '600',
  },
  turnTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  turnTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

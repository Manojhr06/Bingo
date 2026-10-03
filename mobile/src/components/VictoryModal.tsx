import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Player, GameRoom } from '../types';
import { audioEffects } from './AudioEffects';

interface VictoryModalProps {
  visible: boolean;
  winners: Player[];
  room: GameRoom;
  onRematch: () => void;
  onExit: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  visible,
  winners,
  room,
  onRematch,
  onExit,
}) => {
  const { theme } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Scale and bounce animation for the trophy and modal card
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Confetti particles: 16 animated floating dots
  const particleAnims = useRef(
    Array.from({ length: 16 }, () => ({
      y: new Animated.Value(-20),
      x: Math.random() * screenWidth - screenWidth / 2,
      opacity: new Animated.Value(1),
      color: ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][
        Math.floor(Math.random() * 6)
      ],
      size: Math.floor(Math.random() * 8) + 6,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      audioEffects.playBingoWin();

      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start confetti drop
      particleAnims.forEach((p, idx) => {
        p.y.setValue(-20);
        p.opacity.setValue(1);
        Animated.sequence([
          Animated.delay(idx * 60),
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: screenHeight * 0.8,
              duration: 2200 + Math.random() * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: 2400,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const winnerNames = winners.map((w) => w.name).join(' & ');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Confetti Particles */}
        {particleAnims.map((p, idx) => (
          <Animated.View
            key={`particle_${idx}`}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateY: p.y },
                  { translateX: p.x },
                ],
              },
            ]}
          />
        ))}

        {/* Modal Card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Trophy Header */}
          <View style={styles.trophyCircle}>
            <Text style={styles.trophyIcon}>🏆</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>B-I-N-G-O !</Text>
          <Text style={[styles.winnerName, { color: theme.primaryLight }]}>
            {winnerNames} {winners.length > 1 ? 'TIE FOR VICTORY!' : 'WINS!'}
          </Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Completed 5 Bingo lines first!
          </Text>

          {/* Match Stats */}
          <View style={[styles.statsBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{room.calledNumbers.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Numbers Called</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {winners[0]?.completedLinesCount || 5}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Lines Made</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{room.players.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Players</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.rematchBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                audioEffects.playTap();
                onRematch();
              }}
            >
              <Text style={styles.rematchBtnText}>🔄 PLAY AGAIN / REMATCH</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.exitBtn, { borderColor: theme.border }]}
              onPress={() => {
                audioEffects.playTap();
                onExit();
              }}
            >
              <Text style={[styles.exitBtnText, { color: theme.textSecondary }]}>EXIT TO HOME</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  particle: {
    position: 'absolute',
    top: 50,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#818CF8',
    marginBottom: 16,
  },
  trophyIcon: {
    fontSize: 42,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  winnerName: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    marginVertical: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#334155',
  },
  buttonStack: {
    width: '100%',
    gap: 10,
  },
  rematchBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  rematchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  exitBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  exitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

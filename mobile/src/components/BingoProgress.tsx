import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeContext';
import { BINGO_LETTERS, BINGO_LETTER_COLORS } from '../core/bingoLogic';

interface BingoProgressProps {
  completedLinesCount: number;
}

export const BingoProgress: React.FC<BingoProgressProps> = ({ completedLinesCount }) => {
  const { theme } = useTheme();

  // Animation values for each of the 5 letters
  const animValues = useRef(BINGO_LETTERS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // When a new letter is unlocked, trigger a bounce animation on that letter
    const activeIndex = Math.min(BINGO_LETTERS.length - 1, completedLinesCount - 1);
    if (activeIndex >= 0) {
      Animated.sequence([
        Animated.timing(animValues[activeIndex], {
          toValue: 1.35,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(animValues[activeIndex], {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [completedLinesCount]);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>BINGO PROGRESS</Text>
        <Text style={[styles.subtitle, { color: completedLinesCount >= 5 ? theme.success : theme.primaryLight }]}>
          {completedLinesCount >= 5
            ? '🏆 B-I-N-G-O ACHIEVED!'
            : `${Math.min(5, completedLinesCount)} / 5 Lines Completed`}
        </Text>
      </View>

      <View style={styles.lettersRow}>
        {BINGO_LETTERS.map((letter, index) => {
          const isCompleted = index < completedLinesCount;
          const letterColor = BINGO_LETTER_COLORS[letter] || theme.primary;

          return (
            <Animated.View
              key={letter}
              style={[
                styles.letterBadge,
                {
                  transform: [{ scale: animValues[index] }],
                  backgroundColor: isCompleted ? letterColor : theme.surfaceElevated,
                  borderColor: isCompleted ? letterColor : theme.border,
                  shadowColor: isCompleted ? letterColor : 'transparent',
                  shadowOpacity: isCompleted ? 0.6 : 0,
                  shadowRadius: 8,
                  elevation: isCompleted ? 6 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.letterText,
                  {
                    color: isCompleted ? '#FFFFFF' : theme.textMuted,
                    fontWeight: isCompleted ? '900' : '600',
                  },
                ]}
              >
                {letter}
              </Text>
              {isCompleted && (
                <View style={styles.activeDot} />
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  lettersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  letterBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  letterText: {
    fontSize: 22,
    letterSpacing: 0.5,
  },
  activeDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

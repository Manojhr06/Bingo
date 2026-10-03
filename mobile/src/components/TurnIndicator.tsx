import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeContext';

interface TurnIndicatorProps {
  isMyTurn: boolean;
  currentTurnPlayerName: string;
  isAiThinking?: boolean;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  isMyTurn,
  currentTurnPlayerName,
  isAiThinking = false,
}) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isMyTurn || isAiThinking) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isMyTurn, isAiThinking]);

  let bannerBg = theme.surface;
  let borderColor = theme.border;
  let textColor = theme.text;
  let subtitleColor = theme.textSecondary;
  let title = `Waiting for ${currentTurnPlayerName}...`;
  let subtitle = 'Watch for numbers to mark on your board';

  if (isAiThinking) {
    bannerBg = '#312E81'; // Deep indigo
    borderColor = '#6366F1';
    textColor = '#FFFFFF';
    subtitleColor = '#C7D2FE';
    title = '🤖 AI is analyzing board...';
    subtitle = 'Deciding optimal strategic move';
  } else if (isMyTurn) {
    bannerBg = '#064E3B'; // Deep emerald
    borderColor = '#10B981';
    textColor = '#FFFFFF';
    subtitleColor = '#A7F3D0';
    title = '🎯 YOUR TURN!';
    subtitle = 'Tap any uncalled number on your board to call it';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bannerBg,
          borderColor: borderColor,
          transform: [{ scale: pulseAnim }],
          shadowColor: isMyTurn ? '#10B981' : isAiThinking ? '#6366F1' : 'transparent',
          shadowOpacity: isMyTurn || isAiThinking ? 0.4 : 0,
          shadowRadius: 8,
          elevation: isMyTurn ? 4 : 1,
        },
      ]}
    >
      <Text style={[styles.mainText, { color: textColor }]}>{title}</Text>
      <Text style={[styles.subText, { color: subtitleColor }]}>{subtitle}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});

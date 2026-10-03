import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';

interface CalledNumbersTrayProps {
  calledNumbers: number[];
}

export const CalledNumbersTray: React.FC<CalledNumbersTrayProps> = ({ calledNumbers }) => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const lastCalled = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;

  // Auto-scroll to latest number when a new one is called
  useEffect(() => {
    if (calledNumbers.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [calledNumbers.length]);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>
          CALLED NUMBERS ({calledNumbers.length}/25)
        </Text>
        {lastCalled !== null && (
          <View style={styles.lastCalledBadge}>
            <Text style={styles.lastCalledLabel}>LATEST: </Text>
            <Text style={styles.lastCalledNumber}>{lastCalled}</Text>
          </View>
        )}
      </View>

      {calledNumbers.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No numbers called yet. First player to call starts!
        </Text>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {calledNumbers.map((num, idx) => {
            const isLatest = idx === calledNumbers.length - 1;
            return (
              <View
                key={`called_${idx}_${num}`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isLatest ? theme.primary : theme.surfaceElevated,
                    borderColor: isLatest ? theme.primaryLight : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isLatest ? '#FFFFFF' : theme.text,
                      fontWeight: isLatest ? '800' : '600',
                    },
                  ]}
                >
                  {num}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lastCalledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  lastCalledLabel: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '700',
  },
  lastCalledNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  scrollList: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
  },
});

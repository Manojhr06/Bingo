import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { audioEffects } from './AudioEffects';

interface BingoBoardProps {
  board: number[]; // 25 numbers
  markedNumbers: number[];
  completedCellIndices?: number[];
  isMyTurn: boolean;
  onCellPress: (num: number) => void;
  disabled?: boolean;
}

export const BingoBoard: React.FC<BingoBoardProps> = ({
  board,
  markedNumbers,
  completedCellIndices = [],
  isMyTurn,
  onCellPress,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Compute responsive cell size
  const boardPadding = 16;
  const boardGap = 8;
  const availableWidth = Math.min(screenWidth - boardPadding * 2, 420);
  const cellSize = Math.floor((availableWidth - boardGap * 4) / 5);

  const markedSet = new Set(markedNumbers);
  const completedSet = new Set(completedCellIndices);

  const handlePress = (num: number) => {
    if (disabled || !isMyTurn || markedSet.has(num)) return;
    audioEffects.playTap();
    onCellPress(num);
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.gridContainer,
          {
            width: availableWidth,
            gap: boardGap,
          },
        ]}
      >
        {board.map((num, index) => {
          const isMarked = markedSet.has(num);
          const isCompletedLine = completedSet.has(index);
          const isClickable = !disabled && isMyTurn && !isMarked;

          // Determine cell styling
          let cellBg = theme.cellDefault;
          let textColor = theme.cellDefaultText;
          let borderColor = theme.border;
          let borderWidth = 1;

          if (isCompletedLine) {
            cellBg = isMarked ? '#059669' : '#047857'; // Vibrant emerald
            textColor = '#FFFFFF';
            borderColor = '#34D399';
            borderWidth = 2.5;
          } else if (isMarked) {
            cellBg = theme.cellMarked;
            textColor = theme.cellMarkedText;
            borderColor = theme.primaryLight;
            borderWidth = 1.5;
          } else if (isClickable) {
            borderColor = theme.primaryLight;
            borderWidth = 1.5;
          }

          return (
            <TouchableOpacity
              key={`${index}_${num}`}
              activeOpacity={isClickable ? 0.7 : 1}
              onPress={() => handlePress(num)}
              disabled={!isClickable}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: cellBg,
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                  shadowColor: isCompletedLine ? '#10B981' : isMarked ? theme.primary : '#000',
                  shadowOpacity: isCompletedLine ? 0.5 : isMarked ? 0.3 : 0.1,
                  shadowRadius: isCompletedLine ? 6 : 3,
                  elevation: isCompletedLine ? 5 : isMarked ? 3 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  {
                    color: textColor,
                    fontSize: cellSize > 56 ? 20 : 17,
                    fontWeight: isMarked || isCompletedLine ? '800' : '600',
                  },
                ]}
              >
                {num}
              </Text>

              {isCompletedLine && (
                <View style={styles.strikeGlow} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellText: {
    letterSpacing: 0.3,
  },
  strikeGlow: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
});

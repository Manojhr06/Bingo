import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from './ThemeContext';
import {
  generateRandomBoard,
  validateBoard,
  TOTAL_NUMBERS,
} from '../core/bingoLogic';
import { audioEffects } from './AudioEffects';

interface ManualBoardBuilderProps {
  onBoardConfirmed: (board: number[]) => void;
  initialBoard?: number[];
}

export const ManualBoardBuilder: React.FC<ManualBoardBuilderProps> = ({
  onBoardConfirmed,
  initialBoard,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Board state: array of 25 numbers (0 indicates empty in scratch mode)
  const [board, setBoard] = useState<number[]>(() => {
    return initialBoard && initialBoard.length === 25
      ? [...initialBoard]
      : generateRandomBoard();
  });

  // Selected cell index for tap-to-swap
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Setup mode: 'quick_shuffle' vs 'manual_arrange'
  const [activeTab, setActiveTab] = useState<'random' | 'manual'>('random');

  const availableWidth = Math.min(screenWidth - 32, 420);
  const cellSize = Math.floor((availableWidth - 32) / 5);

  // Calculate unplaced numbers (for scratch manual builder)
  const placedNumbers = new Set(board.filter((n) => n > 0));
  const unplacedNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).filter(
    (n) => !placedNumbers.has(n)
  );

  const validation = validateBoard(board);

  // --- ACTIONS ---

  const handleShuffle = () => {
    audioEffects.playTap();
    setBoard(generateRandomBoard());
    setSelectedIndex(null);
  };

  const handleClear = () => {
    audioEffects.playTap();
    setBoard(new Array(TOTAL_NUMBERS).fill(0));
    setSelectedIndex(null);
  };

  const handleAutoFillRemaining = () => {
    audioEffects.playTap();
    const currentBoard = [...board];
    const needed = [...unplacedNumbers];

    // Shuffle needed numbers
    for (let i = needed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [needed[i], needed[j]] = [needed[j], needed[i]];
    }

    let neededIdx = 0;
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] === 0 && neededIdx < needed.length) {
        currentBoard[i] = needed[neededIdx++];
      }
    }

    setBoard(currentBoard);
    setSelectedIndex(null);
  };

  const handleCellPress = (index: number) => {
    audioEffects.playTap();

    if (selectedIndex === null) {
      // First selection: select this cell
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      // Deselect
      setSelectedIndex(null);
    } else {
      // Swap cell at selectedIndex with cell at index!
      const newBoard = [...board];
      const temp = newBoard[selectedIndex];
      newBoard[selectedIndex] = newBoard[index];
      newBoard[index] = temp;
      setBoard(newBoard);
      setSelectedIndex(null);
    }
  };

  const handleBankChipPress = (num: number) => {
    audioEffects.playTap();

    // If a cell is currently selected, place the number there
    if (selectedIndex !== null) {
      const newBoard = [...board];
      newBoard[selectedIndex] = num;
      setBoard(newBoard);
      setSelectedIndex(null);
      return;
    }

    // Otherwise place in the first empty cell
    const firstEmptyIndex = board.findIndex((n) => n === 0);
    if (firstEmptyIndex !== -1) {
      const newBoard = [...board];
      newBoard[firstEmptyIndex] = num;
      setBoard(newBoard);
    }
  };

  const handleConfirm = () => {
    if (!validation.valid) {
      audioEffects.playError();
      return;
    }
    audioEffects.playNumberCalled();
    onBoardConfirmed(board);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Mode Switch Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'random' && { backgroundColor: theme.primary },
          ]}
          onPress={() => {
            setActiveTab('random');
            if (!validation.valid) handleShuffle();
          }}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'random' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            🎲 Random Board
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'manual' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveTab('manual')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'manual' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            ✏️ Manual Arrange
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.tipBox}>
        <Text style={[styles.tipText, { color: theme.textSecondary }]}>
          {activeTab === 'random'
            ? 'Instant random arrangement of numbers 1–25. Tap Shuffle to re-roll.'
            : 'Tap two cells to swap their positions, or pick numbers from the tray below.'}
        </Text>
      </View>

      {/* 5x5 Grid */}
      <View
        style={[
          styles.gridContainer,
          {
            width: availableWidth,
            gap: 8,
          },
        ]}
      >
        {board.map((num, idx) => {
          const isSelected = selectedIndex === idx;
          const isEmpty = num === 0;

          return (
            <TouchableOpacity
              key={`setup_${idx}`}
              activeOpacity={0.7}
              onPress={() => handleCellPress(idx)}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: isSelected
                    ? '#4F46E5'
                    : isEmpty
                    ? theme.surfaceElevated
                    : theme.cellDefault,
                  borderColor: isSelected
                    ? '#F59E0B' // Amber highlight
                    : isEmpty
                    ? theme.border
                    : theme.primaryLight,
                  borderWidth: isSelected ? 2.5 : 1,
                  shadowColor: isSelected ? '#F59E0B' : '#000',
                  shadowOpacity: isSelected ? 0.6 : 0.1,
                  shadowRadius: isSelected ? 6 : 2,
                  elevation: isSelected ? 5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  {
                    color: isSelected ? '#FFFFFF' : isEmpty ? theme.textMuted : theme.text,
                    fontSize: cellSize > 56 ? 20 : 17,
                    fontWeight: isEmpty ? '400' : '700',
                  },
                ]}
              >
                {isEmpty ? '·' : num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Bar */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.smallBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          onPress={handleShuffle}
        >
          <Text style={[styles.smallBtnText, { color: theme.text }]}>🔀 Shuffle</Text>
        </TouchableOpacity>

        {activeTab === 'manual' && unplacedNumbers.length > 0 && (
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={handleAutoFillRemaining}
          >
            <Text style={[styles.smallBtnText, { color: theme.primaryLight }]}>✨ Auto Fill</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'manual' && (
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={handleClear}
          >
            <Text style={[styles.smallBtnText, { color: theme.danger }]}>🗑️ Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Number Bank (Only shown if manual mode has unplaced numbers) */}
      {activeTab === 'manual' && unplacedNumbers.length > 0 && (
        <View style={[styles.bankContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.bankTitle, { color: theme.textSecondary }]}>
            AVAILABLE NUMBERS ({unplacedNumbers.length} REMAINING):
          </Text>
          <View style={styles.bankChipsRow}>
            {unplacedNumbers.map((num) => (
              <TouchableOpacity
                key={`bank_${num}`}
                style={[styles.chip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                onPress={() => handleBankChipPress(num)}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Validation status badge */}
      <View style={styles.statusBox}>
        {validation.valid ? (
          <Text style={[styles.validText, { color: theme.success }]}>
            ✅ Board Ready! All 25 numbers arranged.
          </Text>
        ) : (
          <Text style={[styles.invalidText, { color: theme.warning }]}>
            ⚠️ {validation.reason || `${25 - unplacedNumbers.length}/25 placed`}
          </Text>
        )}
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          {
            backgroundColor: validation.valid ? theme.primary : theme.border,
            opacity: validation.valid ? 1 : 0.6,
          },
        ]}
        disabled={!validation.valid}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmBtnText}>CONFIRM BOARD & READY UP</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginVertical: 12,
    width: '100%',
    maxWidth: 420,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tipBox: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  tipText: {
    fontSize: 13,
    textAlign: 'center',
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
  },
  cellText: {
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bankContainer: {
    width: '100%',
    maxWidth: 420,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  bankTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bankChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBox: {
    marginTop: 14,
    marginBottom: 16,
  },
  validText: {
    fontSize: 14,
    fontWeight: '700',
  },
  invalidText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    width: '100%',
    maxWidth: 420,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

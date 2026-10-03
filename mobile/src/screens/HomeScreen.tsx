import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { audioEffects } from '../components/AudioEffects';
import { BINGO_LETTERS, BINGO_LETTER_COLORS } from '../core/bingoLogic';
import { SettingsModal } from './SettingsModal';

interface HomeScreenProps {
  onSelectOnline: () => void;
  onSelectOffline: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectOnline,
  onSelectOffline,
}) => {
  const { theme } = useTheme();
  const [rulesVisible, setRulesVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.badge25}>
          <Text style={styles.badge25Text}>5×5 GRID</Text>
        </View>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          onPress={() => {
            audioEffects.playTap();
            setSettingsVisible(true);
          }}
        >
          <Text style={styles.iconBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Brand Logo Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoRow}>
            {BINGO_LETTERS.map((letter) => (
              <View
                key={letter}
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: BINGO_LETTER_COLORS[letter],
                    shadowColor: BINGO_LETTER_COLORS[letter],
                  },
                ]}
              >
                <Text style={styles.logoLetter}>{letter}</Text>
              </View>
            ))}
          </View>

          <View style={styles.titleRow}>
            <Text style={[styles.title25, { color: theme.text }]}>25</Text>
            <View style={styles.editionPill}>
              <Text style={styles.editionText}>MOBILE EDITION</Text>
            </View>
          </View>

          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            The classic 5×5 number game. Arrange numbers 1–25, call numbers in real-time, and complete B-I-N-G-O!
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.menuSection}>
          {/* Online Multiplayer Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.primaryCard,
              {
                backgroundColor: '#1E1B4B', // Deep indigo
                borderColor: '#6366F1',
              },
            ]}
            onPress={() => {
              audioEffects.playTap();
              onSelectOnline();
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🌐</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>REAL-TIME</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Online Multiplayer</Text>
            <Text style={styles.cardDescription}>
              Create a room, share a 5-letter code, and play live with 2 to 4 friends across devices.
            </Text>
          </TouchableOpacity>

          {/* Offline Mode Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.secondaryCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => {
              audioEffects.playTap();
              onSelectOffline();
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🎮</Text>
              <View style={[styles.cardBadge, { backgroundColor: '#064E3B' }]}>
                <Text style={[styles.cardBadgeText, { color: '#6EE7B7' }]}>NO INTERNET</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Offline Mode</Text>
            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              Play against Easy, Medium, or Hard AI, or pass the device with 2–4 local players.
            </Text>
          </TouchableOpacity>

          {/* How to Play Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.rulesBtn, { borderColor: theme.border }]}
            onPress={() => {
              audioEffects.playTap();
              setRulesVisible(true);
            }}
          >
            <Text style={[styles.rulesBtnText, { color: theme.textSecondary }]}>
              📖 How to Play Bingo 25
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Rules Modal */}
      <Modal visible={rulesVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.rulesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.rulesHeader}>
              <Text style={[styles.rulesTitle, { color: theme.text }]}>HOW TO PLAY BINGO 25</Text>
              <TouchableOpacity onPress={() => setRulesVisible(false)}>
                <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.rulesScroll}>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>1</Text>
                <View style={styles.ruleTextContainer}>
                  <Text style={[styles.ruleHeading, { color: theme.text }]}>5×5 Board Setup</Text>
                  <Text style={[styles.ruleBody, { color: theme.textSecondary }]}>
                    Each player arranges numbers 1 through 25 on their 5×5 grid. You can pick an instant random arrangement or manually arrange them.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>2</Text>
                <View style={styles.ruleTextContainer}>
                  <Text style={[styles.ruleHeading, { color: theme.text }]}>Turn-Based Calling</Text>
                  <Text style={[styles.ruleBody, { color: theme.textSecondary }]}>
                    Players take turns calling an uncalled number. When a number is called, ALL players mark that number on their own board.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>3</Text>
                <View style={styles.ruleTextContainer}>
                  <Text style={[styles.ruleHeading, { color: theme.text }]}>Completing Lines</Text>
                  <Text style={[styles.ruleBody, { color: theme.textSecondary }]}>
                    When all 5 numbers in any row, column, or diagonal are marked, that line is completed!
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>4</Text>
                <View style={styles.ruleTextContainer}>
                  <Text style={[styles.ruleHeading, { color: theme.text }]}>B-I-N-G-O Progression</Text>
                  <Text style={[styles.ruleBody, { color: theme.textSecondary }]}>
                    Each completed line unlocks a letter: 1st line = B, 2nd = I, 3rd = N, 4th = G, 5th = O.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>5</Text>
                <View style={styles.ruleTextContainer}>
                  <Text style={[styles.ruleHeading, { color: theme.text }]}>Winning the Game</Text>
                  <Text style={[styles.ruleBody, { color: theme.textSecondary }]}>
                    The first player to complete all 5 letters (B-I-N-G-O) wins the match!
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.gotItBtn, { backgroundColor: theme.primary }]}
              onPress={() => setRulesVisible(false)}
            >
              <Text style={styles.gotItBtnText}>GOT IT, LET'S PLAY!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  badge25: {
    backgroundColor: '#312E81',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  badge25Text: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  title25: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  editionPill: {
    backgroundColor: '#EC4899',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  editionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
    maxWidth: 320,
  },
  menuSection: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  primaryCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#6366F1',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  secondaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardBadge: {
    backgroundColor: '#3730A3',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  cardBadgeText: {
    color: '#E0E7FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#C7D2FE',
    fontSize: 13,
    lineHeight: 18,
  },
  rulesBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  rulesBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '700',
    padding: 4,
  },
  rulesScroll: {
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '800',
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  ruleBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  gotItBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  gotItBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

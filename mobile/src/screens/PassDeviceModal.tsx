import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { audioEffects } from '../components/AudioEffects';

interface PassDeviceModalProps {
  visible: boolean;
  nextPlayerName: string;
  onReady: () => void;
}

export const PassDeviceModal: React.FC<PassDeviceModalProps> = ({
  visible,
  nextPlayerName,
  onReady,
}) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.phoneIcon}>📱</Text>
          <Text style={[styles.title, { color: theme.text }]}>PASS THE PHONE</Text>
          <Text style={[styles.targetName, { color: theme.primaryLight }]}>
            Hand device to {nextPlayerName}
          </Text>

          <Text style={[styles.instructions, { color: theme.textSecondary }]}>
            Keep your board hidden from opponents! Tap the button below once {nextPlayerName} has the phone.
          </Text>

          <TouchableOpacity
            style={[styles.readyBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              audioEffects.playTap();
              onReady();
            }}
          >
            <Text style={styles.readyBtnText}>I AM {nextPlayerName.toUpperCase()} — START TURN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#050810',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
  },
  phoneIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  targetName: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 18,
  },
  readyBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

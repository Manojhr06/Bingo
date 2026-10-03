import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { audioEffects } from '../components/AudioEffects';
import { socketService, DEFAULT_SERVER_URL } from '../services/socketService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(audioEffects.soundEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(audioEffects.vibrationEnabled);
  const [serverUrl, setServerUrl] = useState<string>(socketService.currentServerUrl);
  const [testStatus, setTestStatus] = useState<string>('');

  const handleSoundToggle = (val: boolean) => {
    setSoundEnabled(val);
    audioEffects.soundEnabled = val;
    if (val) audioEffects.playTap();
  };

  const handleVibrationToggle = (val: boolean) => {
    setVibrationEnabled(val);
    audioEffects.vibrationEnabled = val;
    if (val) audioEffects.playTap();
  };

  const handleTestConnection = () => {
    audioEffects.playTap();
    setTestStatus('Testing connection...');
    const sock = socketService.connect(serverUrl.trim());

    const timer = setTimeout(() => {
      if (!sock.connected) {
        setTestStatus('❌ Connection timed out. Check IP/Port.');
      }
    }, 4000);

    sock.once('connect', () => {
      clearTimeout(timer);
      setTestStatus('✅ Connected successfully!');
      audioEffects.playNumberCalled();
    });

    sock.once('connect_error', (err) => {
      clearTimeout(timer);
      setTestStatus(`❌ Error: ${err.message}`);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>SETTINGS</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Theme Row */}
          <View style={[styles.row, { borderColor: theme.border }]}>
            <View>
              <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>
                {isDarkMode ? 'Night aesthetic' : 'Bright daylight theme'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#64748B', true: '#4F46E5' }}
              thumbColor={isDarkMode ? '#818CF8' : '#F8FAFC'}
            />
          </View>

          {/* Sound Row */}
          <View style={[styles.row, { borderColor: theme.border }]}>
            <View>
              <Text style={[styles.label, { color: theme.text }]}>Sound Effects</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>
                Chimes, line chimes, victory fanfare
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#64748B', true: '#4F46E5' }}
              thumbColor={soundEnabled ? '#818CF8' : '#F8FAFC'}
            />
          </View>

          {/* Vibration Row */}
          <View style={[styles.row, { borderColor: theme.border }]}>
            <View>
              <Text style={[styles.label, { color: theme.text }]}>Haptic Vibration</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>
                Tactile feedback on cell taps and Bingo
              </Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={handleVibrationToggle}
              trackColor={{ false: '#64748B', true: '#4F46E5' }}
              thumbColor={vibrationEnabled ? '#818CF8' : '#F8FAFC'}
            />
          </View>

          {/* Server URL Input */}
          <View style={styles.serverSection}>
            <Text style={[styles.label, { color: theme.text }]}>Multiplayer Server URL</Text>
            <Text style={[styles.desc, { color: theme.textSecondary }]}>
              {Platform.OS === 'android'
                ? 'Use http://10.0.2.2:3000 for emulator, or your PC IP for physical phone'
                : 'Server address for online multiplayer'}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.100:3000"
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.serverActions}>
              <TouchableOpacity
                style={[styles.testBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                onPress={handleTestConnection}
              >
                <Text style={[styles.testBtnText, { color: theme.primaryLight }]}>
                  Test Connection
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: theme.border }]}
                onPress={() => setServerUrl(DEFAULT_SERVER_URL)}
              >
                <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>
                  Default
                </Text>
              </TouchableOpacity>
            </View>

            {testStatus ? (
              <Text style={[styles.testStatusText, { color: theme.textSecondary }]}>
                {testStatus}
              </Text>
            ) : null}
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>SAVE & CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  desc: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 240,
  },
  serverSection: {
    marginTop: 14,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginTop: 8,
  },
  serverActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  testBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testStatusText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  doneBtn: {
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

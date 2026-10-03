import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class SoundAndHapticsController {
  public soundEnabled: boolean = true;
  public vibrationEnabled: boolean = true;
  private audioCtx: any = null;

  constructor() {
    this.initWebAudio();
  }

  private initWebAudio() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      } catch (e) {
        // Ignore web audio initialization error
      }
    }
  }

  private playTone(freq: number, type: OscillatorType, durationMs: number, gainVal: number = 0.1) {
    if (!this.soundEnabled) return;
    try {
      if (Platform.OS === 'web' && this.audioCtx) {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          this.audioCtx.currentTime + durationMs / 1000
        );
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + durationMs / 1000);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  // --- HAPTICS & SOUND METHODS ---

  public async playTap() {
    if (this.vibrationEnabled) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    this.playTone(520, 'sine', 60, 0.08);
  }

  public async playNumberCalled() {
    if (this.vibrationEnabled) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    this.playTone(680, 'sine', 120, 0.12);
  }

  public async playLineComplete() {
    if (this.vibrationEnabled) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
    // Harmonious double chime
    this.playTone(523.25, 'triangle', 180, 0.15); // C5
    setTimeout(() => {
      this.playTone(659.25, 'triangle', 260, 0.18); // E5
    }, 120);
  }

  public async playBingoWin() {
    if (this.vibrationEnabled) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 500);
      } catch (e) {}
    }
    // Major chord victory arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 400, 0.2);
      }, idx * 150);
    });
  }

  public async playError() {
    if (this.vibrationEnabled) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    }
    this.playTone(220, 'sawtooth', 200, 0.1);
  }
}

export const audioEffects = new SoundAndHapticsController();

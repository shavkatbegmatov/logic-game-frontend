import { Howl, Howler } from 'howler';
import { SOUNDS } from '../constants/spaceTheme';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.7;
    this.ambientVolume = 0.3;
    this.initialized = false;

    // Global volume setting
    Howler.volume(this.volume);
  }

  async init() {
    if (this.initialized) return;

    // Load all sound effects
    this.sounds = {
      gateClick: new Howl({
        src: [`/sounds/${SOUNDS.gateClick}`],
        volume: 0.5,
        preload: true,
      }),
      wireConnect: new Howl({
        src: [`/sounds/${SOUNDS.wireConnect}`],
        volume: 0.6,
        preload: true,
      }),
      signalPass: new Howl({
        src: [`/sounds/${SOUNDS.signalPass}`],
        volume: 0.4,
        loop: true,
      }),
      achievement: new Howl({
        src: [`/sounds/${SOUNDS.achievement}`],
        volume: 0.8,
        preload: true,
      }),
      levelComplete: new Howl({
        src: [`/sounds/${SOUNDS.levelComplete}`],
        volume: 1.0,
        preload: true,
      }),
      error: new Howl({
        src: [`/sounds/${SOUNDS.error}`],
        volume: 0.6,
        preload: true,
      }),
      ambientSpace: new Howl({
        src: [`/sounds/${SOUNDS.ambientSpace}`],
        volume: this.ambientVolume,
        loop: true,
        preload: true,
      }),
      clockTick: new Howl({
        src: [`/sounds/${SOUNDS.clockTick}`],
        volume: 0.3,
        preload: true,
      }),
    };

    // For now, we'll use placeholder sounds - you can replace with actual sound files
    // Creating synthetic sounds as placeholders
    this.createSyntheticSounds();

    this.initialized = true;
  }

  createSyntheticSounds() {
    // Create Web Audio API context for synthetic sounds
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.audioContext = new AudioContext();

    // Store synthetic sound functions
    this.syntheticSounds = {
      gateClick: () => this.playSynthetic('click'),
      wireConnect: () => this.playSynthetic('connect'),
      signalPass: () => this.playSynthetic('signal'),
      achievement: () => this.playSynthetic('achievement'),
      levelComplete: () => this.playSynthetic('complete'),
      error: () => this.playSynthetic('error'),
      clockTick: () => this.playSynthetic('tick'),
    };
  }

  playSynthetic(type) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;

    switch (type) {
      case 'click':
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'connect':
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'signal':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'achievement':
        // Play a chord for achievement
        [261.63, 329.63, 392.00].forEach((freq, i) => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.5);
        });
        break;

      case 'complete':
        // Fanfare sound
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          gain.gain.setValueAtTime(0.4, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.3);
        });
        break;

      case 'error':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'tick':
        oscillator.frequency.setValueAtTime(1000, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      default:
        break;
    }
  }

  play(soundName) {
    if (!this.enabled) return;

    // Use synthetic sounds for now
    if (this.syntheticSounds && this.syntheticSounds[soundName]) {
      this.syntheticSounds[soundName]();
      return;
    }

    // If actual sound files are loaded, play them
    if (this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }

  stop(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].stop();
    }
  }

  startAmbient() {
    if (!this.enabled) return;

    // For now, we'll skip ambient sound since it requires an actual file
    // if (this.sounds.ambientSpace) {
    //   this.sounds.ambientSpace.play();
    // }
  }

  stopAmbient() {
    if (this.sounds.ambientSpace) {
      this.sounds.ambientSpace.stop();
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.volume);
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.sounds.ambientSpace) {
      this.sounds.ambientSpace.volume(this.ambientVolume);
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopAll();
    }
    return this.enabled;
  }

  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.stop();
    });
  }

  cleanup() {
    this.stopAll();
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.unload();
    });
    this.sounds = {};
    this.initialized = false;
  }
}

// Singleton instance
const soundManager = new SoundManager();
export default soundManager;
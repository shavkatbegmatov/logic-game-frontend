/**
 * Sound Manager
 * Manages game audio using Web Audio API and Howler.js
 */

import { Howl, Howler } from 'howler'

type SoundType = 'click' | 'connect' | 'signal' | 'achievement' | 'complete' | 'error' | 'tick'
type SoundName = 'gateClick' | 'wireConnect' | 'signalPass' | 'achievement' | 'levelComplete' | 'error' | 'clockTick' | 'ambientSpace'

class SoundManager {
  private sounds: Record<string, Howl>
  private enabled: boolean
  private volume: number
  private ambientVolume: number
  private initialized: boolean
  private audioContext: AudioContext | null
  private syntheticSounds: Record<SoundName, () => void> | null

  constructor() {
    this.sounds = {}
    this.enabled = true
    this.volume = 0.7
    this.ambientVolume = 0.3
    this.initialized = false
    this.audioContext = null
    this.syntheticSounds = null

    // Global volume setting
    Howler.volume(this.volume)
  }

  async init(): Promise<void> {
    if (this.initialized) return

    // Skip loading sound files - use only synthetic sounds
    // This prevents 404 errors when sound files are not present
    this.sounds = {}

    // Creating synthetic sounds as placeholders
    this.createSyntheticSounds()

    this.initialized = true
  }

  private createSyntheticSounds(): void {
    // Create Web Audio API context for synthetic sounds
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    this.audioContext = new AudioContext()

    // Store synthetic sound functions
    this.syntheticSounds = {
      gateClick: () => this.playSynthetic('click'),
      wireConnect: () => this.playSynthetic('connect'),
      signalPass: () => this.playSynthetic('signal'),
      achievement: () => this.playSynthetic('achievement'),
      levelComplete: () => this.playSynthetic('complete'),
      error: () => this.playSynthetic('error'),
      clockTick: () => this.playSynthetic('tick'),
      ambientSpace: () => {} // No-op for ambient
    }
  }

  private playSynthetic(type: SoundType): void {
    if (!this.enabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    const now = this.audioContext.currentTime

    switch (type) {
      case 'click':
        oscillator.frequency.setValueAtTime(800, now)
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1)
        gainNode.gain.setValueAtTime(0.3, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        oscillator.start(now)
        oscillator.stop(now + 0.1)
        break

      case 'connect':
        oscillator.frequency.setValueAtTime(400, now)
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15)
        gainNode.gain.setValueAtTime(0.2, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        oscillator.start(now)
        oscillator.stop(now + 0.15)
        break

      case 'signal':
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(440, now)
        gainNode.gain.setValueAtTime(0.1, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
        oscillator.start(now)
        oscillator.stop(now + 0.05)
        break

      case 'achievement':
        // Play a chord for achievement
        ;[261.63, 329.63, 392.0].forEach((freq, i) => {
          const osc = this.audioContext!.createOscillator()
          const gain = this.audioContext!.createGain()
          osc.connect(gain)
          gain.connect(this.audioContext!.destination)
          osc.frequency.setValueAtTime(freq, now + i * 0.1)
          gain.gain.setValueAtTime(0.3, now + i * 0.1)
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5)
          osc.start(now + i * 0.1)
          osc.stop(now + i * 0.1 + 0.5)
        })
        break

      case 'complete':
        // Fanfare sound
        ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = this.audioContext!.createOscillator()
          const gain = this.audioContext!.createGain()
          osc.connect(gain)
          gain.connect(this.audioContext!.destination)
          osc.frequency.setValueAtTime(freq, now + i * 0.15)
          gain.gain.setValueAtTime(0.4, now + i * 0.15)
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3)
          osc.start(now + i * 0.15)
          osc.stop(now + i * 0.15 + 0.3)
        })
        break

      case 'error':
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(200, now)
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2)
        gainNode.gain.setValueAtTime(0.3, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        oscillator.start(now)
        oscillator.stop(now + 0.2)
        break

      case 'tick':
        oscillator.frequency.setValueAtTime(1000, now)
        gainNode.gain.setValueAtTime(0.2, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
        oscillator.start(now)
        oscillator.stop(now + 0.05)
        break

      default:
        break
    }
  }

  play(soundName: string): void {
    if (!this.enabled) return

    // Use synthetic sounds for now
    if (this.syntheticSounds && soundName in this.syntheticSounds) {
      this.syntheticSounds[soundName as SoundName]()
      return
    }

    // If actual sound files are loaded, play them
    if (this.sounds[soundName]) {
      this.sounds[soundName].play()
    }
  }

  stop(soundName: string): void {
    if (this.sounds[soundName]) {
      this.sounds[soundName].stop()
    }
  }

  startAmbient(): void {
    if (!this.enabled) return

    // For now, we'll skip ambient sound since it requires an actual file
    // if (this.sounds.ambientSpace) {
    //   this.sounds.ambientSpace.play();
    // }
  }

  stopAmbient(): void {
    if (this.sounds.ambientSpace) {
      this.sounds.ambientSpace.stop()
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    Howler.volume(this.volume)
  }

  setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume))
    if (this.sounds.ambientSpace) {
      this.sounds.ambientSpace.volume(this.ambientVolume)
    }
  }

  toggleSound(): boolean {
    this.enabled = !this.enabled
    if (!this.enabled) {
      this.stopAll()
    }
    return this.enabled
  }

  stopAll(): void {
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.stop()
    })
  }

  cleanup(): void {
    this.stopAll()
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.unload()
    })
    this.sounds = {}
    this.initialized = false
  }
}

// Singleton instance
const soundManager = new SoundManager()
export default soundManager

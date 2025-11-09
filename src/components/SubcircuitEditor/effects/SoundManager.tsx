import React, { useEffect } from 'react'

// Web Audio API based sound manager
class SoundService {
  private audioContext: AudioContext | null = null
  private initialized: boolean = false

  constructor() {}

  init() {
    if (this.initialized) return
    const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
    this.audioContext = new AC()
    this.initialized = true
  }

  playClick() {
    if (!this.initialized) this.init()
    const ctx = this.audioContext!
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 600
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  playSuccess() {
    if (!this.initialized) this.init()
    const ctx = this.audioContext!
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15)
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }

  playError() {
    if (!this.initialized) this.init()
    const ctx = this.audioContext!
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 200
    oscillator.type = 'sawtooth'
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }

  playTransition() {
    if (!this.initialized) this.init()
    const ctx = this.audioContext!
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1)
    oscillator.type = 'triangle'
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }

  playCancel() {
    if (!this.initialized) this.init()
    const ctx = this.audioContext!
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  }
}

const soundService = new SoundService()

const SoundManager = () => {
  useEffect(() => {
    soundService.init()
  }, [])

  return null
}

// Export soundService directly for use in other components
export { soundService }
export default SoundManager

import { useEffect, useCallback } from 'react'
import soundManager from '../utils/SoundManager'

type SoundName = 'gateClick' | 'clockTick' | 'wireConnect' | 'wireDisconnect' | 'error' | 'success'

interface UseSoundReturn {
  playSound: (soundName: SoundName) => void
  stopSound: (soundName: SoundName) => void
  toggleSound: () => boolean
  setVolume: (volume: number) => void
}

const useSound = (): UseSoundReturn => {
  // Initialize sound manager on mount
  useEffect(() => {
    soundManager.init()
    soundManager.startAmbient()

    return () => {
      soundManager.stopAmbient()
    }
  }, [])

  const playSound = useCallback((soundName: SoundName) => {
    soundManager.play(soundName)
  }, [])

  const stopSound = useCallback((soundName: SoundName) => {
    soundManager.stop(soundName)
  }, [])

  const toggleSound = useCallback(() => {
    return soundManager.toggleSound()
  }, [])

  const setVolume = useCallback((volume: number) => {
    soundManager.setVolume(volume)
  }, [])

  return {
    playSound,
    stopSound,
    toggleSound,
    setVolume,
  }
}

export default useSound

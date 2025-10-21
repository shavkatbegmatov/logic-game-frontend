import { useEffect, useCallback } from 'react';
import soundManager from '../utils/SoundManager';

const useSound = () => {
  // Initialize sound manager on mount
  useEffect(() => {
    soundManager.init();
    soundManager.startAmbient();

    return () => {
      soundManager.stopAmbient();
    };
  }, []);

  const playSound = useCallback((soundName) => {
    soundManager.play(soundName);
  }, []);

  const stopSound = useCallback((soundName) => {
    soundManager.stop(soundName);
  }, []);

  const toggleSound = useCallback(() => {
    return soundManager.toggleSound();
  }, []);

  const setVolume = useCallback((volume) => {
    soundManager.setVolume(volume);
  }, []);

  return {
    playSound,
    stopSound,
    toggleSound,
    setVolume,
  };
};

export default useSound;
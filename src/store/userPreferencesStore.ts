/**
 * User Preferences Store - Gamer sozlamalari
 * Foydalanuvchi sozlamalari va preferences
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PreferredEditorMode, CreationMethod, PortMappingStyle } from '../types/subcircuit'

interface UserPreferencesStore {
  // Editor preferences
  editorMode: PreferredEditorMode
  creationFlow: CreationMethod
  portMappingStyle: PortMappingStyle

  // Visual preferences
  enableAnimations: boolean
  animationSpeed: number
  enableSounds: boolean
  soundVolume: number
  enableParticles: boolean
  enableGlow: boolean
  theme: 'dark' | 'light' | 'cyberpunk' | 'retro' | 'matrix'

  // Behavior preferences
  autoSave: boolean
  autoSaveInterval: number
  showHints: boolean
  showTutorial: boolean
  confirmBeforeDelete: boolean

  // Grid & Snap
  snapToGrid: boolean
  gridSize: number
  showGrid: boolean
  showRulers: boolean
  magneticSnap: boolean

  // Performance
  reducedMotion: boolean
  lowPerformanceMode: boolean
  maxUndoSteps: number

  // Keyboard shortcuts
  shortcuts: {
    createSubcircuit: string
    quickCreate: string
    enterEditMode: string
    exitEditMode: string
    undo: string
    redo: string
    duplicate: string
    delete: string
    selectAll: string
    copy: string
    paste: string
    cut: string
    save: string
    toggleGrid: string
    toggleSnap: string
    zoomIn: string
    zoomOut: string
    zoomReset: string
  }

  // Recent choices
  recentCategories: string[]
  recentTemplates: string[]
  favoriteTemplates: string[]

  // First time flags
  hasSeenTutorial: boolean
  hasChosenEditorMode: boolean
  tutorialProgress: number

  // Statistics
  stats: {
    subcircuitsCreated: number
    totalEditTime: number
    favoriteMode: string | null
    lastUsedMode: string | null
    achievementsUnlocked: string[]
  }

  // Actions
  setEditorMode: (mode: PreferredEditorMode) => void
  setCreationFlow: (flow: CreationMethod) => void
  setPortMappingStyle: (style: PortMappingStyle) => void
  setTheme: (theme: 'dark' | 'light' | 'cyberpunk' | 'retro' | 'matrix') => void
  toggleAnimation: () => void
  toggleSound: () => void
  toggleParticles: () => void
  toggleGrid: () => void
  toggleSnap: () => void
  setSoundVolume: (volume: number) => void
  setAnimationSpeed: (speed: number) => void
  setShortcut: (action: string, shortcut: string) => void
  resetShortcuts: () => void
  addRecentTemplate: (templateId: string) => void
  toggleFavoriteTemplate: (templateId: string) => void
  markTutorialSeen: () => void
  incrementSubcircuitsCreated: () => void
  addEditTime: (seconds: number) => void
  reset: () => void
}

const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set, get) => ({
      // Editor preferences
      editorMode: 'inline', // 'inline' | 'floating' | 'fullModal' | 'splitView' (vaqtincha fullModal test uchun)
      creationFlow: 'quick', // 'quick' | 'wizard' | 'template' | 'visual'
      portMappingStyle: 'connectionLines', // 'nodeGraph' | 'connectionLines' | 'smartAuto' | 'pinDesigner'

      // Visual preferences
      enableAnimations: true,
      animationSpeed: 1.0,
      enableSounds: true,
      soundVolume: 0.7,
      enableParticles: true,
      enableGlow: true,
      theme: 'dark', // 'dark' | 'light' | 'cyberpunk' | 'retro' | 'matrix'

      // Behavior preferences
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      showHints: true,
      showTutorial: true,
      confirmBeforeDelete: true,

      // Grid & Snap
      snapToGrid: true,
      gridSize: 20,
      showGrid: true,
      showRulers: false,
      magneticSnap: true,

      // Performance
      reducedMotion: false,
      lowPerformanceMode: false,
      maxUndoSteps: 50,

      // Keyboard shortcuts (customizable)
      shortcuts: {
        createSubcircuit: 'ctrl+g',
        quickCreate: 'ctrl+shift+g',
        enterEditMode: 'e',
        exitEditMode: 'escape',
        undo: 'ctrl+z',
        redo: 'ctrl+y',
        duplicate: 'ctrl+d',
        delete: 'delete',
        selectAll: 'ctrl+a',
        copy: 'ctrl+c',
        paste: 'ctrl+v',
        cut: 'ctrl+x',
        save: 'ctrl+s',
        toggleGrid: 'g',
        toggleSnap: 's',
        zoomIn: 'ctrl+plus',
        zoomOut: 'ctrl+minus',
        zoomReset: 'ctrl+0'
      },

      // Recent choices (for quick access)
      recentCategories: [],
      recentTemplates: [],
      favoriteTemplates: [],

      // First time flags
      hasSeenTutorial: false,
      hasChosenEditorMode: false,
      tutorialProgress: 0,

      // Statistics (for achievements)
      stats: {
        subcircuitsCreated: 0,
        totalEditTime: 0,
        favoriteMode: null,
        lastUsedMode: null,
        achievementsUnlocked: []
      },

      // Actions
      setEditorMode: (mode) => set({
        editorMode: mode,
        hasChosenEditorMode: true,
        'stats.lastUsedMode': mode
      }),

      setCreationFlow: (flow) => set({ creationFlow: flow }),

      setPortMappingStyle: (style) => set({ portMappingStyle: style }),

      setTheme: (theme) => set({ theme: theme }),

      toggleAnimation: () => set(state => ({
        enableAnimations: !state.enableAnimations
      })),

      toggleSound: () => set(state => ({
        enableSounds: !state.enableSounds
      })),

      setSoundVolume: (volume) => set({
        soundVolume: Math.max(0, Math.min(1, volume))
      }),

      toggleParticles: () => set(state => ({
        enableParticles: !state.enableParticles
      })),

      toggleGrid: () => set(state => ({
        showGrid: !state.showGrid
      })),

      setGridSize: (size) => set({
        gridSize: Math.max(10, Math.min(100, size))
      }),

      toggleSnapToGrid: () => set(state => ({
        snapToGrid: !state.snapToGrid
      })),

      updateShortcut: (action, newShortcut) => set(state => ({
        shortcuts: {
          ...state.shortcuts,
          [action]: newShortcut
        }
      })),

      resetShortcuts: () => set({
        shortcuts: {
          createSubcircuit: 'ctrl+g',
          quickCreate: 'ctrl+shift+g',
          enterEditMode: 'e',
          exitEditMode: 'escape',
          undo: 'ctrl+z',
          redo: 'ctrl+y',
          duplicate: 'ctrl+d',
          delete: 'delete',
          selectAll: 'ctrl+a',
          copy: 'ctrl+c',
          paste: 'ctrl+v',
          cut: 'ctrl+x',
          save: 'ctrl+s',
          toggleGrid: 'g',
          toggleSnap: 's',
          zoomIn: 'ctrl+plus',
          zoomOut: 'ctrl+minus',
          zoomReset: 'ctrl+0'
        }
      }),

      addRecentCategory: (category) => set(state => ({
        recentCategories: [
          category,
          ...state.recentCategories.filter(c => c !== category)
        ].slice(0, 5)
      })),

      addRecentTemplate: (templateId) => set(state => ({
        recentTemplates: [
          templateId,
          ...state.recentTemplates.filter(t => t !== templateId)
        ].slice(0, 10)
      })),

      toggleFavoriteTemplate: (templateId) => set(state => ({
        favoriteTemplates: state.favoriteTemplates.includes(templateId)
          ? state.favoriteTemplates.filter(t => t !== templateId)
          : [...state.favoriteTemplates, templateId]
      })),

      markTutorialComplete: () => set({
        hasSeenTutorial: true,
        tutorialProgress: 100
      }),

      updateTutorialProgress: (progress) => set({
        tutorialProgress: Math.max(get().tutorialProgress, progress)
      }),

      incrementSubcircuitCount: () => set(state => ({
        stats: {
          ...state.stats,
          subcircuitsCreated: state.stats.subcircuitsCreated + 1
        }
      })),

      addEditTime: (seconds) => set(state => ({
        stats: {
          ...state.stats,
          totalEditTime: state.stats.totalEditTime + seconds
        }
      })),

      unlockAchievement: (achievementId) => set(state => ({
        stats: {
          ...state.stats,
          achievementsUnlocked: state.stats.achievementsUnlocked.includes(achievementId)
            ? state.stats.achievementsUnlocked
            : [...state.stats.achievementsUnlocked, achievementId]
        }
      })),

      resetPreferences: () => set({
        editorMode: 'inline',
        creationFlow: 'quick',
        portMappingStyle: 'connectionLines',
        enableAnimations: true,
        animationSpeed: 1.0,
        enableSounds: true,
        soundVolume: 0.7,
        enableParticles: true,
        theme: 'dark',
        autoSave: true,
        autoSaveInterval: 30000,
        showHints: true,
        snapToGrid: true,
        gridSize: 20,
        showGrid: true
      }),

      // Get computed preferences
      getEffectiveAnimationSpeed: () => {
        const { enableAnimations, animationSpeed, reducedMotion } = get()
        if (!enableAnimations || reducedMotion) return 0
        return animationSpeed
      },

      getEffectiveSoundVolume: () => {
        const { enableSounds, soundVolume } = get()
        return enableSounds ? soundVolume : 0
      },

      shouldShowParticles: () => {
        const { enableParticles, lowPerformanceMode } = get()
        return enableParticles && !lowPerformanceMode
      },

      isFirstTime: () => {
        const { hasChosenEditorMode, hasSeenTutorial } = get()
        return !hasChosenEditorMode || !hasSeenTutorial
      }
    }),
    {
      name: 'user-preferences-storage',
      version: 1,
      migrate: (persistedState, version) => {
        // Migration logic for future versions
        return persistedState
      }
    }
  )
)

export default useUserPreferencesStore
import React, { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings as SettingsIcon,
  X,
  Columns,
  Maximize2,
  Layers,
  Square,
  Palette,
  Grid as GridIcon,
  Zap,
  Sliders,
  Volume2,
  RotateCcw
} from 'lucide-react'
import useUserPreferencesStore from '../../store/userPreferencesStore'

type Props = {
  isOpen: boolean
  onClose: () => void
}

type TabId = 'general' | 'visual' | 'grid' | 'performance' | 'behavior'

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('general')

  // General preferences
  const editorMode = useUserPreferencesStore(s => s.editorMode)
  const setEditorMode = useUserPreferencesStore(s => s.setEditorMode)
  const creationFlow = useUserPreferencesStore(s => s.creationFlow)
  const setCreationFlow = useUserPreferencesStore(s => s.setCreationFlow)

  // Visual preferences
  const enableAnimations = useUserPreferencesStore(s => s.enableAnimations)
  const toggleAnimation = useUserPreferencesStore(s => s.toggleAnimation)
  const animationSpeed = useUserPreferencesStore(s => s.animationSpeed)
  const enableParticles = useUserPreferencesStore(s => s.enableParticles)
  const toggleParticles = useUserPreferencesStore(s => s.toggleParticles)
  const enableGlow = useUserPreferencesStore(s => s.enableGlow)
  const theme = useUserPreferencesStore(s => s.theme)
  const setTheme = useUserPreferencesStore(s => s.setTheme)

  // Sound preferences
  const enableSounds = useUserPreferencesStore(s => s.enableSounds)
  const toggleSound = useUserPreferencesStore(s => s.toggleSound)
  const soundVolume = useUserPreferencesStore(s => s.soundVolume)
  const setSoundVolume = useUserPreferencesStore(s => s.setSoundVolume)

  // Grid preferences
  const showGrid = useUserPreferencesStore(s => s.showGrid)
  const toggleGrid = useUserPreferencesStore(s => s.toggleGrid)
  const snapToGrid = useUserPreferencesStore(s => s.snapToGrid)
  const toggleSnapToGrid = useUserPreferencesStore(s => s.toggleSnapToGrid)
  const gridSize = useUserPreferencesStore(s => s.gridSize)
  const setGridSize = useUserPreferencesStore(s => s.setGridSize)
  const showRulers = useUserPreferencesStore(s => s.showRulers)
  const magneticSnap = useUserPreferencesStore(s => s.magneticSnap)

  // Performance preferences
  const reducedMotion = useUserPreferencesStore(s => s.reducedMotion)
  const lowPerformanceMode = useUserPreferencesStore(s => s.lowPerformanceMode)
  const maxUndoSteps = useUserPreferencesStore(s => s.maxUndoSteps)

  // Behavior preferences
  const autoSave = useUserPreferencesStore(s => s.autoSave)
  const autoSaveInterval = useUserPreferencesStore(s => s.autoSaveInterval)
  const showHints = useUserPreferencesStore(s => s.showHints)
  const confirmBeforeDelete = useUserPreferencesStore(s => s.confirmBeforeDelete)

  const resetPreferences = useUserPreferencesStore(s => s.resetPreferences)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const editorModes = useMemo(() => ([
    { id: 'inline', name: 'Inline Canvas', desc: 'Asosiy canvas ichida tahrirlash', Icon: Maximize2 },
    { id: 'floating', name: 'Floating Panel', desc: 'Yon panelda tahrirlash', Icon: Layers },
    { id: 'fullModal', name: 'Full Modal', desc: 'To\'liq ekran modalda tahrirlash', Icon: Square },
    { id: 'splitView', name: 'Split View', desc: 'Yonma-yon tahrirlash', Icon: Columns }
  ] as const), [])

  const creationFlows = useMemo(() => ([
    { id: 'quick', name: 'Quick', desc: 'Tezkor yaratish' },
    { id: 'wizard', name: 'Wizard', desc: 'Qadam-baqadam sozlash' },
    { id: 'template', name: 'Template', desc: 'Andozadan yaratish' },
    { id: 'visual', name: 'Visual', desc: 'Vizual tanlash' },
  ] as const), [])

  const themes = useMemo(() => ([
    { id: 'dark', name: 'Dark', color: '#1e293b' },
    { id: 'light', name: 'Light', color: '#f1f5f9' },
    { id: 'cyberpunk', name: 'Cyberpunk', color: '#ec4899' },
    { id: 'retro', name: 'Retro', color: '#f59e0b' },
    { id: 'matrix', name: 'Matrix', color: '#10b981' }
  ] as const), [])

  const tabs = useMemo(() => ([
    { id: 'general' as TabId, name: 'Umumiy', Icon: SettingsIcon },
    { id: 'visual' as TabId, name: 'Vizual', Icon: Palette },
    { id: 'grid' as TabId, name: 'Grid & Snap', Icon: GridIcon },
    { id: 'performance' as TabId, name: 'Unumdorlik', Icon: Zap },
    { id: 'behavior' as TabId, name: 'Xulq-atvor', Icon: Sliders }
  ]), [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleReset = () => {
    if (confirm('Barcha sozlamalarni qayta tiklashni xohlaysizmi?')) {
      resetPreferences()
    }
  }

  return isOpen ? createPortal(
    (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 0, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-white/5 p-2">
                  <SettingsIcon className="h-5 w-5 text-cyan-400" />
                </span>
                <h2 className="text-lg font-semibold text-white">Sozlamalar</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="rounded-lg px-3 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Qayta tiklash
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 px-8 gap-1">
              {tabs.map(({ id, name, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === id
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Editor Mode */}
                  <div>
                    <div className="mb-3 text-sm font-medium text-gray-300">Editor rejimi</div>
                    <div className="grid grid-cols-2 gap-3">
                      {editorModes.map(({ id, name, desc, Icon }) => (
                        <button
                          key={id}
                          onClick={() => setEditorMode(id as any)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                            editorMode === id
                              ? 'border-cyan-400/40 bg-cyan-400/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                            editorMode === id ? 'bg-cyan-500/20' : 'bg-white/10'
                          }`}>
                            <Icon className="h-5 w-5 text-white" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-white">{name}</div>
                            <div className="text-xs text-gray-400">{desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Creation Flow */}
                  <div>
                    <div className="mb-3 text-sm font-medium text-gray-300">Subcircuit yaratish usuli</div>
                    <div className="grid grid-cols-4 gap-2">
                      {creationFlows.map(({ id, name, desc }) => (
                        <button
                          key={id}
                          onClick={() => setCreationFlow(id as any)}
                          className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                            creationFlow === id
                              ? 'border-indigo-400/40 bg-indigo-400/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-sm font-medium text-white">{name}</div>
                          <div className="text-[11px] text-gray-400">{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Tab */}
              {activeTab === 'visual' && (
                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <div className="mb-3 text-sm font-medium text-gray-300">Tema</div>
                    <div className="grid grid-cols-5 gap-2">
                      {themes.map(({ id, name, color }) => (
                        <button
                          key={id}
                          onClick={() => setTheme(id as any)}
                          className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-3 transition-colors ${
                            theme === id
                              ? 'border-cyan-400/40 bg-cyan-400/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className="h-8 w-8 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-white">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animations */}
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Animatsiyalar</span>
                      <input
                        type="checkbox"
                        checked={enableAnimations}
                        onChange={toggleAnimation}
                        className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                      />
                    </label>
                    {enableAnimations && (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-gray-400">Tezlik</span>
                          <span className="text-cyan-400">{animationSpeed.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={animationSpeed}
                          onChange={(e) => useUserPreferencesStore.setState({ animationSpeed: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Particles */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Particle effektlar</span>
                    <input
                      type="checkbox"
                      checked={enableParticles}
                      onChange={toggleParticles}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  {/* Glow */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Glow effektlar</span>
                    <input
                      type="checkbox"
                      checked={enableGlow}
                      onChange={() => useUserPreferencesStore.setState({ enableGlow: !enableGlow })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  {/* Sound */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Tovushlar</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableSounds}
                        onChange={toggleSound}
                        className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                      />
                    </label>
                    {enableSounds && (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-gray-400">Ovoz balandligi</span>
                          <span className="text-cyan-400">{Math.round(soundVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={soundVolume}
                          onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid Tab */}
              {activeTab === 'grid' && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Grid ko'rsatish</span>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={toggleGrid}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Snap to grid</span>
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={toggleSnapToGrid}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Magnetic snap</span>
                    <input
                      type="checkbox"
                      checked={magneticSnap}
                      onChange={() => useUserPreferencesStore.setState({ magneticSnap: !magneticSnap })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Rulers ko'rsatish</span>
                    <input
                      type="checkbox"
                      checked={showRulers}
                      onChange={() => useUserPreferencesStore.setState({ showRulers: !showRulers })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <div className="pt-2">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Grid hajmi</span>
                      <span className="text-cyan-400">{gridSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={gridSize}
                      onChange={(e) => setGridSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-300">Low performance mode</div>
                      <div className="text-xs text-gray-500">Particle va animatsiyalarni cheklaydi</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={lowPerformanceMode}
                      onChange={() => useUserPreferencesStore.setState({ lowPerformanceMode: !lowPerformanceMode })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-300">Reduced motion</div>
                      <div className="text-xs text-gray-500">Animatsiyalarni kamaytiradi</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reducedMotion}
                      onChange={() => useUserPreferencesStore.setState({ reducedMotion: !reducedMotion })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <div className="pt-2">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Max undo steps</span>
                      <span className="text-cyan-400">{maxUndoSteps}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={maxUndoSteps}
                      onChange={(e) => useUserPreferencesStore.setState({ maxUndoSteps: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Behavior Tab */}
              {activeTab === 'behavior' && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Auto-save</span>
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={() => useUserPreferencesStore.setState({ autoSave: !autoSave })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  {autoSave && (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Auto-save intervali</span>
                        <span className="text-cyan-400">{autoSaveInterval / 1000}s</span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="120000"
                        step="5000"
                        value={autoSaveInterval}
                        onChange={(e) => useUserPreferencesStore.setState({ autoSaveInterval: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Show hints</span>
                    <input
                      type="checkbox"
                      checked={showHints}
                      onChange={() => useUserPreferencesStore.setState({ showHints: !showHints })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Confirm before delete</span>
                    <input
                      type="checkbox"
                      checked={confirmBeforeDelete}
                      onChange={() => useUserPreferencesStore.setState({ confirmBeforeDelete: !confirmBeforeDelete })}
                      className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-white/10">
              <button
                onClick={onClose}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Yopish
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    ),
    document.body
  ) : null
}

export default SettingsModal

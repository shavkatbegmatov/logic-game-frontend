import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings as SettingsIcon, X, Columns, Maximize2, Layers, Square } from 'lucide-react'
import useUserPreferencesStore from '../../store/userPreferencesStore'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const editorMode = useUserPreferencesStore(s => s.editorMode)
  const setEditorMode = useUserPreferencesStore(s => s.setEditorMode)
  const creationFlow = useUserPreferencesStore(s => s.creationFlow)
  const setCreationFlow = useUserPreferencesStore(s => s.setCreationFlow)
  const enableSounds = useUserPreferencesStore(s => s.enableSounds)
  const toggleSound = useUserPreferencesStore(s => s.toggleSound)

  const editorModes = useMemo(() => ([
    { id: 'inline', name: 'Inline Canvas', desc: 'Asosiy canvas ichida tahrirlash', Icon: Maximize2 },
    { id: 'floating', name: 'Floating Panel', desc: 'Yon panelda tahrirlash', Icon: Layers },
    { id: 'fullModal', name: 'Full Modal', desc: 'To‘liq ekran modalda tahrirlash', Icon: Square },
    { id: 'splitView', name: 'Split View', desc: 'Yonma-yon tahrirlash', Icon: Columns }
  ] as const), [])

  const creationFlows = useMemo(() => ([
    { id: 'quick', name: 'Quick', desc: 'Tezkor yaratish' },
    { id: 'wizard', name: 'Wizard', desc: 'Qadam-baqadam sozlash' },
    { id: 'template', name: 'Template', desc: 'Andozadan yaratish' },
    { id: 'visual', name: 'Visual', desc: 'Vizual tanlash' },
  ] as const), [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-white/5 p-2"><SettingsIcon className="h-5 w-5 text-cyan-400" /></span>
                <h2 className="text-lg font-semibold text-white">Sozlamalar</h2>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Editor Mode */}
            <div className="mb-6">
              <div className="mb-2 text-sm font-medium text-gray-300">Editor rejimi</div>
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
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${editorMode === id ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
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
            <div className="mb-6">
              <div className="mb-2 text-sm font-medium text-gray-300">Subcircuit yaratish usuli</div>
              <div className="grid grid-cols-4 gap-2">
                {creationFlows.map(({ id, name, desc }) => (
                  <button
                    key={id}
                    onClick={() => setCreationFlow(id as any)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      creationFlow === id ? 'border-indigo-400/40 bg-indigo-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{name}</div>
                    <div className="text-[11px] text-gray-400">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sounds toggle */}
            <div className="mb-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={enableSounds} onChange={toggleSound} className="rounded border-gray-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500" />
                Tovushlar yoqilgan
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Yopish</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SettingsModal

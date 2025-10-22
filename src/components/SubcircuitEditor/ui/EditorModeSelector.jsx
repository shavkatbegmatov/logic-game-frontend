import React from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Layers, Square, Columns } from 'lucide-react'

const EditorModeSelector = ({ onSelect, onSkip }) => {
  const modes = [
    {
      id: 'inline',
      name: 'Inline Canvas',
      description: 'Edit directly on the main canvas',
      icon: Maximize2,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'floating',
      name: 'Floating Panel',
      description: 'Edit in a side panel',
      icon: Layers,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'fullModal',
      name: 'Full Modal',
      description: 'Focused editing in a modal',
      icon: Square,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'splitView',
      name: 'Split View',
      description: 'Side-by-side editing',
      icon: Columns,
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl rounded-2xl bg-slate-900 p-8 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Editor Mode</h2>
        <p className="text-gray-400 mb-8">Select how you prefer to edit subcircuits</p>

        <div className="grid grid-cols-2 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(mode.id)}
                className="relative p-6 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-transparent hover:border-slate-600 transition-all text-left"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${mode.color} mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{mode.name}</h3>
                <p className="text-sm text-gray-400">{mode.description}</p>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default EditorModeSelector
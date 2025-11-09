import React from 'react'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'

const FloatingPanelMode = ({ onClose, theme, enableAnimations }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed right-4 top-20 w-96 h-[calc(100vh-6rem)] z-40"
    >
      <div className="h-full rounded-2xl bg-slate-900/95 backdrop-blur-sm border border-slate-700 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Floating Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Layers className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Floating Panel Editor</h3>
            <p className="text-gray-400">Edit in a side panel while viewing the main canvas</p>
            <p className="text-sm text-gray-500 mt-2">Full implementation coming soon...</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FloatingPanelMode
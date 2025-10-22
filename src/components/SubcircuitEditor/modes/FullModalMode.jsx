import React from 'react'
import { motion } from 'framer-motion'
import { Square } from 'lucide-react'

const FullModalMode = ({ onClose, theme, enableAnimations }) => {
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
        className="w-full max-w-6xl h-[90vh] rounded-2xl bg-slate-900 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Square className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Full Modal Editor</h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
              <Square className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Full Modal Editor</h3>
            <p className="text-gray-400">Focused editing in a dedicated modal window</p>
            <p className="text-sm text-gray-500 mt-2">Full implementation coming soon...</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FullModalMode
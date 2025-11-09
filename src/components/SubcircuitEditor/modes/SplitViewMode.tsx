import React from 'react'
import { motion } from 'framer-motion'
import { Columns } from 'lucide-react'

const SplitViewMode = ({ onClose, theme, enableAnimations }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-slate-900"
    >
      <div className="h-full flex">
        {/* Left panel - main canvas */}
        <div className="flex-1 border-r border-slate-700">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Columns className="h-5 w-5 text-orange-400" />
                <h2 className="text-lg font-semibold text-white">Split View - Main Canvas</h2>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-slate-800/50">
              <p className="text-gray-400">Main canvas view</p>
            </div>
          </div>
        </div>

        {/* Right panel - subcircuit editor */}
        <div className="flex-1">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Subcircuit Editor</h2>
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
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                  <Columns className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Split View Editor</h3>
                <p className="text-gray-400">Edit side-by-side with the main canvas</p>
                <p className="text-sm text-gray-500 mt-2">Full implementation coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SplitViewMode
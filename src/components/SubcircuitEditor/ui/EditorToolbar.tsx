import React from 'react'
import { motion } from 'framer-motion'
import { Save, X, Undo, Redo } from 'lucide-react'

const EditorToolbar = ({ position = 'bottom', onSave, onCancel, onUndo, onRedo }) => {
  const positionClasses = {
    top: 'top-4 left-1/2 -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2'
  }

  return (
    <motion.div
      initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed ${positionClasses[position]} z-50`}
    >
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-full shadow-2xl border border-slate-700 px-4 py-2 flex items-center gap-2">
        <button
          onClick={onUndo}
          className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-slate-700" />
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:brightness-110 transition-all"
        >
          <Save className="h-4 w-4" />
          <span className="text-sm font-medium">Save</span>
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="text-sm font-medium">Cancel</span>
        </button>
      </div>
    </motion.div>
  )
}

export default EditorToolbar
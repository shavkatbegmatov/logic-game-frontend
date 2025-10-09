import React from 'react'
import { Zap, Grid, HelpCircle, Settings, BookOpen } from 'lucide-react'
import useGameStore from '../../store/gameStore'

const Toolbar = () => {
  const { isSimulating, isSandboxMode, setSandboxMode } = useGameStore()

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      {/* Left side - Mode switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSandboxMode(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              !isSandboxMode
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tutorial
          </button>
          <button
            onClick={() => setSandboxMode(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isSandboxMode
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sandbox
          </button>
        </div>

        {/* Status indicator */}
        {isSimulating && (
          <div className="flex items-center gap-2 text-green-600">
            <Zap size={18} className="animate-pulse" />
            <span className="text-sm font-medium">Simulyatsiya faol</span>
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Grid">
          <Grid size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Qo'llanma">
          <BookOpen size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Yordam">
          <HelpCircle size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Sozlamalar">
          <Settings size={20} className="text-gray-600" />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
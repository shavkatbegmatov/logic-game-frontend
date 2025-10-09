import React from 'react'
import { Zap, Grid, HelpCircle, Settings, BookOpen } from 'lucide-react'
import useGameStore from '../../store/gameStore'

const Toolbar = () => {
  const { isSimulating, isSandboxMode, setSandboxMode } = useGameStore()

  return (
    <div className="flex h-16 items-center justify-between border-b border-white/5 bg-white/5 px-6 backdrop-blur-2xl shadow-[0_15px_35px_-20px_rgba(15,23,42,0.6)]">
      {/* Left side - Mode switcher */}
      <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 p-1.5 shadow-inner shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <button
          onClick={() => setSandboxMode(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            !isSandboxMode
              ? 'bg-white text-slate-900 shadow-lg ring-1 ring-white/40'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Tutorial
        </button>
        <button
          onClick={() => setSandboxMode(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            isSandboxMode
              ? 'bg-white text-slate-900 shadow-lg ring-1 ring-white/40'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Sandbox
        </button>
      </div>

        {/* Status indicator */}
        {isSimulating && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 backdrop-blur">
            <Zap size={18} className="animate-pulse" />
            <span className="text-sm font-medium">Simulyatsiya faol</span>
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10"
          title="Grid"
        >
          <Grid size={20} />
        </button>
        <button
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10"
          title="Qo'llanma"
        >
          <BookOpen size={20} />
        </button>
        <button
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10"
          title="Yordam"
        >
          <HelpCircle size={20} />
        </button>
        <button
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10"
          title="Sozlamalar"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar

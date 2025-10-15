import React from 'react'
import { Zap, Grid, HelpCircle, Settings, BookOpen } from 'lucide-react'
import useGameStore from '../../store/gameStore'

const Toolbar = () => {
  const { isSimulating, isSandboxMode, setSandboxMode, currentLevel } = useGameStore()

  return (
    <div className="relative flex h-16 items-center justify-between border-b border-white/5 bg-slate-950/40 px-6 backdrop-blur-2xl shadow-[0_15px_35px_-20px_rgba(15,23,42,0.6)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.12),transparent_55%)] opacity-60" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {/* Left side - Mode switcher */}
      <div className="relative z-10 flex items-center gap-4">
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

      {/* Center - Mission readout */}
      <div className="relative z-10 hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-200 shadow-inner shadow-white/5 md:flex">
        <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-cyan-200">Quantum {currentLevel + 1}</span>
        <span className="rounded-full bg-indigo-400/20 px-2 py-1 text-indigo-200">
          {isSandboxMode ? 'Erkin rejim' : 'Missiya rejimi'}
        </span>
      </div>

      {/* Right side - Actions */}
      <div className="relative z-10 flex items-center gap-2">
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

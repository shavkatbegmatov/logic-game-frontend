import React, { useState } from 'react'
import { Zap, Grid, HelpCircle, Settings, BookOpen, Play, Pause, Rocket, Cpu, Shield } from 'lucide-react'
import useGameStore from '../../store/gameStore'
import useSound from '../../hooks/useSound'
import SettingsModal from '../Settings/SettingsModal'

const Toolbar = () => {
  const {
    isSimulating,
    isSandboxMode,
    setSandboxMode,
    currentLevel,
    startSimulation,
    stopSimulation
  } = useGameStore()

  const { playSound } = useSound()

  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="relative flex h-16 items-center justify-between border-b border-white/5 bg-slate-950/40 px-6 backdrop-blur-2xl shadow-[0_15px_35px_-20px_rgba(15,23,42,0.6)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.12),transparent_55%)] opacity-60" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {/* Left side - Mode switcher */}
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-1.5 shadow-inner shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => {
              setSandboxMode(false);
              playSound('gateClick');
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold font-orbitron transition-all ${
              !isSandboxMode
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 shadow-lg shadow-cyan-400/50'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Rocket size={14} />
            <span>MISSION</span>
          </button>
          <button
            onClick={() => {
              setSandboxMode(true);
              playSound('gateClick');
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold font-orbitron transition-all ${
              isSandboxMode
                ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-slate-900 shadow-lg shadow-purple-400/50'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Cpu size={14} />
            <span>SANDBOX</span>
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
        {/* Simulyatsiya tugmalari */}
        {!isSimulating ? (
          <button
            onClick={startSimulation}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-emerald-200 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            title="Simulyatsiyani boshlash"
          >
            <Play size={18} fill="currentColor" />
            <span className="text-sm font-semibold">Ishga tushirish</span>
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-2 text-red-200 transition-all hover:border-red-400/50 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            title="Simulyatsiyani to'xtatish"
          >
            <Pause size={18} fill="currentColor" />
            <span className="text-sm font-semibold">To'xtatish</span>
          </button>
        )}

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
          onClick={() => setShowSettings(true)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10"
          title="Sozlamalar"
        >
          <Settings size={20} />
        </button>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default Toolbar

import React from 'react'
import { Info, Activity, Zap, Cpu, Layers, Hash, Clock } from 'lucide-react'
import useGameStore from '../../store/gameStore'
import { gateConfigs } from '@/engine/gates.ts'

const PropertiesPanel = () => {
  const { selectedGate, gates, wires, isSimulating } = useGameStore()

  const selectedGateObj = selectedGate ? gates.find(g => g.id === selectedGate) : null
  const config = selectedGateObj ? gateConfigs[selectedGateObj.type] : null

  // Calculate stats
  const totalGates = gates.length
  const totalWires = wires.length
  const complexity = Math.round((totalGates * 1.5) + (totalWires * 0.8))

  // Count gate types
  const gateTypeCounts = gates.reduce((acc: Record<string, number>, gate) => {
    acc[gate.type] = (acc[gate.type] || 0) + 1
    return acc
  }, {})

  const mostUsedGate = Object.entries(gateTypeCounts).sort((a, b) => b[1] - a[1])[0]
  const mostUsedGateName = mostUsedGate ? gateConfigs[mostUsedGate[0]]?.name : 'N/A'

  return (
    <div className="relative w-[280px] lg:w-[320px] h-full flex flex-col rounded-r-2xl bg-gradient-to-bl from-white/10 via-white/5 to-transparent backdrop-blur-xl shadow-[0_30px_60px_-30px_rgba(15,23,42,0.75)] overflow-hidden border-l border-white/10">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-bl from-white/10 via-white/5 to-transparent p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(236,72,153,0.16),transparent_55%),radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.12),transparent_60%)] opacity-70" />
        <div className="relative">
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            {selectedGateObj ? (
              <>
                <Info className="w-5 h-5 text-cyan-400" />
                <span>Xususiyatlar</span>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 text-pink-400" />
                <span>Tizim Holati</span>
              </>
            )}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {selectedGateObj ? 'Tanlangan element parametrlari' : 'Sxema statistikasi va tahlili'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {selectedGateObj && config ? (
          <>
            {/* Selected Gate Info */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl font-bold"
                    style={{ backgroundColor: config.color, color: 'white' }}
                  >
                    {config.symbol}
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-1">{config.name}</h3>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-cyan-300 border border-white/10 mb-3">
                    ID: {String(selectedGateObj.id).slice(0, 8)}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* I/O Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Kirish</div>
                  <div className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    {config.inputs || (config.minInputs ? `${config.minInputs}-${config.maxInputs}` : 'N/A')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Chiqish</div>
                  <div className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                    {config.outputs || 1}
                  </div>
                </div>
              </div>

              {/* Truth Table Preview (Static for now) */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  Haqiqat Jadvali
                </h4>
                <div className="space-y-2">
                  {/* Placeholder for truth table logic - can be expanded based on gate type */}
                  <div className="flex justify-between text-xs py-1 border-b border-white/5 text-slate-500">
                    <span>A</span>
                    <span>B</span>
                    <span>OUT</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 text-slate-300 font-mono">
                    <span>0</span>
                    <span>0</span>
                    <span className="text-slate-500">?</span>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center mt-2 italic">
                    To'liq jadval tez orada...
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Circuit Statistics */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-indigo-200/70 uppercase tracking-wider">Murakkablik</div>
                    <div className="text-xl font-bold text-white">{complexity}</div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${Math.min(100, complexity / 2)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Layers className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Gate'lar</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{totalGates}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Simlar</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{totalWires}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Eng ko'p ishlatilgan</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-200">{mostUsedGateName}</span>
                  <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-mono text-cyan-300">
                    {mostUsedGate ? mostUsedGate[1] : 0}x
                  </span>
                </div>
              </div>

              {/* Simulation Status */}
              <div className={`p-4 rounded-xl border transition-all ${isSimulating
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  : 'bg-slate-800/50 border-white/5'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSimulating ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                    }`}>
                    <Clock className={`w-5 h-5 ${isSimulating ? 'animate-spin-slow' : ''}`} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Holat</div>
                    <div className={`text-sm font-bold ${isSimulating ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {isSimulating ? 'Simulyatsiya Faol' : 'Tahrirlash rejimi'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PropertiesPanel

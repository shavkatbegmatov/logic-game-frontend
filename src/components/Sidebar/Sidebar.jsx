import React from 'react'
import { Play, Pause, RotateCcw, Save, Upload, Grid, Trash2 } from 'lucide-react'
import useGameStore from '../../store/gameStore'
import { GateTypes, gateConfigs } from '../../engine/gates'
import { runSimulation } from '../../engine/simulation'

const Sidebar = () => {
  const {
    gates,
    wires,
    isSimulating,
    startSimulation,
    stopSimulation,
    updateSignals,
    resetCanvas,
    saveCircuit,
    loadCircuit,
    currentLevel,
    isSandboxMode
  } = useGameStore()

  // Simulyatsiyani boshqarish
  const handleSimulation = () => {
    if (isSimulating) {
      stopSimulation()
    } else {
      const result = runSimulation(gates, wires)
      if (result.success) {
        updateSignals(result.signals)
        startSimulation()
      } else {
        alert('Xatolik: ' + result.errors.map(e => e.message).join(', '))
      }
    }
  }

  // Sxemani saqlash
  const handleSave = () => {
    const circuit = saveCircuit()
    const json = JSON.stringify(circuit, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `circuit_${Date.now()}.json`
    a.click()
  }

  // Sxemani yuklash
  const handleLoad = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const circuit = JSON.parse(event.target.result)
        loadCircuit(circuit)
      } catch (error) {
        alert('Faylni yuklashda xatolik!')
      }
    }
    reader.readAsText(file)
  }

  // Gate'ni drag qilish
  const handleDragStart = (e, gateType) => {
    e.dataTransfer.setData('gateType', gateType)
  }

  const energyLevel = Math.min(100, Math.round(gates.length * 12 + wires.length * 6))
  const fluxLevel = Math.max(12, gates.length * 4 + wires.length * 6)
  const missionLabel = isSandboxMode ? 'Sandbox rejimi' : `Daraja ${currentLevel + 1}`
  const missionStatus = isSimulating ? "Signal oqmoqda" : "Kutish holati"

  return (
    <div className="relative w-72 h-full flex flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_60px_-30px_rgba(15,23,42,0.75)]">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(circle_at_90%_20%,rgba(129,140,248,0.12),transparent_60%)] opacity-70" />
        <div className="pointer-events-none absolute -top-24 right-12 h-48 w-48 rounded-full bg-cyan-400/30 blur-3xl mix-blend-screen" />
        <div className="relative space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Transistor Nexus</h2>
            <p className="mt-2 text-sm text-slate-300">
              Kvant impulslarini boshqarib, sxemani uyg‘ot.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1">
              Missiya: {missionLabel}
            </span>
            <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1">
              {missionStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Boshqaruv tugmalari */}
      <div className="p-6 border-b border-white/5">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSimulation}
            className={`group flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition-all ${
              isSimulating
                ? 'bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400 shadow-[0_12px_30px_-12px_rgba(244,63,94,0.55)] hover:brightness-110 hover:shadow-[0_18px_40px_-15px_rgba(244,63,94,0.65)]'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_12px_30px_-12px_rgba(16,185,129,0.55)] hover:brightness-110 hover:shadow-[0_18px_40px_-15px_rgba(6,182,212,0.65)]'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause size={18} />
                <span>To'xtatish</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Boshlash</span>
              </>
            )}
          </button>

          <button
            onClick={resetCanvas}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-slate-100 transition-all hover:border-white/20 hover:bg-white/15"
          >
            <RotateCcw size={18} />
            <span>Tozalash</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-4 py-3 font-semibold text-white transition-all shadow-[0_12px_32px_-14px_rgba(79,70,229,0.65)] hover:brightness-110 hover:shadow-[0_18px_45px_-16px_rgba(99,102,241,0.7)]"
          >
            <Save size={18} />
            <span>Saqlash</span>
          </button>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-slate-100 transition-all hover:border-white/20 hover:bg-white/15">
            <Upload size={18} />
            <span>Yuklash</span>
            <input
              type="file"
              accept=".json"
              onChange={handleLoad}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Gate'lar ro'yxati */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Komponentlar</h3>

        {/* Asosiy gate'lar */}
        <div className="mb-8 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">Mantiqiy Gate'lar</p>
          {Object.entries(GateTypes)
            .filter(([_, type]) => !['INPUT', 'OUTPUT'].includes(type))
            .map(([key, type]) => {
              const config = gateConfigs[type]
              return (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.7)] cursor-move transition-all hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_28px_55px_-25px_rgba(15,23,42,0.7)]"
                  style={{ borderLeftColor: config.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{config.name}</div>
                      <div className="text-xs text-slate-300">{config.description}</div>
                    </div>
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold shadow-lg"
                      style={{ backgroundColor: config.color }}
                    >
                      {config.symbol}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* I/O komponentlar */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">Kirish/Chiqish</p>
          {['INPUT', 'OUTPUT'].map(type => {
            const config = gateConfigs[type]
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.7)] cursor-move transition-all hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_28px_55px_-25px_rgba(15,23,42,0.7)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{config.name}</div>
                    <div className="text-xs text-slate-300">{config.description}</div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500 text-white font-bold shadow-lg">
                    {config.symbol}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer - statistika */}
      <div className="border-t border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="tracking-[0.2em] text-slate-400 uppercase">Gate'lar</span>
            <span className="text-sm font-semibold text-white">{gates.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="tracking-[0.2em] text-slate-400 uppercase">Simlar</span>
            <span className="text-sm font-semibold text-white">{wires.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="tracking-[0.2em] text-slate-400 uppercase">Flux</span>
            <span className="text-sm font-semibold text-cyan-200">{fluxLevel}</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-400">
            <span>Energiya</span>
            <span>{energyLevel}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400"
              style={{ width: `${Math.max(8, energyLevel)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar

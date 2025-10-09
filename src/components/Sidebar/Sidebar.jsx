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
    loadCircuit
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

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Logic Gate Simulator</h2>
        <p className="text-sm text-gray-500 mt-1">Mantiqiy sxemalar yarating</p>
      </div>

      {/* Boshqaruv tugmalari */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSimulation}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white font-medium transition-all ${
              isSimulating
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
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
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition-all"
          >
            <RotateCcw size={18} />
            <span>Tozalash</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
          >
            <Save size={18} />
            <span>Saqlash</span>
          </button>

          <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium cursor-pointer transition-all">
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
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Komponentlar</h3>

        {/* Asosiy gate'lar */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Mantiqiy Gate'lar</p>
          {Object.entries(GateTypes)
            .filter(([_, type]) => !['INPUT', 'OUTPUT'].includes(type))
            .map(([key, type]) => {
              const config = gateConfigs[type]
              return (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-400 cursor-move transition-all hover:shadow-md"
                  style={{ borderLeftColor: config.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{config.name}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
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
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Kirish/Chiqish</p>
          {['INPUT', 'OUTPUT'].map(type => {
            const config = gateConfigs[type]
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-400 cursor-move transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{config.name}</div>
                    <div className="text-xs text-gray-500">{config.description}</div>
                  </div>
                  <div className="w-10 h-10 bg-gray-500 rounded flex items-center justify-center text-white font-bold">
                    {config.symbol}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer - statistika */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="flex justify-between mb-1">
            <span>Gate'lar:</span>
            <span className="font-medium">{gates.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Simlar:</span>
            <span className="font-medium">{wires.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
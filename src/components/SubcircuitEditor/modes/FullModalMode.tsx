import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Square, Save, X, Info } from 'lucide-react'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'

const FullModalMode = ({ onClose }) => {
  const canvasRef = useRef(null)
  const {
    editingSubcircuit,
    internalGates,
    internalWires,
    internalBounds,
    tempPorts
  } = useSubcircuitEditorStore()

  // Canvas o'lchamlari
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 500
  const GRID_SIZE = 20

  // Gatelarni render qilish
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas'ni tozalash
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Grid chizish
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.12)'
    ctx.lineWidth = 1
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    if (internalGates && internalGates.length > 0) {
      const bounds = internalBounds || internalGates.reduce(
        (acc, gate) => {
          const gateWidth = gate.width ?? 80
          const gateHeight = gate.height ?? 60
          return {
            minX: Math.min(acc.minX, gate.x),
            minY: Math.min(acc.minY, gate.y),
            maxX: Math.max(acc.maxX, gate.x + gateWidth),
            maxY: Math.max(acc.maxY, gate.y + gateHeight)
          }
        },
        {
          minX: internalGates[0].x,
          minY: internalGates[0].y,
          maxX: internalGates[0].x + (internalGates[0].width ?? 80),
          maxY: internalGates[0].y + (internalGates[0].height ?? 60)
        }
      )

      const padding = 120
      const width = Math.max(bounds.maxX - bounds.minX, 1)
      const height = Math.max(bounds.maxY - bounds.minY, 1)
      const scaleX = (CANVAS_WIDTH - padding) / width
      const scaleY = (CANVAS_HEIGHT - padding) / height
      const scale = Math.min(scaleX, scaleY, 1.5)
      const offsetX = (CANVAS_WIDTH - width * scale) / 2 - (bounds.minX * scale)
      const offsetY = (CANVAS_HEIGHT - height * scale) / 2 - (bounds.minY * scale)

      ctx.save()
      ctx.translate(offsetX, offsetY)
      ctx.scale(scale, scale)

      // Wire'larni chizish (gates'dan oldin)
      if (internalWires && internalWires.length > 0) {
        internalWires.forEach(wire => {
          const fromGate = internalGates?.find(g => g.id === wire.fromGate)
          const toGate = internalGates?.find(g => g.id === wire.toGate)

          if (fromGate && toGate) {
            const fromWidth = fromGate.width ?? 80
            const fromHeight = fromGate.height ?? 60
            const toHeight = toGate.height ?? 60

            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 2 / scale
            ctx.beginPath()
            ctx.moveTo(fromGate.x + fromWidth, fromGate.y + fromHeight / 2)
            ctx.bezierCurveTo(
              fromGate.x + fromWidth + 40,
              fromGate.y + fromHeight / 2,
              toGate.x - 40,
              toGate.y + toHeight / 2,
              toGate.x,
              toGate.y + toHeight / 2
            )
            ctx.stroke()
          }
        })
      }

      // Gatelarni chizish
      internalGates.forEach(gate => {
        const gateWidth = gate.width ?? 80
        const gateHeight = gate.height ?? 60

        ctx.fillStyle = '#334155'
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 2 / scale
        ctx.fillRect(gate.x, gate.y, gateWidth, gateHeight)
        ctx.strokeRect(gate.x, gate.y, gateWidth, gateHeight)

        ctx.fillStyle = '#ffffff'
        ctx.font = `${12 / scale}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(gate.type || 'GATE', gate.x + gateWidth / 2, gate.y + gateHeight / 2)
      })

      ctx.restore()
    }

    // Agar gatelar yo'q bo'lsa
    if (!internalGates || internalGates.length === 0) {
      ctx.fillStyle = '#64748b'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('No gates in this subcircuit', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }

  }, [internalGates, internalWires, internalBounds])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-6xl h-[90vh] rounded-2xl bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Square className="h-5 w-5 text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingSubcircuit?.name || 'Subcircuit Editor'}
              </h2>
              <p className="text-xs text-gray-400">
                {internalGates?.length || 0} gates, {internalWires?.length || 0} wires
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('Save clicked')
                // Save logic will be added
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Ports */}
          <div className="w-64 border-r border-slate-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Ports
            </h3>

            {/* Input ports */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Inputs ({tempPorts?.inputs?.length || 0})</p>
              <div className="space-y-1">
                {tempPorts?.inputs && tempPorts.inputs.length > 0 ? (
                  tempPorts.inputs.map((input, idx) => (
                    <div key={idx} className="px-2 py-1.5 rounded bg-slate-800 text-xs text-white">
                      {input.name || `IN${idx}`}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No inputs</p>
                )}
              </div>
            </div>

            {/* Output ports */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Outputs ({tempPorts?.outputs?.length || 0})</p>
              <div className="space-y-1">
                {tempPorts?.outputs && tempPorts.outputs.length > 0 ? (
                  tempPorts.outputs.map((output, idx) => (
                    <div key={idx} className="px-2 py-1.5 rounded bg-slate-800 text-xs text-white">
                      {output.name || `OUT${idx}`}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No outputs</p>
                )}
              </div>
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 flex items-center justify-center bg-slate-800/50 p-8">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="bg-slate-900 rounded-lg shadow-xl border border-slate-700"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FullModalMode

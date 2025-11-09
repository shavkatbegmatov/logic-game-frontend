import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Square, MousePointer, Move, Check, X, Info, Maximize2 } from 'lucide-react'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import useGameStore from '../../../store/gameStore'
import { createSubcircuitFromSelection } from '../../../engine/subcircuits'
import SoundManager from '../effects/SoundManager'

const VisualBoundaryCreate = ({ onComplete, onCancel }) => {
  const { creationData } = useSubcircuitEditorStore()
  const { gates, wires } = useGameStore()
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState(null)
  const [endPoint, setEndPoint] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)
  const [selectedGates, setSelectedGates] = useState([])
  const [moduleName, setModuleName] = useState('')
  const [step, setStep] = useState('drawing') // drawing | naming | complete
  const canvasRef = useRef(null)

  useEffect(() => {
    // Start visual selection mode
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e) => {
      if (e.shiftKey && e.altKey) {
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setStartPoint({ x, y })
        setIsDrawing(true)
        SoundManager.playClick()
      }
    }

    const handleMouseMove = (e) => {
      if (!isDrawing || !startPoint) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setEndPoint({ x, y })

      // Calculate selected area
      const area = {
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width: Math.abs(x - startPoint.x),
        height: Math.abs(y - startPoint.y)
      }
      setSelectedArea(area)

      // Find gates within the area
      const gatesInArea = gates.filter(gate => {
        // Simplified check - in real implementation would use actual gate positions
        return gate.x >= area.x && gate.x <= area.x + area.width &&
               gate.y >= area.y && gate.y <= area.y + area.height
      })
      setSelectedGates(gatesInArea)
    }

    const handleMouseUp = () => {
      if (isDrawing && selectedGates.length > 0) {
        setStep('naming')
        SoundManager.playSuccess()
      }
      setIsDrawing(false)
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDrawing, startPoint, gates])

  const handleCreateModule = () => {
    if (!moduleName.trim()) return

    // Get selected wires
    const selectedGateIds = new Set(selectedGates.map(g => g.id))
    const selectedWires = wires.filter(w =>
      selectedGateIds.has(w.fromGate) || selectedGateIds.has(w.toGate)
    )

    // Create subcircuit
    const template = createSubcircuitFromSelection(
      selectedGates,
      selectedWires,
      moduleName
    )

    if (template?.template) {
      template.template.icon = '📦'
      template.template.color = '#F97316'
      template.template.description = `Created from visual boundary selection (${selectedGates.length} gates)`

      setStep('complete')
      SoundManager.playSuccess()

      setTimeout(() => {
        onComplete(template.template)
      }, 1000)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'drawing' && (
        <motion.div
          key="drawing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          {/* Canvas overlay for drawing */}
          <div
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          >
            {/* Drawing area indicator */}
            {selectedArea && (
              <div
                className="absolute border-2 border-orange-400 bg-orange-400/10"
                style={{
                  left: selectedArea.x,
                  top: selectedArea.y,
                  width: selectedArea.width,
                  height: selectedArea.height
                }}
              >
                <div className="absolute -top-6 left-0 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  {selectedGates.length} gates selected
                </div>
              </div>
            )}
          </div>

          {/* Instructions panel */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-orange-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/20">
                <Square className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  Visual Boundary Mode
                  <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">Active</span>
                </h3>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <MousePointer className="h-3 w-3" />
                  Hold <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Shift</kbd>
                  +
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Alt</kbd>
                  and drag to select gates
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </motion.div>
      )}

      {step === 'naming' && (
        <motion.div
          key="naming"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/20">
                <Square className="h-6 w-6 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Name Your Module</h2>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Selected Components</span>
                <span className="text-lg font-bold text-orange-400">{selectedGates.length}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[...new Set(selectedGates.map(g => g.type))].map(type => (
                  <span key={type} className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-300">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Module Name</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="Enter a descriptive name..."
                className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5" />
                Choose a name that describes what this circuit does
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('drawing')}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-gray-400 hover:bg-white/5"
              >
                Back
              </button>
              <button
                onClick={handleCreateModule}
                disabled={!moduleName.trim()}
                className={`flex-1 rounded-lg px-4 py-2 text-white transition-all
                  ${moduleName.trim()
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-110'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
              >
                Create Module
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {step === 'complete' && (
        <motion.div
          key="complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.2, 1], rotate: 0 }}
            transition={{ duration: 0.5 }}
            className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-2xl"
          >
            <Check className="h-16 w-16 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute mt-48 text-center"
          >
            <p className="text-lg font-semibold text-white">Module Created!</p>
            <p className="mt-1 text-sm text-gray-400">{moduleName}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default VisualBoundaryCreate
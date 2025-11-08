import React from 'react'
import { Group, Rect } from 'react-konva'
import { motion } from 'framer-motion'
import { Edit } from 'lucide-react'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'
import { calculateSafeBounds } from '../../../engine/subcircuits'

const InlineCanvasMode = ({ onClose }) => {
  const { editingSubcircuit, updateInternalGateState } = useSubcircuitEditorStore(state => ({
    editingSubcircuit: state.editingSubcircuit,
    updateInternalGateState: state.updateInternalGateState
  }))

  if (!editingSubcircuit) {
    return null
  }

  const { internalCircuit } = editingSubcircuit
  const bounds = calculateSafeBounds(internalCircuit.gates, 100) // 100px padding

  const handleDragEnd = (e, gateId) => {
    updateInternalGateState(gateId, { x: e.target.x(), y: e.target.y() })
  }

  return (
    <>
      {/* Backdrop and UI */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose} // Close when clicking the backdrop
      />

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-4 rounded-lg bg-slate-800/80 p-3 shadow-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">
              Editing: <span className="text-cyan-400">{editingSubcircuit.name}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
          >
            Close Editor
          </button>
        </div>
      </div>

      {/* Konva Group for rendering the internal circuit */}
      <Group
        x={window.innerWidth / 2 - (bounds.width / 2)}
        y={window.innerHeight / 2 - (bounds.height / 2)}
        onClick={(e) => e.cancelBubble = true} // Prevent backdrop click
      >
        <Rect
          width={bounds.width}
          height={bounds.height}
          fill="rgba(15, 23, 42, 0.8)" // slate-900 with opacity
          stroke="#334155" // slate-700
          strokeWidth={2}
          cornerRadius={10}
          shadowColor="black"
          shadowBlur={20}
          shadowOpacity={0.5}
        />

        {/* Render Wires */}
        {internalCircuit.wires.map(wire => (
          <WireComponent
            key={wire.id}
            wire={wire}
            gates={internalCircuit.gates}
            isEditing
          />
        ))}

        {/* Render Gates */}
        {internalCircuit.gates.map(gate => (
          <PCBGateComponent
            key={gate.id}
            id={gate.id}
            type={gate.type}
            x={gate.x}
            y={gate.y}
            label={gate.label}
            isSelected={false} // Internal gates are not selectable in this mode
            isPreSelected={false}
            outputSignal={0} // Simplified view, no simulation
            onDragEnd={(e) => handleDragEnd(e, gate.id)}
            draggable
          />
        ))}
      </Group>
    </>
  )
}

export default InlineCanvasMode
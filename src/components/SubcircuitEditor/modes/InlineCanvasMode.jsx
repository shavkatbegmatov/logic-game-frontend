import React from 'react'
import { Group, Rect } from 'react-konva'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'
import { calculateSafeBounds } from '../../../engine/subcircuits'

const InlineCanvasMode = () => {
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

  // Prevent clicks inside the editor from propagating to the backdrop
  const handleGroupClick = (e) => {
    e.cancelBubble = true
  }

  return (
    <Group
      x={window.innerWidth / 2 - (bounds.width / 2)}
      y={window.innerHeight / 2 - (bounds.height / 2)}
      onClick={handleGroupClick}
    >
      <Rect
        width={bounds.width}
        height={bounds.height}
        fill="rgba(15, 23, 42, 0.85)" // slate-900 with opacity
        stroke="#334155" // slate-700
        strokeWidth={2}
        cornerRadius={16}
        shadowColor="black"
        shadowBlur={25}
        shadowOpacity={0.6}
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
  )
}

export default InlineCanvasMode
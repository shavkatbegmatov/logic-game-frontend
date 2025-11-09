import React from 'react'
import { Group, Rect } from 'react-konva'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'
import { calculateSafeBounds } from '../../../engine/validation'

const InlineCanvasMode = () => {
  const { editingSubcircuit, updateInternalGateState } = useSubcircuitEditorStore(state => ({
    editingSubcircuit: state.editingSubcircuit,
    updateInternalGateState: state.updateInternalGateState
  }))

  if (!editingSubcircuit) {
    return null
  }

  const { internalCircuit } = editingSubcircuit

  if (!internalCircuit || !internalCircuit.gates) {
    return null;
  }

  const bounds = calculateSafeBounds(internalCircuit.gates, 100) // 100px padding


  const handleDragEnd = (gateId, e) => {
    updateInternalGateState(gateId, { x: e.target.x(), y: e.target.y() })
  }

  // Prevent clicks inside the editor from propagating to the backdrop
  const handleGroupClick = (e) => {
    e.cancelBubble = true
  }

  const groupX = window.innerWidth / 2 - (bounds.width / 2);
  const groupY = window.innerHeight / 2 - (bounds.height / 2);


  return (
    <Group
      x={groupX}
      y={groupY}
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
        )
      )}

      {/* Render Gates */}
      {internalCircuit.gates.map(gate => (
        gate && <PCBGateComponent
          key={gate.id}
          gate={gate}
          isSelected={false}
          isPreSelected={false}
          outputSignal={0} // Simplified view, no simulation
          onDragEnd={handleDragEnd}
          onDragStart={() => {}}
          onDragMove={() => {}}
          onSelect={() => {}}
          onUpdateGate={() => {}}
          onWireStart={() => {}}
          onWireEnd={() => {}}
        />
      ))}
    </Group>
  )
}

export default InlineCanvasMode
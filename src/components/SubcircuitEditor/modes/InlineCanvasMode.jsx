import React, { useMemo } from 'react'
import { Group, Rect } from 'react-konva'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import { shallow } from 'zustand/shallow' // Import shallow
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'
import { calculateSafeBounds } from '../../../engine/validation'

const InlineCanvasMode = React.memo(() => { // Wrap with React.memo
  const { internalGates, internalWires, updateInternalGateState } = useSubcircuitEditorStore(state => ({
    internalGates: state.internalGates,
    internalWires: state.internalWires,
    updateInternalGateState: state.updateInternalGateState
  }), shallow) // Use shallow for comparison

  if (!internalGates || internalGates.length === 0) {
    return null;
  }

  // Memoize internal gates and wires to prevent unnecessary re-renders of children
  // Dependencies are now the internalGates/internalWires arrays themselves, which should be stable if content doesn't change
  const memoizedGates = useMemo(() => internalGates, [internalGates])
  const memoizedWires = useMemo(() => internalWires, [internalWires])

  const bounds = calculateSafeBounds(memoizedGates, 100) // 100px padding


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
      {memoizedWires.map(wire => (
          <WireComponent
            key={wire.id}
            wire={wire}
            gates={memoizedGates}
            isEditing
          />
        )
      )}

      {/* Render Gates */}
      {memoizedGates.map(gate => (
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
}) // End React.memo

export default InlineCanvasMode
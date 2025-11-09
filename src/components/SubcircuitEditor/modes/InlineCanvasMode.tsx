import React, { useMemo, useCallback } from 'react'
import { Group, Rect } from 'react-konva'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'
import { calculateSafeBounds } from '../../../engine/validation'

const InlineCanvasMode = React.memo(() => { // Wrap with React.memo
  // Separate store subscriptions to avoid re-creating objects
  const internalGates = useSubcircuitEditorStore(state => state.internalGates)
  const internalWires = useSubcircuitEditorStore(state => state.internalWires)
  const updateInternalGate = useSubcircuitEditorStore(state => state.updateInternalGate)

  // Memoize bounds calculation
  const bounds = useMemo(() => {
    if (!internalGates || internalGates.length === 0) {
      return { width: 400, height: 300, minX: 0, minY: 0, maxX: 400, maxY: 300 }
    }
    return calculateSafeBounds(internalGates)
  }, [internalGates])

  // Memoize handlers to prevent re-creating functions
  const handleDragEnd = useCallback((gateId, e) => {
    updateInternalGate(gateId, { x: e.target.x(), y: e.target.y() })
  }, [updateInternalGate])

  // Prevent clicks inside the editor from propagating to the backdrop
  const handleGroupClick = useCallback((e) => {
    e.cancelBubble = true
  }, [])

  // Empty handlers for editor mode (no interaction needed)
  const emptyHandler = useCallback(() => {}, [])

  if (!internalGates || internalGates.length === 0) {
    return null;
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
      {internalWires.map(wire => (
        <WireComponent
          key={wire.id}
          wire={wire}
          gates={internalGates}
          signal={0}
          isTemporary={false}
          draggingGate={null}
        />
      ))}

      {/* Render Gates */}
      {internalGates.map(gate => (
        gate && <PCBGateComponent
          key={gate.id}
          gate={gate}
          isSelected={false}
          isPreSelected={false}
          outputSignal={0} // Simplified view, no simulation
          onDragEnd={handleDragEnd}
          onDragStart={emptyHandler}
          onDragMove={emptyHandler}
          onSelect={emptyHandler}
          onUpdateGate={emptyHandler}
          onWireStart={emptyHandler}
          onWireEnd={emptyHandler}
        />
      ))}
    </Group>
  )
}) // End React.memo

export default InlineCanvasMode

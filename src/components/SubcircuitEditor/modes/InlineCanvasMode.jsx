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

  console.log('[InlineCanvasMode] Render:', {
    gatesCount: internalGates?.length || 0,
    wiresCount: internalWires?.length || 0,
    gates: internalGates,
    gatePositions: internalGates?.map(g => ({ id: g.id, type: g.type, x: g.x, y: g.y }))
  })

  // Memoize bounds calculation
  const bounds = useMemo(() => {
    if (!internalGates || internalGates.length === 0) {
      console.log('[InlineCanvasMode] No gates found, using default bounds')
      return { width: 400, height: 300, minX: 0, minY: 0, maxX: 400, maxY: 300 }
    }
    const calculatedBounds = calculateSafeBounds(internalGates, 100)
    console.log('[InlineCanvasMode] Calculated bounds:', calculatedBounds)
    return calculatedBounds
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

  console.log('[InlineCanvasMode] Rendering Group:', {
    groupX,
    groupY,
    bounds,
    windowSize: { width: window.innerWidth, height: window.innerHeight }
  })

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
            isEditing
          />
        )
      )}

      {/* Render Gates */}
      {internalGates.map(gate => {
        console.log('[InlineCanvasMode] Rendering gate:', gate?.id, gate?.type, `x:${gate?.x} y:${gate?.y}`)
        return gate && <PCBGateComponent
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
      })}
    </Group>
  )
}) // End React.memo

export default InlineCanvasMode
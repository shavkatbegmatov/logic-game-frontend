import React, { useMemo, useCallback } from 'react'
import { Group, Rect, Circle, Text } from 'react-konva'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'
import { calculateSafeBounds } from '../../../engine/validation'
import { GateTypes } from '../../../engine/gates'

// Port visualization component
const PortComponent = ({ gate, onDragEnd }) => {
  const isInput = gate.type === GateTypes.INPUT

  return (
    <Group
      x={gate.x}
      y={gate.y}
      draggable
      onDragEnd={(e) => onDragEnd(gate.id, e)}
    >
      {/* Pin Body */}
      <Rect
        x={0}
        y={0}
        width={gate.width}
        height={gate.height}
        fill="#B45309" // Dark gold/copper
        cornerRadius={4}
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
      />

      {/* Metallic Gradient Effect (Simulated with overlay) */}
      <Rect
        x={2}
        y={2}
        width={gate.width - 4}
        height={gate.height / 2}
        fill="white"
        opacity={0.1}
        cornerRadius={2}
        listening={false}
      />

      {/* Connection Point */}
      <Circle
        x={isInput ? gate.width : 0}
        y={gate.height / 2}
        radius={6}
        fill="#FCD34D" // Light gold
        stroke="#78350F" // Dark brown border
        strokeWidth={2}
      />

      {/* Label */}
      <Text
        text={isInput ? "IN" : "OUT"}
        x={0}
        y={0}
        width={gate.width}
        height={gate.height}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fontFamily="monospace"
        fontStyle="bold"
        fill="white"
        shadowColor="black"
        shadowBlur={2}
      />
    </Group>
  )
}

const InlineCanvasMode = React.memo(() => {
  // Separate store subscriptions to avoid re-creating objects
  const internalGates = useSubcircuitEditorStore(state => state.internalGates)
  const internalWires = useSubcircuitEditorStore(state => state.internalWires)
  const updateInternalGate = useSubcircuitEditorStore(state => state.updateInternalGate)

  // Memoize bounds calculation
  const bounds = useMemo(() => {
    if (!internalGates || internalGates.length === 0) {
      return { width: 400, height: 300, minX: 0, minY: 0, maxX: 400, maxY: 300 }
    }
    return calculateSafeBounds(internalGates, 100)
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
  const emptyHandler = useCallback(() => { }, [])

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
          isEditing
        />
      )
      )}

      {/* Render Gates */}
      {internalGates.map(gate => {
        if (!gate) return null

        // Use PortComponent for INPUT and OUTPUT gates
        if (gate.type === GateTypes.INPUT || gate.type === GateTypes.OUTPUT) {
          return (
            <PortComponent
              key={gate.id}
              gate={gate}
              onDragEnd={handleDragEnd}
            />
          )
        }

        // Use standard component for logic gates
        return (
          <PCBGateComponent
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
        )
      })}
    </Group>
  )
})

export default InlineCanvasMode
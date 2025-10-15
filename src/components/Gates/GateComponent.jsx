import React from 'react'
import { Group, Rect, Text, Circle } from 'react-konva'
import { GateTypes, gateConfigs } from '../../engine/gates'

const GateComponent = ({
  gate,
  isSelected,
  onDragMove,
  onDragEnd,
  onSelect,
  onWireStart,
  onWireEnd,
  outputSignal
}) => {
  const config = gateConfigs[gate.type]

  // Kirish/chiqish nuqtalarini hisoblash
  const getInputPositions = () => {
    const positions = []
    const inputCount = config.maxInputs || 2
    const spacing = gate.height / (inputCount + 1)

    for (let i = 0; i < inputCount; i++) {
      positions.push({
        x: gate.x - 5,
        y: gate.y + spacing * (i + 1)
      })
    }
    return positions
  }

  const getOutputPositions = () => {
    if (gate.type === GateTypes.OUTPUT) return []

    return [{
      x: gate.x + gate.width + 5,
      y: gate.y + gate.height / 2
    }]
  }

  const inputPositions = getInputPositions()
  const outputPositions = getOutputPositions()

  // Gate rangini aniqlash
  const getFillColor = () => {
    if (gate.type === GateTypes.INPUT) {
      return gate.value === 1 ? '#22C55E' : '#6B7280'
    }
    if (gate.type === GateTypes.OUTPUT) {
      return outputSignal === 1 ? '#22C55E' : '#6B7280'
    }
    return config.color
  }

  const handleClick = (e) => {
    e.cancelBubble = true

    // INPUT gate uchun qiymatni almashtirish
    if (gate.type === GateTypes.INPUT) {
      const newValue = gate.value === 1 ? 0 : 1
      // Bu yerda updateGate funksiyasini chaqirish kerak
      onSelect()
    } else {
      onSelect()
    }
  }

  return (
    <Group
      x={gate.x}
      y={gate.y}
      draggable={true}
      onDragMove={(e) => {
        onDragMove(gate.id, {
          x: e.target.x(),
          y: e.target.y()
        })
      }}
      onDragEnd={(e) => {
        onDragEnd(gate.id, {
          x: e.target.x(),
          y: e.target.y()
        })
      }}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Gate tanasi */}
      <Rect
        width={gate.width}
        height={gate.height}
        fill={getFillColor()}
        stroke={isSelected ? '#1F2937' : '#9CA3AF'}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={8}
        shadowBlur={5}
        shadowOpacity={0.2}
      />

      {/* Gate belgisi */}
      <Text
        text={config.symbol}
        width={gate.width}
        height={gate.height}
        align="center"
        verticalAlign="middle"
        fontSize={gate.type === GateTypes.NOT ? 24 : 20}
        fontFamily="monospace"
        fontStyle="bold"
        fill="white"
      />

      {/* Kirish nuqtalari */}
      {gate.type !== GateTypes.INPUT && inputPositions.map((pos, index) => (
        <Circle
          key={`input-${index}`}
          x={pos.x - gate.x}
          y={pos.y - gate.y}
          radius={6}
          fill="rgba(8,15,30,0.92)"
          stroke="rgba(56,189,248,0.65)"
          strokeWidth={1.5}
          shadowBlur={6}
          shadowOpacity={0.35}
          shadowColor="rgba(56,189,248,0.65)"
          onMouseEnter={(e) => {
            e.target.radius(8)
            e.target.getLayer().batchDraw()
          }}
          onMouseLeave={(e) => {
            e.target.radius(6)
            e.target.getLayer().batchDraw()
          }}
          onMouseDown={(e) => {
            e.cancelBubble = true
          }}
          onMouseUp={(e) => {
            e.cancelBubble = true
            onWireEnd(gate.id, 'input', index)
          }}
          onTouchEnd={(e) => {
            e.cancelBubble = true
            onWireEnd(gate.id, 'input', index)
          }}
        />
      ))}

      {/* Chiqish nuqtalari */}
      {outputPositions.map((pos, index) => (
        <Circle
          key={`output-${index}`}
          x={pos.x - gate.x}
          y={pos.y - gate.y}
          radius={6}
          fill={outputSignal === 1 ? '#22C55E' : 'rgba(8,15,30,0.92)'}
          stroke={outputSignal === 1 ? '#34D399' : 'rgba(99,102,241,0.6)'}
          strokeWidth={1.5}
          shadowBlur={outputSignal === 1 ? 10 : 6}
          shadowOpacity={outputSignal === 1 ? 0.6 : 0.25}
          shadowColor={outputSignal === 1 ? 'rgba(34,197,94,0.8)' : 'rgba(129,140,248,0.6)'}
          onMouseEnter={(e) => {
            e.target.radius(8)
            e.target.getLayer().batchDraw()
          }}
          onMouseLeave={(e) => {
            e.target.radius(6)
            e.target.getLayer().batchDraw()
          }}
          onMouseDown={(e) => {
            e.cancelBubble = true
            onWireStart(gate.id, 'output', index)
          }}
        />
      ))}

      {/* Gate nomi (debug uchun) */}
      {false && (
        <Text
          text={gate.type}
          y={-20}
          fontSize={12}
          fill="#6B7280"
        />
      )}
    </Group>
  )
}

export default GateComponent

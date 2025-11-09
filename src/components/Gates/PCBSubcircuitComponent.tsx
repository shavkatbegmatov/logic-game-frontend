import React, { useRef, useState, useEffect } from 'react'
import { Group, Rect, Text, Circle, Line } from 'react-konva'

const PCBSubcircuitComponent = ({
  gate,
  isSelected,
  onDragMove,
  onDragEnd,
  onSelect,
  onUpdateGate,
  onWireStart,
  onWireEnd,
  onDoubleClick,
  outputSignals = []
}) => {
  const groupRef = useRef()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // IC chip style parametrlari
  const chipWidth = gate.width || 120
  const chipHeight = gate.height || 100
  const pinSize = 8
  const pinSpacing = 20
  const notchSize = 10

  // Port pozitsiyalarini hisoblash
  const inputPorts = gate.inputPorts || []
  const outputPorts = gate.outputPorts || []

  const maxPins = Math.max(inputPorts.length, outputPorts.length)
  const actualHeight = Math.max(chipHeight, (maxPins + 1) * pinSpacing)

  // Pin pozitsiyalarini yaratish
  const getInputPinPosition = (index: number) => ({
    x: -pinSize,
    y: pinSpacing + index * pinSpacing
  })

  const getOutputPinPosition = (index: number) => ({
    x: chipWidth + pinSize,
    y: pinSpacing + index * pinSpacing
  })

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragMove = (e) => {
    const node = groupRef.current
    if (node) {
      const newPos = {
        x: node.x(),
        y: node.y()
      }
      onDragMove && onDragMove(gate.id, newPos)
    }
  }

  const handleDragEndInternal = (e) => {
    setIsDragging(false)
    const node = groupRef.current
    if (node) {
      const newPos = {
        x: node.x(),
        y: node.y()
      }
      onDragEnd && onDragEnd(gate.id, newPos)
    }
  }

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(gate)
    }
  }

  // Input/Output connection handlers
  const handleInputMouseDown = (index) => (e) => {
    e.cancelBubble = true
    onWireEnd && onWireEnd(gate.id, 'input', index)
  }

  const handleOutputMouseDown = (index) => (e) => {
    e.cancelBubble = true
    onWireStart && onWireStart(gate.id, 'output', index)
  }

  const handleInputMouseUp = (index) => (e) => {
    e.cancelBubble = true
    onWireEnd && onWireEnd(gate.id, 'input', index)
  }

  const handleOutputMouseUp = (index) => (e) => {
    e.cancelBubble = true
    // Output'ga wire tugamaydi
  }

  return (
    <Group
      ref={groupRef}
      x={gate.x}
      y={gate.y}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEndInternal}
      onClick={onSelect}
      onDblClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* IC Chip Shadow */}
      <Rect
        x={2}
        y={2}
        width={chipWidth}
        height={actualHeight}
        fill="rgba(0, 0, 0, 0.3)"
        cornerRadius={4}
      />

      {/* IC Chip Body */}
      <Rect
        x={0}
        y={0}
        width={chipWidth}
        height={actualHeight}
        fill="#2a2a2a"
        stroke={isSelected ? '#60a5fa' : '#4a4a4a'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor="#60a5fa"
      />

      {/* IC Chip Top Surface */}
      <Rect
        x={4}
        y={4}
        width={chipWidth - 8}
        height={actualHeight - 8}
        fill="linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)"
        stroke="#555"
        strokeWidth={0.5}
        cornerRadius={2}
      />

      {/* Orientation Notch */}
      <Circle
        x={chipWidth / 2}
        y={0}
        radius={notchSize / 2}
        fill="#1a1a1a"
      />

      {/* IC Label */}
      <Text
        x={chipWidth / 2}
        y={actualHeight / 2 - 10}
        text={gate.icon || 'SC'}
        fontSize={16}
        fontFamily="monospace"
        fontStyle="bold"
        fill="#fff"
        align="center"
        verticalAlign="middle"
        shadowBlur={2}
        shadowColor="#000"
      />

      {/* IC Name */}
      <Text
        x={chipWidth / 2}
        y={actualHeight / 2 + 10}
        text={gate.name || 'Subcircuit'}
        fontSize={10}
        fontFamily="monospace"
        fill="#888"
        align="center"
        verticalAlign="middle"
      />

      {/* Input Pins */}
      {inputPorts.map((port, index) => {
        const pos = getInputPinPosition(index)
        const hasSignal = gate.inputs && gate.inputs[index] === 1

        return (
          <Group key={`input-${index}`}>
            {/* Pin Line */}
            <Line
              points={[pos.x + pinSize, pos.y, 0, pos.y]}
              stroke="#888"
              strokeWidth={2}
            />

            {/* Pin Circle */}
            <Circle
              x={pos.x}
              y={pos.y}
              radius={pinSize / 2}
              fill={hasSignal ? '#22d3ee' : '#374151'}
              stroke="#888"
              strokeWidth={1}
              onMouseDown={handleInputMouseDown(index)}
              onMouseUp={handleInputMouseUp(index)}
              shadowBlur={hasSignal ? 8 : 0}
              shadowColor="#22d3ee"
            />

            {/* Pin Number */}
            <Text
              x={pos.x - 20}
              y={pos.y - 5}
              text={`${index + 1}`}
              fontSize={8}
              fill="#666"
              align="center"
            />

            {/* Pin Label */}
            <Text
              x={pos.x - 35}
              y={pos.y - 5}
              text={port.name}
              fontSize={8}
              fill="#888"
              align="right"
            />
          </Group>
        )
      })}

      {/* Output Pins */}
      {outputPorts.map((port, index) => {
        const pos = getOutputPinPosition(index)
        const hasSignal = outputSignals[index] === 1

        return (
          <Group key={`output-${index}`}>
            {/* Pin Line */}
            <Line
              points={[chipWidth, pos.y, pos.x - pinSize, pos.y]}
              stroke="#888"
              strokeWidth={2}
            />

            {/* Pin Circle */}
            <Circle
              x={pos.x}
              y={pos.y}
              radius={pinSize / 2}
              fill={hasSignal ? '#10b981' : '#374151'}
              stroke="#888"
              strokeWidth={1}
              onMouseDown={handleOutputMouseDown(index)}
              onMouseUp={handleOutputMouseUp(index)}
              shadowBlur={hasSignal ? 8 : 0}
              shadowColor="#10b981"
            />

            {/* Pin Number */}
            <Text
              x={pos.x + 20}
              y={pos.y - 5}
              text={`${outputPorts.length * 2 - index}`}
              fontSize={8}
              fill="#666"
              align="center"
            />

            {/* Pin Label */}
            <Text
              x={pos.x + 35}
              y={pos.y - 5}
              text={port.name}
              fontSize={8}
              fill="#888"
              align="left"
            />
          </Group>
        )
      })}

      {/* Status LED */}
      <Circle
        x={chipWidth - 10}
        y={10}
        radius={3}
        fill={isHovered ? '#22d3ee' : '#374151'}
        shadowBlur={isHovered ? 6 : 0}
        shadowColor="#22d3ee"
      />

      {/* VDD and GND labels */}
      <Text
        x={5}
        y={actualHeight - 12}
        text="GND"
        fontSize={6}
        fill="#666"
      />
      <Text
        x={chipWidth - 20}
        y={actualHeight - 12}
        text="VDD"
        fontSize={6}
        fill="#666"
      />

      {/* Hover/Selected Effect */}
      {(isHovered || isSelected) && (
        <Rect
          x={-2}
          y={-2}
          width={chipWidth + 4}
          height={actualHeight + 4}
          stroke={isSelected ? '#60a5fa' : '#818cf8'}
          strokeWidth={1}
          cornerRadius={6}
          fill="transparent"
          dash={[5, 5]}
          opacity={0.5}
        />
      )}
    </Group>
  )
}

export default PCBSubcircuitComponent
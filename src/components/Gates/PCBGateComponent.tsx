import React, { useEffect, useState } from 'react'
import { Group, Rect, Text, Circle, Line, Ring, RegularPolygon } from 'react-konva'
import { GateTypes, gateConfigs } from '@/engine/gates.ts'
import { SPACE_COLORS } from '@/constants/spaceTheme.ts'
import useSound from '../../hooks/useSound'

const log = (message: any, ...args: any[]) => console.log(`%c[GATE] ${message}`, 'color: #FF9800;', ...args);

const PCBGateComponent = ({
  gate,
  isSelected,
  isPreSelected, // To show highlighting during selection drawing
  onDragStart,
  onDragMove,
  onDragEnd,
  onSelect,
  onUpdateGate,
  onWireStart,
  onWireEnd,
  outputSignal
}) => {
  const config = gateConfigs[gate.type]
  const [isHovered, setIsHovered] = useState(false)
  const [pulseAnimation, setPulseAnimation] = useState(0)
  const { playSound } = useSound()

  // Komponent holati o'zgarganda log yozish
  useEffect(() => {
    log(`'${gate.type}_${gate.id}' holati yangilandi`, { isSelected, isPreSelected, outputSignal });
  }, [gate.id, gate.type, isSelected, isPreSelected, outputSignal]);

  // Komponent birinchi marta o'rnatilganda log yozish
  useEffect(() => {
    log(`'${gate.type}_${gate.id}' komponenti o'rnatildi (mounted).`);
    return () => {
      log(`'${gate.type}_${gate.id}' komponenti o'chirildi (unmounted).`);
    }
  }, [gate.id, gate.type]);


  // PCB renglari
  const gateTheme = SPACE_COLORS.gates[gate.type] || SPACE_COLORS.gates.AND

  // Animatsiya uchun
  useEffect(() => {
    if (outputSignal === 1 || (gate.type === GateTypes.INPUT && gate.value === 1)) {
      const interval = setInterval(() => {
        setPulseAnimation(prev => (prev + 1) % 360)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [outputSignal, gate.value, gate.type])

  // Kirish/chiqish nuqtalarini hisoblash
  const getInputPositions = () => {
    const positions = []
    const inputCount = config.maxInputs || 2
    const spacing = gate.height / (inputCount + 1)

    for (let i = 0; i < inputCount; i++) {
      positions.push({
        x: gate.x - 10,
        y: gate.y + spacing * (i + 1)
      })
    }
    return positions
  }

  const getOutputPositions = () => {
    if (gate.type === GateTypes.OUTPUT) return []

    return [{
      x: gate.x + gate.width + 10,
      y: gate.y + gate.height / 2
    }]
  }

  const inputPositions = getInputPositions()
  const outputPositions = getOutputPositions()

  // Gate holatiga qarab rang
  const getMainColor = () => {
    const isActive = (gate.type === GateTypes.INPUT && gate.value === 1) ||
                     (gate.type === GateTypes.OUTPUT && outputSignal === 1) ||
                     (gate.type === GateTypes.CLOCK && gate.value === 1)

    return isActive ? gateTheme.glow : gateTheme.base
  }

  const handleClick = (e: any) => {
    e.cancelBubble = true
    log(`'${gate.type}_${gate.id}' bosildi (click).`);

    // Play click sound
    playSound('gateClick')

    if (gate.type === GateTypes.INPUT) {
      const newValue = gate.value === 1 ? 0 : 1
      log(`   - INPUT qiymati o'zgartirildi: ${newValue}`);
      onUpdateGate(gate.id, { value: newValue })
      onSelect(e) // Event uzatish - multi-selection uchun
    } else if (gate.type === GateTypes.CLOCK) {
      playSound('clockTick')
      onSelect(e) // Event uzatish - multi-selection uchun
    } else {
      onSelect(e) // Event uzatish - multi-selection uchun
    }
  }

  return (
    <Group
      x={gate.x}
      y={gate.y}
      draggable={true}
      onDragStart={(e) => onDragStart(gate.id, e)}
      onDragMove={(e) => onDragMove(gate.id, e)}
      onDragEnd={(e) => onDragEnd(gate.id, e)}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <Ring
          x={gate.width / 2}
          y={gate.height / 2}
          innerRadius={gate.width / 1.8}
          outerRadius={gate.width / 1.8 + 3}
          fill={SPACE_COLORS.ui.selectionGlow}
          shadowBlur={15}
          shadowColor={SPACE_COLORS.ui.selectionGlow}
          shadowOpacity={1}
          listening={false} // Don't block mouse events
        />
      )}

      {/* PCB Board Shadow */}
      <Rect
        x={2}
        y={2}
        width={gate.width}
        height={gate.height}
        fill="black"
        opacity={0.3}
        cornerRadius={4}
      />

      {/* PCB Board Base */}
      <Rect
        width={gate.width}
        height={gate.height}
        fill={SPACE_COLORS.pcbDarkGreen}
        stroke={
          isPreSelected ? SPACE_COLORS.ui.selectionGlow :
          (isSelected ? gateTheme.trace : SPACE_COLORS.copperTrace)
        }
        strokeWidth={isPreSelected || isSelected ? 2.5 : 2}
        cornerRadius={4}
        shadowBlur={isHovered || isPreSelected ? 15 : 8}
        shadowColor={isPreSelected ? SPACE_COLORS.ui.selectionGlow : getMainColor()}
        shadowOpacity={isHovered ? 0.8 : 0.4}
      />

      {/* Circuit Pattern */}
      <Group opacity={0.3}>
        <Line
          points={[5, gate.height/2, gate.width-5, gate.height/2]}
          stroke={SPACE_COLORS.copperTrace}
          strokeWidth={1}
        />
        <Line
          points={[gate.width/2, 5, gate.width/2, gate.height-5]}
          stroke={SPACE_COLORS.copperTrace}
          strokeWidth={1}
        />
      </Group>

      {/* IC Chip Rectangle */}
      <Rect
        x={10}
        y={10}
        width={gate.width - 20}
        height={gate.height - 20}
        fill={getMainColor()}
        stroke={gateTheme.trace}
        strokeWidth={1}
        cornerRadius={2}
        shadowBlur={5}
        shadowColor={getMainColor()}
        shadowOpacity={0.5}
      />

      {/* IC Chip Text */}
      <Text
        text={config.symbol}
        x={10}
        y={10}
        width={gate.width - 20}
        height={gate.height - 20}
        align="center"
        verticalAlign="middle"
        fontSize={gate.type === GateTypes.NOT ? 22 : 18}
        fontFamily="Orbitron, monospace"
        fontStyle="bold"
        fill={SPACE_COLORS.starWhite}
        shadowBlur={3}
        shadowColor={gateTheme.led}
        shadowOpacity={0.8}
      />

      {/* LED Indicator for all gates */}
      <Group>
        {/* LED Base */}
        <Circle
          x={gate.width / 2}
          y={-8}
          radius={6}
          fill="black"
          opacity={0.5}
        />

        {/* LED Ring */}
        <Ring
          x={gate.width / 2}
          y={-8}
          innerRadius={4}
          outerRadius={6}
          fill={SPACE_COLORS.silverSolder}
          opacity={0.8}
        />

        {/* LED Light */}
        <Circle
          x={gate.width / 2}
          y={-8}
          radius={4}
          fill={
            (gate.type === GateTypes.INPUT && gate.value === 1) ||
            (gate.type === GateTypes.OUTPUT && outputSignal === 1) ||
            (gate.type === GateTypes.CLOCK && gate.value === 1) ||
            (outputSignal === 1)
              ? gateTheme.led
              : '#2C2C2C'
          }
          shadowBlur={
            (gate.type === GateTypes.INPUT && gate.value === 1) ||
            (gate.type === GateTypes.OUTPUT && outputSignal === 1) ||
            (gate.type === GateTypes.CLOCK && gate.value === 1) ||
            (outputSignal === 1)
              ? 15
              : 0
          }
          shadowColor={gateTheme.led}
          shadowOpacity={0.9}
          opacity={
            (gate.type === GateTypes.INPUT && gate.value === 1) ||
            (gate.type === GateTypes.OUTPUT && outputSignal === 1) ||
            (gate.type === GateTypes.CLOCK && gate.value === 1) ||
            (outputSignal === 1)
              ? Math.sin(pulseAnimation * Math.PI / 180) * 0.3 + 0.7
              : 0.6
          }
        />

        {/* LED Bright Spot */}
        {((gate.type === GateTypes.INPUT && gate.value === 1) ||
          (gate.type === GateTypes.OUTPUT && outputSignal === 1) ||
          (gate.type === GateTypes.CLOCK && gate.value === 1) ||
          (outputSignal === 1)) && (
          <Circle
            x={gate.width / 2 - 1}
            y={-9}
            radius={1}
            fill="white"
            opacity={0.9}
          />
        )}
      </Group>

      {/* Pin Labels */}
      {gate.type !== GateTypes.NOT && (
        <Group opacity={0.6}>
          <Text
            text="Vcc"
            x={5}
            y={2}
            fontSize={8}
            fill={SPACE_COLORS.ui.textSecondary}
            fontFamily="monospace"
          />
          <Text
            text="GND"
            x={gate.width - 25}
            y={gate.height - 10}
            fontSize={8}
            fill={SPACE_COLORS.ui.textSecondary}
            fontFamily="monospace"
          />
        </Group>
      )}

      {/* Input Connectors - Gold Plated Pins */}
      {gate.type !== GateTypes.INPUT && inputPositions.map((pos, index) => (
        <Group key={`input-${index}`}>
          {/* Pin Shadow */}
          <Circle
            x={pos.x - gate.x + 1}
            y={pos.y - gate.y + 1}
            radius={7}
            fill="black"
            opacity={0.3}
          />

          {/* Gold Pin Base */}
          <Circle
            x={pos.x - gate.x}
            y={pos.y - gate.y}
            radius={7}
            fill={SPACE_COLORS.goldContact}
            stroke={SPACE_COLORS.copperTrace}
            strokeWidth={1}
            shadowBlur={4}
            shadowColor={SPACE_COLORS.goldContact}
            shadowOpacity={0.5}
          />

          {/* Pin Center */}
          <Circle
            x={pos.x - gate.x}
            y={pos.y - gate.y}
            radius={4}
            fill="#1A1A1A"
            stroke={SPACE_COLORS.goldContact}
            strokeWidth={1}
            onMouseEnter={(e) => {
              const circle = e.target as any
              circle.radius(5)
              circle.fill(SPACE_COLORS.goldContact)
              e.target.getLayer()?.batchDraw()
            }}
            onMouseLeave={(e) => {
              const circle = e.target as any
              circle.radius(4)
              circle.fill('#1A1A1A')
              e.target.getLayer()?.batchDraw()
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
        </Group>
      ))}

      {/* Output Connectors - Gold Plated Pins */}
      {outputPositions.map((pos, index) => (
        <Group key={`output-${index}`}>
          {/* Pin Shadow */}
          <Circle
            x={pos.x - gate.x + 1}
            y={pos.y - gate.y + 1}
            radius={7}
            fill="black"
            opacity={0.3}
          />

          {/* Gold Pin Base */}
          <Circle
            x={pos.x - gate.x}
            y={pos.y - gate.y}
            radius={7}
            fill={SPACE_COLORS.goldContact}
            stroke={SPACE_COLORS.copperTrace}
            strokeWidth={1}
            shadowBlur={outputSignal === 1 ? 12 : 4}
            shadowColor={outputSignal === 1 ? gateTheme.led : SPACE_COLORS.goldContact}
            shadowOpacity={outputSignal === 1 ? 0.8 : 0.5}
          />

          {/* Pin Center */}
          <Circle
            x={pos.x - gate.x}
            y={pos.y - gate.y}
            radius={4}
            fill={outputSignal === 1 ? gateTheme.led : '#1A1A1A'}
            stroke={SPACE_COLORS.goldContact}
            strokeWidth={1}
            opacity={outputSignal === 1 ? Math.sin(pulseAnimation * Math.PI / 180) * 0.3 + 0.7 : 1}
            onMouseEnter={(e) => {
              const circle = e.target as any
              circle.radius(5)
              e.target.getLayer()?.batchDraw()
            }}
            onMouseLeave={(e) => {
              const circle = e.target as any
              circle.radius(4)
              e.target.getLayer()?.batchDraw()
            }}
            onMouseDown={(e) => {
              e.cancelBubble = true
              onWireStart(gate.id, 'output', index)
            }}
          />

          {/* Signal Indicator Ring */}
          {outputSignal === 1 && (
            <Ring
              x={pos.x - gate.x}
              y={pos.y - gate.y}
              innerRadius={6}
              outerRadius={8 + Math.sin(pulseAnimation * Math.PI / 180) * 2}
              fill={gateTheme.led}
              opacity={0.3}
            />
          )}
        </Group>
      ))}

      {/* 3D Effect Top Highlight */}
      <Rect
        width={gate.width - 4}
        x={2}
        y={2}
        height={15}
        fill="white"
        opacity={0.1}
        cornerRadius={2}
      />
    </Group>
  )
}

export default PCBGateComponent
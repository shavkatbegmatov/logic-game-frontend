import React, { useEffect, useState } from 'react'
import { Line, Group, Circle } from 'react-konva'
import { gateConfigs } from '@/engine/gates.ts'
import { SPACE_COLORS } from '@/constants/spaceTheme.ts'

const SpaceWireComponent = ({ wire, gates, signal, isSimulating, isTemporary, draggedItems = {} }) => {
  const [animationOffset, setAnimationOffset] = useState(0)
  const [particlePositions, setParticlePositions] = useState([])

  // Animation loop for energy flow
  useEffect(() => {
    if (!signal || isTemporary) return

    const interval = setInterval(() => {
      setAnimationOffset(prev => (prev + 2) % 100)

      // Generate random particle positions along the wire
      if (Math.random() > 0.7) {
        const t = Math.random()
        setParticlePositions(prev => [...prev.slice(-5), t])
      }
    }, 50)

    return () => clearInterval(interval)
  }, [signal, isTemporary])

  // Calculate wire start and end points
  const getWirePoints = () => {
    if (isTemporary) {
      return createBezierPoints(wire.startX, wire.startY, wire.endX, wire.endY)
    }

    let fromGate = gates.find(g => g.id === wire.fromGate)
    let toGate = gates.find(g => g.id === wire.toGate)

    if (!fromGate || !toGate) return []

    // Handle dragging gates
    const fromGateDraggedPosition = draggedItems[fromGate.id]
    if (fromGateDraggedPosition) {
      fromGate = { ...fromGate, x: fromGateDraggedPosition.x, y: fromGateDraggedPosition.y }
    }

    const toGateDraggedPosition = draggedItems[toGate.id]
    if (toGateDraggedPosition) {
      toGate = { ...toGate, x: toGateDraggedPosition.x, y: toGateDraggedPosition.y }
    }

    // Output point (from)
    const fromX = fromGate.x + fromGate.width + 10
    const fromY = fromGate.y + fromGate.height / 2

    // Input point (to)
    const toConfig = gateConfigs[toGate.type]
    const inputCount = toConfig.maxInputs || 2
    const spacing = toGate.height / (inputCount + 1)
    const toX = toGate.x - 10
    const toY = toGate.y + spacing * ((wire.toIndex || 0) + 1)

    return createBezierPoints(fromX, fromY, toX, toY)
  }

  // Create smooth Bezier curve
  const createBezierPoints = (x1, y1, x2, y2) => {
    const points = []
    const steps = 30
    const distance = Math.abs(x2 - x1)
    const controlOffset = Math.min(distance * 0.4, 120)

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const cx1 = x1 + controlOffset
      const cy1 = y1
      const cx2 = x2 - controlOffset
      const cy2 = y2

      // Cubic Bezier formula
      const x = Math.pow(1 - t, 3) * x1 +
        3 * Math.pow(1 - t, 2) * t * cx1 +
        3 * (1 - t) * Math.pow(t, 2) * cx2 +
        Math.pow(t, 3) * x2

      const y = Math.pow(1 - t, 3) * y1 +
        3 * Math.pow(1 - t, 2) * t * cy1 +
        3 * (1 - t) * Math.pow(t, 2) * cy2 +
        Math.pow(t, 3) * y2

      points.push(x, y)
    }

    return points
  }

  // Get point on bezier curve at position t (0-1)
  const getPointOnCurve = (t) => {
    const points = getWirePoints()
    if (!points || points.length === 0) return { x: 0, y: 0 }

    const index = Math.floor(t * (points.length / 2 - 1))
    return {
      x: points[index * 2],
      y: points[index * 2 + 1]
    }
  }

  const points = getWirePoints()
  if (points.length === 0) return null

  const wireIsActive = !isTemporary && signal === 1

  // Wire style based on state
  const getWireStyle = () => {
    if (isTemporary) {
      return {
        stroke: SPACE_COLORS.ui.textSecondary,
        strokeWidth: 2,
        dash: [8, 8],
        opacity: 0.7,
        shadowBlur: 5,
        shadowColor: SPACE_COLORS.effects.glowColor
      }
    }

    if (wireIsActive) {
      return {
        stroke: SPACE_COLORS.signalActive,
        strokeWidth: 3,
        shadowBlur: 20,
        shadowColor: SPACE_COLORS.signalActive,
        opacity: 1
      }
    }

    return {
      stroke: SPACE_COLORS.copperTrace,
      strokeWidth: 2,
      shadowBlur: 0,
      opacity: 0.4
    }
  }

  const wireStyle = getWireStyle()

  return (
    <Group>
      {/* PCB Trace background */}
      <Line
        points={points}
        stroke={SPACE_COLORS.pcbDarkGreen}
        strokeWidth={6}
        opacity={0.3}
        lineCap="round"
        lineJoin="round"
      />

      {/* Copper trace */}
      <Line
        points={points}
        stroke={SPACE_COLORS.copperTrace}
        strokeWidth={4}
        opacity={0.6}
        lineCap="round"
        lineJoin="round"
      />

      {/* Main wire */}
      <Line
        points={points}
        {...wireStyle}
        lineCap="round"
        lineJoin="round"
        tension={0}
      />

      {/* Energy flow animation when active */}
      {wireIsActive && !isTemporary && (
        <>
          {/* Plasma flow effect */}
          <Line
            points={points}
            stroke="url(#plasmaGradient)"
            strokeWidth={2}
            opacity={0.9}
            dash={[20, 10]}
            dashOffset={-animationOffset * 2}
            lineCap="round"
            shadowBlur={15}
            shadowColor={SPACE_COLORS.effects.glowColor}
          />

          {/* Energy pulse effect */}
          <Line
            points={points}
            stroke={SPACE_COLORS.effects.sparkColor}
            strokeWidth={1}
            opacity={Math.sin(animationOffset * 0.1) * 0.5 + 0.5}
            dash={[5, 30]}
            dashOffset={-animationOffset * 3}
            lineCap="round"
          />

          {/* Particle effects along the wire */}
          {particlePositions.map((t, index) => {
            const pos = getPointOnCurve(t)
            return (
              <Group key={`particle-${index}`}>
                {/* Particle glow */}
                <Circle
                  x={pos.x}
                  y={pos.y}
                  radius={4}
                  fill={SPACE_COLORS.effects.particleColors[index % 4]}
                  opacity={0.3}
                  shadowBlur={10}
                  shadowColor={SPACE_COLORS.effects.particleColors[index % 4]}
                />
                {/* Particle core */}
                <Circle
                  x={pos.x}
                  y={pos.y}
                  radius={2}
                  fill={SPACE_COLORS.effects.sparkColor}
                  opacity={0.9}
                />
              </Group>
            )
          })}

          {/* Connection point sparks */}
          <Circle
            x={points[0]}
            y={points[1]}
            radius={3 + Math.sin(animationOffset * 0.2) * 2}
            fill={SPACE_COLORS.signalActive}
            opacity={0.6}
            shadowBlur={10}
            shadowColor={SPACE_COLORS.signalActive}
          />
          <Circle
            x={points[points.length - 2]}
            y={points[points.length - 1]}
            radius={3 + Math.sin(animationOffset * 0.2 + Math.PI) * 2}
            fill={SPACE_COLORS.signalActive}
            opacity={0.6}
            shadowBlur={10}
            shadowColor={SPACE_COLORS.signalActive}
          />
        </>
      )}

      {/* Holographic overlay for temporary wires */}
      {isTemporary && (
        <Line
          points={points}
          stroke={SPACE_COLORS.effects.glowColor}
          strokeWidth={1}
          opacity={Math.sin(Date.now() / 200) * 0.3 + 0.7}
          lineCap="round"
          lineJoin="round"
          shadowBlur={10}
          shadowColor={SPACE_COLORS.effects.glowColor}
        />
      )}
    </Group>
  )
}

export default SpaceWireComponent
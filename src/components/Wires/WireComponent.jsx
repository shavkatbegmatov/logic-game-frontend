import React from 'react'
import { Line, Group } from 'react-konva'
import { gateConfigs } from '../../engine/gates'

const WireComponent = ({ wire, gates, signal, isSimulating, isTemporary }) => {
  // Wire'ning boshlang'ich va tugash nuqtalarini hisoblash
  const getWirePoints = () => {
    if (isTemporary) {
      // Vaqtinchalik wire uchun
      const fromGate = gates.find(g => g.id === wire.fromGate)
      if (!fromGate) return []

      const fromConfig = gateConfigs[fromGate.type]
      const fromX = fromGate.x + fromGate.width + 5
      const fromY = fromGate.y + fromGate.height / 2

      return [fromX, fromY, wire.endX, wire.endY]
    }

    // Oddiy wire uchun
    const fromGate = gates.find(g => g.id === wire.fromGate)
    const toGate = gates.find(g => g.id === wire.toGate)

    if (!fromGate || !toGate) return []

    // Chiqish nuqtasi (from)
    const fromX = fromGate.x + fromGate.width + 5
    const fromY = fromGate.y + fromGate.height / 2

    // Kirish nuqtasi (to)
    const toConfig = gateConfigs[toGate.type]
    const inputCount = toConfig.maxInputs || 2
    const spacing = toGate.height / (inputCount + 1)
    const toX = toGate.x - 5
    const toY = toGate.y + spacing * ((wire.toIndex || 0) + 1)

    // Bezier egri chizig'i uchun nuqtalar
    return createBezierPoints(fromX, fromY, toX, toY)
  }

  // Bezier egri chizig'i yaratish
  const createBezierPoints = (x1, y1, x2, y2) => {
    const points = []
    const steps = 20
    const distance = Math.abs(x2 - x1)
    const controlOffset = Math.min(distance * 0.5, 100)

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

  const points = getWirePoints()
  if (points.length === 0) return null

  // Wire rangi va qalinligi
  const getWireStyle = () => {
    if (isTemporary) {
      return {
        stroke: '#9CA3AF',
        strokeWidth: 2,
        dash: [5, 5],
        opacity: 0.6
      }
    }

    if (isSimulating && signal === 1) {
      return {
        stroke: '#22C55E',
        strokeWidth: 3,
        shadowBlur: 8,
        shadowColor: '#22C55E',
        opacity: 1
      }
    }

    return {
      stroke: signal === 1 ? '#22C55E' : '#9CA3AF',
      strokeWidth: 2,
      opacity: 1
    }
  }

  const wireStyle = getWireStyle()

  return (
    <Group>
      <Line
        points={points}
        {...wireStyle}
        lineCap="round"
        lineJoin="round"
        tension={0}
      />

      {/* Signal animatsiyasi */}
      {isSimulating && signal === 1 && !isTemporary && (
        <Line
          points={points}
          stroke="#FFFFFF"
          strokeWidth={1}
          opacity={0.8}
          dash={[10, 10]}
          dashOffset={-Date.now() / 50}
        />
      )}
    </Group>
  )
}

export default WireComponent
import React from 'react'
import { Line, Group } from 'react-konva'
import { gateConfigs } from '../../engine/gates'

const WireComponent = ({ wire, gates, signal, isSimulating, isTemporary, draggingGate }) => {
  // Wire'ning boshlang'ich va tugash nuqtalarini hisoblash
  const getWirePoints = () => {
    if (isTemporary) {
      // Vaqtinchalik wire uchun bezier egri chiziq
      return createBezierPoints(wire.startX, wire.startY, wire.endX, wire.endY)
    }

    // Oddiy wire uchun
    let fromGate = gates.find(g => g.id === wire.fromGate)
    let toGate = gates.find(g => g.id === wire.toGate)

    if (!fromGate || !toGate) return []

    // Agar fromGate drag qilinayotgan bo'lsa, vaqtinchalik pozitsiyani ishlatish
    if (draggingGate && draggingGate.id === fromGate.id) {
      fromGate = { ...fromGate, x: draggingGate.x, y: draggingGate.y }
    }

    // Agar toGate drag qilinayotgan bo'lsa, vaqtinchalik pozitsiyani ishlatish
    if (draggingGate && draggingGate.id === toGate.id) {
      toGate = { ...toGate, x: draggingGate.x, y: draggingGate.y }
    }

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
        stroke: 'rgba(148, 163, 184, 0.6)',
        strokeWidth: 2,
        dash: [5, 5],
        opacity: 0.65
      }
    }

    if (isSimulating && signal === 1) {
      return {
        stroke: 'rgba(59, 130, 246, 0.9)',
        strokeWidth: 3,
        shadowBlur: 14,
        shadowColor: 'rgba(56, 189, 248, 0.85)',
        opacity: 1
      }
    }

    return {
      stroke: signal === 1 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(148, 163, 184, 0.55)',
      strokeWidth: 2.5,
      shadowBlur: signal === 1 ? 10 : 0,
      shadowColor: signal === 1 ? 'rgba(34, 197, 94, 0.6)' : undefined,
      opacity: signal === 1 ? 0.95 : 0.8
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
          stroke="rgba(224, 242, 254, 0.85)"
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

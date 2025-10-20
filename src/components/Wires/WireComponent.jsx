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

  // Wire yonishi kerakmi? (signal 1 bo'lsa)
  // Signal'lar endi har doim hisoblanadi (simulyatsiya faol bo'lmasa ham)
  const wireIsActive = !isTemporary && signal === 1

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

    // Wire faol bo'lsa (INPUT gate faol yoki simulyatsiya signal 1)
    if (wireIsActive) {
      return {
        stroke: '#10B981', // Yorqin yashil
        strokeWidth: 4,
        shadowBlur: 20,
        shadowColor: 'rgba(16, 185, 129, 0.9)',
        opacity: 1
      }
    }

    // Boshqa barcha holatlar - kulrang
    return {
      stroke: 'rgba(100, 116, 139, 0.4)', // Qorong'i kulrang
      strokeWidth: 2,
      shadowBlur: 0,
      opacity: 0.6
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

      {/* Signal animatsiyasi - oqib turuvchi energiya */}
      {wireIsActive && !isTemporary && (
        <>
          {/* Asosiy oqayotgan chiziq */}
          <Line
            points={points}
            stroke="rgba(240, 253, 244, 0.9)"
            strokeWidth={2}
            opacity={0.9}
            dash={[15, 15]}
            dashOffset={-Date.now() / 30}
            lineCap="round"
          />
          {/* Qo'shimcha yorqin nuqtalar */}
          <Line
            points={points}
            stroke="rgba(167, 243, 208, 1)"
            strokeWidth={3}
            opacity={0.7}
            dash={[5, 25]}
            dashOffset={-Date.now() / 40}
            lineCap="round"
            shadowBlur={10}
            shadowColor="rgba(16, 185, 129, 0.8)"
          />
        </>
      )}
    </Group>
  )
}

export default WireComponent

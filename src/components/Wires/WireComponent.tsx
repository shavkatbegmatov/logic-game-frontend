import React from 'react'
import { Line, Group } from 'react-konva'
import { gateConfigs } from '@/engine/gates'
import { createBezierPoints, getWireGates } from '@/utils/wireUtils'

const WireComponent = ({ wire, gates, signal, isTemporary, draggingGate }) => {
  // Wire'ning boshlang'ich va tugash nuqtalarini hisoblash
  const getWirePoints = () => {
    if (isTemporary) {
      // Vaqtinchalik wire uchun bezier egri chiziq
      return createBezierPoints(wire.startX, wire.startY, wire.endX, wire.endY)
    }

    // Get gates with drag handling
    const { fromGate, toGate } = getWireGates(wire, gates, draggingGate)
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

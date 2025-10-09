import React, { useRef, useCallback, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import useGameStore from '../../store/gameStore'
import GateComponent from '../Gates/GateComponent'
import WireComponent from '../Wires/WireComponent'
import { createGate } from '../../engine/gates'

const Canvas = () => {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 280, height: window.innerHeight - 60 })
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [wireStart, setWireStart] = useState(null)
  const [tempWireEnd, setTempWireEnd] = useState(null)

  const {
    gates,
    wires,
    selectedGate,
    addGate,
    updateGate,
    addWire,
    selectGate,
    clearSelection,
    isSimulating,
    signals
  } = useGameStore()

  // Canvas o'lchamini yangilash
  React.useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth - 280,
        height: window.innerHeight - 60
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Canvas'ga gate qo'shish (drag & drop uchun)
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const gateType = e.dataTransfer.getData('gateType')
    if (!gateType) return

    // Konva koordinatalarini olish
    stage.setPointersPositions(e)
    const position = stage.getPointerPosition()

    // Yangi gate yaratish
    const newGate = createGate(gateType, position.x, position.y)
    addGate(newGate)
  }, [addGate])

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Canvas click handler
  const handleStageClick = (e) => {
    // Agar bo'sh joyga bosilsa, tanlashni bekor qilish
    if (e.target === e.target.getStage()) {
      clearSelection()
    }
  }

  // Gate harakatlanishi
  const handleGateDragEnd = (gateId, newPosition) => {
    updateGate(gateId, newPosition)
  }

  // Wire ulash boshlash
  const handleWireStart = (gateId, connectionType, connectionIndex) => {
    setIsDraggingWire(true)
    setWireStart({
      gateId,
      type: connectionType, // 'input' yoki 'output'
      index: connectionIndex
    })
  }

  // Wire ulashni tugatish
  const handleWireEnd = (gateId, connectionType, connectionIndex) => {
    if (!isDraggingWire || !wireStart) return

    // Mantiqiy tekshiruvlar
    if (wireStart.gateId === gateId) {
      // O'ziga o'zini ulash mumkin emas
      cancelWireCreation()
      return
    }

    if (wireStart.type === connectionType) {
      // Input-input yoki output-output ulash mumkin emas
      cancelWireCreation()
      return
    }

    // Wire yaratish
    const wire = {
      fromGate: wireStart.type === 'output' ? wireStart.gateId : gateId,
      fromIndex: wireStart.type === 'output' ? wireStart.index : connectionIndex,
      toGate: wireStart.type === 'input' ? wireStart.gateId : gateId,
      toIndex: wireStart.type === 'input' ? wireStart.index : connectionIndex
    }

    addWire(wire)
    cancelWireCreation()
  }

  const cancelWireCreation = () => {
    setIsDraggingWire(false)
    setWireStart(null)
    setTempWireEnd(null)
  }

  // Mouse harakati (vaqtinchalik wire ko'rsatish uchun)
  const handleMouseMove = (e) => {
    if (!isDraggingWire) return

    const stage = stageRef.current
    const position = stage.getPointerPosition()
    setTempWireEnd(position)
  }

  const handleStageMouseUp = (e) => {
    if (!isDraggingWire) return

    const target = e.target
    if (target && target.getClassName && target.getClassName() === 'Circle') {
      return
    }

    cancelWireCreation()
  }

  return (
    <div
      className="relative h-full overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
      >
        <Layer>
          {/* Simlarni chizish */}
          {wires.map(wire => (
            <WireComponent
              key={wire.id}
              wire={wire}
              gates={gates}
              signal={signals[wire.id]}
              isSimulating={isSimulating}
            />
          ))}

          {/* Vaqtinchalik wire (yaratish jarayonida) */}
          {isDraggingWire && wireStart && tempWireEnd && (
            <WireComponent
              wire={{
                id: 'temp',
                fromGate: wireStart.gateId,
                fromIndex: wireStart.index,
                endX: tempWireEnd.x,
                endY: tempWireEnd.y
              }}
              gates={gates}
              signal={0}
              isTemporary={true}
            />
          )}

          {/* Gate'larni chizish */}
          {gates.map(gate => (
            <GateComponent
              key={gate.id}
              gate={gate}
              isSelected={selectedGate === gate.id}
              onDragEnd={handleGateDragEnd}
              onSelect={() => selectGate(gate.id)}
              onWireStart={handleWireStart}
              onWireEnd={handleWireEnd}
              outputSignal={isSimulating ? signals[`gate_${gate.id}`] : 0}
            />
          ))}
        </Layer>
      </Stage>

      {/* Simulyatsiya indikatori */}
      {isSimulating && (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 backdrop-blur">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
          <span>Simulyatsiya ishlamoqda</span>
        </div>
      )}
    </div>
  )
}

export default Canvas

import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Stage, Layer } from 'react-konva'
import useGameStore from '../../store/gameStore'
import GateComponent from '../Gates/GateComponent'
import WireComponent from '../Wires/WireComponent'
import { createGate, gateConfigs } from '../../engine/gates'
import { runSimulation } from '../../engine/simulation'

const Canvas = () => {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 280, height: window.innerHeight - 60 })
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [wireStart, setWireStart] = useState(null)
  const [tempWireEnd, setTempWireEnd] = useState(null)
  const [draggingGate, setDraggingGate] = useState(null) // { id, x, y }

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
    signals,
    updateSignals
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

  // Simulyatsiya loop
  useEffect(() => {
    if (!isSimulating) return

    const simulationInterval = setInterval(() => {
      const result = runSimulation(gates, wires)

      if (result.success) {
        // Signallarni yangilash
        const newSignals = {}

        // Wire signallari
        Object.keys(result.signals).forEach(key => {
          newSignals[key] = result.signals[key]
        })

        // Gate output signallari
        Object.keys(result.gateOutputs).forEach(key => {
          newSignals[`gate_${key}`] = result.gateOutputs[key]
        })

        updateSignals(newSignals)
      }
    }, 100) // Har 100ms da yangilash

    return () => clearInterval(simulationInterval)
  }, [isSimulating, gates, wires, updateSignals])

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
  const handleGateDragMove = (gateId, newPosition) => {
    setDraggingGate({ id: gateId, x: newPosition.x, y: newPosition.y })
  }

  const handleGateDragEnd = (gateId, newPosition) => {
    updateGate(gateId, newPosition)
    setDraggingGate(null) // Vaqtinchalik pozitsiyani tozalash
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
      className="relative h-full overflow-hidden bg-slate-950/30"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34, 211, 238, 0.14) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(129, 140, 248, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen">
        <div className="absolute left-10 top-12 h-40 w-40 rounded-full border border-cyan-400/50 bg-cyan-400/10 blur-2xl" />
        <div className="absolute right-12 bottom-20 h-52 w-52 rounded-full border border-indigo-500/40 bg-indigo-500/10 blur-[100px]" />
        <div className="absolute inset-y-0 left-1/3 w-px bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent" />
        <div className="absolute inset-y-0 right-1/4 w-px bg-gradient-to-b from-transparent via-indigo-300/30 to-transparent" />
      </div>

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
              draggingGate={draggingGate}
            />
          ))}

          {/* Vaqtinchalik wire (yaratish jarayonida) */}
          {isDraggingWire && wireStart && tempWireEnd && (() => {
            const gate = gates.find(g => g.id === wireStart.gateId)
            if (!gate) return null

            let startX, startY
            if (wireStart.type === 'output') {
              // Chiqish nuqtasidan boshlangan
              startX = gate.x + gate.width + 5
              startY = gate.y + gate.height / 2
            } else {
              // Kirish nuqtasidan boshlangan
              const config = gateConfigs[gate.type]
              const inputCount = config.maxInputs || 2
              const spacing = gate.height / (inputCount + 1)
              startX = gate.x - 5
              startY = gate.y + spacing * (wireStart.index + 1)
            }

            return (
              <WireComponent
                wire={{
                  id: 'temp',
                  startX,
                  startY,
                  endX: tempWireEnd.x,
                  endY: tempWireEnd.y
                }}
                gates={gates}
                signal={0}
                isTemporary={true}
              />
            )
          })()}

          {/* Gate'larni chizish */}
          {gates.map(gate => (
            <GateComponent
              key={gate.id}
              gate={gate}
              isSelected={selectedGate === gate.id}
              onDragMove={handleGateDragMove}
              onDragEnd={handleGateDragEnd}
              onSelect={() => selectGate(gate.id)}
              onUpdateGate={updateGate}
              onWireStart={handleWireStart}
              onWireEnd={handleWireEnd}
              outputSignal={isSimulating ? signals[`gate_${gate.id}`] : 0}
            />
          ))}
        </Layer>
      </Stage>

      {/* Simulyatsiya indikatori */}
      {isSimulating && (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.45)] backdrop-blur">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
          <span>Signal oqimi faollashdi</span>
        </div>
      )}
    </div>
  )
}

export default Canvas

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import useGameStore from '../../store/gameStore'
import useAchievementStore from '../../store/achievementStore'
import PCBGateComponent from '../Gates/PCBGateComponent'
import SpaceWireComponent from '../Wires/SpaceWireComponent'
import SubcircuitEditorManager from '../SubcircuitEditor/SubcircuitEditorManager'
import { createGate, gateConfigs, GateTypes } from '../../engine/gates'
import { runSimulation } from '../../engine/simulation'
import { normalizeKeyEvent } from '../../utils/keyboard'

const Canvas = () => {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 280, height: window.innerHeight - 60 })
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [wireStart, setWireStart] = useState(null)
  const [tempWireEnd, setTempWireEnd] = useState(null)
  const [draggedItems, setDraggedItems] = useState({}) // Stores temp positions of dragged gates { [id]: {x, y} }
  const [dragStartData, setDragStartData] = useState(null) // Stores data for multi-drag operation

  // Multi-selection state
  const [isDrawingSelection, setIsDrawingSelection] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [tempSelectionBox, setTempSelectionBox] = useState(null)
  const [selectionStartedWithShift, setSelectionStartedWithShift] = useState(false)

  const {
    gates,
    wires,
    selectedGate,
    selectedGates,
    preSelectedGates, // For live selection highlighting
    selectionBox,
    selectionMode,
    addGate,
    updateGate,
    updateGatePositions, // For multi-drag
    addWire,
    selectGate,
    clearSelection,
    toggleGateSelection,
    selectMultipleGates,
    setPreSelectedGates, // For live selection highlighting
    setSelectionBox,
    getGatesInSelectionBox,
    createSubcircuitFromSelected,
    isSimulating,
    signals,
    updateSignals
  } = useGameStore()

  const { updateStats } = useAchievementStore()

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const combo = normalizeKeyEvent(e)
      if (!combo) return

      // Ctrl+A - barcha gate'larni tanlash
      if (combo === 'ctrl+a') {
        e.preventDefault()
        const allGateIds = gates.map(g => g.id)
        selectMultipleGates(allGateIds)
      }

      // Ctrl+G - tanlangan gate'lardan subcircuit yaratish
      // Note: Ctrl+G handling SubcircuitEditorManager'da qilinadi

      // Escape - tanlashni bekor qilish
      if (combo === 'escape') {
        clearSelection()
        setIsDrawingSelection(false)
        setTempSelectionBox(null)
      }

      // Delete - tanlangan gate'larni o'chirish (agar kerak bo'lsa)
      // if (e.key === 'Delete' && selectedGates.length > 0) {
      //   selectedGates.forEach(id => removeGate(id))
      //   clearSelection()
      // }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedGates, gates, wires, selectMultipleGates, clearSelection])

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

        // Debug: INPUT gate'lar va ularning signal'larini ko'rsatish
        console.log('🔍 Simulyatsiya signals:', {
          wireSignals: result.signals,
          gateOutputs: result.gateOutputs,
          inputGates: gates.filter(g => g.type === 'INPUT').map(g => ({ id: g.id, value: g.value }))
        })

        updateSignals(newSignals)
      }
    }, 100) // Har 100ms da yangilash

    return () => clearInterval(simulationInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, gates, wires])

  // Simulyatsiya faol bo'lmaganda ham signal'larni hisoblash (useMemo)
  // Bu signal'larni har safar gates/wires o'zgarganda qayta hisoblaydi
  // Lekin store'ga yozmaydi, shuning uchun cheksiz loop bo'lmaydi
  const computedSignals = useMemo(() => {
    // Agar simulyatsiya faol bo'lsa, store'dagi signal'lardan foydalanish
    if (isSimulating) {
      return signals
    }

    // Agar gate yoki wire yo'q bo'lsa, bo'sh object qaytarish
    if (gates.length === 0 || wires.length === 0) {
      return {}
    }

    // Signal'larni hisoblash
    const result = runSimulation(gates, wires)

    if (result.success) {
      const newSignals = {}

      // Wire signallari
      Object.keys(result.signals).forEach(key => {
        newSignals[key] = result.signals[key]
      })

      // Gate output signallari
      Object.keys(result.gateOutputs).forEach(key => {
        newSignals[`gate_${key}`] = result.gateOutputs[key]
      })

      return newSignals
    }

    return {}
  }, [gates, wires, isSimulating, signals])

  // Clock gate'lar uchun interval - periodik signal generatori
  useEffect(() => {
    const clockGates = gates.filter(g => g.type === GateTypes.CLOCK)

    // Agar Clock gate'lar yo'q bo'lsa, hech narsa qilmaslik
    if (clockGates.length === 0) return

    // Har 500ms da Clock gate'larning value'sini almashtirish
    const clockInterval = setInterval(() => {
      clockGates.forEach(gate => {
        const newValue = gate.value === 1 ? 0 : 1
        updateGate(gate.id, { value: newValue })
      })
    }, 500) // 500ms = 0.5 soniya (2Hz chastota)

    return () => clearInterval(clockInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gates])

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

    // Update achievement statistics
    updateStats('gatesPlaced', prev => prev + 1)
    updateStats('gateTypesUsed', prev => {
      const types = new Set(prev)
      types.add(gateType)
      return types
    })
  }, [addGate, updateStats])

  const handleDragOver = (e) => {
    e.preventDefault()
  }


  // Selection rectangle handlers
  const handleStageMouseDown = (e) => {
    // Agar bo'sh joyga bosilsa, selection box boshlash
    if (e.target === e.target.getStage()) {
      const stage = stageRef.current
      if (!stage) return

      const position = stage.getPointerPosition()
      setIsDrawingSelection(true)
      setSelectionStart(position)
      setSelectionStartedWithShift(e.evt.shiftKey) // Shift holatini eslab qolish
      setTempSelectionBox({
        x1: position.x,
        y1: position.y,
        x2: position.x,
        y2: position.y
      })
    }
  }

  const handleSelectionMouseMove = (e) => {
    if (!isDrawingSelection || !selectionStart) return

    const stage = stageRef.current
    if (!stage) return

    const position = stage.getPointerPosition()
    const newSelectionBox = {
      x1: selectionStart.x,
      y1: selectionStart.y,
      x2: position.x,
      y2: position.y
    }
    setTempSelectionBox(newSelectionBox)

    // Live-update pre-selected gates
    const gatesInBox = getGatesInSelectionBox(newSelectionBox)
    setPreSelectedGates(gatesInBox.map(g => g.id))
  }

  const handleSelectionMouseUp = (e) => {
    if (!isDrawingSelection || !tempSelectionBox) return

    const { x1, y1, x2, y2 } = tempSelectionBox
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

    // Agar sichqoncha deyarli harakatlanmagan bo'lsa (click)
    if (distance < 5) {
      // va shift bosilmagan bo'lsa, tanlovni tozalash
      if (!selectionStartedWithShift) {
        clearSelection()
      }
    } else { // Agar drag bo'lgan bo'lsa
      const gatesInBox = getGatesInSelectionBox(tempSelectionBox)
      const newGateIds = gatesInBox.map(g => g.id)

      if (newGateIds.length > 0) {
        if (selectionStartedWithShift) {
          const combinedIds = [...new Set([...selectedGates, ...newGateIds])]
          selectMultipleGates(combinedIds)
        } else {
          selectMultipleGates(newGateIds)
        }
      } else {
        // Bo'sh joyga drag qilinganda (va shift bosilmagan bo'lsa) tanlovni tozalash
        if (!selectionStartedWithShift) {
          clearSelection()
        }
      }
    }

    // Reset state
    setIsDrawingSelection(false)
    setSelectionStart(null)
    setTempSelectionBox(null)
    setSelectionStartedWithShift(false)
    setPreSelectedGates([]) // Clear pre-selection
  }

  // --- Gate Dragging Logic ---

  const handleGateDragStart = (gateId, e) => {
    const stage = e.target.getStage()
    if (!stage) return

    // If the dragged gate is part of a selection, prepare for multi-drag
    if (selectedGates.length > 1 && selectedGates.includes(gateId)) {
      setDragStartData({
        pointer: stage.getPointerPosition(),
        gates: gates.filter(g => selectedGates.includes(g.id)).map(g => ({ id: g.id, x: g.x, y: g.y }))
      })
    }
  }

  const handleGateDragMove = (gateId, e) => {
    const stage = e.target.getStage()
    if (!stage) return

    const pointer = stage.getPointerPosition()

    // Multi-drag logic
    if (dragStartData) {
      const dx = pointer.x - dragStartData.pointer.x
      const dy = pointer.y - dragStartData.pointer.y

      const newPositions = {}
      dragStartData.gates.forEach(startGate => {
        newPositions[startGate.id] = {
          x: startGate.x + dx,
          y: startGate.y + dy
        }
      })
      setDraggedItems(newPositions)
      return
    }

    // Single-drag logic
    setDraggedItems({
      [gateId]: {
        x: e.target.x(),
        y: e.target.y()
      }
    })
  }

  const handleGateDragEnd = (gateId, e) => {
    // Multi-drag final update
    if (dragStartData) {
      const pointer = e.target.getStage().getPointerPosition()
      const dx = pointer.x - dragStartData.pointer.x
      const dy = pointer.y - dragStartData.pointer.y

      const finalPositions = dragStartData.gates.map(startGate => ({
        id: startGate.id,
        x: startGate.x + dx,
        y: startGate.y + dy
      }))

      updateGatePositions(finalPositions)
    } else {
      // Single-drag final update
      updateGate(gateId, { x: e.target.x(), y: e.target.y() })
    }

    // Reset drag states
    setDraggedItems({})
    setDragStartData(null)
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

    // Update achievement statistics
    updateStats('wiresConnected', prev => prev + 1)
  }

  const cancelWireCreation = () => {
    setIsDraggingWire(false)
    setWireStart(null)
    setTempWireEnd(null)
  }

  // Mouse harakati (vaqtinchalik wire ko'rsatish uchun)
  const handleMouseMove = (e) => {
    // Selection box drawing
    if (isDrawingSelection) {
      handleSelectionMouseMove(e)
      return
    }

    // Wire creation
    if (!isDraggingWire) return

    const stage = stageRef.current
    const position = stage.getPointerPosition()
    setTempWireEnd(position)
  }

  const handleStageMouseUp = (e) => {
    // Selection box tugallash
    if (isDrawingSelection) {
      handleSelectionMouseUp(e)
      return
    }

    // Wire creation tugallash
    if (!isDraggingWire) return

    const target = e.target
    if (target && target.getClassName && target.getClassName() === 'Circle') {
      return
    }

    cancelWireCreation()
  }

  return (
    <div
      className="relative h-full overflow-hidden bg-slate-950/30 canvas-3d"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* 3D Grid Floor */}
      <div className="grid-3d" />

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
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
      >
        <Layer>
          {/* Simlarni chizish */}
          {wires.map(wire => (
            <SpaceWireComponent
              key={wire.id}
              wire={wire}
              gates={gates}
              signal={computedSignals[wire.id]}
              isSimulating={isSimulating}
              draggedItems={draggedItems}
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
              <SpaceWireComponent
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

          {/* Selection rectangle */}
          {tempSelectionBox && (
            <Rect
              x={Math.min(tempSelectionBox.x1, tempSelectionBox.x2)}
              y={Math.min(tempSelectionBox.y1, tempSelectionBox.y2)}
              width={Math.abs(tempSelectionBox.x2 - tempSelectionBox.x1)}
              height={Math.abs(tempSelectionBox.y2 - tempSelectionBox.y1)}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth={2}
              dash={[8, 4]}
              shadowBlur={10}
              shadowColor="rgba(59, 130, 246, 0.5)"
              shadowOpacity={0.8}
            />
          )}

          {/* Gate'larni chizish */}
          {gates.map(gate => {
            const draggedPosition = draggedItems[gate.id]
            const gateProps = {
              ...gate,
              x: draggedPosition ? draggedPosition.x : gate.x,
              y: draggedPosition ? draggedPosition.y : gate.y
            };

            return (
              <PCBGateComponent
                key={gate.id}
                gate={gateProps}
                isSelected={selectedGate === gate.id || selectedGates.includes(gate.id)}
                isPreSelected={preSelectedGates.includes(gate.id)}
                onDragStart={handleGateDragStart}
                onDragMove={handleGateDragMove}
                onDragEnd={handleGateDragEnd}
                onSelect={(e) => {
                  if (e.evt.ctrlKey) {
                    // Ctrl+Click - toggle selection
                    toggleGateSelection(gate.id)
                  } else if (e.evt.shiftKey) {
                    // Shift+Click - add to selection
                    toggleGateSelection(gate.id)
                  } else {
                    // Normal click - single select
                    selectGate(gate.id)
                  }
                }}
                onUpdateGate={updateGate}
              onWireStart={handleWireStart}
              onWireEnd={handleWireEnd}
              outputSignal={computedSignals[`gate_${gate.id}`] || 0}
            />
          );
          })}
        </Layer>
      </Stage>

      {/* Simulyatsiya indikatori */}
      {isSimulating && (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.45)] backdrop-blur">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
          <span>Signal oqimi faollashdi</span>
        </div>
      )}

      {/* Subcircuit Editor Manager */}
      <SubcircuitEditorManager />
    </div>
  )
}

export default Canvas

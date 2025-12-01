import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Columns, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react'
import { Stage, Layer, Rect } from 'react-konva'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import useGameStore from '../../../store/gameStore'
import { gateConfigs } from '@/engine/gates'
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'

const SplitViewMode = ({ onClose }) => {
  // Subcircuit editor state
  const internalGates = useSubcircuitEditorStore(s => s.internalGates)
  const internalWires = useSubcircuitEditorStore(s => s.internalWires)
  const selectedInternalGates = useSubcircuitEditorStore(s => s.selectedInternalGates)
  const updateInternalGate = useSubcircuitEditorStore(s => s.updateInternalGate)
  const addInternalWire = useSubcircuitEditorStore(s => s.addInternalWire)
  const clearInternalSelection = useSubcircuitEditorStore(s => s.clearInternalSelection)
  const selectInternalGate = useSubcircuitEditorStore(s => s.selectInternalGate)
  const setZoomLevel = useSubcircuitEditorStore(s => s.setZoomLevel)
  const setPanOffset = useSubcircuitEditorStore(s => s.setPanOffset)
  const zoomLevel = useSubcircuitEditorStore(s => s.zoomLevel)
  const panOffset = useSubcircuitEditorStore(s => s.panOffset)

  // Right panel stage sizing
  const rightRef = useRef<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  useEffect(() => {
    const resize = () => {
      if (!rightRef.current) return
      const rect = rightRef.current.getBoundingClientRect()
      setStageSize({ width: Math.max(300, rect.width), height: Math.max(300, rect.height - 56) })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Interactive wiring/dragging state
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [wireStart, setWireStart] = useState<null | { gateId: string | number; type: 'input' | 'output'; index: number }>(null)
  const [tempWireEnd, setTempWireEnd] = useState<{ x: number; y: number } | null>(null)
  const [draggingGate, setDraggingGate] = useState<null | { id: string | number; x: number; y: number }>(null)

  // Panning state
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPosition, setLastPanPosition] = useState<{ x: number; y: number } | null>(null)

  const handleWireStart = useCallback((gateId: string | number, type: 'input' | 'output', index: number) => {
    setIsDraggingWire(true)
    setWireStart({ gateId, type, index })
  }, [])

  const cancelWire = useCallback(() => {
    setIsDraggingWire(false)
    setWireStart(null)
    setTempWireEnd(null)
  }, [])

  const handleWireEnd = useCallback((gateId: string | number, type: 'input' | 'output', index: number) => {
    if (!isDraggingWire || !wireStart) return
    if (wireStart.gateId === gateId || wireStart.type === type) {
      cancelWire()
      return
    }
    const wire = {
      id: Date.now() + Math.random(),
      fromGate: wireStart.type === 'output' ? wireStart.gateId : gateId,
      fromIndex: wireStart.type === 'output' ? wireStart.index : index,
      toGate: wireStart.type === 'input' ? wireStart.gateId : gateId,
      toIndex: wireStart.type === 'input' ? wireStart.index : index,
      signal: 0 as const
    }
    addInternalWire(wire as any)
    cancelWire()
  }, [isDraggingWire, wireStart, addInternalWire, cancelWire])

  // Coordinate transformation helper
  const getRelativePointerPosition = (node: any) => {
    const transform = node.getAbsoluteTransform().copy()
    transform.invert()
    const pos = node.getStage().getPointerPosition()
    return transform.point(pos)
  }

  const onStageMouseDown = useCallback((e: any) => {
    // Middle mouse or Space+Left for panning
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.code === 'Space')) {
      e.evt.preventDefault()
      setIsPanning(true)
      setLastPanPosition({ x: e.evt.clientX, y: e.evt.clientY })
    }
  }, [])

  const onStageMouseMove = useCallback((e: any) => {
    // Panning logic
    if (isPanning && lastPanPosition) {
      const dx = e.evt.clientX - lastPanPosition.x
      const dy = e.evt.clientY - lastPanPosition.y
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
      setLastPanPosition({ x: e.evt.clientX, y: e.evt.clientY })
      return
    }

    // Wire dragging logic
    if (isDraggingWire) {
      const stage = e.target.getStage()
      const layer = stage.getLayers()[0]
      const pos = getRelativePointerPosition(layer)
      if (pos) setTempWireEnd(pos)
    }
  }, [isPanning, lastPanPosition, panOffset, setPanOffset, isDraggingWire])

  const onStageMouseUp = useCallback((e: any) => {
    if (isPanning) {
      setIsPanning(false)
      setLastPanPosition(null)
    }
    if (isDraggingWire && e.target.getClassName() !== 'Circle') cancelWire()
  }, [isPanning, isDraggingWire, cancelWire])

  const onStageWheel = useCallback((e: any) => {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1
    // Limit zoom
    if (newScale < 0.1 || newScale > 5) return

    setZoomLevel(newScale)

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    setPanOffset(newPos)
  }, [setZoomLevel, setPanOffset])

  // Zoom controls
  const zoomIn = () => setZoomLevel(zoomLevel * 1.1)
  const zoomOut = () => setZoomLevel(zoomLevel / 1.1)
  const resetView = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }) }

  // Temp wire start point calc for internal gates
  const getTempWireStart = useCallback(() => {
    if (!wireStart || !tempWireEnd) return null
    const gate = internalGates.find(g => g.id === wireStart.gateId)
    if (!gate) return null
    const config = gateConfigs[gate.type] || { maxInputs: 2, maxOutputs: 1 }
    let startX: number
    let startY: number
    if (wireStart.type === 'output') {
      const spacingOut = gate.height / ((config.maxOutputs || 1) + 1)
      startX = gate.x + gate.width + 5
      startY = gate.y + spacingOut * (wireStart.index + 1)
    } else {
      const spacingIn = gate.height / ((config.maxInputs || 2) + 1)
      startX = gate.x - 5
      startY = gate.y + spacingIn * (wireStart.index + 1)
    }
    return { startX, startY, endX: tempWireEnd.x, endY: tempWireEnd.y }
  }, [wireStart, tempWireEnd, internalGates])

  // Left panel preview sizing
  const leftRef = useRef<HTMLDivElement | null>(null)
  const [leftSize, setLeftSize] = useState({ width: 800, height: 600 })
  useEffect(() => {
    const resize = () => {
      if (!leftRef.current) return
      const rect = leftRef.current.getBoundingClientRect()
      setLeftSize({ width: Math.max(300, rect.width), height: Math.max(300, rect.height - 56) })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Left panel preview data (read-only)
  const mainGates = useGameStore(s => s.gates)
  const mainWires = useGameStore(s => s.wires)
  // const isSimulating = useGameStore(s => s.isSimulating)

  // Left side: read-only preview of main canvas
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-slate-900/90"
    >
      <div className="h-full flex">
        {/* Left panel - pass through pointer events to main canvas */}
        <div className="flex-1 border-r border-slate-700 flex flex-col" ref={leftRef}>
          <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <Columns className="h-5 w-5 text-orange-400" />
              <h2 className="text-sm font-semibold text-white">Split View — Main Canvas</h2>
            </div>
          </div>
          <div className="flex-1 bg-slate-900/40">
            <Stage width={leftSize.width} height={leftSize.height} listening={false}>
              <Layer>
                {/* Simple background grid */}
                <Rect x={0} y={0} width={leftSize.width} height={leftSize.height} stroke="#334155" strokeWidth={1} opacity={0.1} />
                {/* Wires */}
                {mainWires.map(wire => (
                  <WireComponent key={wire.id} wire={wire as any} gates={mainGates as any} signal={0} isTemporary={false} draggingGate={null} />
                ))}
                {/* Gates */}
                {mainGates.map(gate => (
                  <PCBGateComponent
                    key={gate.id}
                    gate={gate as any}
                    isSelected={false}
                    isPreSelected={false}
                    onDragStart={() => {}}
                    onDragMove={() => {}}
                    onDragEnd={() => {}}
                    onSelect={() => {}}
                    onUpdateGate={() => {}}
                    onWireStart={() => {}}
                    onWireEnd={() => {}}
                    outputSignal={0}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Right panel - subcircuit editor (interactive) */}
        <div className="flex-1 flex flex-col" ref={rightRef}>
          <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">Subcircuit Editor</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={zoomOut} className="rounded-lg p-1.5 bg-slate-800 text-gray-300 hover:bg-slate-700" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
              <button onClick={zoomIn} className="rounded-lg p-1.5 bg-slate-800 text-gray-300 hover:bg-slate-700" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={resetView} className="rounded-lg p-1.5 bg-slate-800 text-gray-300 hover:bg-slate-700" title="Reset view"><RotateCcw className="h-4 w-4" /></button>
              <button onClick={onClose} className="rounded-lg p-1.5 bg-slate-800 text-gray-300 hover:bg-slate-700" title="Close"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="flex-1 relative">
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              scaleX={zoomLevel}
              scaleY={zoomLevel}
              x={panOffset.x}
              y={panOffset.y}
              onMouseDown={onStageMouseDown}
              onMouseMove={onStageMouseMove}
              onMouseUp={onStageMouseUp}
              onTouchEnd={onStageMouseUp}
              onWheel={onStageWheel}
              className="bg-[rgba(15,23,42,0.85)]"
            >
              <Layer>
                {/* Grid */}
                <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} stroke="#334155" strokeWidth={1} opacity={0.15} />

                {/* Wires */}
                {internalWires.map(wire => (
                  <WireComponent key={wire.id} wire={wire} gates={internalGates} signal={0} isTemporary={false} draggingGate={draggingGate} />
                ))}

                {/* Temporary wire */}
                {isDraggingWire && wireStart && tempWireEnd && (() => {
                  const temp = getTempWireStart()
                  if (!temp) return null
                  return (
                    <WireComponent
                      wire={{ id: 'temp', startX: temp.startX, startY: temp.startY, endX: temp.endX, endY: temp.endY } as any}
                      gates={internalGates}
                      signal={0}
                      isTemporary={true}
                      draggingGate={null}
                    />
                  )
                })()}

                {/* Gates */}
                {internalGates.map(gate => (
                  <PCBGateComponent
                    key={gate.id}
                    gate={gate}
                    isSelected={selectedInternalGates.includes(gate.id)}
                    isPreSelected={false}
                    onDragStart={(gid: string | number, e: any) => {
                      setDraggingGate({ id: gid, x: e.target.x(), y: e.target.y() })
                    }}
                    onDragMove={(gid: string | number, e: any) => {
                      setDraggingGate({ id: gid, x: e.target.x(), y: e.target.y() })
                    }}
                    onDragEnd={(gid: string | number, e: any) => {
                      setDraggingGate(null)
                      updateInternalGate(gid, { x: e.target.x(), y: e.target.y() })
                    }}
                    onSelect={() => {
                      clearInternalSelection()
                      selectInternalGate(gate.id)
                    }}
                    onUpdateGate={updateInternalGate}
                    onWireStart={handleWireStart}
                    onWireEnd={handleWireEnd}
                    outputSignal={0}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SplitViewMode

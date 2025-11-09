import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Columns, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react'
import { Stage, Layer, Rect } from 'react-konva'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import useGameStore from '../../../store/gameStore'
import PCBGateComponent from '../../Gates/PCBGateComponent'
import WireComponent from '../../Wires/WireComponent'
import { gateConfigs } from '../../../engine/gates'

const SplitViewMode = ({ onClose }) => {
  // Editor store
  const internalGates = useSubcircuitEditorStore(s => s.internalGates)
  const internalWires = useSubcircuitEditorStore(s => s.internalWires)
  const selectedInternalGates = useSubcircuitEditorStore(s => s.selectedInternalGates)
  const updateInternalGate = useSubcircuitEditorStore(s => s.updateInternalGate)
  const addInternalWire = useSubcircuitEditorStore(s => s.addInternalWire)
  const clearInternalSelection = useSubcircuitEditorStore(s => s.clearInternalSelection)
  const selectInternalGate = useSubcircuitEditorStore(s => s.selectInternalGate)
  const zoomLevel = useSubcircuitEditorStore(s => s.zoomLevel)
  const panOffset = useSubcircuitEditorStore(s => s.panOffset)
  const setZoomLevel = useSubcircuitEditorStore(s => s.setZoomLevel)
  const setPanOffset = useSubcircuitEditorStore(s => s.setPanOffset)

  // Right panel size
  const rightRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  useEffect(() => {
    const resize = () => {
      if (!rightRef.current) return
      const rect = rightRef.current.getBoundingClientRect()
      setStageSize({ width: Math.max(300, rect.width), height: Math.max(300, rect.height - 48) })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Left panel size + preview data
  const leftRef = useRef(null)
  const [leftSize, setLeftSize] = useState({ width: 800, height: 600 })
  useEffect(() => {
    const resize = () => {
      if (!leftRef.current) return
      const rect = leftRef.current.getBoundingClientRect()
      setLeftSize({ width: Math.max(300, rect.width), height: Math.max(300, rect.height - 48) })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const mainGates = useGameStore(s => s.gates)
  const mainWires = useGameStore(s => s.wires)

  // Wiring state
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [wireStart, setWireStart] = useState(null)
  const [tempWireEnd, setTempWireEnd] = useState(null)
  const [draggingGate, setDraggingGate] = useState(null)

  const handleWireStart = useCallback((gateId, type, index) => {
    setIsDraggingWire(true)
    setWireStart({ gateId, type, index })
  }, [])

  const cancelWire = useCallback(() => {
    setIsDraggingWire(false)
    setWireStart(null)
    setTempWireEnd(null)
  }, [])

  const handleWireEnd = useCallback((gateId, type, index) => {
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
      signal: 0
    }
    addInternalWire(wire)
    cancelWire()
  }, [isDraggingWire, wireStart, addInternalWire, cancelWire])

  const onStageMouseMove = useCallback((e) => {
    if (!isDraggingWire) return
    const pos = e.target.getStage().getPointerPosition()
    if (pos) setTempWireEnd(pos)
  }, [isDraggingWire])

  const onStageMouseUp = useCallback((e) => {
    if (isDraggingWire && e.target.getClassName() !== 'Circle') cancelWire()
  }, [isDraggingWire, cancelWire])

  const zoomIn = () => setZoomLevel(zoomLevel * 1.1)
  const zoomOut = () => setZoomLevel(zoomLevel / 1.1)
  const resetView = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }) }

  const getTempWireStart = useCallback(() => {
    if (!wireStart || !tempWireEnd) return null
    const gate = internalGates.find(g => g.id === wireStart.gateId)
    if (!gate) return null
    const config = gateConfigs[gate.type] || { maxInputs: 2, maxOutputs: 1 }
    let startX, startY
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-slate-900/90"
    >
      <div className="h-full flex">
        {/* Left: main canvas preview */}
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
                <Rect x={0} y={0} width={leftSize.width} height={leftSize.height} stroke="#334155" strokeWidth={1} opacity={0.1} />
                {mainWires.map(wire => (
                  <WireComponent key={wire.id} wire={wire} gates={mainGates} signal={0} isTemporary={false} draggingGate={null} />
                ))}
                {mainGates.map(gate => (
                  <PCBGateComponent
                    key={gate.id}
                    gate={gate}
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

        {/* Right: subcircuit editor */}
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
              onMouseMove={onStageMouseMove}
              onMouseUp={onStageMouseUp}
              onTouchEnd={onStageMouseUp}
              className="bg-[rgba(15,23,42,0.85)]"
            >
              <Layer>
                <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} stroke="#334155" strokeWidth={1} opacity={0.15} />
                {internalWires.map(wire => (
                  <WireComponent key={wire.id} wire={wire} gates={internalGates} signal={0} isTemporary={false} draggingGate={draggingGate} />
                ))}
                {isDraggingWire && wireStart && tempWireEnd && (() => {
                  const temp = getTempWireStart()
                  if (!temp) return null
                  return (
                    <WireComponent
                      wire={{ id: 'temp', startX: temp.startX, startY: temp.startY, endX: temp.endX, endY: temp.endY }}
                      gates={internalGates}
                      signal={0}
                      isTemporary={true}
                      draggingGate={null}
                    />
                  )
                })()}
                {internalGates.map(gate => (
                  <PCBGateComponent
                    key={gate.id}
                    gate={gate}
                    isSelected={selectedInternalGates.includes(gate.id)}
                    isPreSelected={false}
                    onDragStart={(e) => { setDraggingGate({ id: gate.id, x: e.target.x(), y: e.target.y() }) }}
                    onDragMove={(e) => { setDraggingGate({ id: gate.id, x: e.target.x(), y: e.target.y() }) }}
                    onDragEnd={(e) => { setDraggingGate(null); updateInternalGate(gate.id, { x: e.target.x(), y: e.target.y() }) }}
                    onSelect={() => { clearInternalSelection(); selectInternalGate(gate.id) }}
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

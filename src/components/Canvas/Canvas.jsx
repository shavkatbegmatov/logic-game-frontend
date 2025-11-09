import React, { useRef, useCallback, useState, useEffect, useMemo, Suspense } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import { motion } from 'framer-motion'
import { Edit } from 'lucide-react'

import useGameStore from '../../store/gameStore'
import useSubcircuitEditorStore from '../../store/subcircuitEditorStore'
import useSubcircuitStore from '../../store/subcircuitStore'
import useUserPreferencesStore from '../../store/userPreferencesStore'
import useAchievementStore from '../../store/achievementStore'

import PCBGateComponent from '../Gates/PCBGateComponent'
import SpaceWireComponent from '../Wires/SpaceWireComponent'
import SubcircuitEditorManager from '../SubcircuitEditor/SubcircuitEditorManager'
import { createGate, gateConfigs, GateTypes } from '../../engine/gates'
import { runSimulation } from '../../engine/simulation'
import { normalizeKeyEvent } from '../../utils/keyboard'
import { soundService } from '../SubcircuitEditor/effects/SoundManager'

// Creation flows (DOM components)
const QuickCreate = React.lazy(() => import('../SubcircuitEditor/creation/QuickCreate'))
const WizardCreate = React.lazy(() => import('../SubcircuitEditor/creation/WizardCreate'))
const TemplateCreate = React.lazy(() => import('../SubcircuitEditor/creation/TemplateCreate'))
const VisualBoundaryCreate = React.lazy(() => import('../SubcircuitEditor/creation/VisualBoundaryCreate'))

// Editor modes (DOM components)
const SplitViewMode = React.lazy(() => import('../SubcircuitEditor/modes/SplitViewMode'))
const FloatingPanelMode = React.lazy(() => import('../SubcircuitEditor/modes/FloatingPanelMode'))
const FullModalMode = React.lazy(() => import('../SubcircuitEditor/modes/FullModalMode'))


const log = (message, ...args) => console.log(`%c[CANVAS] ${message}`, 'color: #9C27B0;', ...args);

const Canvas = () => {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 280, height: window.innerHeight - 60 })
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [wireStart, setWireStart] = useState(null)
  const [tempWireEnd, setTempWireEnd] = useState(null)
  const [draggedItems, setDraggedItems] = useState({})
  const [dragStartData, setDragStartData] = useState(null)

  const latestDraggedItems = useRef({});
  const updateScheduled = useRef(false);

  const [isDrawingSelection, setIsDrawingSelection] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [tempSelectionBox, setTempSelectionBox] = useState(null)
  const [selectionStartedWithShift, setSelectionStartedWithShift] = useState(false)

  const {
    gates, wires, selectedGate, selectedGates, preSelectedGates, addGate, updateGate,
    updateGatePositions, addWire, selectGate, clearSelection, toggleGateSelection,
    selectMultipleGates, setPreSelectedGates, getGatesInSelectionBox, isSimulating,
    signals, updateSignals
  } = useGameStore()

  const {
    isEditing, editingMode, editingSubcircuit, creationMethod,
    startEditing, stopEditing, startCreation
  } = useSubcircuitEditorStore()

  const { addTemplate } = useSubcircuitStore()
  const { shortcuts, editorMode: preferredEditorMode, enableSounds } = useUserPreferencesStore()
  const { updateStats } = useAchievementStore()

  useEffect(() => {
    const handleResize = () => setStageSize({ width: window.innerWidth - 280, height: window.innerHeight - 60 })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const combo = normalizeKeyEvent(e)
      if (!combo) return

      // Create Subcircuit
      if (combo === shortcuts.createSubcircuit) {
        e.preventDefault()
        if (selectedGates.length > 0) {
          log('Subcircuit yaratish boshlandi...', selectedGates)
          const selectedSet = new Set(selectedGates)
          const initialGates = gates.filter(g => selectedSet.has(g.id))
          // Fix: Pass all wires connected to the selection, not just internal ones.
          const initialWires = wires.filter(w => selectedSet.has(w.fromGate) || selectedSet.has(w.toGate))
          
          startCreation('quick', {
            selectedGates: initialGates,
            selectedWires: initialWires
          })
        } else {
          console.warn('Subcircuit yaratish uchun avval gate\'larni tanlang.')
          // TODO: Add toast notification
        }
      }
      
      if (combo === 'ctrl+a') {
        e.preventDefault()
        selectMultipleGates(gates.map(g => g.id))
      }

      if (combo === 'escape') {
        if (isEditing) stopEditing()
        clearSelection()
        setIsDrawingSelection(false)
        setTempSelectionBox(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectMultipleGates, clearSelection, isEditing, stopEditing, gates, shortcuts, startCreation, selectedGates, wires])

  useEffect(() => {
    if (!isSimulating) return
    const simulationInterval = setInterval(() => {
      const result = runSimulation(gates, wires)
      if (result.success) {
        const newSignals = { ...result.signals, ...result.gateOutputs }
        updateSignals(newSignals)
      }
    }, 100)
    return () => clearInterval(simulationInterval)
  }, [isSimulating, gates, wires, updateSignals])

  const computedSignals = useMemo(() => {
    if (isSimulating) return signals
    if (gates.length === 0) return {}
    const result = runSimulation(gates, wires)
    if (result.success) {
      return { ...result.signals, ...result.gateOutputs }
    }
    return {}
  }, [gates, wires, isSimulating, signals])

  useEffect(() => {
    const clockGates = gates.filter(g => g.type === GateTypes.CLOCK)
    if (clockGates.length === 0) return
    const clockInterval = setInterval(() => {
      clockGates.forEach(gate => updateGate(gate.id, { value: gate.value === 1 ? 0 : 1 }))
    }, 500)
    return () => clearInterval(clockInterval)
  }, [gates, updateGate])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const gateType = e.dataTransfer.getData('gateType')
    if (!gateType) return
    stage.setPointersPositions(e)
    const position = stage.getPointerPosition()
    const newGate = createGate(gateType, position.x, position.y)
    addGate(newGate)
    updateStats('gatesPlaced', prev => prev + 1)
    updateStats('gateTypesUsed', prev => new Set(prev).add(gateType))
  }, [addGate, updateStats])

  const handleDragOver = (e) => e.preventDefault()

  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage() && !isEditing) {
      const pos = e.target.getStage().getPointerPosition()
      setIsDrawingSelection(true)
      setSelectionStart(pos)
      setSelectionStartedWithShift(e.evt.shiftKey)
      setTempSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
    }
  }

  const handleSelectionMouseMove = (e) => {
    if (!isDrawingSelection || !selectionStart) return
    const pos = e.target.getStage().getPointerPosition()
    const newBox = { x1: selectionStart.x, y1: selectionStart.y, x2: pos.x, y2: pos.y }
    setTempSelectionBox(newBox)
    setPreSelectedGates(getGatesInSelectionBox(newBox).map(g => g.id))
  }

  const handleSelectionMouseUp = () => {
    if (!isDrawingSelection || !tempSelectionBox) return
    const { x1, y1, x2, y2 } = tempSelectionBox
    if (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) < 5) {
      if (!selectionStartedWithShift) clearSelection()
    } else {
      const newGateIds = getGatesInSelectionBox(tempSelectionBox).map(g => g.id)
      if (newGateIds.length > 0) {
        selectMultipleGates(selectionStartedWithShift ? [...new Set([...selectedGates, ...newGateIds])] : newGateIds)
      } else if (!selectionStartedWithShift) {
        clearSelection()
      }
    }
    setIsDrawingSelection(false)
    setTempSelectionBox(null)
    setPreSelectedGates([])
  }

  const handleGateDragStart = (gateId, e) => {
    if (selectedGates.length > 1 && selectedGates.includes(gateId)) {
      setDragStartData({
        pointer: e.target.getStage().getPointerPosition(),
        gates: gates.filter(g => selectedGates.includes(g.id)).map(g => ({ id: g.id, x: g.x, y: g.y }))
      })
    }
  }

  const handleGateDragMove = (gateId, e) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (dragStartData) {
      const dx = pointer.x - dragStartData.pointer.x;
      const dy = pointer.y - dragStartData.pointer.y;
      const newPositions = {};
      dragStartData.gates.forEach(sg => { newPositions[sg.id] = { x: sg.x + dx, y: sg.y + dy } });
      latestDraggedItems.current = newPositions;
    } else {
      latestDraggedItems.current = { [gateId]: { x: e.target.x(), y: e.target.y() } };
    }
    if (!updateScheduled.current) {
      updateScheduled.current = true;
      requestAnimationFrame(() => {
        setDraggedItems(latestDraggedItems.current);
        updateScheduled.current = false;
      });
    }
  };

  const handleGateDragEnd = (gateId, e) => {
    if (dragStartData) {
      const pointer = e.target.getStage().getPointerPosition()
      const dx = pointer.x - dragStartData.pointer.x
      const dy = pointer.y - dragStartData.pointer.y
      const finalPositions = dragStartData.gates.map(sg => ({ id: sg.id, x: sg.x + dx, y: sg.y + dy }))
      updateGatePositions(finalPositions)
    } else {
      updateGate(gateId, { x: e.target.x(), y: e.target.y() })
    }
    setDraggedItems({})
    setDragStartData(null)
  }

  const handleWireStart = (gateId, type, index) => {
    setIsDraggingWire(true)
    setWireStart({ gateId, type, index })
  }

  const handleWireEnd = (gateId, type, index) => {
    if (!isDraggingWire || !wireStart) return
    if (wireStart.gateId === gateId || wireStart.type === type) {
      cancelWireCreation()
      return
    }
    const wire = {
      fromGate: wireStart.type === 'output' ? wireStart.gateId : gateId,
      fromIndex: wireStart.type === 'output' ? wireStart.index : index,
      toGate: wireStart.type === 'input' ? wireStart.gateId : gateId,
      toIndex: wireStart.type === 'input' ? wireStart.index : index
    }
    addWire(wire)
    cancelWireCreation()
    updateStats('wiresConnected', prev => prev + 1)
  }

  const cancelWireCreation = () => {
    setIsDraggingWire(false)
    setWireStart(null)
    setTempWireEnd(null)
  }

  const handleMouseMove = (e) => {
    if (isDrawingSelection) handleSelectionMouseMove(e)
    if (isDraggingWire) setTempWireEnd(e.target.getStage().getPointerPosition())
  }

  const handleStageMouseUp = (e) => {
    if (isDrawingSelection) handleSelectionMouseUp(e)
    if (isDraggingWire && e.target.getClassName() !== 'Circle') cancelWireCreation()
  }

  const renderDomEditor = () => {
    if (!isEditing || editingMode !== 'edit') return null;

    const editorProps = {
      onClose: stopEditing,
      subcircuit: editingSubcircuit,
    };

    const renderEditorComponent = () => {
      switch (preferredEditorMode) {
        case 'splitView':
          return <SplitViewMode {...editorProps} />;
        case 'floating':
          return <FloatingPanelMode {...editorProps} />;
        case 'fullModal':
          return <FullModalMode {...editorProps} />;
        default:
          return null; // Inline mode is Konva-only
      }
    };

    return (
      <>
        {/* Common UI for all editing modes, like the top banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-slate-900/80 backdrop-blur-sm" onClick={stopEditing} />
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-4 rounded-lg bg-slate-800/80 p-3 shadow-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Editing: <span className="text-cyan-400">{editingSubcircuit?.name}</span></h2>
            </div>
            <button onClick={stopEditing} className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Close Editor</button>
          </motion.div>
        </div>

        {/* Mode-specific DOM UI */}
        {renderEditorComponent()}
      </>
    );
  };

  const renderCreationFlow = () => {
    if (!isEditing || editingMode !== 'create' || !creationMethod) return null;
    const props = {
      onComplete: (template) => {
        addTemplate(template)
        startEditing('edit', template)
        clearSelection()
        if (enableSounds) soundService.playSuccess()
      },
      onCancel: () => {
        stopEditing()
        if (enableSounds) soundService.playCancel()
      }
    }
    switch (creationMethod) {
      case 'quick': return <QuickCreate {...props} />
      case 'wizard': return <WizardCreate {...props} />
      case 'template': return <TemplateCreate {...props} />
      case 'visual': return <VisualBoundaryCreate {...props} />
      default: return <QuickCreate {...props} />
    }
  }

  const LoadingFallback = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
    </div>
  )

  return (
    <div className="relative h-full overflow-hidden bg-slate-950/30 canvas-3d" onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="grid-3d" />
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen" style={{ backgroundImage: `linear-gradient(to right, rgba(34, 211, 238, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(129, 140, 248, 0.12) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen">
        <div className="absolute left-10 top-12 h-40 w-40 rounded-full border border-cyan-400/50 bg-cyan-400/10 blur-2xl" />
        <div className="absolute right-12 bottom-20 h-52 w-52 rounded-full border border-indigo-500/40 bg-indigo-500/10 blur-[100px]" />
      </div>

      <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} onMouseDown={handleStageMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleStageMouseUp} onTouchEnd={handleStageMouseUp} className={isEditing ? 'cursor-default' : 'cursor-crosshair'}>
        <Layer>
          {!isEditing && wires.map(wire => (
            <SpaceWireComponent key={wire.id} wire={wire} gates={gates} signal={computedSignals[wire.id]} isSimulating={isSimulating} draggedItems={draggedItems} />
          ))}
          {isDraggingWire && wireStart && tempWireEnd && (() => {
            const gate = gates.find(g => g.id === wireStart.gateId)
            if (!gate) return null
            let startX, startY
            if (wireStart.type === 'output') {
              const config = gateConfigs[gate.type]
              const spacing = gate.height / ((config.outputs || 1) + 1)
              startX = gate.x + gate.width + 5
              startY = gate.y + spacing * (wireStart.index + 1)
            } else {
              const config = gateConfigs[gate.type]
              const spacing = gate.height / ((config.maxInputs || config.minInputs || 2) + 1)
              startX = gate.x - 5
              startY = gate.y + spacing * (wireStart.index + 1)
            }
            return <SpaceWireComponent wire={{ id: 'temp', startX, startY, endX: tempWireEnd.x, endY: tempWireEnd.y }} gates={gates} signal={0} isTemporary={true} />
          })()}
          {tempSelectionBox && (
            <Rect x={Math.min(tempSelectionBox.x1, tempSelectionBox.x2)} y={Math.min(tempSelectionBox.y1, tempSelectionBox.y2)} width={Math.abs(tempSelectionBox.x2 - tempSelectionBox.x1)} height={Math.abs(tempSelectionBox.y2 - tempSelectionBox.y1)} fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth={2} dash={[8, 4]} />
          )}
          {!isEditing && gates.map(gate => {
            const draggedPosition = draggedItems[gate.id]
            const gateProps = { ...gate, x: draggedPosition ? draggedPosition.x : gate.x, y: draggedPosition ? draggedPosition.y : gate.y };
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
                  if (e.evt.ctrlKey || e.evt.shiftKey) toggleGateSelection(gate.id)
                  else selectGate(gate.id)
                }}
                onUpdateGate={updateGate}
                onWireStart={handleWireStart}
                onWireEnd={handleWireEnd}
                outputSignal={computedSignals[`gate_${gate.id}`] || 0}
              />
            );
          })}
        </Layer>
        <SubcircuitEditorManager />
      </Stage>

      <Suspense fallback={<LoadingFallback />}>
        {renderCreationFlow()}
        {renderDomEditor()}
      </Suspense>
      

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

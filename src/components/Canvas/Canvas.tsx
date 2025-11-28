import React, { useRef, useCallback, useState, useEffect, useMemo, Suspense } from 'react'
import { Stage, Layer, Rect, Ring } from 'react-konva'
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

// Type definitions
interface WireStartData {
  gateId: string | number;
  type: 'input' | 'output';
  index: number;
}

interface RewireData {
  wire: any;
  detached: {
    gateId: string | number;
    type: 'input' | 'output';
    index: number;
  };
}

interface SnapTarget {
  gateId: string | number;
  type: 'input' | 'output';
  index: number;
  x: number;
  y: number;
}

const Canvas = () => {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 280, height: window.innerHeight - 60 })
  const [isDraggingWire, setIsDraggingWire] = useState(false)
  const [wireStart, setWireStart] = useState<WireStartData | null>(null)
  const [tempWireEnd, setTempWireEnd] = useState<{ x: number; y: number } | null>(null)
  const [draggedItems, setDraggedItems] = useState({})
  const [dragStartData, setDragStartData] = useState(null)

  // New state for wire snapping and rewiring
  const [snappedWireEnd, setSnappedWireEnd] = useState<SnapTarget | null>(null)
  const [hoveredStartPin, setHoveredStartPin] = useState<SnapTarget | null>(null)
  const [isWireCreationMode, setIsWireCreationMode] = useState(false)
  const [rewireData, setRewireData] = useState<RewireData | null>(null)

  const latestDraggedItems = useRef({});
  const updateScheduled = useRef(false);

  const [isDrawingSelection, setIsDrawingSelection] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [tempSelectionBox, setTempSelectionBox] = useState(null)
  const [selectionStartedWithShift, setSelectionStartedWithShift] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; wireId: string | number } | null>(null)

  const {
    gates, wires, selectedGate, selectedWire, selectedGates, preSelectedGates, addGate, updateGate,
    updateGatePositions, addWire, removeWire, selectGate, selectWire, clearSelection, toggleGateSelection,
    selectMultipleGates, setPreSelectedGates, getGatesInSelectionBox, isSimulating,
    signals, updateSignals, deleteSelection
  } = useGameStore()

  const {
    isEditing, editingMode, editingSubcircuit, creationMethod,
    startEditing, stopEditing, startCreation
  } = useSubcircuitEditorStore()

  const { addTemplate } = useSubcircuitStore()
  const { shortcuts, editorMode: preferredEditorMode, enableSounds } = useUserPreferencesStore()
  const { updateStats } = useAchievementStore()

  // Helper to get gate position accounting for drag state
  const resolveGatePosition = useCallback((gate: any) => {
    const override = draggedItems[gate.id]
    return override ? { ...gate, ...override } : gate
  }, [draggedItems])

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
        setContextMenu(null)
      }

      // Delete selected wire or gates
      if (combo === 'delete' || combo === 'backspace') {
        e.preventDefault()
        deleteSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectMultipleGates, clearSelection, isEditing, stopEditing, gates, shortcuts, startCreation, selectedGates, wires, deleteSelection])

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

  const handleStageMouseDown = (e: any) => {
    if (e.target === e.target.getStage() && !isEditing) {
      // If we have a hovered start pin, start the wire from there
      if (hoveredStartPin) {
        handleWireStart(hoveredStartPin.gateId, hoveredStartPin.type, hoveredStartPin.index)
        return
      }

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

  const handleWireStart = (gateId: string | number, type: 'input' | 'output', index: number) => {
    // If we are already dragging a wire, this click is ALWAYS intended to finish/cancel the connection
    if (isDraggingWire && wireStart) {
      handleWireEnd(gateId, type, index)
      return
    }

    // Check if this pin is already occupied
    const currentWires = useGameStore.getState().wires
    const occupiedWire = currentWires.find(w =>
      (type === 'output' && w.fromGate === gateId && w.fromIndex === index) ||
      (type === 'input' && w.toGate === gateId && w.toIndex === index)
    )

    if (occupiedWire) {
      // Rewire: pick the existing wire, detach it, and let the user drop one end while the opposite end stays anchored
      const fixedEnd = type === 'output'
        ? { gateId: occupiedWire.toGate, type: 'input' as const, index: occupiedWire.toIndex }
        : { gateId: occupiedWire.fromGate, type: 'output' as const, index: occupiedWire.fromIndex }

      removeWire(occupiedWire.id)
      setRewireData({ wire: occupiedWire, detached: { gateId, type, index } })
      setIsDraggingWire(true)
      setWireStart(fixedEnd)
      setIsWireCreationMode(true)
      return
    }

    // Start new wire
    setIsDraggingWire(true)
    setWireStart({ gateId, type, index })
    setIsWireCreationMode(false)
  }

  const handleWireEnd = (gateId: string | number, type: 'input' | 'output', index: number) => {
    if (!isDraggingWire || !wireStart) return
    let connected = false

    // Skip immediate reconnect to the same detached pin when rewiring
    if (rewireData?.detached &&
        rewireData.detached.gateId === gateId &&
        rewireData.detached.type === type &&
        rewireData.detached.index === index) {
      return
    }

    // Prevent connecting to self or same type (input-input or output-output)
    if (wireStart.gateId === gateId || wireStart.type === type) {
      if (!isWireCreationMode) {
        cancelWireCreation(true)
      }
      return
    }

    const wire = {
      fromGate: wireStart.type === 'output' ? wireStart.gateId : gateId,
      fromIndex: wireStart.type === 'output' ? wireStart.index : index,
      toGate: wireStart.type === 'input' ? wireStart.gateId : gateId,
      toIndex: wireStart.type === 'input' ? wireStart.index : index
    }

    // Check if wire already exists
    const exists = wires.some(w =>
      w.fromGate === wire.fromGate &&
      w.fromIndex === wire.fromIndex &&
      w.toGate === wire.toGate &&
      w.toIndex === wire.toIndex
    )

    // Check if target input is already occupied
    const isInputOccupied = wires.some(w =>
      w.toGate === wire.toGate &&
      w.toIndex === wire.toIndex
    )

    // Check if source output is already occupied
    const isOutputOccupied = wires.some(w =>
      w.fromGate === wire.fromGate &&
      w.fromIndex === wire.fromIndex
    )

    try {
      if (!exists && !isInputOccupied && !isOutputOccupied) {
        addWire(wire)
        updateStats('wiresConnected', prev => prev + 1)
        if (enableSounds) soundService.playConnect?.()
        connected = true
      } else if (isInputOccupied || isOutputOccupied) {
        console.warn('Pin already occupied')
      }
    } catch (error) {
      console.error('Wire connection handling failed', error)
    } finally {
      cancelWireCreation(!connected)
    }
  }

  const cancelWireCreation = (shouldRestore = true) => {
    setIsDraggingWire(false)
    setWireStart(null)
    setTempWireEnd(null)
    setSnappedWireEnd(null)
    setIsWireCreationMode(false)
    // Restore original wire if canceling a rewire operation
    if (shouldRestore && rewireData?.wire) {
      addWire(rewireData.wire)
    }
    setRewireData(null)
  }

  // Find snap target when dragging wire
  const findSnapTarget = (pointerPos: { x: number; y: number }): SnapTarget | null => {
    if (!wireStart) return null

    const SNAP_RADIUS = 20
    let bestDist = SNAP_RADIUS
    let bestTarget: SnapTarget | null = null

    gates.forEach(gate => {
      const gatePos = resolveGatePosition(gate)
      const { x, y, width, height, type, id } = gatePos
      // Don't snap to source gate
      if (id === wireStart.gateId) return

      const config = gateConfigs[type]
      if (!config) return

      // If dragging from output, look for inputs
      if (wireStart.type === 'output') {
        const inputCount = config.maxInputs || 2
        const spacing = height / (inputCount + 1)

        for (let i = 0; i < inputCount; i++) {
          const px = x - 10
          const py = y + spacing * (i + 1)
          const dist = Math.sqrt(Math.pow(pointerPos.x - px, 2) + Math.pow(pointerPos.y - py, 2))

          if (dist < bestDist) {
            const isOccupied = wires.some(w => w.toGate === id && w.toIndex === i)
            if (!isOccupied) {
              bestDist = dist
              bestTarget = { gateId: id, type: 'input', index: i, x: px, y: py }
            }
          }
        }
      }
      // If dragging from input, look for outputs
      else {
        if (type === GateTypes.OUTPUT) return

        const px = x + width + 10
        const py = y + height / 2
        const dist = Math.sqrt(Math.pow(pointerPos.x - px, 2) + Math.pow(pointerPos.y - py, 2))

        if (dist < bestDist) {
          const isOccupied = wires.some(w => w.fromGate === id && w.fromIndex === 0)
          if (!isOccupied) {
            bestDist = dist
            bestTarget = { gateId: id, type: 'output', index: 0, x: px, y: py }
          }
        }
      }
    })

    return bestTarget
  }

  // Find pin to start wire from (hover indicator)
  const findStartTarget = (pointerPos: { x: number; y: number }): SnapTarget | null => {
    const SNAP_RADIUS = 20
    let bestDist = SNAP_RADIUS
    let bestTarget: SnapTarget | null = null
    const currentWires = useGameStore.getState().wires

    gates.forEach(gate => {
      const gatePos = resolveGatePosition(gate)
      const { x, y, width, height, type, id } = gatePos
      const config = gateConfigs[type]
      if (!config) return

      // Check Inputs
      const inputCount = config.maxInputs || 2
      const spacing = height / (inputCount + 1)

      for (let i = 0; i < inputCount; i++) {
        const px = x - 10
        const py = y + spacing * (i + 1)
        const dist = Math.sqrt(Math.pow(pointerPos.x - px, 2) + Math.pow(pointerPos.y - py, 2))

        if (dist < bestDist) {
          const isOccupied = currentWires.some(w => w.toGate === id && w.toIndex === i)
          if (!isOccupied) {
            bestDist = dist
            bestTarget = { gateId: id, type: 'input', index: i, x: px, y: py }
          }
        }
      }

      // Check Outputs
      if (type !== GateTypes.OUTPUT) {
        const px = x + width + 10
        const py = y + height / 2
        const dist = Math.sqrt(Math.pow(pointerPos.x - px, 2) + Math.pow(pointerPos.y - py, 2))

        if (dist < bestDist) {
          const isOccupied = currentWires.some(w => w.fromGate === id && w.fromIndex === 0)
          if (!isOccupied) {
            bestDist = dist
            bestTarget = { gateId: id, type: 'output', index: 0, x: px, y: py }
          }
        }
      }
    })

    return bestTarget
  }

  const handleMouseMove = (e: any) => {
    if (isDrawingSelection) handleSelectionMouseMove(e)

    if (isDraggingWire) {
      const stage = e.target.getStage()
      const pointerPos = stage.getPointerPosition()
      setTempWireEnd(pointerPos)

      const snapTarget = findSnapTarget(pointerPos)
      setSnappedWireEnd(snapTarget)
    } else {
      // If not dragging, look for start targets
      const stage = e.target.getStage()
      if (stage) {
        const pointerPos = stage.getPointerPosition()
        const startTarget = findStartTarget(pointerPos)
        setHoveredStartPin(startTarget)
      }
    }
  }

  const handleStageMouseUp = (e: any) => {
    if (isDrawingSelection) handleSelectionMouseUp()

    if (isDraggingWire) {
      // If we have a snap target, complete the connection
      if (snappedWireEnd) {
        handleWireEnd(snappedWireEnd.gateId, snappedWireEnd.type, snappedWireEnd.index)
        return
      }

      // Check if we should enter creation mode or cancel
      if (!isWireCreationMode && wireStart) {
        const startGate = gates.find(g => g.id === wireStart.gateId)
        if (startGate) {
          let startX: number, startY: number
          if (wireStart.type === 'output') {
            const config = gateConfigs[startGate.type]
            const spacing = startGate.height / ((config.maxOutputs || 1) + 1)
            startX = startGate.x + startGate.width + 5
            startY = startGate.y + spacing * (wireStart.index + 1)
          } else {
            const config = gateConfigs[startGate.type]
            const spacing = startGate.height / ((config.maxInputs || config.minInputs || 2) + 1)
            startX = startGate.x - 5
            startY = startGate.y + spacing * (wireStart.index + 1)
          }

          const pointerPos = e.target.getStage().getPointerPosition()
          const dist = Math.sqrt(Math.pow(pointerPos.x - startX, 2) + Math.pow(pointerPos.y - startY, 2))

          // If moved less than 10px, treat as click and enter creation mode
          if (dist < 10) {
            setIsWireCreationMode(true)
          } else {
            cancelWireCreation()
          }
        } else {
          cancelWireCreation()
        }
      } else {
        // If we were ALREADY in creation mode and clicked empty space, cancel
        cancelWireCreation()
      }
    }
  }

  const renderDomEditor = () => {
    if (!isEditing || editingMode !== 'edit') return null;

    // Inline mode uses Konva only, no DOM overlay needed
    if (preferredEditorMode === 'inline') return null;

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
        {/* Backdrop and UI for non-inline editing modes */}
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

      <Stage ref={stageRef} width={stageSize.width} height={stageSize.height} onMouseDown={(e) => { setContextMenu(null); handleStageMouseDown(e); }} onMouseMove={handleMouseMove} onMouseUp={handleStageMouseUp} onTouchEnd={handleStageMouseUp} className={isEditing ? 'cursor-default' : 'cursor-crosshair'}>
        <Layer>
          {!isEditing && wires.map(wire => (
            <SpaceWireComponent
              key={wire.id}
              wire={wire}
              gates={gates}
              signal={computedSignals[wire.id]}
              isSimulating={isSimulating}
              draggedItems={draggedItems}
              isSelected={selectedWire === wire.id}
              onSelect={(wireId) => selectWire(wireId)}
              onContextMenu={(wireId, e) => {
                selectWire(wireId)
                const stage = stageRef.current
                if (stage) {
                  const containerRect = (stage as any).container().getBoundingClientRect()
                  setContextMenu({
                    x: e.evt.clientX - containerRect.left,
                    y: e.evt.clientY - containerRect.top,
                    wireId
                  })
                }
              }}
            />
          ))}
          {isDraggingWire && wireStart && tempWireEnd && (() => {
            const gate = (() => {
              const base = gates.find(g => g.id === wireStart.gateId)
              if (!base) return null
              const override = draggedItems[wireStart.gateId]
              return override ? { ...base, ...override } : base
            })()
            if (!gate) return null
            let startX: number, startY: number
            if (wireStart.type === 'output') {
              const config = gateConfigs[gate.type]
              const spacing = gate.height / ((config.maxOutputs || 1) + 1)
              startX = gate.x + gate.width + 10
              startY = gate.y + spacing * (wireStart.index + 1)
            } else {
              const config = gateConfigs[gate.type]
              const spacing = gate.height / ((config.maxInputs || config.minInputs || 2) + 1)
              startX = gate.x - 10
              startY = gate.y + spacing * (wireStart.index + 1)
            }

            // Use snapped position if available
            const endX = snappedWireEnd ? snappedWireEnd.x : tempWireEnd.x
            const endY = snappedWireEnd ? snappedWireEnd.y : tempWireEnd.y

            return (
              <>
                <SpaceWireComponent wire={{ id: 'temp', startX, startY, endX, endY }} gates={gates} signal={0} isTemporary={true} />
                {snappedWireEnd && (
                  <Ring
                    x={snappedWireEnd.x}
                    y={snappedWireEnd.y}
                    innerRadius={5}
                    outerRadius={10}
                    stroke="#00ff00"
                    strokeWidth={2}
                    opacity={0.8}
                    listening={false}
                  />
                )}
              </>
            )
          })()}
          {/* Hover Start Indicator */}
          {!isDraggingWire && hoveredStartPin && (
            <Ring
              x={hoveredStartPin.x}
              y={hoveredStartPin.y}
              innerRadius={5}
              outerRadius={10}
              stroke="#22d3ee"
              strokeWidth={2}
              opacity={0.8}
              listening={false}
            />
          )}
          {tempSelectionBox && (
            <Rect x={Math.min(tempSelectionBox.x1, tempSelectionBox.x2)} y={Math.min(tempSelectionBox.y1, tempSelectionBox.y2)} width={Math.abs(tempSelectionBox.x2 - tempSelectionBox.x1)} height={Math.abs(tempSelectionBox.y2 - tempSelectionBox.y1)} fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth={2} dash={[8, 4]} />
          )}
          {!isEditing && gates.map(gate => {
            const draggedPosition = draggedItems[gate.id]
            const gateProps = { ...gate, x: draggedPosition ? draggedPosition.x : gate.x, y: draggedPosition ? draggedPosition.y : gate.y };

            // Qaysi pinlar ulangan - wire'lardan hisoblash
            const connectedInputs = wires
              .filter(w => w.toGate === gate.id)
              .map(w => w.toIndex || 0)
            const connectedOutputs = wires
              .filter(w => w.fromGate === gate.id)
              .map(w => w.fromIndex || 0)

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
                  if (e.evt?.ctrlKey || e.evt?.shiftKey) toggleGateSelection(gate.id)
                  else selectGate(gate.id)
                }}
                onUpdateGate={updateGate}
                onWireStart={handleWireStart}
                onWireEnd={handleWireEnd}
                outputSignal={computedSignals[`gate_${gate.id}`] || 0}
                connectedPins={{ inputs: connectedInputs, outputs: connectedOutputs }}
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

      {/* Wire Context Menu */}
      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute z-50 min-w-[160px] rounded-lg border border-slate-600/50 bg-slate-800/95 py-1 shadow-xl backdrop-blur-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
            onClick={() => {
              removeWire(contextMenu.wireId)
              setContextMenu(null)
              if (enableSounds) soundService.playDisconnect?.()
            }}
          >
            <span className="text-red-400">✕</span>
            Simni o'chirish
          </button>
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
            onClick={() => {
              const wire = wires.find(w => w.id === contextMenu.wireId)
              if (wire) {
                removeWire(wire.id)
                setIsDraggingWire(true)
                setWireStart({ gateId: wire.fromGate, type: 'output', index: wire.fromIndex || 0 })
              }
              setContextMenu(null)
            }}
          >
            <span className="text-cyan-400">↻</span>
            Qayta ulash
          </button>
          <div className="my-1 border-t border-slate-600/50" />
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:bg-slate-700/50 transition-colors"
            onClick={() => setContextMenu(null)}
          >
            Bekor qilish
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default Canvas

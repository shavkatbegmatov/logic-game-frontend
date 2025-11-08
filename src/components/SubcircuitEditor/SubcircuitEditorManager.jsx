import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Edit } from 'lucide-react'
import useUserPreferencesStore from '../../store/userPreferencesStore'
import useSubcircuitEditorStore from '../../store/subcircuitEditorStore'
import useGameStore from '../../store/gameStore'
import useSubcircuitStore from '../../store/subcircuitStore'

// Lazy imports with fallbacks
const InlineCanvasMode = React.lazy(() => import('./modes/InlineCanvasMode'))
const FloatingPanelMode = React.lazy(() => import('./modes/FloatingPanelMode'))
const FullModalMode = React.lazy(() => import('./modes/FullModalMode'))
const SplitViewMode = React.lazy(() => import('./modes/SplitViewMode'))

const QuickCreate = React.lazy(() => import('./creation/QuickCreate'))
const WizardCreate = React.lazy(() => import('./creation/WizardCreate'))
const TemplateCreate = React.lazy(() => import('./creation/TemplateCreate'))
const VisualBoundaryCreate = React.lazy(() => import('./creation/VisualBoundaryCreate'))

const EditorModeSelector = React.lazy(() => import('./ui/EditorModeSelector'))
const EditorToolbar = React.lazy(() => import('./ui/EditorToolbar'))
const BreadcrumbNav = React.lazy(() => import('./ui/BreadcrumbNav'))

const AnimationController = React.lazy(() => import('./effects/AnimationController'))
const SoundManager = React.lazy(() => import('./effects/SoundManager'))
import { soundService } from './effects/SoundManager'
import { normalizeKeyEvent, normalizeShortcutString } from '../../utils/keyboard'

const SubcircuitEditorManager = () => {
  const {
    editorMode,
    creationFlow,
    hasChosenEditorMode,
    isFirstTime,
    shortcuts,
    enableAnimations,
    enableSounds,
    theme
  } = useUserPreferencesStore()

  const {
    isEditing,
    editingMode,
    editingSubcircuit,
    editingContext,
    creationMethod,
    startEditing,
    stopEditing,
    startCreation
  } = useSubcircuitEditorStore()

  const {
    selectedGates,
    gates,
    wires,
    clearSelection
  } = useGameStore()

  const {
    addTemplate,
    getTemplate
  } = useSubcircuitStore()

  const [showModeSelector, setShowModeSelector] = useState(false)
  const [activeCreationFlow, setActiveCreationFlow] = useState(null)

  // First time user - show mode selector
  useEffect(() => {
    if (isFirstTime() && !hasChosenEditorMode) {
      setShowModeSelector(true)
    }
  }, [hasChosenEditorMode, isFirstTime])

  // Sync activeCreationFlow with store creationMethod
  useEffect(() => {
    if (isEditing && editingMode === 'create' && creationMethod) {
      setActiveCreationFlow(prev => {
        if (prev !== creationMethod) {
          console.log('SubcircuitEditorManager: Setting activeCreationFlow to', creationMethod)
          return creationMethod
        }
        return prev
      })
    }

    if (!isEditing) {
      setActiveCreationFlow(prev => {
        if (prev !== null) {
          console.log('SubcircuitEditorManager: Clearing activeCreationFlow')
          return null
        }
        return prev
      })
    }
  }, [isEditing, editingMode, creationMethod])

  const handleCreateSubcircuit = useCallback((method) => {
    console.log('handleCreateSubcircuit called with method:', method)
    console.log('Selected gates count:', selectedGates.length)

    if (selectedGates.length === 0) {
      console.error('No gates selected for subcircuit creation')
      if (enableSounds) soundService.playError()
      return
    }

    const gateMap = new Map(gates.map(g => [String(g.id), g]))
    const selectedIds = new Set(selectedGates.map(id => String(id)))

    const selectedGateObjects = selectedGates
      .map(id => gateMap.get(String(id)))
      .filter(Boolean)
      .map(g => {
        const { id, type, x, y, width, height, inputs = [], outputs = [], value = 0, rotation = 0, flipped = false, ...rest } = g
        return { id, type, x, y, width: width ?? 80, height: height ?? 60, inputs: Array.isArray(inputs) ? [...inputs] : [], outputs: Array.isArray(outputs) ? [...outputs] : [], value, rotation, flipped, ...rest }
      })

    const selectedWireObjects = wires
      .filter(w => selectedIds.has(String(w.fromGate)) || selectedIds.has(String(w.toGate)))
      .map(w => {
        const { id, fromGate, toGate, fromIndex = 0, toIndex = 0, signal = 0, ...rest } = w
        return { id, fromGate, toGate, fromIndex, toIndex, signal, ...rest }
      })

    console.log('Selected gate objects:', selectedGateObjects)
    console.log('Selected wire objects:', selectedWireObjects)

    if (selectedGateObjects.length === 0) {
      console.error('Gate objects not found for selected IDs')
      if (enableSounds) soundService.playError()
      return
    }

    const boundaryBox = selectedGateObjects.reduce(
      (acc, gate) => {
        const gateWidth = gate.width ?? 80
        const gateHeight = gate.height ?? 60
        return {
          minX: Math.min(acc.minX, gate.x),
          minY: Math.min(acc.minY, gate.y),
          maxX: Math.max(acc.maxX, gate.x + gateWidth),
          maxY: Math.max(acc.maxY, gate.y + gateHeight)
        }
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    )

    const normalizedBoundaryBox = {
      minX: boundaryBox.minX === Infinity ? 0 : boundaryBox.minX,
      minY: boundaryBox.minY === Infinity ? 0 : boundaryBox.minY,
      maxX: boundaryBox.maxX === -Infinity ? 0 : boundaryBox.maxX,
      maxY: boundaryBox.maxY === -Infinity ? 0 : boundaryBox.maxY
    }
    normalizedBoundaryBox.width = normalizedBoundaryBox.maxX - normalizedBoundaryBox.minX
    normalizedBoundaryBox.height = normalizedBoundaryBox.maxY - normalizedBoundaryBox.minY
    normalizedBoundaryBox.centerX = normalizedBoundaryBox.minX + normalizedBoundaryBox.width / 2
    normalizedBoundaryBox.centerY = normalizedBoundaryBox.minY + normalizedBoundaryBox.height / 2

    const methodToUse = method || 'quick'
    startCreation(methodToUse, {
      selectedGates: selectedGateObjects,
      selectedWires: selectedWireObjects,
      boundaryBox: normalizedBoundaryBox
    })

    setTimeout(() => {
      const storeState = useSubcircuitEditorStore.getState()
      console.log('handleCreateSubcircuit: Store state after creation:', {
        isEditing: storeState.isEditing,
        editingMode: storeState.editingMode,
        creationMethod: storeState.creationMethod,
        hasCreationData: !!storeState.creationData,
        selectedGatesInStore: storeState.creationData?.selectedGates?.length || 0
      })
    }, 0)

    if (enableSounds) soundService.playClick()
  }, [selectedGates, gates, wires, startCreation, enableSounds])

  const handleEnterEditMode = useCallback((subcircuitGate) => {
    const template = getTemplate(subcircuitGate.templateId)
    if (!template) {
      if (enableSounds) soundService.playError()
      console.error('Subcircuit template topilmadi')
      return
    }
    startEditing('edit', { ...subcircuitGate, template })
    if (enableSounds) soundService.playTransition()
  }, [getTemplate, startEditing, enableSounds])

  const handleExitEditMode = useCallback(() => {
    const { isDirty } = useSubcircuitEditorStore.getState()
    if (isDirty) {
      if (!confirm('Saqllanmagan o\'zgarishlar bor. Chiqishni xohlaysizmi?')) {
        return
      }
    }
    stopEditing()
    clearSelection()
    if (enableSounds) soundService.playTransition()
  }, [stopEditing, clearSelection, enableSounds])

  // Keyboard shortcuts
  useEffect(() => {
    const createShortcut = normalizeShortcutString(shortcuts.createSubcircuit)
    const quickShortcut = normalizeShortcutString(shortcuts.quickCreate)
    const exitShortcut = normalizeShortcutString(shortcuts.exitEditMode)
    const enterShortcut = normalizeShortcutString(shortcuts.enterEditMode)
    const undoShortcut = normalizeShortcutString(shortcuts.undo)
    const redoShortcut = normalizeShortcutString(shortcuts.redo)

    const handleKeyDown = (e) => {
      const combo = normalizeKeyEvent(e)
      if (!combo) return

      if (combo === createShortcut && selectedGates.length > 0) {
        e.preventDefault()
        handleCreateSubcircuit(creationFlow)
        return
      }
      if (combo === quickShortcut && selectedGates.length > 0) {
        e.preventDefault()
        handleCreateSubcircuit('quick')
        return
      }
      if (combo === exitShortcut && isEditing) {
        e.preventDefault()
        handleExitEditMode()
        return
      }
      if (combo === enterShortcut && selectedGates.length === 1) {
        const selectedGate = gates.find(g => g.id === selectedGates[0])
        if (selectedGate?.type === 'SUBCIRCUIT') {
          e.preventDefault()
          handleEnterEditMode(selectedGate)
        }
        return
      }
      if (combo === undoShortcut && isEditing) {
        e.preventDefault()
        useSubcircuitEditorStore.getState().undo()
        return
      }
      if (combo === redoShortcut && isEditing) {
        e.preventDefault()
        useSubcircuitEditorStore.getState().redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, selectedGates, isEditing, gates, creationFlow, handleCreateSubcircuit, handleExitEditMode, handleEnterEditMode])

  const renderEditorUI = () => {
    if (!isEditing || editingMode !== 'edit') return null

    if (editorMode === 'inline') {
      return (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-900/80 backdrop-blur-sm"
            onClick={handleExitEditMode}
          />
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-4 rounded-lg bg-slate-800/80 p-3 shadow-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">
                  Editing: <span className="text-cyan-400">{editingSubcircuit?.name}</span>
                </h2>
              </div>
              <button
                onClick={handleExitEditMode}
                className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
              >
                Close Editor
              </button>
            </div>
          </div>
        </>
      )
    }
    // Boshqa modlar uchun UI bu yerda render qilinishi mumkin
    return null
  }

  const renderKonvaEditor = () => {
    if (!isEditing || editingMode !== 'edit') return null

    const props = { onClose: handleExitEditMode, theme, enableAnimations }

    switch (editorMode) {
      case 'inline':
        return <InlineCanvasMode {...props} />
      case 'floating':
        return <FloatingPanelMode {...props} />
      case 'fullModal':
        return <FullModalMode {...props} />
      case 'splitView':
        return <SplitViewMode {...props} />
      default:
        return <InlineCanvasMode {...props} />
    }
  }

  const renderCreationFlow = () => {
    if (!activeCreationFlow) return null

    const props = {
      onComplete: (template) => {
        console.log('Creation flow completed with template:', template)
        addTemplate(template)
        setActiveCreationFlow(null)
        const subcircuitForEditing = {
          ...template,
          internalGates: template.internalCircuit?.gates || [],
          internalWires: template.internalCircuit?.wires || [],
          internalBounds: template.internalCircuit?.bounds || null,
          inputPorts: template.inputs || [],
          outputPorts: template.outputs || []
        }
        console.log('Opening editor for template:', subcircuitForEditing)
        startEditing('edit', subcircuitForEditing)
        clearSelection()
        if (enableSounds) soundService.playSuccess()
      },
      onCancel: () => {
        console.warn('Creation flow cancelled, resetting state')
        setActiveCreationFlow(null)
        stopEditing()
        if (enableSounds) soundService.playCancel()
      }
    }

    switch (activeCreationFlow) {
      case 'quick':
        return <QuickCreate {...props} />
      case 'wizard':
        return <WizardCreate {...props} />
      case 'template':
        return <TemplateCreate {...props} />
      case 'visual':
        return <VisualBoundaryCreate {...props} />
      default:
        console.warn('renderCreationFlow: Unknown method, using QuickCreate')
        return <QuickCreate {...props} />
    }
  }

  const LoadingFallback = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
    </div>
  )

  return (
    <>
      {renderEditorUI()}
      <Suspense fallback={<LoadingFallback />}>
        {renderKonvaEditor()}
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        {renderCreationFlow()}
      </Suspense>

      {showModeSelector && (
        <Suspense fallback={<LoadingFallback />}>
          <EditorModeSelector
            onSelect={(mode) => {
              useUserPreferencesStore.getState().setEditorMode(mode)
              setShowModeSelector(false)
              if (enableSounds) soundService.playSuccess()
            }}
            onSkip={() => setShowModeSelector(false)}
          />
        </Suspense>
      )}
      {isEditing && editingContext.length > 0 && (
        <Suspense fallback={<LoadingFallback />}>
          <BreadcrumbNav
            context={editingContext}
            onNavigate={(index) => {
              const newContext = editingContext.slice(0, index + 1)
              useSubcircuitEditorStore.getState().editingContext = newContext
            }}
          />
        </Suspense>
      )}
      {isEditing && (
        <Suspense fallback={<LoadingFallback />}>
          <EditorToolbar
            position="bottom"
            onSave={() => { if (enableSounds) soundService.playSuccess() }}
            onCancel={handleExitEditMode}
            onUndo={() => useSubcircuitEditorStore.getState().undo()}
            onRedo={() => useSubcircuitEditorStore.getState().redo()}
          />
        </Suspense>
      )}
      {enableAnimations && <Suspense fallback={null}><AnimationController /></Suspense>}
      {enableSounds && <Suspense fallback={null}><SoundManager /></Suspense>}
    </>
  )
}

export default SubcircuitEditorManager

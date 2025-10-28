import React, { useEffect, useState, useCallback, Suspense } from 'react'
import useUserPreferencesStore from '../../store/userPreferencesStore'
import useSubcircuitEditorStore from '../../store/subcircuitEditorStore'
import useGameStore from '../../store/gameStore'
import useSubcircuitStore from '../../store/subcircuitStore'
import SoundManager from './effects/SoundManager'

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
    console.log('SubcircuitEditorManager: Sync effect', {
      isEditing,
      editingMode,
      creationMethod,
      activeCreationFlow,
      shouldSync: isEditing && editingMode === 'create' && creationMethod && !activeCreationFlow
    })

    if (isEditing && editingMode === 'create' && creationMethod && !activeCreationFlow) {
      console.log('SubcircuitEditorManager: Setting activeCreationFlow to', creationMethod)
      setActiveCreationFlow(creationMethod)
    }

    // Agar editing to'xtatilsa, activeCreationFlow'ni tozalash
    if (!isEditing && activeCreationFlow) {
      console.log('SubcircuitEditorManager: Clearing activeCreationFlow')
      setActiveCreationFlow(null)
    }
  }, [isEditing, editingMode, creationMethod, activeCreationFlow])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.shiftKey ? 'shift+' : ''}${e.altKey ? 'alt+' : ''}${e.key.toLowerCase()}`

      // Create subcircuit shortcut
      if (key === shortcuts.createSubcircuit && selectedGates.length > 0) {
        e.preventDefault()
        handleCreateSubcircuit(creationFlow)
      }

      // Quick create shortcut
      if (key === shortcuts.quickCreate && selectedGates.length > 0) {
        e.preventDefault()
        handleCreateSubcircuit('quick')
      }

      // Exit edit mode
      if (key === shortcuts.exitEditMode && isEditing) {
        e.preventDefault()
        handleExitEditMode()
      }

      // Enter edit mode
      if (key === shortcuts.enterEditMode && selectedGates.length === 1) {
        const selectedGate = gates.find(g => g.id === selectedGates[0])
        if (selectedGate?.type === 'SUBCIRCUIT') {
          e.preventDefault()
          handleEnterEditMode(selectedGate)
        }
      }

      // Undo/Redo
      if (key === shortcuts.undo && isEditing) {
        e.preventDefault()
        useSubcircuitEditorStore.getState().undo()
      }

      if (key === shortcuts.redo && isEditing) {
        e.preventDefault()
        useSubcircuitEditorStore.getState().redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, selectedGates, isEditing, gates, creationFlow])

  // Handle subcircuit creation
  const handleCreateSubcircuit = useCallback((method) => {
    console.log('handleCreateSubcircuit called with method:', method)
    console.log('Selected gates count:', selectedGates.length)

    if (selectedGates.length === 0) {
      console.error('No gates selected for subcircuit creation')
      if (enableSounds) SoundManager.playError()
      return
    }

    const selectedIds = new Set(selectedGates)

    const selectedGateObjects = gates
      .filter(g => selectedIds.has(g.id))
      .map(g => {
        const {
          id,
          type,
          x,
          y,
          width,
          height,
          inputs = [],
          outputs = [],
          value = 0,
          rotation = 0,
          flipped = false,
          ...rest
        } = g

        return {
          id,
          type,
          x,
          y,
          width,
          height,
          inputs: Array.isArray(inputs) ? [...inputs] : [],
          outputs: Array.isArray(outputs) ? [...outputs] : [],
          value,
          rotation,
          flipped,
          ...rest
        }
      })

    const selectedWireObjects = wires
      .filter(w => selectedIds.has(w.fromGate) || selectedIds.has(w.toGate))
      .map(w => {
        const {
          id,
          fromGate,
          toGate,
          fromIndex = 0,
          toIndex = 0,
          signal = 0,
          ...rest
        } = w

        return {
          id,
          fromGate,
          toGate,
          fromIndex,
          toIndex,
          signal,
          ...rest
        }
      })

    console.log('Selected gate objects:', selectedGateObjects)
    console.log('Selected wire objects:', selectedWireObjects)

    // Ma'lumotlarni store'ga saqlashdan oldin tekshirish
    if (selectedGateObjects.length === 0) {
      console.error('Gate objects not found for selected IDs')
      if (enableSounds) SoundManager.playError()
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
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
      }
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

    // Store'ga ma'lumotlarni saqlash
    startCreation(methodToUse, {
      selectedGates: selectedGateObjects,
      selectedWires: selectedWireObjects,
      boundaryBox: normalizedBoundaryBox
    })

    // Store yangilanishini kutish, keyin activeCreationFlow o'rnatish
    setTimeout(() => {
      console.log('handleCreateSubcircuit: Setting activeCreationFlow to', methodToUse)
      setActiveCreationFlow(methodToUse)

      // Store holatini tekshirish
      const storeState = useSubcircuitEditorStore.getState()
      console.log('handleCreateSubcircuit: Store state after creation:', {
        isEditing: storeState.isEditing,
        editingMode: storeState.editingMode,
        creationMethod: storeState.creationMethod,
        hasCreationData: !!storeState.creationData,
        selectedGatesInStore: storeState.creationData?.selectedGates?.length || 0
      })
    }, 0)

    if (enableSounds) SoundManager.playClick()
  }, [selectedGates, gates, wires, startCreation, enableSounds])

  // Handle entering edit mode
  const handleEnterEditMode = useCallback((subcircuitGate) => {
    const template = getTemplate(subcircuitGate.templateId)
    if (!template) {
      if (enableSounds) SoundManager.playError()
      console.error('Subcircuit template topilmadi')
      return
    }

    startEditing('edit', {
      ...subcircuitGate,
      template
    })

    if (enableSounds) SoundManager.playTransition()
  }, [getTemplate, startEditing, enableSounds])

  // Handle exiting edit mode
  const handleExitEditMode = useCallback(() => {
    // Check for unsaved changes
    const { isDirty } = useSubcircuitEditorStore.getState()
    if (isDirty) {
      if (!confirm('Saqllanmagan o\'zgarishlar bor. Chiqishni xohlaysizmi?')) {
        return
      }
    }

    stopEditing()
    clearSelection()
    if (enableSounds) SoundManager.playTransition()
  }, [stopEditing, clearSelection, enableSounds])

  // Render appropriate editor mode
  const renderEditor = () => {
    // Faqat edit mode'da editor'ni ko'rsatish (creation mode'da emas)
    if (!isEditing || editingMode !== 'edit') {
      console.log('renderEditor: Not rendering', { isEditing, editingMode })
      return null
    }

    console.log('renderEditor: Rendering editor with mode:', editorMode)

    const props = {
      onClose: handleExitEditMode,
      theme: theme,
      enableAnimations: enableAnimations
    }

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

  // Render creation flow
  const renderCreationFlow = () => {
    if (!activeCreationFlow) {
      console.log('renderCreationFlow: No activeCreationFlow')
      return null
    }

    console.log('renderCreationFlow: Rendering', activeCreationFlow)

    const props = {
      onComplete: (template) => {
        console.log('Creation flow completed with template:', template)

        // Template'ni library'ga qo'shish
        addTemplate(template)

        // Creation flow'ni to'xtatish
        setActiveCreationFlow(null)

        // Template'ni edit qilish uchun tayyorlash
        const subcircuitForEditing = {
          ...template,
          internalGates: template.internalCircuit?.gates || [],
          internalWires: template.internalCircuit?.wires || [],
          internalBounds: template.internalCircuit?.bounds || null,
          inputPorts: template.inputs || [],
          outputPorts: template.outputs || []
        }

        console.log('Opening editor for template:', subcircuitForEditing)

        // Edit mode'ga o'tish (creation mode'dan exit qilib, edit mode'ga o'tamiz)
        startEditing('edit', subcircuitForEditing)

        // Tanlashni tozalash
        clearSelection()

        if (enableSounds) SoundManager.playSuccess()
      },
      onCancel: () => {
        console.warn('Creation flow cancelled, resetting state')
        setActiveCreationFlow(null)
        stopEditing()
        if (enableSounds) SoundManager.playCancel()
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

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  )

  return (
    <>
      {/* Editor Mode Selector (first time) */}
      {showModeSelector && (
        <Suspense fallback={<LoadingFallback />}>
          <EditorModeSelector
          onSelect={(mode) => {
            useUserPreferencesStore.getState().setEditorMode(mode)
            setShowModeSelector(false)
            if (enableSounds) SoundManager.playSuccess()
          }}
          onSkip={() => {
            setShowModeSelector(false)
          }}
        />
        </Suspense>
      )}

      {/* Breadcrumb Navigation */}
      {isEditing && editingContext.length > 0 && (
        <Suspense fallback={<LoadingFallback />}>
          <BreadcrumbNav
            context={editingContext}
            onNavigate={(index) => {
              // Navigate to specific context level
              const newContext = editingContext.slice(0, index + 1)
              useSubcircuitEditorStore.getState().editingContext = newContext
            }}
          />
        </Suspense>
      )}

      {/* Main Editor */}
      <Suspense fallback={<LoadingFallback />}>
        {renderEditor()}
      </Suspense>

      {/* Creation Flow */}
      <Suspense fallback={<LoadingFallback />}>
        {renderCreationFlow()}
      </Suspense>

      {/* Floating Toolbar (always visible when editing) */}
      {isEditing && (
        <Suspense fallback={<LoadingFallback />}>
          <EditorToolbar
            position="bottom"
            onSave={() => {
              // Save logic
              if (enableSounds) SoundManager.playSuccess()
            }}
            onCancel={handleExitEditMode}
            onUndo={() => useSubcircuitEditorStore.getState().undo()}
            onRedo={() => useSubcircuitEditorStore.getState().redo()}
          />
        </Suspense>
      )}

      {/* Animation Controller */}
      {enableAnimations && (
        <Suspense fallback={null}>
          <AnimationController />
        </Suspense>
      )}

      {/* Sound Manager */}
      {enableSounds && (
        <Suspense fallback={null}>
          <SoundManager />
        </Suspense>
      )}
    </>
  )
}

export default SubcircuitEditorManager

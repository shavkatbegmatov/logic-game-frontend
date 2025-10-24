import React, { useEffect, useState, useCallback, Suspense } from 'react'
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

const SoundManager = React.lazy(() => import('./effects/SoundManager'))
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
    if (isEditing && editingMode === 'create' && creationMethod && !activeCreationFlow) {
      setActiveCreationFlow(creationMethod)
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

    const selectedGateObjects = gates.filter(g => selectedGates.includes(g.id))
    const selectedWireObjects = wires.filter(w => {
      const selectedIds = new Set(selectedGates)
      return selectedIds.has(w.fromGate) || selectedIds.has(w.toGate)
    })

    console.log('Selected gate objects:', selectedGateObjects)
    console.log('Selected wire objects:', selectedWireObjects)

    // Ma'lumotlarni store'ga saqlashdan oldin tekshirish
    if (selectedGateObjects.length === 0) {
      console.error('Gate objects not found for selected IDs')
      if (enableSounds) SoundManager.playError()
      return
    }

    startCreation(method || 'quick', {
      selectedGates: selectedGateObjects,
      selectedWires: selectedWireObjects
    })

    setActiveCreationFlow(method || 'quick')
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
    if (!isEditing) return null

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
    if (!activeCreationFlow) return null

    const props = {
      onComplete: (template) => {
        console.log('QuickCreate completed with template:', template)
        addTemplate(template)
        setActiveCreationFlow(null)
        stopEditing()
        clearSelection()
        if (enableSounds) SoundManager.playSuccess()
      },
      onCancel: () => {
        console.warn('QuickCreate cancelled, resetting state')
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
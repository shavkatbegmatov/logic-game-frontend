import React, { useEffect, useState, useCallback, Suspense } from 'react'
import useUserPreferencesStore from '../../store/userPreferencesStore'
import useSubcircuitEditorStore from '../../store/subcircuitEditorStore'
import useGameStore from '../../store/gameStore'
import useSubcircuitStore from '../../store/subcircuitStore'

// Lazy imports for editor modes and creation flows
const InlineCanvasMode = React.lazy(() => import('./modes/InlineCanvasMode'))
const FloatingPanelMode = React.lazy(() => import('./modes/FloatingPanelMode'))
const FullModalMode = React.lazy(() => import('./modes/FullModalMode'))
const SplitViewMode = React.lazy(() => import('./modes/SplitViewMode'))

const QuickCreate = React.lazy(() => import('./creation/QuickCreate'))
const WizardCreate = React.lazy(() => import('./creation/WizardCreate'))
const TemplateCreate = React.lazy(() => import('./creation/TemplateCreate'))
const VisualBoundaryCreate = React.lazy(() => import('./creation/VisualBoundaryCreate'))

import { soundService } from './effects/SoundManager'
import { normalizeKeyEvent, normalizeShortcutString } from '../../utils/keyboard'

const SubcircuitEditorManager = () => {
  const { editorMode, creationFlow, shortcuts, enableSounds } = useUserPreferencesStore()
  const { isEditing, editingMode, startEditing, stopEditing, startCreation, creationMethod } = useSubcircuitEditorStore()
  const { selectedGates, gates, wires, clearSelection } = useGameStore()
  const { addTemplate, getTemplate } = useSubcircuitStore()

  const [activeCreationFlow, setActiveCreationFlow] = useState(null)

  useEffect(() => {
    if (isEditing && editingMode === 'create' && creationMethod) {
      setActiveCreationFlow(creationMethod)
    } else if (!isEditing) {
      setActiveCreationFlow(null)
    }
  }, [isEditing, editingMode, creationMethod])

  const handleCreateSubcircuit = useCallback((method) => {
    if (selectedGates.length === 0) {
      console.error('No gates selected for subcircuit creation')
      if (enableSounds) soundService.playError()
      return
    }

    const gateMap = new Map(gates.map(g => [String(g.id), g]))
    const selectedIds = new Set(selectedGates.map(id => String(id)))
    const selectedGateObjects = selectedGates.map(id => gateMap.get(String(id))).filter(Boolean)
    const selectedWireObjects = wires.filter(w => selectedIds.has(String(w.fromGate)) || selectedIds.has(String(w.toGate)))

    if (selectedGateObjects.length === 0) {
      console.error('Gate objects not found for selected IDs')
      if (enableSounds) soundService.playError()
      return
    }

    startCreation(method || 'quick', {
      selectedGates: selectedGateObjects,
      selectedWires: selectedWireObjects,
    })

    if (enableSounds) soundService.playClick()
  }, [selectedGates, gates, wires, startCreation, enableSounds])

  const handleEnterEditMode = useCallback((subcircuitGate) => {
    const template = getTemplate(subcircuitGate.templateId)
    if (!template) {
      if (enableSounds) soundService.playError()
      console.error('Subcircuit template not found')
      return
    }
    startEditing('edit', { ...subcircuitGate, template })
    if (enableSounds) soundService.playTransition()
  }, [getTemplate, startEditing, enableSounds])

  const handleExitEditMode = useCallback(() => {
    stopEditing()
    clearSelection()
    if (enableSounds) soundService.playTransition()
  }, [stopEditing, clearSelection, enableSounds])

  useEffect(() => {
    const createShortcut = normalizeShortcutString(shortcuts.createSubcircuit)
    const quickShortcut = normalizeShortcutString(shortcuts.quickCreate)
    const exitShortcut = normalizeShortcutString(shortcuts.exitEditMode)
    const enterShortcut = normalizeShortcutString(shortcuts.enterEditMode)

    const handleKeyDown = (e) => {
      const combo = normalizeKeyEvent(e)
      if (!combo) return

      if (combo === createShortcut && selectedGates.length > 0) {
        e.preventDefault()
        handleCreateSubcircuit(creationFlow)
      } else if (combo === quickShortcut && selectedGates.length > 0) {
        e.preventDefault()
        handleCreateSubcircuit('quick')
      } else if (combo === exitShortcut && isEditing) {
        e.preventDefault()
        handleExitEditMode()
      } else if (combo === enterShortcut && selectedGates.length === 1) {
        const selectedGate = gates.find(g => g.id === selectedGates[0])
        if (selectedGate?.type === 'SUBCIRCUIT') {
          e.preventDefault()
          handleEnterEditMode(selectedGate)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, selectedGates, isEditing, gates, creationFlow, handleCreateSubcircuit, handleExitEditMode, handleEnterEditMode])

  const onCreationComplete = (template) => {
    console.log('Creation flow completed with template:', template)
    addTemplate(template)
    setActiveCreationFlow(null)
    startEditing('edit', template)
    clearSelection()
    if (enableSounds) soundService.playSuccess()
  }

  const onCreationCancel = () => {
    console.warn('Creation flow cancelled, resetting state')
    setActiveCreationFlow(null)
    stopEditing()
    if (enableSounds) soundService.playCancel()
  }

  const renderKonvaEditor = () => {
    if (!isEditing || editingMode !== 'edit') return null
    const props = { onClose: handleExitEditMode }
    switch (editorMode) {
      case 'inline': return <InlineCanvasMode {...props} />
      case 'floating': return <FloatingPanelMode {...props} />
      case 'fullModal': return <FullModalMode {...props} />
      case 'splitView': return <SplitViewMode {...props} />
      default: return <InlineCanvasMode {...props} />
    }
  }

  const renderCreationFlow = () => {
    if (!activeCreationFlow) return null
    const props = { onComplete: onCreationComplete, onCancel: onCreationCancel }
    switch (activeCreationFlow) {
      case 'quick': return <QuickCreate {...props} />
      case 'wizard': return <WizardCreate {...props} />
      case 'template': return <TemplateCreate {...props} />
      case 'visual': return <VisualBoundaryCreate {...props} />
      default: return <QuickCreate {...props} />
    }
  }

  const LoadingFallback = () => null // Main canvas handles loading indicator

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        {renderKonvaEditor()}
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        {renderCreationFlow()}
      </Suspense>
    </>
  )
}

export default SubcircuitEditorManager

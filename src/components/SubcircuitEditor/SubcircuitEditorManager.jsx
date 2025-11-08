import React, { useEffect, useCallback, Suspense } from 'react'
import useUserPreferencesStore from '../../store/userPreferencesStore'
import useSubcircuitEditorStore from '../../store/subcircuitEditorStore'
import useGameStore from '../../store/gameStore'
import useSubcircuitStore from '../../store/subcircuitStore'

// Lazy imports for editor modes
const InlineCanvasMode = React.lazy(() => import('./modes/InlineCanvasMode'))
const FloatingPanelMode = React.lazy(() => import('./modes/FloatingPanelMode'))
const FullModalMode = React.lazy(() => import('./modes/FullModalMode'))
const SplitViewMode = React.lazy(() => import('./modes/SplitViewMode'))

import { soundService } from './effects/SoundManager'
import { normalizeKeyEvent, normalizeShortcutString } from '../../utils/keyboard'

/**
 * This component manages ONLY the Konva part of the subcircuit editor.
 * It renders the appropriate editor mode (e.g., InlineCanvasMode) inside the Konva Stage.
 * All DOM-based UI (creation flows, toolbars, etc.) is handled by Canvas.jsx.
 */
const SubcircuitEditorManager = () => {
  const { editorMode, creationFlow, shortcuts, enableSounds } = useUserPreferencesStore()
  const { isEditing, editingMode, startEditing, stopEditing, startCreation } = useSubcircuitEditorStore()
  const { selectedGates, gates, clearSelection } = useGameStore()
  const { getTemplate } = useSubcircuitStore()

  const handleCreateSubcircuit = useCallback((method) => {
    if (selectedGates.length === 0) {
      if (enableSounds) soundService.playError()
      return
    }
    const gateMap = new Map(gates.map(g => [String(g.id), g]))
    const selectedGateObjects = selectedGates.map(id => gateMap.get(String(id))).filter(Boolean)
    const selectedWireObjects = useGameStore.getState().wires.filter(w => {
      const selectedIds = new Set(selectedGates.map(id => String(id)))
      return selectedIds.has(String(w.fromGate)) || selectedIds.has(String(w.toGate))
    })
    startCreation(method || 'quick', {
      selectedGates: selectedGateObjects,
      selectedWires: selectedWireObjects,
    })
    if (enableSounds) soundService.playClick()
  }, [selectedGates, gates, startCreation, enableSounds])

  const handleEnterEditMode = useCallback((subcircuitGate) => {
    const template = getTemplate(subcircuitGate.templateId)
    if (!template) {
      if (enableSounds) soundService.playError()
      return
    }
    startEditing('edit', template)
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

      if (combo === createShortcut && selectedGates.length > 0 && !isEditing) {
        e.preventDefault()
        handleCreateSubcircuit(creationFlow)
      } else if (combo === quickShortcut && selectedGates.length > 0 && !isEditing) {
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

  return (
    <Suspense fallback={null}>
      {renderKonvaEditor()}
    </Suspense>
  )
}

export default SubcircuitEditorManager

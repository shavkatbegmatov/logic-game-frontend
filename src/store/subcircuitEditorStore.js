// Subcircuit Editor Store - Tahrirlash holati
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { deepEqualArrays } from '../utils/arrayUtils' // Corrected import path

const initialState = {
  // Editing state
  isEditing: false,
  editingMode: null, // 'create' | 'edit' | 'preview'
  editingSubcircuit: null, // Current subcircuit being edited
  editingContext: [], // Breadcrumb path [{id, name, type}]

  // Creation state
  creationMethod: null, // 'quick' | 'wizard' | 'template' | 'visual'
  creationStep: 0,
  creationData: {
    selectedGates: [],
    selectedWires: [],
    boundaryBox: null,
    templateId: null,
    name: '',
    description: '',
    icon: '',
    category: 'custom',
    isGlobal: false
  },

  // Port mapping
  portMappingMode: null,
  tempPorts: {
    inputs: [],
    outputs: []
  },
  portConnections: [], // [{external: wireId, internal: portIndex}]
  suggestedMappings: [], // AI suggestions

  // Canvas state
  internalGates: [],
  internalWires: [],
  internalBounds: null,
  selectedInternalGates: [],
  selectedInternalWires: [],

  // Preview state
  previewCircuit: null,
  previewSignals: {},
  isSimulatingPreview: false,

  // History (Undo/Redo)
  history: {
    past: [],
    present: null,
    future: []
  },
  maxHistorySteps: 50,

  // Auto-save
  isDirty: false,
  lastSaved: null,
  autoSaveTimer: null,

  // UI State
  panels: {
    toolbar: { visible: true, position: 'top' },
    properties: { visible: false, target: null, position: 'right' },
    layers: { visible: false, position: 'left' },
    preview: { visible: true, position: 'bottom' }
  },

  // Visual helpers
  gridVisible: true,
  gridSize: 20,
  guidelines: [],
  rulers: { x: [], y: [] },
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },

  // Validation
  validationErrors: [],
  validationWarnings: []
}

const useSubcircuitEditorStore = create(
  immer((set, get) => ({
    ...initialState,

    // Actions

    // Start editing
    startEditing: (mode, subcircuit = null) => set(state => {
      state.isEditing = true
      state.editingMode = mode
      state.editingSubcircuit = subcircuit

      if (subcircuit) {
        const newInternalGates = [...(subcircuit.internalCircuit?.gates || [])]
        const newInternalWires = [...(subcircuit.internalCircuit?.wires || [])]
        const newInputs = subcircuit.inputs ? [...subcircuit.inputs] : []
        const newOutputs = subcircuit.outputs ? [...subcircuit.outputs] : []

        // Only update if content has actually changed to prevent unnecessary re-renders
        if (!deepEqualArrays(state.internalGates, newInternalGates)) {
          state.internalGates = newInternalGates
        }
        if (!deepEqualArrays(state.internalWires, newInternalWires)) {
          state.internalWires = newInternalWires
        }
        if (!deepEqualArrays(state.tempPorts.inputs, newInputs)) {
          state.tempPorts.inputs = newInputs
        }
        if (!deepEqualArrays(state.tempPorts.outputs, newOutputs)) {
          state.tempPorts.outputs = newOutputs
        }

        state.internalBounds = subcircuit.internalCircuit?.bounds || null
      }

      // Save initial state to history
      state.history.present = {
        gates: [...state.internalGates],
        wires: [...state.internalWires],
        ports: { ...state.tempPorts },
        bounds: state.internalBounds ? { ...state.internalBounds } : null
      }
    }),

    // Stop editing
    stopEditing: () => set(state => {
      state.isEditing = false
      state.editingMode = null
      state.editingSubcircuit = null
      state.editingContext = []
      state.internalGates = []
      state.internalWires = []
      state.internalBounds = null
      state.selectedInternalGates = []
      state.selectedInternalWires = []
      state.creationStep = 0
      state.isDirty = false
    }),

    // Creation flow
    startCreation: (method, initialData = {}) => set(state => {
      state.isEditing = true
      state.editingMode = 'create'
      state.creationMethod = method
      state.creationData = {
        ...state.creationData,
        ...initialData
      }
      // Populate the editor's canvas with the selected gates
      state.internalGates = initialData.selectedGates || []
      state.internalWires = initialData.selectedWires || []
    }),

    nextCreationStep: () => set(state => {
      state.creationStep += 1
    }),

    previousCreationStep: () => set(state => {
      if (state.creationStep > 0) {
        state.creationStep -= 1
      }
    }),

    updateCreationData: (data) => set(state => {
      state.creationData = {
        ...state.creationData,
        ...data
      }
    }),

    // Context navigation
    pushContext: (context) => set(state => {
      state.editingContext.push(context)
    }),

    popContext: () => set(state => {
      state.editingContext.pop()
    }),

    clearContext: () => set(state => {
      state.editingContext = []
    }),

    // Port management
    addInputPort: (port) => set(state => {
      state.tempPorts.inputs.push({
        ...port,
        index: state.tempPorts.inputs.length
      })
      state.isDirty = true
    }),

    addOutputPort: (port) => set(state => {
      state.tempPorts.outputs.push({
        ...port,
        index: state.tempPorts.outputs.length
      })
      state.isDirty = true
    }),

    updatePort: (type, index, updates) => set(state => {
      if (type === 'input' && state.tempPorts.inputs[index]) {
        state.tempPorts.inputs[index] = {
          ...state.tempPorts.inputs[index],
          ...updates
        }
      } else if (type === 'output' && state.tempPorts.outputs[index]) {
        state.tempPorts.outputs[index] = {
          ...state.tempPorts.outputs[index],
          ...updates
        }
      }
      state.isDirty = true
    }),

    removePort: (type, index) => set(state => {
      if (type === 'input') {
        state.tempPorts.inputs.splice(index, 1)
        // Re-index
        state.tempPorts.inputs.forEach((port, i) => {
          port.index = i
        })
      } else if (type === 'output') {
        state.tempPorts.outputs.splice(index, 1)
        // Re-index
        state.tempPorts.outputs.forEach((port, i) => {
          port.index = i
        })
      }
      state.isDirty = true
    }),

    reorderPorts: (type, fromIndex, toIndex) => set(state => {
      const ports = type === 'input' ? state.tempPorts.inputs : state.tempPorts.outputs
      const [movedPort] = ports.splice(fromIndex, 1)
      ports.splice(toIndex, 0, movedPort)
      // Re-index
      ports.forEach((port, i) => {
        port.index = i
      })
      state.isDirty = true
    }),

    // Internal circuit editing
    addInternalGate: (gate) => set(state => {
      state.internalGates.push(gate)
      state.isDirty = true
      get().saveToHistory()
    }),

    updateInternalGate: (gateId, updates) => set(state => {
      const gate = state.internalGates.find(g => g.id === gateId)
      if (gate) {
        Object.assign(gate, updates)
        state.isDirty = true
      }
    }),

    removeInternalGate: (gateId) => set(state => {
      state.internalGates = state.internalGates.filter(g => g.id !== gateId)
      state.internalWires = state.internalWires.filter(w =>
        w.fromGate !== gateId && w.toGate !== gateId
      )
      state.isDirty = true
      get().saveToHistory()
    }),

    addInternalWire: (wire) => set(state => {
      state.internalWires.push(wire)
      state.isDirty = true
      get().saveToHistory()
    }),

    removeInternalWire: (wireId) => set(state => {
      state.internalWires = state.internalWires.filter(w => w.id !== wireId)
      state.isDirty = true
      get().saveToHistory()
    }),

    // Selection
    selectInternalGate: (gateId) => set(state => {
      if (!state.selectedInternalGates.includes(gateId)) {
        state.selectedInternalGates.push(gateId)
      }
    }),

    deselectInternalGate: (gateId) => set(state => {
      state.selectedInternalGates = state.selectedInternalGates.filter(id => id !== gateId)
    }),

    clearInternalSelection: () => set(state => {
      state.selectedInternalGates = []
      state.selectedInternalWires = []
    }),

    // History management
    saveToHistory: () => set(state => {
      const currentState = {
        gates: [...state.internalGates],
        wires: [...state.internalWires],
        ports: { ...state.tempPorts },
        bounds: state.internalBounds ? { ...state.internalBounds } : null
      }

      // Add to past
      state.history.past.push(state.history.present)

      // Limit history size
      if (state.history.past.length > state.maxHistorySteps) {
        state.history.past.shift()
      }

      // Set as present
      state.history.present = currentState

      // Clear future
      state.history.future = []
    }),

    undo: () => set(state => {
      if (state.history.past.length === 0) return

      // Move present to future
      state.history.future.unshift(state.history.present)

      // Get previous state
      const previousState = state.history.past.pop()
      state.history.present = previousState

      // Apply state
      state.internalGates = [...previousState.gates]
      state.internalWires = [...previousState.wires]
      state.tempPorts = { ...previousState.ports }
      state.internalBounds = previousState.bounds ? { ...previousState.bounds } : null
    }),

    redo: () => set(state => {
      if (state.history.future.length === 0) return

      // Move present to past
      state.history.past.push(state.history.present)

      // Get next state
      const nextState = state.history.future.shift()
      state.history.present = nextState

      // Apply state
      state.internalGates = [...nextState.gates]
      state.internalWires = [...nextState.wires]
      state.tempPorts = { ...nextState.ports }
      state.internalBounds = nextState.bounds ? { ...nextState.bounds } : null
    }),

    // Preview
    updatePreview: () => set(state => {
      // Build preview circuit from current state
      state.previewCircuit = {
        gates: state.internalGates,
        wires: state.internalWires,
        inputs: state.tempPorts.inputs,
        outputs: state.tempPorts.outputs
      }
    }),

    setPreviewSignals: (signals) => set(state => {
      state.previewSignals = signals
    }),

    togglePreviewSimulation: () => set(state => {
      state.isSimulatingPreview = !state.isSimulatingPreview
    }),

    // Panel management
    togglePanel: (panelName) => set(state => {
      if (state.panels[panelName]) {
        state.panels[panelName].visible = !state.panels[panelName].visible
      }
    }),

    setPanelPosition: (panelName, position) => set(state => {
      if (state.panels[panelName]) {
        state.panels[panelName].position = position
      }
    }),

    // Grid and guides
    toggleGrid: () => set(state => {
      state.gridVisible = !state.gridVisible
    }),

    setGridSize: (size) => set(state => {
      state.gridSize = Math.max(10, Math.min(100, size))
    }),

    addGuideline: (guideline) => set(state => {
      state.guidelines.push(guideline)
    }),

    removeGuideline: (id) => set(state => {
      state.guidelines = state.guidelines.filter(g => g.id !== id)
    }),

    clearGuidelines: () => set(state => {
      state.guidelines = []
    }),

    // Zoom and pan
    setZoomLevel: (zoom) => set(state => {
      state.zoomLevel = Math.max(0.1, Math.min(5, zoom))
    }),

    setPanOffset: (offset) => set(state => {
      state.panOffset = offset
    }),

    resetView: () => set(state => {
      state.zoomLevel = 1
      state.panOffset = { x: 0, y: 0 }
    }),

    // Validation
    validate: () => {
      const state = get()
      const errors = []
      const warnings = []

      // Check for minimum requirements
      if (state.creationData.name.trim() === '') {
        errors.push('Subcircuit nomi kiritilishi kerak')
      }

      if (state.internalGates.length === 0) {
        errors.push('Kamida bitta gate bo\'lishi kerak')
      }

      if (state.tempPorts.inputs.length === 0 && state.tempPorts.outputs.length === 0) {
        warnings.push('Input yoki output portlari yo\'q')
      }

      // Check for disconnected gates
      const connectedGates = new Set()
      state.internalWires.forEach(wire => {
        connectedGates.add(wire.fromGate)
        connectedGates.add(wire.toGate)
      })

      const disconnectedGates = state.internalGates.filter(g =>
        !connectedGates.has(g.id)
      )

      if (disconnectedGates.length > 0) {
        warnings.push(`${disconnectedGates.length} ta gate ulanmagan`)
      }

      set(state => {
        state.validationErrors = errors
        state.validationWarnings = warnings
      })

      return { errors, warnings, isValid: errors.length === 0 }
    },

    // Auto-save
    markDirty: () => set(state => {
      state.isDirty = true
    }),

    markClean: () => set(state => {
      state.isDirty = false
      state.lastSaved = new Date()
    }),

    updateInternalGateState: (gateId, updates) => set(state => {
      if (!state.editingSubcircuit) return

      const gate = state.editingSubcircuit.internalCircuit.gates.find(g => g.id === gateId)
      if (gate) {
        Object.assign(gate, updates)
        state.isDirty = true
      }
    }),

    // Reset all state
    reset: () => set(initialState)
  }))
)

export default useSubcircuitEditorStore

/**
 * Store Type Definitions
 * Types for Zustand stores
 */

import type { Gate, Wire, Port, Bounds, SelectionBox, SignalMap } from './gates'
import type {
  EditorMode,
  CreationMethod,
  PreferredEditorMode,
  PortMappingStyle,
  BreadcrumbItem,
  ValidationError,
  ValidationWarning
} from './subcircuit'

// Game Store State
export interface GameState {
  currentLevel: number
  isPlaying: boolean
  isSandboxMode: boolean
  gates: Gate[]
  wires: Wire[]
  selectedGate: string | number | null
  selectedWire: string | number | null
  selectedGates: (string | number)[]
  preSelectedGates: (string | number)[]
  selectionMode: boolean
  selectionBox: SelectionBox | null
  editingSubcircuit: Gate | null
  subcircuitContext: BreadcrumbItem[]
  signals: SignalMap
  isSimulating: boolean
}

// Subcircuit Editor Store State
export interface SubcircuitEditorState {
  isEditing: boolean
  editingMode: EditorMode
  editingSubcircuit: any | null // SubcircuitTemplate instance
  editingContext: BreadcrumbItem[]

  creationMethod: CreationMethod
  creationStep: number
  creationData: {
    selectedGates: Gate[]
    selectedWires: Wire[]
    boundaryBox: Bounds | null
    templateId: string | null
    name: string
    description: string
    icon: string
    category: string
    isGlobal: boolean
  }

  portMappingMode: string | null
  tempPorts: {
    inputs: Port[]
    outputs: Port[]
  }
  portConnections: any[]
  suggestedMappings: any[]

  internalGates: Gate[]
  internalWires: Wire[]
  internalBounds: Bounds | null
  selectedInternalGates: (string | number)[]
  selectedInternalWires: (string | number)[]

  previewCircuit: any | null
  previewSignals: SignalMap
  isSimulatingPreview: boolean

  history: {
    past: any[]
    present: any | null
    future: any[]
  }
  maxHistorySteps: number

  isDirty: boolean
  lastSaved: Date | null
  autoSaveTimer: any | null

  panels: {
    toolbar: { visible: boolean; position: string }
    properties: { visible: boolean; target: any; position: string }
    layers: { visible: boolean; position: string }
    preview: { visible: boolean; position: string }
  }

  gridVisible: boolean
  gridSize: number
  guidelines: any[]
  rulers: { x: number[]; y: number[] }
  zoomLevel: number
  panOffset: { x: number; y: number }

  validationErrors: ValidationError[]
  validationWarnings: ValidationWarning[]
}

// User Preferences Store State
export interface UserPreferencesState {
  editorMode: PreferredEditorMode
  creationFlow: CreationMethod
  portMappingStyle: PortMappingStyle

  enableAnimations: boolean
  animationSpeed: number
  enableSounds: boolean
  soundVolume: number
  enableParticles: boolean
  enableGlow: boolean
  theme: 'dark' | 'light' | 'cyberpunk' | 'retro' | 'matrix'

  autoSave: boolean
  autoSaveInterval: number
  showHints: boolean
  showTutorial: boolean
  confirmBeforeDelete: boolean

  snapToGrid: boolean
  gridSize: number
  showGrid: boolean
  showRulers: boolean
  magneticSnap: boolean

  reducedMotion: boolean
  lowPerformanceMode: boolean
  maxUndoSteps: number

  shortcuts: {
    createSubcircuit: string
    quickCreate: string
    enterEditMode: string
    exitEditMode: string
    undo: string
    redo: string
    duplicate: string
    delete: string
    selectAll: string
    deselectAll: string
    save: string
    toggleGrid: string
    zoomIn: string
    zoomOut: string
    resetZoom: string
    play: string
    pause: string
  }
}

// Achievement Store State
export interface AchievementState {
  unlockedAchievements: string[]
  achievementProgress: Record<string, number>
  totalGatesPlaced: number
  totalWiresConnected: number
  totalSubcircuitsCreated: number
  totalLevelsCompleted: number
  playTime: number
  lastPlayDate: Date | string | null
  streakDays: number
  statistics: {
    gatesPlaced: Record<string, number>
    wiresCreated: number
    subcircuitsCreated: number
    levelsCompleted: number
    sessionsPlayed: number
    totalPlayTime: number
  }
}

// Subcircuit Store State
export interface SubcircuitStoreState {
  templates: Map<string, any> // SubcircuitTemplate instances
  globalTemplates: string[]
  userTemplates: string[]
  categories: string[]
}

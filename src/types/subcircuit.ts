/**
 * Subcircuit Type Definitions
 * Types for subcircuit templates, validation, and port mapping
 */

import type { Gate, Wire, Port, Bounds } from './gates'

// Subcircuit template configuration
export interface SubcircuitTemplateConfig {
  id?: string
  name: string
  description?: string
  icon?: string
  category?: string
  color?: string
  version?: string
  author?: string
  inputs: Port[]
  outputs: Port[]
  internalCircuit: {
    gates: Gate[]
    wires: Wire[]
    bounds: Bounds | null
  }
  isGlobal?: boolean
  isPublic?: boolean
  usageCount?: number
  tags?: string[]
  width?: number
  height?: number
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Validation result
export interface ValidationResult {
  valid: boolean
  success?: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

// Validation error
export interface ValidationError {
  type: string
  message: string
  gate?: string | number
  wire?: string | number
  port?: string | number
  severity?: 'error' | 'warning'
}

// Validation warning
export interface ValidationWarning {
  type: string
  message: string
  gate?: string | number
  wire?: string | number
  suggestion?: string
}

// Port mapping result
export interface PortMappingResult {
  inputs: Port[]
  outputs: Port[]
  internalWires: Wire[]
  externalConnections: ExternalConnection[]
  suggestedMappings?: PortMapping[]
}

// External connection
export interface ExternalConnection {
  wireId: string | number
  portType: 'input' | 'output'
  portIndex: number
  internalGate: string | number
  internalPort: number
}

// Port mapping
export interface PortMapping {
  portId: string
  portName: string
  portType: 'input' | 'output'
  connectedGate: string | number
  connectedPort: number
  confidence: number
}

// Subcircuit creation options
export interface SubcircuitCreationOptions {
  autoDetectPorts?: boolean
  optimizePorts?: boolean
  validateResult?: boolean
  smartNaming?: boolean
  mergeIdenticalPorts?: boolean
  generateIcon?: boolean
}

// Subcircuit creation result
export interface SubcircuitCreationResult {
  success: boolean
  template?: any // Will be SubcircuitTemplate class instance
  errors?: string[]
  warnings?: string[]
}

// Breadcrumb navigation item
export interface BreadcrumbItem {
  id: string | number
  name: string
  type: 'main' | 'subcircuit'
  templateId?: string
}

// Editor mode types
export type EditorMode = 'create' | 'edit' | 'preview' | null
export type CreationMethod = 'quick' | 'wizard' | 'template' | 'visual' | null
export type PreferredEditorMode = 'inline' | 'floating' | 'fullModal' | 'splitView'

// Port mapping style
export type PortMappingStyle = 'nodeGraph' | 'connectionLines' | 'smartAuto' | 'pinDesigner'

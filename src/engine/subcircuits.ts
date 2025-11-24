/**
 * Subcircuit (Composite Gate) Engine - REFACTORED VERSION
 * Bu fayl subcircuit'larning asosiy funksionalligini ta'minlaydi
 */

import { nanoid } from 'nanoid'
import {
  validateTemplate,
  validateSelection,
  sanitizeGates,
  sanitizeWires,
  calculateSafeBounds,
  validateConnectivity
} from './validation'
import {
  createPortMapping
} from './portMapping'
import type { Gate, Wire, Port, Bounds } from '@/types'
import type { SubcircuitTemplateConfig } from '@/types'

/**
 * Subcircuit Template Class - Refactored
 * Robust validation, port stability, va migration support bilan
 */
export class SubcircuitTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  version: string
  author: string
  inputs: Port[]
  outputs: Port[]
  internalCircuit: {
    gates: Gate[]
    wires: Wire[]
    bounds: Bounds | null
  }
  isGlobal: boolean
  isPublic: boolean
  usageCount: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
  width: number
  height: number
  performanceHints: any
  _validationCache: any
  _lastValidation: number

  constructor(config: Partial<SubcircuitTemplateConfig> = {}) {
    this.id = config.id || nanoid(12)
    this.name = config.name || 'Untitled Subcircuit'
    this.description = config.description || ''
    this.icon = config.icon || 'SC'
    this.color = (config as any).color || '#7C3AED'
    this.category = config.category || 'custom'
    this.version = config.version || '1.0.0'
    this.author = config.author || 'anonymous'
    this.createdAt = config.createdAt ? (typeof config.createdAt === 'string' ? new Date(config.createdAt) : config.createdAt) : new Date()
    this.updatedAt = config.updatedAt ? (typeof config.updatedAt === 'string' ? new Date(config.updatedAt) : config.updatedAt) : new Date()

    // Input/Output portlari - Enhanced format
    this.inputs = config.inputs || []
    this.outputs = config.outputs || []

    // Ichki circuit
    this.internalCircuit = config.internalCircuit || {
      gates: [],
      wires: [],
      bounds: null
    }

    // Template metadata
    this.isGlobal = config.isGlobal || false
    this.isPublic = config.isPublic || false
    this.usageCount = config.usageCount || 0
    this.tags = config.tags || []

    // Visual settings
    this.width = config.width || 120
    this.height = config.height || Math.max(80, Math.max(this.inputs.length, this.outputs.length) * 30)

    // Performance hints
    this.performanceHints = (config as any).performanceHints || {
      canCache: true,
      estimatedGateCount: this.internalCircuit.gates?.length || 0,
      hasRecursion: false,
      complexity: 'simple' // simple, moderate, complex
    }

    // Validation cache
    this._validationCache = null
    this._lastValidation = null
  }

  /**
   * Enhanced validation with caching
   */
  validate() {
    // Check cache
    const now = Date.now()
    if (this._validationCache && this._lastValidation && (now - this._lastValidation < 5000)) {
      return this._validationCache
    }

    // Perform validation
    const result = validateTemplate(this)

    // Cache result
    this._validationCache = result
    this._lastValidation = now

    return result
  }

  /**
   * Create instance from template
   */
  createInstance(x = 100, y = 100) {
    // Validate template first
    const validation = this.validate()
    if (!validation.valid) {
      console.error('Template validation failed:', validation.errors)
      return null
    }

    return {
      id: nanoid(12),
      type: 'SUBCIRCUIT',
      templateId: this.id,
      name: this.name,
      icon: this.icon,
      x: x,
      y: y,
      width: this.width,
      height: this.height,
      inputs: new Array(this.inputs.length).fill(0),
      outputs: new Array(this.outputs.length).fill(0),
      inputPorts: this.inputs.map(p => ({ ...p })),
      outputPorts: this.outputs.map(p => ({ ...p })),
      rotation: 0,
      flipped: false,
      value: 0,
      state: {},
      performanceHints: { ...this.performanceHints }
    }
  }

  /**
   * Clone template
   */
  clone(newName = null) {
    const cloned = new SubcircuitTemplate({
      ...this,
      id: nanoid(12),
      name: newName || `${this.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    })

    // Deep clone internal circuit
    cloned.internalCircuit = {
      gates: this.internalCircuit.gates.map(g => ({ ...g })),
      wires: this.internalCircuit.wires.map(w => ({ ...w })),
      bounds: this.internalCircuit.bounds ? { ...this.internalCircuit.bounds } : null
    }

    // Deep clone ports
    cloned.inputs = this.inputs.map(p => ({ ...p }))
    cloned.outputs = this.outputs.map(p => ({ ...p }))

    return cloned
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      color: this.color,
      category: this.category,
      version: this.version,
      author: this.author,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      inputs: this.inputs,
      outputs: this.outputs,
      internalCircuit: this.internalCircuit,
      isGlobal: this.isGlobal,
      isPublic: this.isPublic,
      usageCount: this.usageCount,
      tags: this.tags,
      width: this.width,
      height: this.height,
      performanceHints: this.performanceHints
    }
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    return new SubcircuitTemplate(json)
  }

  /**
   * Update internal circuit
   */
  updateInternalCircuit(gates, wires) {
    // Sanitize and validate
    const sanitizedGates = sanitizeGates(gates)
    const sanitizedWires = sanitizeWires(wires)

    // Validate connectivity
    const connectivity = validateConnectivity(sanitizedGates, sanitizedWires)
    if (!connectivity.valid) {
      console.error('Connectivity validation failed:', connectivity.errors)
      return false
    }

    // Calculate bounds
    const bounds = calculateSafeBounds(sanitizedGates)

    // Update
    this.internalCircuit = {
      gates: sanitizedGates,
      wires: sanitizedWires,
      bounds
    }

    // Update metadata
    this.updatedAt = new Date()
    this.performanceHints.estimatedGateCount = sanitizedGates.length

    // Invalidate cache
    this._validationCache = null
    this._lastValidation = 0

    return true
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      gateCount: this.internalCircuit.gates?.length || 0,
      wireCount: this.internalCircuit.wires?.length || 0,
      inputCount: this.inputs.length,
      outputCount: this.outputs.length,
      complexity: this.performanceHints.complexity,
      canCache: this.performanceHints.canCache
    }
  }
}


/**
 * Create subcircuit from selected gates - REFACTORED
 * Smart port mapping va robust validation bilan
 */
export function createSubcircuitFromSelection(selectedGates: any, allWires: any, name: string | null = null, options: any = {}) {
  const {
    autoDetectPorts = true,
    optimizePorts = true,
    validateResult = true,
    smartNaming: _smartNaming = true
  } = options

  // Step 1: Validate selection
  const selectionValidation = validateSelection(selectedGates, allWires, selectedGates, allWires)
  if (!selectionValidation.valid) {
    console.error('Selection validation failed:', selectionValidation.errors)
    return {
      success: false,
      errors: selectionValidation.errors,
      warnings: selectionValidation.warnings
    }
  }

  // Step 2: Sanitize input data
  const sanitizedGates = sanitizeGates(selectedGates)
  const selectedGateIds = new Set(sanitizedGates.map(g => g.id))

  // Step 3: Create port mapping
  const portMapping = createPortMapping(sanitizedGates, allWires, {
    autoDetect: autoDetectPorts,
    optimize: optimizePorts,
    validate: validateResult
  })

  if (!portMapping || !portMapping.validation) {
      console.error('Port mapping failed catastrophically, result is null or invalid.');
      return {
          success: false,
          errors: ['Critical error during port mapping.'],
          warnings: []
      };
  }

  if (!portMapping.validation.valid) {
    console.error('Port mapping validation failed:', portMapping.validation.errors)
    return {
      success: false,
      errors: portMapping.validation.errors,
      warnings: portMapping.validation.warnings
    }
  }

  // Step 4: Get internal wires AND keep all wires for editing
  const internalWires = portMapping.internalWires;

  // Keep ALL wires connected to selected gates (for editing visualization)
  const allNormalizedWires = allWires
    .filter(wire => selectedGateIds.has(wire.fromGate) && selectedGateIds.has(wire.toGate))
    .map(wire => ({
      ...wire,
      // Wires will be normalized with gates below
    }));

  // Step 5: Normalize gate positions
  const bounds = calculateSafeBounds(sanitizedGates);

  // Normalize ALL gates (including INPUT/OUTPUT for editing)
  const allNormalizedGates = sanitizedGates.map(gate => ({
    ...gate,
    x: gate.x - bounds.minX,
    y: gate.y - bounds.minY
  }));

  // Filter out INPUT/OUTPUT for execution (they become ports)
  const executionGates = allNormalizedGates
    .filter(gate => gate.type !== 'INPUT' && gate.type !== 'OUTPUT');

  // Step 6: Generate smart name if needed
  const finalName = name || generateSmartName(sanitizedGates)

  // Step 7: Create template
  const template = new SubcircuitTemplate({
    name: finalName,
    description: `Created from ${sanitizedGates.length} gates`,
    icon: finalName.substring(0, 3).toUpperCase(),
    category: 'custom',
    inputs: portMapping.legacy.inputs,
    outputs: portMapping.legacy.outputs,
    internalCircuit: {
      gates: allNormalizedGates, // Use ALL gates for editing
      wires: sanitizeWires(allNormalizedWires), // Use ALL wires for editing
      bounds: {
        ...bounds,
        minX: 0,
        minY: 0,
        maxX: bounds.width,
        maxY: bounds.height
      }
    },
    width: Math.max(120, Math.min(200, bounds.width / 2)),
    height: Math.max(80, Math.max(portMapping.inputPorts.length, portMapping.outputPorts.length) * 30),
    performanceHints: {
      canCache: true,
      estimatedGateCount: executionGates.length,
      hasRecursion: false,
      complexity: getComplexity(executionGates.length, internalWires.length)
    }
  } as any)

  // Step 8: Final validation (skip for templates with INPUT/OUTPUT gates)
  // These are kept for editing but not for execution
  const hasIOGates = allNormalizedGates.some(g => g.type === 'INPUT' || g.type === 'OUTPUT')

  if (validateResult && !hasIOGates) {
    const finalValidation = template.validate()
    if (!finalValidation.valid) {
      console.error('Template validation failed:', finalValidation.errors)
      return {
        success: false,
        errors: finalValidation.errors,
        warnings: finalValidation.warnings
      }
    }
  } else if (hasIOGates) {
    console.log('[SUBCIRCUIT] Skipping validation for template with INPUT/OUTPUT gates')
  }

  // Return success result
  return {
    success: true,
    template,
    portMapping,
    stats: {
      gateCount: allNormalizedGates.length, // All gates including INPUT/OUTPUT
      wireCount: allNormalizedWires.length, // All wires including INPUT/OUTPUT connections
      inputCount: portMapping.inputPorts.length,
      outputCount: portMapping.outputPorts.length
    },
    warnings: [...selectionValidation.warnings, ...portMapping.validation.warnings]
  }
}

/**
 * Generate smart name for subcircuit
 */
function generateSmartName(gates) {
  const gateTypes = [...new Set(gates.map(g => g.type))]

  if (gateTypes.length === 1) {
    return `${gateTypes[0]} Module`
  } else if (gateTypes.length === 2) {
    return `${gateTypes[0]}-${gateTypes[1]} Circuit`
  } else {
    const dominant = getMostFrequentGateType(gates)
    return `${dominant} Complex`
  }
}

/**
 * Get most frequent gate type
 */
function getMostFrequentGateType(gates) {
  const counts = {}
  gates.forEach(gate => {
    counts[gate.type] = (counts[gate.type] || 0) + 1
  })

  let maxCount = 0
  let dominant = 'Mixed'

  Object.entries(counts).forEach(([type, count]: [string, any]) => {
    if (count > maxCount) {
      maxCount = count as number
      dominant = type
    }
  })

  return dominant
}

/**
 * Get complexity rating
 */
function getComplexity(gateCount, wireCount) {
  const total = gateCount + wireCount

  if (total < 10) return 'simple'
  if (total < 50) return 'moderate'
  return 'complex'
}

/**
 * Simulate subcircuit - PLACEHOLDER
 * To'liq implementation subcircuitSimulation.js da bo'ladi
 */
export function simulateSubcircuit(subcircuitGate, inputSignals, templateManager) {
  const template = templateManager.getTemplate(subcircuitGate.templateId)

  if (!template) {
    console.error('Template topilmadi:', subcircuitGate.templateId)
    return new Array(subcircuitGate.outputs.length).fill(0)
  }

  // Validate inputs
  if (inputSignals.length !== template.inputs.length) {
    console.error('Input signal count mismatch')
    return new Array(template.outputs.length).fill(0)
  }

  // TODO: Full simulation will be implemented in subcircuitSimulation.js
  console.warn('Subcircuit simulation not yet implemented - returning zeros')

  return new Array(template.outputs.length).fill(0)
}

/**
 * Migrate old template format to new format
 */
export function migrateTemplate(oldTemplate) {
  // Check if already migrated
  if (oldTemplate.performanceHints) {
    return oldTemplate
  }

  // Create new template with migration
  const migrated = new SubcircuitTemplate({
    ...oldTemplate,
    performanceHints: {
      canCache: true,
      estimatedGateCount: oldTemplate.internalCircuit?.gates?.length || 0,
      hasRecursion: false,
      complexity: 'simple'
    }
  })

  // Ensure ports have proper structure
  migrated.inputs = migrated.inputs.map((input: any, index: number) => {
    if (typeof input === 'string') {
      return {
        name: input,
        index: index,
        connectedGate: null,
        connectedIndex: 0
      } as any
    }
    return input
  }) as Port[]

  migrated.outputs = migrated.outputs.map((output: any, index: number) => {
    if (typeof output === 'string') {
      return {
        name: output,
        index: index,
        connectedGate: null,
        connectedIndex: 0
      } as any
    }
    return output
  }) as Port[]

  return migrated
}

/**
 * Batch create subcircuits
 */
export function batchCreateSubcircuits(selections, allWires, options = {}) {
  const results = []

  selections.forEach((selection, index) => {
    const result = createSubcircuitFromSelection(
      selection.gates,
      allWires,
      selection.name || `Subcircuit ${index + 1}`,
      options
    )
    results.push(result)
  })

  return results
}

/**
 * SubcircuitManager Class
 * Template'larni boshqarish uchun
 */
export class SubcircuitManager {
  globalTemplates: Map<string, SubcircuitTemplate>
  customTemplates: Map<string, SubcircuitTemplate>

  constructor() {
    this.globalTemplates = new Map()  // Global kutubxona
    this.customTemplates = new Map()  // Loyihaga xos template'lar
  }

  /**
   * Template qo'shish
   */
  addTemplate(template, isGlobal = false) {
    if (!template || !template.id) {
      console.error('Invalid template:', template)
      return false
    }

    const targetMap = isGlobal ? this.globalTemplates : this.customTemplates

    // Eski template'ni o'chirish (agar mavjud bo'lsa)
    this.globalTemplates.delete(template.id)
    this.customTemplates.delete(template.id)

    // Yangi joyga qo'shish
    targetMap.set(template.id, template)
    template.isGlobal = isGlobal

    return true
  }

  /**
   * Template olish
   */
  getTemplate(templateId) {
    return this.globalTemplates.get(templateId) || this.customTemplates.get(templateId) || null
  }

  /**
   * Template o'chirish
   */
  removeTemplate(templateId) {
    // Faqat custom template'larni o'chirish mumkin
    if (this.globalTemplates.has(templateId)) {
      console.warn('Cannot remove global template:', templateId)
      return false
    }

    return this.customTemplates.delete(templateId)
  }

  /**
   * Template yangilash
   */
  updateTemplate(templateId, updates) {
    const template = this.getTemplate(templateId)

    if (!template) {
      console.error('Template not found:', templateId)
      return null
    }

    // Global template'larni yangilash mumkin emas
    if (template.isGlobal) {
      console.warn('Cannot update global template:', templateId)
      return null
    }

    // Update properties
    Object.assign(template, updates)
    template.updatedAt = new Date()

    return template
  }

  /**
   * Barcha template'larni olish
   */
  getAllTemplates() {
    const templates = []

    // Global templates first
    this.globalTemplates.forEach(template => templates.push(template))

    // Then custom templates
    this.customTemplates.forEach(template => templates.push(template))

    return templates
  }

  /**
   * Kategoriya bo'yicha template'larni olish
   */
  getTemplatesByCategory(category) {
    return this.getAllTemplates().filter(template => template.category === category)
  }

  /**
   * Template'larni eksport qilish
   */
  exportLibrary(templateIds = null) {
    const templates = []

    if (templateIds) {
      // Faqat ko'rsatilgan template'lar
      templateIds.forEach(id => {
        const template = this.getTemplate(id)
        if (template) {
          templates.push(template.toJSON())
        }
      })
    } else {
      // Barcha custom template'lar
      this.customTemplates.forEach(template => {
        templates.push(template.toJSON())
      })
    }

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: templates
    }
  }

  /**
   * Template'larni import qilish
   */
  importLibrary(libraryData) {
    const results = {
      imported: [],
      errors: []
    }

    if (!libraryData || !libraryData.templates) {
      results.errors.push('Invalid library data')
      return results
    }

    libraryData.templates.forEach(templateData => {
      try {
        const template = SubcircuitTemplate.fromJSON(templateData)
        const validation = template.validate()

        if (validation.valid) {
          // Check for name conflicts
          const existing = this.getAllTemplates().find(t => t.name === template.name)

          if (existing) {
            template.name = `${template.name} (Imported)`
          }

          this.addTemplate(template, false)
          results.imported.push(template.name)
        } else {
          results.errors.push(`Failed to import ${templateData.name}: ${validation.errors.join(', ')}`)
        }
      } catch (error) {
        results.errors.push(`Error importing template: ${error.message}`)
      }
    })

    return results
  }
}

/**
 * Create default templates
 * Asosiy mantiqiy gate'lardan tashkil topgan template'lar
 */
export function createDefaultTemplates() {
  const templates = []

  // AND Gate Template
  templates.push(new SubcircuitTemplate({
    id: 'default-and-gate',
    name: 'AND Gate Module',
    description: 'Ikki kirishli AND mantiqiy gate',
    icon: 'AND',
    category: 'logic',
    isGlobal: true,
    inputs: [
      { name: 'A', index: 0, connectedGate: 'input-0', connectedIndex: 0 } as any,
      { name: 'B', index: 1, connectedGate: 'input-1', connectedIndex: 0 } as any
    ],
    outputs: [
      { name: 'Y', index: 0, connectedGate: 'and-0', connectedIndex: 0 } as any
    ],
    internalCircuit: {
      gates: [
        { id: 'input-0', type: 'INPUT', x: 50, y: 100, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'input-1', type: 'INPUT', x: 50, y: 200, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'and-0', type: 'AND', x: 200, y: 150, inputs: [0, 0], outputs: [0], width: 60, height: 60, value: 0 } as any,
        { id: 'output-0', type: 'OUTPUT', x: 350, y: 150, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any
      ],
      wires: [
        { id: 'w1', fromGate: 'input-0', fromIndex: 0, toGate: 'and-0', toIndex: 0, signal: 0 } as any,
        { id: 'w2', fromGate: 'input-1', fromIndex: 0, toGate: 'and-0', toIndex: 1, signal: 0 } as any,
        { id: 'w3', fromGate: 'and-0', fromIndex: 0, toGate: 'output-0', toIndex: 0, signal: 0 } as any
      ],
      bounds: null
    }
  }))

  // OR Gate Template
  templates.push(new SubcircuitTemplate({
    id: 'default-or-gate',
    name: 'OR Gate Module',
    description: 'Ikki kirishli OR mantiqiy gate',
    icon: 'OR',
    category: 'logic',
    isGlobal: true,
    inputs: [
      { name: 'A', index: 0, connectedGate: 'input-0', connectedIndex: 0 } as any,
      { name: 'B', index: 1, connectedGate: 'input-1', connectedIndex: 0 } as any
    ],
    outputs: [
      { name: 'Y', index: 0, connectedGate: 'or-0', connectedIndex: 0 } as any
    ],
    internalCircuit: {
      gates: [
        { id: 'input-0', type: 'INPUT', x: 50, y: 100, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'input-1', type: 'INPUT', x: 50, y: 200, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'or-0', type: 'OR', x: 200, y: 150, inputs: [0, 0], outputs: [0], width: 60, height: 60, value: 0 } as any,
        { id: 'output-0', type: 'OUTPUT', x: 350, y: 150, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any
      ],
      wires: [
        { id: 'w1', fromGate: 'input-0', fromIndex: 0, toGate: 'or-0', toIndex: 0, signal: 0 } as any,
        { id: 'w2', fromGate: 'input-1', fromIndex: 0, toGate: 'or-0', toIndex: 1, signal: 0 } as any,
        { id: 'w3', fromGate: 'or-0', fromIndex: 0, toGate: 'output-0', toIndex: 0, signal: 0 } as any
      ],
      bounds: null
    }
  }))

  // XOR Gate Template
  templates.push(new SubcircuitTemplate({
    id: 'default-xor-gate',
    name: 'XOR Gate Module',
    description: 'Ikki kirishli XOR mantiqiy gate',
    icon: 'XOR',
    category: 'logic',
    isGlobal: true,
    inputs: [
      { name: 'A', index: 0, connectedGate: 'input-0', connectedIndex: 0 } as any,
      { name: 'B', index: 1, connectedGate: 'input-1', connectedIndex: 0 } as any
    ],
    outputs: [
      { name: 'Y', index: 0, connectedGate: 'xor-0', connectedIndex: 0 } as any
    ],
    internalCircuit: {
      gates: [
        { id: 'input-0', type: 'INPUT', x: 50, y: 100, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'input-1', type: 'INPUT', x: 50, y: 200, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'xor-0', type: 'XOR', x: 200, y: 150, inputs: [0, 0], outputs: [0], width: 60, height: 60, value: 0 } as any,
        { id: 'output-0', type: 'OUTPUT', x: 350, y: 150, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any
      ],
      wires: [
        { id: 'w1', fromGate: 'input-0', fromIndex: 0, toGate: 'xor-0', toIndex: 0, signal: 0 } as any,
        { id: 'w2', fromGate: 'input-1', fromIndex: 0, toGate: 'xor-0', toIndex: 1, signal: 0 } as any,
        { id: 'w3', fromGate: 'xor-0', fromIndex: 0, toGate: 'output-0', toIndex: 0, signal: 0 } as any
      ],
      bounds: null
    }
  }))

  // NOT Gate Template
  templates.push(new SubcircuitTemplate({
    id: 'default-not-gate',
    name: 'NOT Gate Module',
    description: 'Inverter mantiqiy gate',
    icon: 'NOT',
    category: 'logic',
    isGlobal: true,
    inputs: [
      { name: 'A', index: 0, connectedGate: 'input-0', connectedIndex: 0 } as any
    ],
    outputs: [
      { name: 'Y', index: 0, connectedGate: 'not-0', connectedIndex: 0 } as any
    ],
    internalCircuit: {
      gates: [
        { id: 'input-0', type: 'INPUT', x: 50, y: 150, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'not-0', type: 'NOT', x: 200, y: 150, inputs: [0], outputs: [1], width: 60, height: 60, value: 0 } as any,
        { id: 'output-0', type: 'OUTPUT', x: 350, y: 150, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any
      ],
      wires: [
        { id: 'w1', fromGate: 'input-0', fromIndex: 0, toGate: 'not-0', toIndex: 0, signal: 0 } as any,
        { id: 'w2', fromGate: 'not-0', fromIndex: 0, toGate: 'output-0', toIndex: 0, signal: 0 } as any
      ],
      bounds: null
    }
  }))

  // Half Adder Template
  templates.push(new SubcircuitTemplate({
    id: 'default-half-adder',
    name: 'Half Adder',
    description: 'Yarim qo\'shuvchi circuit',
    icon: 'HA',
    category: 'arithmetic',
    isGlobal: true,
    inputs: [
      { name: 'A', index: 0, connectedGate: 'input-0', connectedIndex: 0 } as any,
      { name: 'B', index: 1, connectedGate: 'input-1', connectedIndex: 0 } as any
    ],
    outputs: [
      { name: 'Sum', index: 0, connectedGate: 'xor-0', connectedIndex: 0 } as any,
      { name: 'Carry', index: 1, connectedGate: 'and-0', connectedIndex: 0 } as any
    ],
    internalCircuit: {
      gates: [
        { id: 'input-0', type: 'INPUT', x: 50, y: 100, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'input-1', type: 'INPUT', x: 50, y: 200, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'xor-0', type: 'XOR', x: 200, y: 100, inputs: [0, 0], outputs: [0], width: 60, height: 60, value: 0 } as any,
        { id: 'and-0', type: 'AND', x: 200, y: 200, inputs: [0, 0], outputs: [0], width: 60, height: 60, value: 0 } as any,
        { id: 'output-0', type: 'OUTPUT', x: 350, y: 100, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any,
        { id: 'output-1', type: 'OUTPUT', x: 350, y: 200, value: 0, width: 60, height: 40, inputs: [], outputs: [] } as any
      ],
      wires: [
        { id: 'w1', fromGate: 'input-0', fromIndex: 0, toGate: 'xor-0', toIndex: 0, signal: 0 } as any,
        { id: 'w2', fromGate: 'input-1', fromIndex: 0, toGate: 'xor-0', toIndex: 1, signal: 0 } as any,
        { id: 'w3', fromGate: 'input-0', fromIndex: 0, toGate: 'and-0', toIndex: 0, signal: 0 } as any,
        { id: 'w4', fromGate: 'input-1', fromIndex: 0, toGate: 'and-0', toIndex: 1, signal: 0 } as any,
        { id: 'w5', fromGate: 'xor-0', fromIndex: 0, toGate: 'output-0', toIndex: 0, signal: 0 } as any,
        { id: 'w6', fromGate: 'and-0', fromIndex: 0, toGate: 'output-1', toIndex: 0, signal: 0 } as any
      ],
      bounds: null
    }
  }))

  return templates
}

// Default export - barcha funksiyalar allaqachon eksport qilingan
export default {
  SubcircuitTemplate,
  SubcircuitManager,
  createDefaultTemplates,
  createSubcircuitFromSelection,
  simulateSubcircuit,
  migrateTemplate,
  batchCreateSubcircuits
}

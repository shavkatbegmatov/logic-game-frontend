// Subcircuit (Composite Gate) Engine - REFACTORED VERSION
// Bu fayl subcircuit'larning asosiy funksionalligini ta'minlaydi

import { nanoid } from 'nanoid'
import {
  validateTemplate,
  validateSelection,
  validateGate,
  validateWire,
  sanitizeGates,
  sanitizeWires,
  calculateSafeBounds,
  validateConnectivity
} from './validation'
import {
  createPortMapping,
  optimizePorts,
  PortDirection
} from './portMapping'

/**
 * Subcircuit Template Class - Refactored
 * Robust validation, port stability, va migration support bilan
 */
export class SubcircuitTemplate {
  constructor(config = {}) {
    this.id = config.id || nanoid(12)
    this.name = config.name || 'Untitled Subcircuit'
    this.description = config.description || ''
    this.icon = config.icon || 'SC'
    this.category = config.category || 'custom'
    this.version = config.version || '1.0.0'
    this.author = config.author || 'anonymous'
    this.createdAt = config.createdAt || new Date().toISOString()
    this.updatedAt = config.updatedAt || new Date().toISOString()

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
    this.performanceHints = config.performanceHints || {
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
    this.updatedAt = new Date().toISOString()
    this.performanceHints.estimatedGateCount = sanitizedGates.length

    // Invalidate cache
    this._validationCache = null
    this._lastValidation = null

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
 * Subcircuit template manager
 * Tracks global va custom kutubxonalarni alohida map'larga ajratadi
 */
export class SubcircuitManager {
  constructor(initialTemplates = []) {
    this.templates = new Map()
    this.globalTemplates = new Map()
    this.customTemplates = new Map()

    initialTemplates.forEach(entry => {
      if (!entry) {
        return
      }

      if (Array.isArray(entry)) {
        const [template, isGlobal = false] = entry
        this.addTemplate(template, isGlobal)
        return
      }

      if (entry.template) {
        this.addTemplate(entry.template, entry.isGlobal ?? entry.template?.isGlobal ?? false)
        return
      }

      this.addTemplate(entry, entry.isGlobal ?? false)
    })
  }

  addTemplate(templateInput, isGlobalOverride = null) {
    if (!templateInput) {
      throw new Error('Template is required')
    }

    const template =
      templateInput instanceof SubcircuitTemplate
        ? templateInput
        : new SubcircuitTemplate(templateInput)

    const isGlobal = isGlobalOverride ?? template.isGlobal ?? false
    template.isGlobal = isGlobal

    const validation = template.validate()
    if (!validation.valid) {
      throw new Error(`Invalid subcircuit template: ${validation.errors.join(', ')}`)
    }

    this.templates.set(template.id, template)

    if (isGlobal) {
      this.globalTemplates.set(template.id, template)
      this.customTemplates.delete(template.id)
    } else {
      this.customTemplates.set(template.id, template)
      this.globalTemplates.delete(template.id)
    }

    return template
  }

  getTemplate(templateId) {
    return this.templates.get(templateId) || null
  }

  getAllTemplates() {
    return Array.from(this.templates.values())
  }

  updateTemplate(templateId, updates = {}) {
    const existing = this.getTemplate(templateId)
    if (!existing) {
      return null
    }

    let template = existing

    if (updates instanceof SubcircuitTemplate) {
      template = updates
    } else {
      Object.assign(template, updates)
      template.updatedAt = updates.updatedAt || new Date().toISOString()
    }

    const isGlobal =
      updates instanceof SubcircuitTemplate
        ? template.isGlobal
        : updates.isGlobal ?? template.isGlobal ?? false

    template.isGlobal = isGlobal

    this.templates.set(templateId, template)

    if (isGlobal) {
      this.globalTemplates.set(templateId, template)
      this.customTemplates.delete(templateId)
    } else {
      this.customTemplates.set(templateId, template)
      this.globalTemplates.delete(templateId)
    }

    return template
  }

  removeTemplate(templateId) {
    const removed = this.templates.delete(templateId)
    this.globalTemplates.delete(templateId)
    this.customTemplates.delete(templateId)
    return removed
  }

  getTemplatesByCategory(category) {
    if (!category || category === 'all') {
      return this.getAllTemplates()
    }
    return this.getAllTemplates().filter(template => template.category === category)
  }
}

function createBounds(width = 160, height = 120) {
  return {
    minX: 0,
    minY: 0,
    maxX: width,
    maxY: height,
    width,
    height,
    centerX: width / 2,
    centerY: height / 2
  }
}

function createPortConfig(name, index, direction) {
  return {
    id: `${direction}-${name}-${index}-${nanoid(6)}`,
    name,
    index,
    connectedGate: null,
    connectedIndex: 0,
    direction
  }
}

function createInternalGate(type, inputLabels, outputLabels) {
  return {
    id: `${type.toLowerCase()}-${nanoid(6)}`,
    type,
    name: type,
    x: 64,
    y: 40,
    width: 80,
    height: 60,
    inputs: inputLabels.map((label, index) => ({
      name: label,
      index,
      connectedGate: null,
      connectedIndex: 0
    })),
    outputs: outputLabels.map((label, index) => ({
      name: label,
      index,
      connectedGate: null,
      connectedIndex: 0
    })),
    rotation: 0,
    flipped: false,
    value: 0,
    state: {}
  }
}

export function createDefaultTemplates() {
  const blueprints = [
    {
      type: 'AND',
      name: 'AND Gate',
      description: 'Two-input AND kombinatsion logic subcircuit',
      icon: 'AND',
      category: 'logic',
      tags: ['logic', 'and'],
      inputs: ['A', 'B'],
      outputs: ['Y']
    },
    {
      type: 'OR',
      name: 'OR Gate',
      description: 'Two-input OR kombinatsion logic subcircuit',
      icon: 'OR',
      category: 'logic',
      tags: ['logic', 'or'],
      inputs: ['A', 'B'],
      outputs: ['Y']
    },
    {
      type: 'NOT',
      name: 'NOT Gate',
      description: 'Single-input inverter subcircuit',
      icon: 'NOT',
      category: 'logic',
      tags: ['logic', 'not', 'inverter'],
      inputs: ['A'],
      outputs: ['Y']
    }
  ]

  return blueprints.map(blueprint => {
    const templateConfig = {
      name: blueprint.name,
      description: blueprint.description,
      icon: blueprint.icon,
      category: blueprint.category,
      tags: blueprint.tags,
      isGlobal: true,
      inputs: blueprint.inputs.map((label, index) =>
        createPortConfig(label, index, PortDirection.INPUT)
      ),
      outputs: blueprint.outputs.map((label, index) =>
        createPortConfig(label, index, PortDirection.OUTPUT)
      ),
      internalCircuit: {
        gates: [createInternalGate(blueprint.type, blueprint.inputs, blueprint.outputs)],
        wires: [],
        bounds: createBounds()
      }
    }

    return new SubcircuitTemplate(templateConfig)
  })
}

/**
 * Create subcircuit from selected gates - REFACTORED
 * Smart port mapping va robust validation bilan
 */
export function createSubcircuitFromSelection(selectedGates, allWires, name = null, options = {}) {
  const {
    autoDetectPorts = true,
    optimizePorts = true,
    validateResult = true,
    smartNaming = true
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

  if (!portMapping.validation.valid) {
    console.error('Port mapping validation failed:', portMapping.validation.errors)
    return {
      success: false,
      errors: portMapping.validation.errors,
      warnings: portMapping.validation.warnings
    }
  }

  // Step 4: Filter internal wires
  const internalWires = allWires.filter(wire => {
    return selectedGateIds.has(wire.fromGate) && selectedGateIds.has(wire.toGate)
  })

  // Step 5: Normalize gate positions
  const bounds = calculateSafeBounds(sanitizedGates)
  const normalizedGates = sanitizedGates.map(gate => ({
    ...gate,
    x: gate.x - bounds.minX,
    y: gate.y - bounds.minY
  }))

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
      gates: normalizedGates,
      wires: sanitizeWires(internalWires),
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
      estimatedGateCount: normalizedGates.length,
      hasRecursion: false,
      complexity: getComplexity(normalizedGates.length, internalWires.length)
    }
  })

  // Step 8: Final validation
  if (validateResult) {
    const finalValidation = template.validate()
    if (!finalValidation.valid) {
      console.error('Template validation failed:', finalValidation.errors)
      return {
        success: false,
        errors: finalValidation.errors,
        warnings: finalValidation.warnings
      }
    }
  }

  // Return success result
  return {
    success: true,
    template,
    portMapping,
    stats: {
      gateCount: normalizedGates.length,
      wireCount: internalWires.length,
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

  Object.entries(counts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count
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
  migrated.inputs = migrated.inputs.map((input, index) => {
    if (typeof input === 'string') {
      return {
        name: input,
        index: index,
        connectedGate: null,
        connectedIndex: 0
      }
    }
    return input
  })

  migrated.outputs = migrated.outputs.map((output, index) => {
    if (typeof output === 'string') {
      return {
        name: output,
        index: index,
        connectedGate: null,
        connectedIndex: 0
      }
    }
    return output
  })

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

export default {
  SubcircuitTemplate,
  SubcircuitManager,
  createDefaultTemplates,
  createSubcircuitFromSelection,
  simulateSubcircuit,
  migrateTemplate,
  batchCreateSubcircuits
}

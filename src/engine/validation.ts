/**
 * Validation utilities for subcircuit creation
 * Bu fayl barcha validation logic'ini o'z ichiga oladi
 */

import type { Gate, Wire, Port, Bounds } from '../types/gates'

/**
 * Wire object validator
 * Wire strukturasini to'liq tekshiradi
 */
export function validateWire(wire: any): { valid: boolean; errors: string[]; sanitized?: Wire } {
  const errors: string[] = []

  // Required fields
  if (!wire || typeof wire !== 'object') {
    errors.push('Wire is not a valid object')
    return { valid: false, errors }
  }

  if (!wire.id) {
    errors.push('Wire ID is missing')
  }

  if (!wire.fromGate) {
    errors.push('Wire fromGate is missing')
  }

  if (!wire.toGate) {
    errors.push('Wire toGate is missing')
  }

  // Index validation
  if (wire.fromIndex === undefined || wire.fromIndex === null) {
    wire.fromIndex = 0 // Default value
  }

  if (wire.toIndex === undefined || wire.toIndex === null) {
    wire.toIndex = 0 // Default value
  }

  if (typeof wire.fromIndex !== 'number' || wire.fromIndex < 0) {
    errors.push(`Invalid fromIndex: ${wire.fromIndex}`)
  }

  if (typeof wire.toIndex !== 'number' || wire.toIndex < 0) {
    errors.push(`Invalid toIndex: ${wire.toIndex}`)
  }

  // Signal validation
  if (wire.signal === undefined) {
    wire.signal = 0 // Default signal
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: wire
  }
}

/**
 * Gate object validator
 * Gate strukturasini to'liq tekshiradi
 */
export function validateGate(gate: any): { valid: boolean; errors: string[]; sanitized?: Gate } {
  const errors: string[] = []

  if (!gate || typeof gate !== 'object') {
    errors.push('Gate is not a valid object')
    return { valid: false, errors }
  }
  
  const sanitized = { ...gate };

  // Required fields
  if (!sanitized.id) {
    errors.push('Gate ID is missing')
  }

  if (!sanitized.type) {
    errors.push('Gate type is missing')
  }

  // Position validation
  if (typeof sanitized.x !== 'number') {
    sanitized.x = 0
    errors.push('Gate x position invalid, defaulting to 0')
  }

  if (typeof sanitized.y !== 'number') {
    sanitized.y = 0
    errors.push('Gate y position invalid, defaulting to 0')
  }

  // Size validation
  if (!sanitized.width || typeof sanitized.width !== 'number') {
    sanitized.width = 80 // Default width
  }

  if (!sanitized.height || typeof sanitized.height !== 'number') {
    sanitized.height = 60 // Default height
  }

  // Port arrays validation
  if (!Array.isArray(sanitized.inputs)) {
    sanitized.inputs = []
  }

  if (!Array.isArray(sanitized.outputs)) {
    sanitized.outputs = []
  }

  // Additional properties
  if (sanitized.value === undefined) {
    sanitized.value = 0
  }

  if (sanitized.rotation === undefined) {
    sanitized.rotation = 0
  }

  if (sanitized.flipped === undefined) {
    sanitized.flipped = false
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: sanitized
  }
}

/**
 * Port configuration validator
 */
export function validatePort(port) {
  const errors = []

  if (!port || typeof port !== 'object') {
    errors.push('Port is not a valid object')
    return { valid: false, errors }
  }

  // Required fields
  if (!port.name || typeof port.name !== 'string') {
    errors.push('Port name is missing or invalid')
  }

  if (typeof port.index !== 'number' || port.index < 0) {
    errors.push('Port index is invalid')
  }

  // Connected gate validation
  if (port.connectedGateId && typeof port.connectedGateId !== 'string') {
    errors.push('Connected gate ID must be a string')
  }

  if (typeof port.connectedIndex !== 'number' || port.connectedIndex < 0) {
    port.connectedIndex = 0
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: port
  }
}

/**
 * Bounds object validator
 */
export function validateBounds(bounds) {
  const errors = []

  if (!bounds || typeof bounds !== 'object') {
    return {
      valid: false,
      errors: ['Bounds is not a valid object'],
      sanitized: { minX: 0, minY: 0, maxX: 100, maxY: 100 }
    }
  }

  // Check all required properties
  const required = ['minX', 'minY', 'maxX', 'maxY']
  for (const prop of required) {
    if (typeof bounds[prop] !== 'number') {
      errors.push(`Bounds ${prop} is not a number`)
      bounds[prop] = 0
    }
  }

  // Logical validation
  if (bounds.minX > bounds.maxX) {
    errors.push('Bounds minX > maxX')
    ;[bounds.minX, bounds.maxX] = [bounds.maxX, bounds.minX]
  }

  if (bounds.minY > bounds.maxY) {
    errors.push('Bounds minY > maxY')
    ;[bounds.minY, bounds.maxY] = [bounds.maxY, bounds.minY]
  }

  // Calculate additional properties
  bounds.width = bounds.maxX - bounds.minX
  bounds.height = bounds.maxY - bounds.minY
  bounds.centerX = bounds.minX + bounds.width / 2
  bounds.centerY = bounds.minY + bounds.height / 2

  return {
    valid: errors.length === 0,
    errors,
    sanitized: bounds
  }
}

/**
 * Connectivity validator
 * Wire'lar va gate'lar o'rtasidagi bog'lanishlarni tekshiradi
 */
export function validateConnectivity(gates, wires) {
  const errors = []
  const warnings = []

  // Create gate ID set for quick lookup
  const gateIds = new Set(gates.map(g => g.id))

  // Gate port count map
  const gatePortCounts = new Map()
  gates.forEach(gate => {
    gatePortCounts.set(gate.id, {
      inputs: gate.inputs?.length || 0,
      outputs: gate.outputs?.length || 0
    })
  })

  // Validate each wire
  for (const wire of wires) {
    // Check if gates exist
    if (!gateIds.has(wire.fromGate)) {
      errors.push(`Wire ${wire.id}: fromGate '${wire.fromGate}' does not exist`)
    }

    if (!gateIds.has(wire.toGate)) {
      errors.push(`Wire ${wire.id}: toGate '${wire.toGate}' does not exist`)
    }

    // Check port indices
    const fromPorts = gatePortCounts.get(wire.fromGate)
    const toPorts = gatePortCounts.get(wire.toGate)

    if (fromPorts && wire.fromIndex >= fromPorts.outputs) {
      errors.push(`Wire ${wire.id}: fromIndex ${wire.fromIndex} exceeds output count ${fromPorts.outputs}`)
    }

    if (toPorts && wire.toIndex >= toPorts.inputs) {
      errors.push(`Wire ${wire.id}: toIndex ${wire.toIndex} exceeds input count ${toPorts.inputs}`)
    }
  }

  // Check for isolated gates
  const connectedGates = new Set()
  wires.forEach(wire => {
    connectedGates.add(wire.fromGate)
    connectedGates.add(wire.toGate)
  })

  gates.forEach(gate => {
    if (!connectedGates.has(gate.id)) {
      warnings.push(`Gate ${gate.id} (${gate.type}) is not connected to any wires`)
    }
  })

  // Check for duplicate wires (same from/to combination)
  const wireKeys = new Set()
  wires.forEach(wire => {
    const key = `${wire.fromGate}:${wire.fromIndex}->${wire.toGate}:${wire.toIndex}`
    if (wireKeys.has(key)) {
      errors.push(`Duplicate wire connection: ${key}`)
    }
    wireKeys.add(key)
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Template structure validator
 */
export function validateTemplate(template) {
  const errors = []
  const warnings = []

  // Basic structure
  if (!template || typeof template !== 'object') {
    return {
      valid: false,
      errors: ['Template is not a valid object'],
      warnings: []
    }
  }

  // Required fields
  if (!template.name || typeof template.name !== 'string') {
    errors.push('Template name is missing or invalid')
  }

  if (!template.id) {
    errors.push('Template ID is missing')
  }

  // Validate internal circuit
  if (!template.internalCircuit || typeof template.internalCircuit !== 'object') {
    errors.push('Internal circuit is missing')
  } else {
    // Validate gates
    if (!Array.isArray(template.internalCircuit.gates)) {
      errors.push('Internal circuit gates must be an array')
    } else {
      template.internalCircuit.gates.forEach((gate, i) => {
        const result = validateGate(gate)
        if (!result.valid) {
          errors.push(`Gate ${i}: ${result.errors.join(', ')}`)
        }
      })
    }

    // Validate wires
    if (!Array.isArray(template.internalCircuit.wires)) {
      errors.push('Internal circuit wires must be an array')
    } else {
      template.internalCircuit.wires.forEach((wire, i) => {
        const result = validateWire(wire)
        if (!result.valid) {
          errors.push(`Wire ${i}: ${result.errors.join(', ')}`)
        }
      })
    }

    // Validate connectivity
    if (template.internalCircuit.gates && template.internalCircuit.wires) {
      const connectResult = validateConnectivity(
        template.internalCircuit.gates,
        template.internalCircuit.wires
      )
      errors.push(...connectResult.errors)
      warnings.push(...connectResult.warnings)
    }
  }

  // Validate ports
  if (!Array.isArray(template.inputs)) {
    errors.push('Template inputs must be an array')
  } else {
    template.inputs.forEach((port, i) => {
      const result = validatePort(port)
      if (!result.valid) {
        errors.push(`Input port ${i}: ${result.errors.join(', ')}`)
      }
    })
  }

  if (!Array.isArray(template.outputs)) {
    errors.push('Template outputs must be an array')
  } else {
    template.outputs.forEach((port, i) => {
      const result = validatePort(port)
      if (!result.valid) {
        errors.push(`Output port ${i}: ${result.errors.join(', ')}`)
      }
    })
  }

  // Port count limits
  if (template.inputs && template.inputs.length > 32) {
    warnings.push('Input port count exceeds 32 (performance impact)')
  }

  if (template.outputs && template.outputs.length > 32) {
    warnings.push('Output port count exceeds 32 (performance impact)')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Selection validator
 * Tanlangan gate'lar va wire'larni tekshiradi
 */
export function validateSelection(selectedGates, selectedWires, allGates, allWires) {
  const errors = []
  const warnings = []

  // Check if selection is empty
  if (!selectedGates || selectedGates.length === 0) {
    errors.push('No gates selected for subcircuit creation')
    return { valid: false, errors, warnings }
  }

  // Validate each selected gate
  const selectedGateIds = new Set()
  selectedGates.forEach(gate => {
    const result = validateGate(gate)
    if (!result.valid) {
      errors.push(`Selected gate validation failed: ${result.errors.join(', ')}`)
    }
    selectedGateIds.add(gate.id)
  })

  // Check for external dependencies
  let externalInputCount = 0
  let externalOutputCount = 0
  let potentialInputsFromGates = 0
  let potentialOutputsFromGates = 0

  selectedGates.forEach(gate => {
    if (gate.type === 'INPUT') {
      potentialInputsFromGates++
    }
    if (gate.type === 'OUTPUT') {
      potentialOutputsFromGates++
    }
  })

  if (selectedWires && allWires) {
    // Find external connections
    allWires.forEach(wire => {
      const fromSelected = selectedGateIds.has(wire.fromGate)
      const toSelected = selectedGateIds.has(wire.toGate)

      if (!fromSelected && toSelected) {
        externalInputCount++
      }

      if (fromSelected && !toSelected) {
        externalOutputCount++
      }
    })
  }

  // Warnings for port counts
  if (externalInputCount === 0 && potentialInputsFromGates === 0) {
    warnings.push('No external inputs detected - subcircuit will have no input ports')
  }

  if (externalOutputCount === 0 && potentialOutputsFromGates === 0) {
    warnings.push('No external outputs detected - subcircuit will have no output ports')
  }

  if (externalInputCount > 16) {
    warnings.push(`High input count (${externalInputCount}) may affect performance`)
  }

  if (externalOutputCount > 16) {
    warnings.push(`High output count (${externalOutputCount}) may affect performance`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      gateCount: selectedGates.length,
      externalInputs: externalInputCount,
      externalOutputs: externalOutputCount
    }
  }
}

/**
 * Sanitize and normalize functions
 */
export function sanitizeGates(gates) {
  return gates.map(gate => {
    const result = validateGate(gate)
    return result.sanitized
  })
}

export function sanitizeWires(wires) {
  return wires.map(wire => {
    const result = validateWire(wire)
    return result.sanitized
  })
}

export function sanitizePorts(ports) {
  return ports.map(port => {
    const result = validatePort(port)
    return result.sanitized
  })
}

/**
 * Calculate safe bounds
 */
export function calculateSafeBounds(gates: Gate[]): Bounds {
  if (!gates || gates.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
      width: 100,
      height: 100,
      centerX: 50,
      centerY: 50
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  gates.forEach(gate => {
    const gateWidth = gate.width ?? 80
    const gateHeight = gate.height ?? 60

    minX = Math.min(minX, gate.x)
    minY = Math.min(minY, gate.y)
    maxX = Math.max(maxX, gate.x + gateWidth)
    maxY = Math.max(maxY, gate.y + gateHeight)
  })

  // Infinity check
  if (minX === Infinity) minX = 0
  if (minY === Infinity) minY = 0
  if (maxX === -Infinity) maxX = 100
  if (maxY === -Infinity) maxY = 100

  return validateBounds({
    minX,
    minY,
    maxX,
    maxY
  }).sanitized
}

export default {
  validateWire,
  validateGate,
  validatePort,
  validateBounds,
  validateConnectivity,
  validateTemplate,
  validateSelection,
  sanitizeGates,
  sanitizeWires,
  sanitizePorts,
  calculateSafeBounds
}
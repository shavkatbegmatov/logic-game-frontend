/**
 * Smart Port Mapping Engine
 * Avtomatik port aniqlash va intelligent mapping
 */

import { nanoid } from 'nanoid'
import type { Gate, Wire, Port } from '../types/gates'
import type { PortMappingResult } from '../types/subcircuit'

/**
 * Port direction types
 */
export const PortDirection = {
  INPUT: 'input',
  OUTPUT: 'output',
  BIDIRECTIONAL: 'bidirectional'
}

/**
 * Gate type port configurations
 * Har bir gate tipining standart port konfiguratsiyasi
 */
export const GatePortConfigs = {
  AND: {
    inputs: [
      { name: 'A', index: 0, description: 'First input' },
      { name: 'B', index: 1, description: 'Second input' }
    ],
    outputs: [
      { name: 'Y', index: 0, description: 'Output' }
    ]
  },
  OR: {
    inputs: [
      { name: 'A', index: 0, description: 'First input' },
      { name: 'B', index: 1, description: 'Second input' }
    ],
    outputs: [
      { name: 'Y', index: 0, description: 'Output' }
    ]
  },
  NOT: {
    inputs: [
      { name: 'A', index: 0, description: 'Input' }
    ],
    outputs: [
      { name: 'Y', index: 0, description: 'Inverted output' }
    ]
  },
  XOR: {
    inputs: [
      { name: 'A', index: 0, description: 'First input' },
      { name: 'B', index: 1, description: 'Second input' }
    ],
    outputs: [
      { name: 'Y', index: 0, description: 'XOR output' }
    ]
  },
  NAND: {
    inputs: [
      { name: 'A', index: 0, description: 'First input' },
      { name: 'B', index: 1, description: 'Second input' }
    ],
    outputs: [
      { name: 'Y', index: 0, description: 'NAND output' }
    ]
  },
  NOR: {
    inputs: [
      { name: 'A', index: 0, description: 'First input' },
      { name: 'B', index: 1, description: 'Second input' }
    ],
    outputs: [
      { name: 'Y', index: 0, description: 'NOR output' }
    ]
  },
  XNOR: {
    inputs: [
      { name: 'A', index: 0, description: 'First input' },
      { name: 'B', index: 1, description: 'Second input' }
    ],
    outputs: [
      { name: 'Y', index: 0, description: 'XNOR output' }
    ]
  },
  BUTTON: {
    inputs: [],
    outputs: [
      { name: 'OUT', index: 0, description: 'Button signal' }
    ]
  },
  LED: {
    inputs: [
      { name: 'IN', index: 0, description: 'LED input' }
    ],
    outputs: []
  },
  CLOCK: {
    inputs: [],
    outputs: [
      { name: 'CLK', index: 0, description: 'Clock signal' }
    ]
  },
  SUBCIRCUIT: {
    inputs: [], // Dinamik
    outputs: []  // Dinamik
  }
}

/**
 * Avtomatik port aniqlash
 * Tanlangan gate'lardan tashqi ulanishlarni aniqlaydi
 */
export function autoDetectPorts(selectedGates, allWires) {
  const selectedGateIds = new Set(selectedGates.map(g => g.id));
  const gateMap = new Map(selectedGates.map(g => [g.id, g]));
  const externalInputs = [];
  const externalOutputs = [];
  const internalWires = [];

  // Wire'larni kategoriyalarga ajratish
  for (const wire of allWires) {
    const fromSelected = selectedGateIds.has(wire.fromGate);
    const toSelected = selectedGateIds.has(wire.toGate);

    if (fromSelected && toSelected) {
      const fromGate = gateMap.get(wire.fromGate);
      const toGate = gateMap.get(wire.toGate);

      // Agar sim tanlangan OUTPUT'ga ulansa, bu tashqi chiqish portini belgilaydi
      if (toGate && toGate.type === 'OUTPUT') {
        if (fromGate) {
          externalOutputs.push({
            wireId: wire.id,
            sourceGateId: wire.fromGate,
            sourceGateType: fromGate.type,
            sourcePortIndex: wire.fromIndex || 0,
            isVirtual: true,
            definedByGate: toGate,
          });
        }
      }
      // Agar sim tanlangan INPUT'dan boshlansa, bu tashqi kirish portini belgilaydi
      else if (fromGate && fromGate.type === 'INPUT') {
        if (toGate) {
          externalInputs.push({
            wireId: wire.id,
            targetGateId: wire.toGate,
            targetGateType: toGate.type,
            targetPortIndex: wire.toIndex || 0,
            isVirtual: true,
            definedByGate: fromGate,
          });
        }
      }
      // Aks holda, bu haqiqiy ichki sim
      else {
        internalWires.push(wire);
      }
    } else if (!fromSelected && toSelected) {
      // Tashqaridan ichkariga - input
      const targetGate = gateMap.get(wire.toGate);
      if (targetGate) {
        externalInputs.push({
          wireId: wire.id,
          targetGateId: wire.toGate,
          targetGateType: targetGate.type,
          targetPortIndex: wire.toIndex || 0,
          sourceGateId: wire.fromGate,
          signal: wire.signal || 0
        });
      }
    } else if (fromSelected && !toSelected) {
      // Ichkaridan tashqariga - output
      const sourceGate = gateMap.get(wire.fromGate);
      if (sourceGate) {
        externalOutputs.push({
          wireId: wire.id,
          sourceGateId: wire.fromGate,
          sourceGateType: sourceGate.type,
          sourcePortIndex: wire.fromIndex || 0,
          targetGateId: wire.toGate,
          signal: wire.signal || 0
        });
      }
    }
  }

  return {
    externalInputs,
    externalOutputs,
    internalWires,
    stats: {
      inputCount: externalInputs.length,
      outputCount: externalOutputs.length,
      internalWireCount: internalWires.length
    }
  };
}

/**
 * Smart port naming
 * Gate tipiga va port indeksiga qarab intelligent nom beradi
 */
export function generateSmartPortName(gateType, portIndex, direction, existingNames = []) {
  const config = GatePortConfigs[gateType]

  // Agar config mavjud bo'lsa va port nomi bo'lsa
  if (config) {
    const ports = direction === PortDirection.INPUT ? config.inputs : config.outputs
    if (ports && ports[portIndex]) {
      const baseName = ports[portIndex].name

      // Agar bu nom allaqachon ishlatilgan bo'lsa, raqam qo'shish
      if (existingNames.includes(baseName)) {
        let counter = 1
        while (existingNames.includes(`${baseName}${counter}`)) {
          counter++
        }
        return `${baseName}${counter}`
      }

      return baseName
    }
  }

  // Default naming
  const prefix = direction === PortDirection.INPUT ? 'IN' : 'OUT'
  const baseName = `${prefix}${portIndex}`

  if (existingNames.includes(baseName)) {
    let counter = 1
    while (existingNames.includes(`${baseName}_${counter}`)) {
      counter++
    }
    return `${baseName}_${counter}`
  }

  return baseName
}

/**
 * Port mapper - external connections'dan port'lar yaratadi
 */
export function mapExternalConnectionsToPorts(externalInputs, externalOutputs, selectedGates) {
  const inputPorts = []
  const outputPorts = []
  const usedInputNames = []
  const usedOutputNames = []

  // Group inputs by similar connections
  const inputGroups = groupSimilarConnections(externalInputs)
  const outputGroups = groupSimilarConnections(externalOutputs)

  // Create input ports
  inputGroups.forEach((group, index) => {
    const representative = group[0]
    const gate = selectedGates.find(g => g.id === representative.targetGateId)

    const portName = generateSmartPortName(
      representative.targetGateType,
      representative.targetPortIndex,
      PortDirection.INPUT,
      usedInputNames
    )

    usedInputNames.push(portName)

    inputPorts.push({
      id: nanoid(8),
      name: portName,
      index: index,
      direction: PortDirection.INPUT,
      connectedGateId: representative.targetGateId,
      connectedPortIndex: representative.targetPortIndex,
      description: `Input to ${representative.targetGateType}`,
      position: index, // For drag-drop reordering
      group: group.map(g => g.wireId) // Track which wires belong to this port
    })
  })

  // Create output ports
  outputGroups.forEach((group, index) => {
    const representative = group[0]
    const gate = selectedGates.find(g => g.id === representative.sourceGateId)

    const portName = generateSmartPortName(
      representative.sourceGateType,
      representative.sourcePortIndex,
      PortDirection.OUTPUT,
      usedOutputNames
    )

    usedOutputNames.push(portName)

    outputPorts.push({
      id: nanoid(8),
      name: portName,
      index: index,
      direction: PortDirection.OUTPUT,
      connectedGateId: representative.sourceGateId,
      connectedPortIndex: representative.sourcePortIndex,
      description: `Output from ${representative.sourceGateType}`,
      position: index,
      group: group.map(g => g.wireId)
    })
  })

  return {
    inputPorts,
    outputPorts
  }
}

/**
 * Group similar connections
 * Bir xil gate va port'ga ulangan wire'larni guruhlashtiradi
 */
function groupSimilarConnections(connections) {
  const groups = []
  const processed = new Set()

  connections.forEach(conn => {
    if (processed.has(conn.wireId)) return

    const group = [conn]
    processed.add(conn.wireId)

    // Find similar connections
    connections.forEach(other => {
      if (processed.has(other.wireId)) return

      const sameTarget = conn.targetGateId === other.targetGateId &&
                        conn.targetPortIndex === other.targetPortIndex
      const sameSource = conn.sourceGateId === other.sourceGateId &&
                        conn.sourcePortIndex === other.sourcePortIndex

      if (sameTarget || sameSource) {
        group.push(other)
        processed.add(other.wireId)
      }
    })

    groups.push(group)
  })

  return groups
}

/**
 * Port optimizer
 * Ortiqcha va takroriy portlarni olib tashlaydi
 */
export function optimizePorts(ports) {
  const optimized = []
  const seen = new Map()

  ports.forEach(port => {
    const key = `${port.connectedGateId}:${port.connectedPortIndex}`

    if (!seen.has(key)) {
      seen.set(key, port)
      optimized.push(port)
    } else {
      // Merge port information
      const existing = seen.get(key)
      if (port.group && existing.group) {
        existing.group = [...new Set([...existing.group, ...port.group])]
      }
    }
  })

  return optimized
}

/**
 * Port reordering
 * Drag-drop orqali portlarning tartibini o'zgartirish
 */
export function reorderPorts(ports, fromIndex, toIndex) {
  const reordered = [...ports]
  const [movedPort] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, movedPort)

  // Update positions and indices
  reordered.forEach((port, index) => {
    port.position = index
    port.index = index
  })

  return reordered
}

/**
 * Port validation
 */
export function validatePortMapping(inputPorts, outputPorts, selectedGates) {
  const errors = []
  const warnings = []

  // Check for duplicate names
  const allNames = [...inputPorts.map(p => p.name), ...outputPorts.map(p => p.name)]
  const uniqueNames = new Set(allNames)

  if (uniqueNames.size !== allNames.length) {
    errors.push('Duplicate port names detected')
  }

  // Check port connections
  const gateIds = new Set(selectedGates.map(g => g.id))

  inputPorts.forEach(port => {
    if (!gateIds.has(port.connectedGateId)) {
      errors.push(`Input port "${port.name}" connected to non-existent gate`)
    }
  })

  outputPorts.forEach(port => {
    if (!gateIds.has(port.connectedGateId)) {
      errors.push(`Output port "${port.name}" connected to non-existent gate`)
    }
  })

  // Warnings
  if (inputPorts.length === 0) {
    warnings.push('No input ports - subcircuit will have no inputs')
  }

  if (outputPorts.length === 0) {
    warnings.push('No output ports - subcircuit will have no outputs')
  }

  if (inputPorts.length > 16) {
    warnings.push(`High input port count (${inputPorts.length}) may affect performance`)
  }

  if (outputPorts.length > 16) {
    warnings.push(`High output port count (${outputPorts.length}) may affect performance`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Convert ports to legacy format (backward compatibility)
 */
export function convertToLegacyFormat(inputPorts, outputPorts) {
  const legacyInputs = inputPorts.map(port => ({
    name: port.name,
    index: port.index,
    connectedGate: port.connectedGateId,
    connectedIndex: port.connectedPortIndex
  }))

  const legacyOutputs = outputPorts.map(port => ({
    name: port.name,
    index: port.index,
    connectedGate: port.connectedGateId,
    connectedIndex: port.connectedPortIndex
  }))

  return {
    inputs: legacyInputs,
    outputs: legacyOutputs
  }
}

/**
 * Port suggestions
 * User'ga port nomlari uchun tavsiyalar beradi
 */
export function suggestPortNames(gateType, existingNames = []) {
  const suggestions = []

  // Common signal names
  const commonNames = {
    clock: ['CLK', 'Clock', 'Clk', 'CLOCK_IN'],
    enable: ['EN', 'Enable', 'E', 'ENABLE'],
    reset: ['RST', 'Reset', 'R', 'RESET'],
    data: ['D', 'Data', 'DATA', 'DIN', 'DOUT'],
    address: ['A', 'ADDR', 'Address', 'ADDR_BUS'],
    control: ['CTRL', 'Control', 'CTL', 'CONTROL'],
    select: ['SEL', 'Select', 'S', 'SELECT'],
    write: ['WR', 'Write', 'W', 'WRITE_EN'],
    read: ['RD', 'Read', 'R', 'READ_EN'],
    carry: ['C', 'Carry', 'CIN', 'COUT'],
    sum: ['S', 'Sum', 'SUM', 'RESULT'],
    bit: ['B0', 'B1', 'B2', 'B3', 'BIT0', 'BIT1']
  }

  // Generate suggestions based on gate type
  const config = GatePortConfigs[gateType]
  if (config) {
    // Add configured names
    config.inputs.forEach(input => {
      if (!existingNames.includes(input.name)) {
        suggestions.push(input.name)
      }
    })

    config.outputs.forEach(output => {
      if (!existingNames.includes(output.name)) {
        suggestions.push(output.name)
      }
    })
  }

  // Add common names
  Object.values(commonNames).forEach(names => {
    names.forEach(name => {
      if (!existingNames.includes(name) && !suggestions.includes(name)) {
        suggestions.push(name)
      }
    })
  })

  return suggestions.slice(0, 10) // Return top 10 suggestions
}

/**
 * Main port mapping function
 */
export function createPortMapping(selectedGates, allWires, options = {}) {
  const {
    autoDetect = true,
    optimize = true,
    validate = true
  } = options

  // Step 1: Auto-detect external connections
  const detection = autoDetectPorts(selectedGates, allWires)

  // Step 2: Map to ports
  const { inputPorts, outputPorts } = mapExternalConnectionsToPorts(
    detection.externalInputs,
    detection.externalOutputs,
    selectedGates
  )

  // Step 3: Optimize if requested
  let finalInputPorts = inputPorts
  let finalOutputPorts = outputPorts

  if (optimize) {
    finalInputPorts = optimizePorts(inputPorts)
    finalOutputPorts = optimizePorts(outputPorts)
  }

  // Step 4: Validate if requested
  let validation = { valid: true, errors: [], warnings: [] }

  if (validate) {
    validation = validatePortMapping(finalInputPorts, finalOutputPorts, selectedGates)
  }

  return {
    inputPorts: finalInputPorts,
    outputPorts: finalOutputPorts,
    internalWires: detection.internalWires,
    stats: {
      ...detection.stats,
      optimized: optimize,
      validated: validate
    },
    validation,
    legacy: convertToLegacyFormat(finalInputPorts, finalOutputPorts)
  }
}

export default {
  PortDirection,
  GatePortConfigs,
  autoDetectPorts,
  generateSmartPortName,
  mapExternalConnectionsToPorts,
  optimizePorts,
  reorderPorts,
  validatePortMapping,
  convertToLegacyFormat,
  suggestPortNames,
  createPortMapping
}
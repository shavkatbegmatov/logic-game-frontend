/**
 * Subcircuit Simulation Engine with Cache System
 * Cached Results + Real-time debug mode strategiyasi bilan
 */

import { validateTemplate } from './validation'
import type { Gate, Wire, Port } from '../types/gates'

/**
 * Simulation Cache Manager
 * LRU (Least Recently Used) cache implementation
 */
class SimulationCache {
  maxSize: number
  cache: Map<string, any>
  accessOrder: string[]

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
    this.cache = new Map()
    this.accessOrder = []
  }

  /**
   * Generate cache key from inputs
   */
  generateKey(templateId: string, inputSignals: number[]): string {
    return `${templateId}:${inputSignals.join(',')}`
  }

  /**
   * Get cached result
   */
  get(templateId: string, inputSignals: number[]): number[] | null {
    const key = this.generateKey(templateId, inputSignals)

    if (this.cache.has(key)) {
      // Update access order (move to end)
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
      this.accessOrder.push(key)

      const cached = this.cache.get(key)
      cached.hits++
      cached.lastAccess = Date.now()

      return cached.outputs
    }

    return null
  }

  /**
   * Set cache entry
   */
  set(templateId: string, inputSignals: number[], outputSignals: number[]): void {
    const key = this.generateKey(templateId, inputSignals)

    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Remove least recently used
      const lruKey = this.accessOrder.shift()
      if (lruKey) {
        this.cache.delete(lruKey)
      }
    }

    // Add or update
    this.cache.set(key, {
      outputs: outputSignals,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      hits: 0
    })

    // Update access order
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }

  /**
   * Clear cache for specific template
   */
  clearTemplate(templateId: string): void {
    const keysToDelete = []

    this.cache.forEach((_, key) => {
      if (key.startsWith(`${templateId}:`)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    })
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; totalHits: number; averageAge: number; fillRate: number } {
    let totalHits = 0
    let totalAge = 0
    const now = Date.now()

    this.cache.forEach(entry => {
      totalHits += entry.hits
      totalAge += (now - entry.timestamp)
    })

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      fillRate: (this.cache.size / this.maxSize) * 100
    }
  }
}

/**
 * Gate simulation functions
 */
const GateSimulators: Record<string, (inputs: number[], state?: any) => number> = {
  AND: (inputs: number[]) => inputs.every(i => i === 1) ? 1 : 0,
  OR: (inputs: number[]) => inputs.some(i => i === 1) ? 1 : 0,
  NOT: (inputs: number[]) => inputs[0] === 1 ? 0 : 1,
  NAND: (inputs: number[]) => inputs.every(i => i === 1) ? 0 : 1,
  NOR: (inputs: number[]) => inputs.some(i => i === 1) ? 0 : 1,
  XOR: (inputs: number[]) => inputs.filter(i => i === 1).length % 2 === 1 ? 1 : 0,
  XNOR: (inputs: number[]) => inputs.filter(i => i === 1).length % 2 === 0 ? 1 : 0,
  BUFFER: (inputs: number[]) => inputs[0] || 0,
  BUTTON: (inputs: number[], state?: any) => state?.pressed ? 1 : 0,
  LED: (inputs: number[]) => inputs[0] || 0,
  CLOCK: (inputs: number[], state?: any) => state?.value || 0,
  SWITCH: (inputs: number[], state?: any) => state?.on ? 1 : 0
}

/**
 * Simulation Engine Class
 */
export class SubcircuitSimulationEngine {
  cache: SimulationCache
  debugMode: boolean
  useCache: boolean
  maxRecursionDepth: number
  simulationSteps: any[]
  templateManager: any | null

  constructor(options: any = {}) {
    this.cache = new SimulationCache(options.cacheSize || 1000)
    this.debugMode = options.debugMode || false
    this.useCache = options.useCache !== false // Default true
    this.maxRecursionDepth = options.maxRecursionDepth || 10
    this.simulationSteps = []
    this.templateManager = null
  }

  /**
   * Set template manager
   */
  setTemplateManager(manager: any): void {
    this.templateManager = manager
  }

  /**
   * Main simulation function
   */
  simulate(subcircuitGate: any, inputSignals: number[], options: any = {}): any {
    const {
      forceRealtime = false,
      recordSteps = this.debugMode
    } = options

    // Get template
    const template = this.templateManager?.getTemplate(subcircuitGate.templateId)
    if (!template) {
      console.error('Template not found:', subcircuitGate.templateId)
      return new Array(subcircuitGate.outputs?.length || 0).fill(0)
    }

    // Validate template
    const validation = template.validate()
    if (!validation.valid) {
      console.error('Template validation failed:', validation.errors)
      return new Array(template.outputs.length).fill(0)
    }

    // Check input count
    if (inputSignals.length !== template.inputs.length) {
      console.error('Input signal count mismatch')
      return new Array(template.outputs.length).fill(0)
    }

    // Check cache (unless forced realtime)
    if (this.useCache && !forceRealtime) {
      const cached = this.cache.get(subcircuitGate.templateId, inputSignals)
      if (cached) {
        if (this.debugMode) {
          console.log('Cache hit for subcircuit:', subcircuitGate.name)
        }
        return cached
      }
    }

    // Clear simulation steps if recording
    if (recordSteps) {
      this.simulationSteps = []
    }

    // Perform real-time simulation
    const outputs = this.simulateRealtime(
      template,
      inputSignals,
      subcircuitGate.state || {},
      0,
      recordSteps
    )

    // Cache result
    if (this.useCache && !forceRealtime) {
      this.cache.set(subcircuitGate.templateId, inputSignals, outputs)
    }

    return outputs
  }

  /**
   * Real-time simulation
   */
  simulateRealtime(template: any, inputSignals: number[], state: any, recursionDepth: number = 0, recordSteps: boolean = false): number[] {
    // Check recursion depth
    if (recursionDepth > this.maxRecursionDepth) {
      console.error('Maximum recursion depth exceeded')
      return new Array(template.outputs.length).fill(0)
    }

    // Initialize gate states
    const gateStates = new Map()
    const gateOutputs = new Map()

    // Map input signals to internal gates
    template.inputs.forEach((input, index) => {
      if (input.connectedGate && input.connectedIndex !== undefined) {
        if (!gateStates.has(input.connectedGate)) {
          gateStates.set(input.connectedGate, {})
        }
        const gateState = gateStates.get(input.connectedGate)
        if (!gateState.inputs) gateState.inputs = []
        gateState.inputs[input.connectedIndex] = inputSignals[index] || 0

        if (recordSteps) {
          this.simulationSteps.push({
            type: 'input',
            gateId: input.connectedGate,
            portIndex: input.connectedIndex,
            value: inputSignals[index] || 0
          })
        }
      }
    })

    // Initialize all gates
    template.internalCircuit.gates.forEach(gate => {
      if (!gateStates.has(gate.id)) {
        gateStates.set(gate.id, {
          inputs: new Array(gate.inputs?.length || 2).fill(0),
          output: 0,
          type: gate.type,
          state: state[gate.id] || {}
        })
      }
    })

    // Process wires to connect gates
    template.internalCircuit.wires.forEach(wire => {
      if (!gateStates.has(wire.toGate)) {
        gateStates.set(wire.toGate, { inputs: [] })
      }
    })

    // Simulation iterations (handle feedback loops)
    const maxIterations = 10
    let iteration = 0
    let stable = false

    while (!stable && iteration < maxIterations) {
      stable = true
      iteration++

      // Simulate each gate
      template.internalCircuit.gates.forEach(gate => {
        const gateState = gateStates.get(gate.id)
        if (!gateState) return

        // Get current inputs
        const currentInputs = gateState.inputs || []

        // Simulate gate based on type
        let output = 0

        if (gate.type === 'SUBCIRCUIT') {
          // Recursive subcircuit simulation
          output = this.simulate(
            gate,
            currentInputs,
            { forceRealtime: true }
          )[0] || 0
        } else {
          // Normal gate simulation
          const simulator = GateSimulators[gate.type]
          if (simulator) {
            output = simulator(currentInputs, gateState.state)
          } else {
            console.warn('Unknown gate type:', gate.type)
            output = 0
          }
        }

        // Check if output changed
        if (gateState.output !== output) {
          stable = false
          gateState.output = output
          gateOutputs.set(gate.id, output)

          if (recordSteps) {
            this.simulationSteps.push({
              type: 'gate',
              gateId: gate.id,
              gateType: gate.type,
              inputs: [...currentInputs],
              output,
              iteration
            })
          }
        }
      })

      // Propagate signals through wires
      template.internalCircuit.wires.forEach(wire => {
        const fromOutput = gateOutputs.get(wire.fromGate) || 0
        const toState = gateStates.get(wire.toGate)

        if (toState) {
          if (!toState.inputs) toState.inputs = []
          const oldValue = toState.inputs[wire.toIndex || 0]
          toState.inputs[wire.toIndex || 0] = fromOutput

          if (oldValue !== fromOutput) {
            stable = false

            if (recordSteps) {
              this.simulationSteps.push({
                type: 'wire',
                wireId: wire.id,
                fromGate: wire.fromGate,
                toGate: wire.toGate,
                value: fromOutput,
                iteration
              })
            }
          }
        }
      })
    }

    // Collect output signals
    const outputSignals = new Array(template.outputs.length).fill(0)

    template.outputs.forEach((output, index) => {
      if (output.connectedGate && output.connectedIndex !== undefined) {
        const gateState = gateStates.get(output.connectedGate)
        if (gateState) {
          outputSignals[index] = gateState.output || 0

          if (recordSteps) {
            this.simulationSteps.push({
              type: 'output',
              portIndex: index,
              gateId: output.connectedGate,
              value: outputSignals[index]
            })
          }
        }
      }
    })

    if (this.debugMode && !stable) {
      console.warn('Circuit did not stabilize after', maxIterations, 'iterations')
    }

    return outputSignals
  }

  /**
   * Get simulation steps (for debugging)
   */
  getSimulationSteps(): any[] {
    return this.simulationSteps
  }

  /**
   * Clear cache
   */
  clearCache(templateId: string | null = null): void {
    if (templateId) {
      this.cache.clearTemplate(templateId)
    } else {
      this.cache.clearAll()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; totalHits: number; averageAge: number; fillRate: number } {
    return this.cache.getStats()
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Enable/disable cache
   */
  setCacheEnabled(enabled: boolean): void {
    this.useCache = enabled
  }
}

/**
 * Global simulation engine instance
 */
export const globalSimulationEngine = new SubcircuitSimulationEngine({
  cacheSize: 2000,
  debugMode: false,
  useCache: true,
  maxRecursionDepth: 10
})

/**
 * Convenience function for quick simulation
 */
export function simulateSubcircuit(subcircuitGate: any, inputSignals: number[], templateManager: any, options: any = {}): any {
  // Set template manager if provided
  if (templateManager && !globalSimulationEngine.templateManager) {
    globalSimulationEngine.setTemplateManager(templateManager)
  }

  return globalSimulationEngine.simulate(subcircuitGate, inputSignals, options)
}

/**
 * Create custom simulation engine
 */
export function createSimulationEngine(options: any): SubcircuitSimulationEngine {
  return new SubcircuitSimulationEngine(options)
}

export default {
  SubcircuitSimulationEngine,
  globalSimulationEngine,
  simulateSubcircuit,
  createSimulationEngine,
  GateSimulators
}
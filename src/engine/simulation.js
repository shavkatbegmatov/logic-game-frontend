import { gateLogic, GateTypes, gateConfigs } from './gates'
import { simulateSubcircuit } from './subcircuits'
import useSubcircuitStore from '../store/subcircuitStore'

export class SimulationEngine {
  constructor(gates, wires) {
    this.gates = gates
    this.wires = wires
    this.signals = {}
    this.gateOutputs = {}
  }

  // Simulyatsiyani ishga tushirish
  simulate() {
    // Boshlang'ich signallarni o'rnatish
    this.resetSignals()

    // Topologik tartiblash - dependency grafini yaratish
    const sortedGates = this.topologicalSort()

    // Har bir gate'ni ketma-ket hisoblash
    for (const gate of sortedGates) {
      this.evaluateGate(gate)
    }

    return {
      signals: this.signals,
      gateOutputs: this.gateOutputs
    }
  }

  resetSignals() {
    this.signals = {}
    this.gateOutputs = {}

    // Barcha simlarni 0 ga o'rnatish
    this.wires.forEach(wire => {
      this.signals[wire.id] = 0
    })

    // INPUT gate'larning qiymatlarini o'rnatish
    this.gates.forEach(gate => {
      if (gate.type === GateTypes.INPUT) {
        this.gateOutputs[gate.id] = gate.value || 0
      }
    })
  }

  // Gate'ni hisoblash
  evaluateGate(gate) {
    // Gate'ning kirish signallarini yig'ish
    const inputSignals = this.getGateInputs(gate)

    let outputs = []

    // SUBCIRCUIT uchun alohida logic
    if (gate.type === GateTypes.SUBCIRCUIT) {
      // Subcircuit template'ni olish
      const subcircuitStore = useSubcircuitStore.getState()
      const template = subcircuitStore.getTemplate(gate.templateId)

      if (template) {
        // Subcircuit simulyatsiya
        outputs = simulateSubcircuit(gate, inputSignals, subcircuitStore.manager)
      } else {
        console.error('Subcircuit template topilmadi:', gate.templateId)
        outputs = new Array(gate.outputPorts?.length || 1).fill(0)
      }

      // Multiple outputs uchun har birini alohida saqlash
      gate.outputPorts?.forEach((port, index) => {
        this.gateOutputs[`${gate.id}_${index}`] = outputs[index] || 0
      })
    } else {
      // Oddiy gate logikasi
      const output = gateLogic[gate.type](inputSignals, gate.value)
      outputs = [output]
      this.gateOutputs[gate.id] = output
    }

    // Gate'dan chiqadigan simlarga signalni uzatish
    const outputWires = this.wires.filter(wire => wire.fromGate === gate.id)
    outputWires.forEach(wire => {
      // SUBCIRCUIT uchun fromIndex'dan foydalanish
      if (gate.type === GateTypes.SUBCIRCUIT) {
        this.signals[wire.id] = outputs[wire.fromIndex || 0] || 0
      } else {
        this.signals[wire.id] = outputs[0] || 0
      }
    })

    // Debug: INPUT gate'lar uchun signal uzatishni ko'rsatish
    if (gate.type === GateTypes.INPUT && outputs[0] === 1) {
      console.log(`⚡ INPUT gate ${gate.id} signal uzatmoqda:`, {
        output: outputs[0],
        outputWires: outputWires.map(w => w.id),
        signals: outputWires.map(w => ({ wireId: w.id, signal: this.signals[w.id] }))
      })
    }
  }

  // Gate'ning kirish signallarini olish
  getGateInputs(gate) {
    const inputWires = this.wires.filter(wire => wire.toGate === gate.id)
    return inputWires.map(wire => {
      // Agar sim boshqa gate'dan kelayotgan bo'lsa
      if (wire.fromGate) {
        return this.gateOutputs[wire.fromGate] || 0
      }
      return this.signals[wire.id] || 0
    })
  }

  // Topologik tartiblash (dependency resolution)
  topologicalSort() {
    const visited = new Set()
    const sorted = []
    const visiting = new Set() // Cycle detection uchun

    const visit = (gate) => {
      if (visited.has(gate.id)) return
      if (visiting.has(gate.id)) {
        console.warn('Cycle detected in gate connections!')
        return
      }

      visiting.add(gate.id)

      // Gate'ning dependencylarini topish
      const dependencies = this.getGateDependencies(gate)
      dependencies.forEach(depGate => visit(depGate))

      visiting.delete(gate.id)
      visited.add(gate.id)
      sorted.push(gate)
    }

    // INPUT gate'lardan boshlash
    const inputGates = this.gates.filter(g => g.type === GateTypes.INPUT)
    inputGates.forEach(gate => visit(gate))

    // Qolgan gate'larni qo'shish
    this.gates.forEach(gate => {
      if (!visited.has(gate.id)) {
        visit(gate)
      }
    })

    return sorted
  }

  // Gate'ning dependency'larini topish
  getGateDependencies(gate) {
    const inputWires = this.wires.filter(wire => wire.toGate === gate.id)
    const dependencies = []

    inputWires.forEach(wire => {
      if (wire.fromGate) {
        const depGate = this.gates.find(g => g.id === wire.fromGate)
        if (depGate) {
          dependencies.push(depGate)
        }
      }
    })

    return dependencies
  }

  // Sxema to'g'riligini tekshirish
  validateCircuit() {
    const errors = []

    // Har bir gate'ning minimal kirishlari borligini tekshirish
    this.gates.forEach(gate => {
      if (gate.type === GateTypes.INPUT || gate.type === GateTypes.OUTPUT) return

      // SUBCIRCUIT uchun alohida validatsiya
      if (gate.type === GateTypes.SUBCIRCUIT) {
        const subcircuitStore = useSubcircuitStore.getState()
        const template = subcircuitStore.getTemplate(gate.templateId)

        if (!template) {
          errors.push(`Subcircuit ${gate.id} template topilmadi`)
        }
        return
      }

      const inputCount = this.wires.filter(w => w.toGate === gate.id).length
      const config = gateConfigs[gate.type]

      if (inputCount < config.minInputs) {
        errors.push({
          type: 'insufficient_inputs',
          gate: gate.id,
          message: `${gate.type} gate kamida ${config.minInputs} ta kirishga muhtoj`
        })
      }
    })

    // Cycle mavjudligini tekshirish
    if (this.hasCycle()) {
      errors.push({
        type: 'cycle_detected',
        message: 'Sxemada sikl mavjud'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Cycle detection
  hasCycle() {
    const visited = new Set()
    const recursionStack = new Set()

    const hasCycleDFS = (gateId) => {
      visited.add(gateId)
      recursionStack.add(gateId)

      const neighbors = this.wires
        .filter(w => w.fromGate === gateId)
        .map(w => w.toGate)
        .filter(Boolean)

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          if (hasCycleDFS(neighborId)) return true
        } else if (recursionStack.has(neighborId)) {
          return true
        }
      }

      recursionStack.delete(gateId)
      return false
    }

    for (const gate of this.gates) {
      if (!visited.has(gate.id)) {
        if (hasCycleDFS(gate.id)) return true
      }
    }

    return false
  }
}

// Helper funksiyalar
export const runSimulation = (gates, wires) => {
  const engine = new SimulationEngine(gates, wires)
  const validation = engine.validateCircuit()

  // Validation xatoliklari bo'lganda ham simulyatsiya ishlashi kerak
  // Faqat warning berish
  if (!validation.valid) {
    console.warn('Sxemada xatoliklar bor, lekin simulyatsiya davom etmoqda:', validation.errors)
  }

  const result = engine.simulate()
  return {
    success: true,
    ...result,
    warnings: validation.valid ? [] : validation.errors
  }
}
import { gateLogic, GateTypes, gateConfigs } from './gates'
import { simulateSubcircuit } from './subcircuits'
import useSubcircuitStore from '../store/subcircuitStore'
import type { Gate, Wire, SignalMap } from '@/types'

export interface SimulationResult {
  success: boolean
  signals: SignalMap
  gateOutputs: Record<string | number, number>
  warnings: any[]
}

export class SimulationEngine {
  gates: Gate[]
  wires: Wire[]
  signals: SignalMap
  gateOutputs: Record<string | number, number>

  constructor(gates: Gate[], wires: Wire[]) {
    console.log('[SIMULATION] Engine yaratilmoqda...', { gates: gates.length, wires: wires.length });
    this.gates = gates
    this.wires = wires
    this.signals = {}
    this.gateOutputs = {}
  }

  // Simulyatsiyani ishga tushirish
  simulate() {
    console.log('[SIMULATION] Simulyatsiya boshlandi.');
    // Boshlang'ich signallarni o'rnatish
    this.resetSignals()

    // Topologik tartiblash - dependency grafini yaratish
    console.log('[SIMULATION] Elementlarni topologik saralash...');
    const sortedGates = this.topologicalSort()
    console.log('[SIMULATION] Saralangan tartib:', sortedGates.map(g => `${g.type}_${g.id}`));

    // Har bir gate'ni ketma-ket hisoblash
    console.log('[SIMULATION] Elementlarni baholash boshlandi...');
    for (const gate of sortedGates) {
      this.evaluateGate(gate)
    }
    console.log('[SIMULATION] Elementlarni baholash tugadi.');

    console.log('[SIMULATION] Simulyatsiya yakunlandi.', { signals: this.signals, gateOutputs: this.gateOutputs });
    return {
      signals: this.signals,
      gateOutputs: this.gateOutputs
    }
  }

  resetSignals() {
    console.log('[SIMULATION] Signallar boshlang\'ich holatga keltirilmoqda.');
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
    console.log('[SIMULATION] Signallar o\'rnatildi.', { initialOutputs: this.gateOutputs });
  }

  // Gate'ni hisoblash
  evaluateGate(gate: Gate) {
    console.log(`[SIMULATION] Baholanmoqda: ${gate.type}_${gate.id}`);
    // Gate'ning kirish signallarini yig'ish
    const inputSignals = this.getGateInputs(gate)
    console.log(`[SIMULATION]   - Kirish signallari (${gate.type}_${gate.id}):`, inputSignals);

    let outputs = []

    // SUBCIRCUIT uchun alohida logic
    if (gate.type === GateTypes.SUBCIRCUIT) {
      console.log(`[SIMULATION]   - Subcircuit aniqlandi: ${gate.templateId}`);
      // Subcircuit template'ni olish
      const subcircuitStore = useSubcircuitStore.getState()
      const template = subcircuitStore.getTemplate(gate.templateId)

      if (template) {
        // Subcircuit simulyatsiya
        outputs = simulateSubcircuit(gate, inputSignals, subcircuitStore.manager)
        console.log(`[SIMULATION]   - Subcircuit natijasi:`, outputs);
      } else {
        console.error('Subcircuit template topilmadi:', gate.templateId)
        outputs = new Array(gate.outputPorts?.length || 1).fill(0)
      }

      // Multiple outputs uchun har birini alohida saqlash
      gate.outputPorts?.forEach((_, index) => {
        this.gateOutputs[`${gate.id}_${index}`] = outputs[index] || 0
      })
    } else {
      // Oddiy gate logikasi
      const output = gateLogic[gate.type](inputSignals, gate.value)
      outputs = [output]
      this.gateOutputs[gate.id] = typeof output === 'number' ? output : 0
    }
    console.log(`[SIMULATION]   - Chiqish signallari (${gate.type}_${gate.id}):`, outputs);

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
  getGateInputs(gate: Gate) {
    const inputWires = this.wires.filter(wire => wire.toGate === gate.id)
    return inputWires.map(wire => {
      // Agar sim boshqa gate'dan kelayotgan bo'lsa
      if (wire.fromGate) {
        // SUBCIRCUIT chiqishlarini to'g'ri olish
        const fromGate = this.gates.find(g => g.id === wire.fromGate);
        if (fromGate && fromGate.type === GateTypes.SUBCIRCUIT) {
          const outputKey = `${wire.fromGate}_${wire.fromIndex || 0}`;
          return this.gateOutputs[outputKey] || 0;
        }
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

    const visit = (gate: Gate) => {
      if (!gate) {
        console.warn('[SIMULATION] `visit` funksiyasiga `undefined` element keldi.');
        return;
      }
      if (visited.has(gate.id)) return
      if (visiting.has(gate.id)) {
        console.warn(`[SIMULATION] Sikl aniqlandi! Element: ${gate.type}_${gate.id}`)
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

    // Barcha elementlar bo'yicha yurib chiqish
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
    console.log('[SIMULATION] Sxema tekshirilmoqda...');
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
      console.warn('[SIMULATION] Sxemada sikl mavjudligi aniqlandi.');
      errors.push({
        type: 'cycle_detected',
        message: 'Sxemada sikl mavjud'
      })
    }

    console.log(`[SIMULATION] Tekshiruv natijasi: ${errors.length === 0 ? 'Valid' : 'Invalid'}`, { errors });
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
export const runSimulation = (gates: Gate[], wires: Wire[]): SimulationResult => {
  console.log('%c[SIMULATION] `runSimulation` ishga tushirildi.', 'color: #4CAF50; font-weight: bold;', { gates: gates.length, wires: wires.length });
  const engine = new SimulationEngine(gates, wires)
  const validation = engine.validateCircuit()

  // Validation xatoliklari bo'lganda ham simulyatsiya ishlashi kerak
  // Faqat warning berish
  if (!validation.valid) {
    console.warn('[SIMULATION] Sxemada xatoliklar bor, lekin simulyatsiya davom etmoqda:', validation.errors)
  }

  const result = engine.simulate()
  console.log('%c[SIMULATION] `runSimulation` yakunlandi.', 'color: #F44336; font-weight: bold;', { result });
  return {
    success: true,
    ...result,
    warnings: validation.valid ? [] : validation.errors
  }
}
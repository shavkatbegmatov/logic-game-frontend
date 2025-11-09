/**
 * Gate Logic and Configuration
 * Core gate types, logic functions, and factory
 */

import type { Gate, Signal, GateConfig } from '../types/gates'

// Gate Types
export const GateTypes = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  XOR: 'XOR',
  NAND: 'NAND',
  NOR: 'NOR',
  INPUT: 'INPUT',
  OUTPUT: 'OUTPUT',
  CLOCK: 'CLOCK',
  SUBCIRCUIT: 'SUBCIRCUIT'
} as const

export type GateTypeValue = (typeof GateTypes)[keyof typeof GateTypes]

// Gate Logic Functions
type GateLogicFunction = (inputs: number[], value?: number) => Signal | number[]

export const gateLogic: Record<string, GateLogicFunction> = {
  [GateTypes.AND]: (inputs: number[]): Signal => {
    if (inputs.length < 2) return 0
    return inputs.every(i => i === 1) ? 1 : 0
  },

  [GateTypes.OR]: (inputs: number[]): Signal => {
    if (inputs.length < 2) return 0
    return inputs.some(i => i === 1) ? 1 : 0
  },

  [GateTypes.NOT]: (inputs: number[]): Signal => {
    if (inputs.length === 0) return 1
    return inputs[0] === 1 ? 0 : 1
  },

  [GateTypes.XOR]: (inputs: number[]): Signal => {
    if (inputs.length < 2) return 0
    const trueCount = inputs.filter(i => i === 1).length
    return trueCount % 2 === 1 ? 1 : 0
  },

  [GateTypes.NAND]: (inputs: number[]): Signal => {
    if (inputs.length < 2) return 1
    return inputs.every(i => i === 1) ? 0 : 1
  },

  [GateTypes.NOR]: (inputs: number[]): Signal => {
    if (inputs.length < 2) return 1
    return inputs.some(i => i === 1) ? 0 : 1
  },

  [GateTypes.INPUT]: (_: number[], value?: number): Signal => {
    return (value || 0) as Signal
  },

  [GateTypes.OUTPUT]: (inputs: number[]): Signal => {
    return (inputs[0] || 0) as Signal
  },

  [GateTypes.CLOCK]: (_: number[], value?: number): Signal => {
    return (value || 0) as Signal
  },

  [GateTypes.SUBCIRCUIT]: (inputs: number[]): number[] => {
    // Subcircuit logic simulyatsiya paytida alohida bajariladi
    // Bu yerda placeholder
    return inputs
  }
}

// Gate Configurations
export const gateConfigs: Record<string, GateConfig> = {
  [GateTypes.AND]: {
    type: GateTypes.AND,
    name: 'AND Gate',
    description: "Barcha kirishlar 1 bo'lsa, chiqish 1",
    symbol: '&',
    minInputs: 2,
    maxInputs: 2,
    maxOutputs: 1,
    color: '#3B82F6'
  },
  [GateTypes.OR]: {
    type: GateTypes.OR,
    name: 'OR Gate',
    description: "Kamida bitta kirish 1 bo'lsa, chiqish 1",
    symbol: '≥1',
    minInputs: 2,
    maxInputs: 2,
    maxOutputs: 1,
    color: '#10B981'
  },
  [GateTypes.NOT]: {
    type: GateTypes.NOT,
    name: 'NOT Gate',
    description: "Kirishni teskariga o'zgartiradi",
    symbol: '!',
    minInputs: 1,
    maxInputs: 1,
    maxOutputs: 1,
    color: '#EF4444'
  },
  [GateTypes.XOR]: {
    type: GateTypes.XOR,
    name: 'XOR Gate',
    description: "Toq sondagi kirishlar 1 bo'lsa, chiqish 1",
    symbol: '⊕',
    minInputs: 2,
    maxInputs: 2,
    maxOutputs: 1,
    color: '#8B5CF6'
  },
  [GateTypes.NAND]: {
    type: GateTypes.NAND,
    name: 'NAND Gate',
    description: "AND gate'ning teskarisi",
    symbol: '!&',
    minInputs: 2,
    maxInputs: 2,
    maxOutputs: 1,
    color: '#F59E0B'
  },
  [GateTypes.NOR]: {
    type: GateTypes.NOR,
    name: 'NOR Gate',
    description: "OR gate'ning teskarisi",
    symbol: '!≥1',
    minInputs: 2,
    maxInputs: 2,
    maxOutputs: 1,
    color: '#EC4899'
  },
  [GateTypes.INPUT]: {
    type: GateTypes.INPUT,
    name: 'Input Switch',
    description: 'Signal kiritish uchun',
    symbol: 'IN',
    minInputs: 0,
    maxInputs: 0,
    maxOutputs: 1,
    color: '#6B7280'
  },
  [GateTypes.OUTPUT]: {
    type: GateTypes.OUTPUT,
    name: 'Output LED',
    description: "Signalni ko'rsatish uchun",
    symbol: 'OUT',
    minInputs: 1,
    maxInputs: 1,
    maxOutputs: 0,
    color: '#6B7280'
  },
  [GateTypes.CLOCK]: {
    type: GateTypes.CLOCK,
    name: 'Clock Signal',
    description: 'Periodik signal generatori (takt)',
    symbol: 'CLK',
    minInputs: 0,
    maxInputs: 0,
    maxOutputs: 1,
    color: '#0EA5E9'
  },
  [GateTypes.SUBCIRCUIT]: {
    type: GateTypes.SUBCIRCUIT,
    name: 'Subcircuit',
    description: 'Composite gate / Subcircuit',
    symbol: 'SC',
    minInputs: 0,
    maxInputs: 32,
    maxOutputs: 32,
    color: '#7C3AED'
  }
}

// Gate Factory Function
export const createGate = (type: string, x: number, y: number): Gate => {
  const config = gateConfigs[type]
  if (!config) throw new Error(`Unknown gate type: ${type}`)

  return {
    id: Date.now() + Math.random(),
    type,
    x,
    y,
    width: type === GateTypes.NOT ? 60 : 80,
    height: 60,
    inputs: [],
    outputs: [],
    value: 0,
    name: config.name,
    description: config.description,
    color: config.color,
    symbol: config.symbol
  }
}

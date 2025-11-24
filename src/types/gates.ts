/**
 * Gate and Wire Type Definitions
 * Core types for the logic gate simulator
 */

// Gate type enum
export enum GateType {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  XOR = 'XOR',
  NAND = 'NAND',
  NOR = 'NOR',
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  CLOCK = 'CLOCK',
  SUBCIRCUIT = 'SUBCIRCUIT'
}

// Wire interface
export interface Wire {
  id: string | number
  fromGate: string | number
  toGate: string | number
  fromIndex?: number
  toIndex?: number
  signal: 0 | 1
}

// Port interface
export interface Port {
  id?: string
  name: string
  direction: 'input' | 'output'
  index: number
  position?: { x: number; y: number }
  connectedWire?: string | number
  label?: string
  description?: string
}

// Gate interface
export interface Gate {
  id: string | number
  type: GateType | string
  x: number
  y: number
  width: number
  height: number
  inputs: Wire[]
  outputs: Wire[]
  value: number
  name?: string
  description?: string
  color?: string
  symbol?: string

  // Subcircuit-specific properties
  templateId?: string
  inputPorts?: Port[]
  outputPorts?: Port[]
  internalGates?: Gate[]
  internalWires?: Wire[]
}

// Gate configuration
export interface GateConfig {
  type: GateType | string
  name: string
  symbol: string
  description: string
  minInputs?: number
  maxInputs: number
  maxOutputs: number
  color: string
  logic?: (inputs: number[]) => number
  icon?: string
  category?: string
}

// Bounds interface
export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width?: number
  height?: number
  centerX?: number
  centerY?: number
}

// Selection box
export interface SelectionBox {
  x1: number
  y1: number
  x2: number
  y2: number
  width?: number
  height?: number
}

// Coordinates
export type Coordinates = {
  x: number
  y: number
}

// Signal state (0 or 1)
export type Signal = 0 | 1

// Signal map
export type SignalMap = Record<string | number, Signal>

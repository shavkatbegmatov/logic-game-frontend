// Mantiqiy gate klasslari

export const GateTypes = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  XOR: 'XOR',
  NAND: 'NAND',
  NOR: 'NOR',
  INPUT: 'INPUT',
  OUTPUT: 'OUTPUT'
}

// Gate logikalari
export const gateLogic = {
  [GateTypes.AND]: (inputs) => {
    if (inputs.length < 2) return 0
    return inputs.every(i => i === 1) ? 1 : 0
  },

  [GateTypes.OR]: (inputs) => {
    if (inputs.length < 2) return 0
    return inputs.some(i => i === 1) ? 1 : 0
  },

  [GateTypes.NOT]: (inputs) => {
    if (inputs.length === 0) return 1
    return inputs[0] === 1 ? 0 : 1
  },

  [GateTypes.XOR]: (inputs) => {
    if (inputs.length < 2) return 0
    const trueCount = inputs.filter(i => i === 1).length
    return trueCount % 2 === 1 ? 1 : 0
  },

  [GateTypes.NAND]: (inputs) => {
    if (inputs.length < 2) return 1
    return inputs.every(i => i === 1) ? 0 : 1
  },

  [GateTypes.NOR]: (inputs) => {
    if (inputs.length < 2) return 1
    return inputs.some(i => i === 1) ? 0 : 1
  },

  [GateTypes.INPUT]: (_, value) => value || 0,

  [GateTypes.OUTPUT]: (inputs) => inputs[0] || 0
}

// Gate konfiguratsiyalari
export const gateConfigs = {
  [GateTypes.AND]: {
    name: 'AND Gate',
    description: 'Barcha kirishlar 1 bo\'lsa, chiqish 1',
    minInputs: 2,
    maxInputs: 8,
    outputs: 1,
    color: '#3B82F6',
    symbol: '&'
  },
  [GateTypes.OR]: {
    name: 'OR Gate',
    description: 'Kamida bitta kirish 1 bo\'lsa, chiqish 1',
    minInputs: 2,
    maxInputs: 8,
    outputs: 1,
    color: '#10B981',
    symbol: '≥1'
  },
  [GateTypes.NOT]: {
    name: 'NOT Gate',
    description: 'Kirishni teskariga o\'zgartiradi',
    minInputs: 1,
    maxInputs: 1,
    outputs: 1,
    color: '#EF4444',
    symbol: '!'
  },
  [GateTypes.XOR]: {
    name: 'XOR Gate',
    description: 'Toq sondagi kirishlar 1 bo\'lsa, chiqish 1',
    minInputs: 2,
    maxInputs: 8,
    outputs: 1,
    color: '#8B5CF6',
    symbol: '⊕'
  },
  [GateTypes.NAND]: {
    name: 'NAND Gate',
    description: 'AND gate\'ning teskarisi',
    minInputs: 2,
    maxInputs: 8,
    outputs: 1,
    color: '#F59E0B',
    symbol: '!&'
  },
  [GateTypes.NOR]: {
    name: 'NOR Gate',
    description: 'OR gate\'ning teskarisi',
    minInputs: 2,
    maxInputs: 8,
    outputs: 1,
    color: '#EC4899',
    symbol: '!≥1'
  },
  [GateTypes.INPUT]: {
    name: 'Input Switch',
    description: 'Signal kiritish uchun',
    minInputs: 0,
    maxInputs: 0,
    outputs: 1,
    color: '#6B7280',
    symbol: 'IN'
  },
  [GateTypes.OUTPUT]: {
    name: 'Output LED',
    description: 'Signalni ko\'rsatish uchun',
    minInputs: 1,
    maxInputs: 1,
    outputs: 0,
    color: '#6B7280',
    symbol: 'OUT'
  }
}

// Gate yaratish factory
export const createGate = (type, x, y) => {
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
    ...config
  }
}
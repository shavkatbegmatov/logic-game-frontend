import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  // O'yin holati
  currentLevel: 0,
  isPlaying: false,
  isSandboxMode: false,

  // Komponentlar
  gates: [],
  wires: [],
  selectedGate: null,
  selectedWire: null,

  // Signal simulyatsiyasi
  signals: {},
  isSimulating: false,

  // Actions
  addGate: (gate) => set((state) => ({
    gates: [...state.gates, {
      ...gate,
      id: Date.now() + Math.random(),
      inputs: [],
      outputs: [],
      value: 0
    }]
  })),

  removeGate: (gateId) => set((state) => {
    // Gate'ga ulangan simlarni ham o'chirish
    const newWires = state.wires.filter(wire =>
      wire.fromGate !== gateId && wire.toGate !== gateId
    )
    return {
      gates: state.gates.filter(g => g.id !== gateId),
      wires: newWires
    }
  }),

  updateGate: (gateId, updates) => set((state) => ({
    gates: state.gates.map(g =>
      g.id === gateId ? { ...g, ...updates } : g
    )
  })),

  addWire: (wire) => set((state) => ({
    wires: [...state.wires, {
      ...wire,
      id: Date.now() + Math.random(),
      signal: 0
    }]
  })),

  removeWire: (wireId) => set((state) => ({
    wires: state.wires.filter(w => w.id !== wireId)
  })),

  updateWire: (wireId, updates) => set((state) => ({
    wires: state.wires.map(w =>
      w.id === wireId ? { ...w, ...updates } : w
    )
  })),

  selectGate: (gateId) => set({ selectedGate: gateId, selectedWire: null }),
  selectWire: (wireId) => set({ selectedWire: wireId, selectedGate: null }),
  clearSelection: () => set({ selectedGate: null, selectedWire: null }),

  // Simulyatsiya
  startSimulation: () => set({ isSimulating: true }),
  stopSimulation: () => set({ isSimulating: false, signals: {} }),

  updateSignals: (newSignals) => set({ signals: newSignals }),

  // Level boshqaruvi
  setLevel: (level) => set({ currentLevel: level }),
  setSandboxMode: (enabled) => set({ isSandboxMode: enabled }),

  // O'yinni tozalash
  resetCanvas: () => set({
    gates: [],
    wires: [],
    signals: {},
    selectedGate: null,
    selectedWire: null,
    isSimulating: false
  }),

  // Sxemani saqlash/yuklash
  saveCircuit: () => {
    const state = get()
    return {
      gates: state.gates,
      wires: state.wires
    }
  },

  loadCircuit: (circuit) => set({
    gates: circuit.gates || [],
    wires: circuit.wires || [],
    signals: {},
    isSimulating: false
  })
}))

export default useGameStore
import { create } from 'zustand'
import { createSubcircuitFromSelection } from '../engine/subcircuits'

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

  // Multi-selection
  selectedGates: [],
  preSelectedGates: [], // Gates currently inside the selection rectangle
  selectionMode: false, // multi-select mode
  selectionBox: null, // {x1, y1, x2, y2} selection rectangle

  // Subcircuit editing
  editingSubcircuit: null, // Hozirda tahrirlayotgan subcircuit
  subcircuitContext: [], // Breadcrumb navigation [{id, name}, ...]

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

  updateGatePositions: (positions) => set((state) => {
    const updatedGates = state.gates.map(gate => {
      const newPosition = positions.find(p => p.id === gate.id);
      if (newPosition) {
        return { ...gate, ...newPosition };
      }
      return gate;
    });
    return { gates: updatedGates };
  }),

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
  clearSelection: () => set({
    selectedGate: null,
    selectedWire: null,
    selectedGates: [],
    selectionBox: null
  }),

  // Multi-selection methods
  toggleGateSelection: (gateId) => set((state) => {
    const isSelected = state.selectedGates.includes(gateId);
    if (isSelected) {
      return { selectedGates: state.selectedGates.filter(id => id !== gateId) };
    } else {
      return { selectedGates: [...state.selectedGates, gateId] };
    }
  }),

  selectMultipleGates: (gateIds) => set({
    selectedGates: gateIds,
    selectedGate: null,
    selectedWire: null
  }),

  addToSelection: (gateId) => set((state) => ({
    selectedGates: [...state.selectedGates, gateId]
  })),

  removeFromSelection: (gateId) => set((state) => ({
    selectedGates: state.selectedGates.filter(id => id !== gateId)
  })),

  setSelectionMode: (enabled) => set({ selectionMode: enabled }),

  setPreSelectedGates: (gateIds) => set({ preSelectedGates: gateIds }),

  setSelectionBox: (box) => set({ selectionBox: box }),

  getGatesInSelectionBox: (box) => {
    const { gates } = get();
    if (!box) return [];

    const selMinX = Math.min(box.x1, box.x2);
    const selMaxX = Math.max(box.x1, box.x2);
    const selMinY = Math.min(box.y1, box.y2);
    const selMaxY = Math.max(box.y1, box.y2);

    // AABB (Axis-Aligned Bounding Box) intersection detection
    // Gate'ning har qanday qismi selection box bilan kesishsa - select qilish
    return gates.filter(gate => {
      const gateMinX = gate.x;
      const gateMaxX = gate.x + gate.width;
      const gateMinY = gate.y;
      const gateMaxY = gate.y + gate.height;

      // Ikkita to'rtburchak kesishishini tekshirish
      const intersects = !(
        gateMaxX < selMinX || // Gate selection box'dan chap tomonda
        gateMinX > selMaxX || // Gate selection box'dan o'ng tomonda
        gateMaxY < selMinY || // Gate selection box'dan yuqorida
        gateMinY > selMaxY    // Gate selection box'dan pastda
      );

      return intersects;
    });
  },

  // Subcircuit creation from selection
  createSubcircuitFromSelected: (name, description) => {
    const { selectedGates, gates, wires } = get();

    if (selectedGates.length === 0) {
      console.error('Gate\'lar tanlanmagan');
      return null;
    }

    const selectedGateObjects = gates.filter(g => selectedGates.includes(g.id));

    try {
      const result = createSubcircuitFromSelection(selectedGateObjects, wires, name);

      // Template yaratilgandan so'ng, selected gate'larni o'chirib,
      // o'rniga subcircuit instance qo'yish mumkin

      return result;
    } catch (error) {
      console.error('Subcircuit yaratishda xato:', error);
      return null;
    }
  },

  // Subcircuit editing
  enterSubcircuit: (subcircuitGate) => set((state) => ({
    editingSubcircuit: subcircuitGate,
    subcircuitContext: [...state.subcircuitContext, {
      id: subcircuitGate.id,
      name: subcircuitGate.name
    }],
    // Subcircuit ichidagi gate va wire'larni yuklash
    gates: subcircuitGate.internalGates || [],
    wires: subcircuitGate.internalWires || [],
    selectedGate: null,
    selectedWire: null,
    selectedGates: []
  })),

  exitSubcircuit: () => set((state) => {
    // Agar context bo'sh bo'lsa, asosiy canvas'ga qaytish
    if (state.subcircuitContext.length <= 1) {
      return {
        editingSubcircuit: null,
        subcircuitContext: [],
        // Asosiy circuit'ni qayta yuklash kerak
        selectedGate: null,
        selectedWire: null,
        selectedGates: []
      };
    }

    // Aks holda bir daraja yuqoriga chiqish
    const newContext = state.subcircuitContext.slice(0, -1);
    const parentSubcircuit = newContext[newContext.length - 1];

    return {
      subcircuitContext: newContext,
      editingSubcircuit: parentSubcircuit,
      // Parent subcircuit gate va wire'larini yuklash kerak
      selectedGate: null,
      selectedWire: null,
      selectedGates: []
    };
  }),

  isEditingSubcircuit: () => {
    const { editingSubcircuit } = get();
    return editingSubcircuit !== null;
  },

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
    selectedGates: [],
    selectionBox: null,
    selectionMode: false,
    editingSubcircuit: null,
    subcircuitContext: [],
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
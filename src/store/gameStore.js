};

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

  // Clipboard
  clipboard: [],

  // Actions
  addGate: (gate) => {
    logAction('addGate', { gate });
    set((state) => ({
      gates: [...state.gates, {
        ...gate,
        id: Date.now() + Math.random(),
        inputs: [],
        outputs: [],
        value: 0
      }]
    }));
  },

  removeGate: (gateId) => {
    logAction('removeGate', { gateId });
    set((state) => {
      // Gate'ga ulangan simlarni ham o'chirish
      const newWires = state.wires.filter(wire =>
        wire.fromGate !== gateId && wire.toGate !== gateId
      );
      return {
        gates: state.gates.filter(g => g.id !== gateId),
        wires: newWires
      };
    });
  },

  updateGate: (gateId, updates) => {
    logAction('updateGate', { gateId, updates });
    set((state) => ({
      gates: state.gates.map(g =>
        g.id === gateId ? { ...g, ...updates } : g
      )
    }));
  },

  updateGatePositions: (positions) => {
    logAction('updateGatePositions', { positions });
    set((state) => {
      const updatedGates = state.gates.map(gate => {
        const newPosition = positions.find(p => p.id === gate.id);
        if (newPosition) {
          return { ...gate, ...newPosition };
        }
        return gate;
      });
      return { gates: updatedGates };
    });
  },

  addWire: (wire) => {
    logAction('addWire', { wire });
    set((state) => ({
      wires: [...state.wires, {
        ...wire,
        id: Date.now() + Math.random(),
        signal: 0
      }]
    }));
  },

  removeWire: (wireId) => {
    logAction('removeWire', { wireId });
    set((state) => ({
      wires: state.wires.filter(w => w.id !== wireId)
    }));
  },

  updateWire: (wireId, updates) => {
    logAction('updateWire', { wireId, updates });
    set((state) => ({
      wires: state.wires.map(w =>
        w.id === wireId ? { ...w, ...updates } : w
      )
    }));
  },

  selectGate: (gateId) => {
    logAction('selectGate', { gateId });
    set({ selectedGate: gateId, selectedWire: null });
  },
  selectWire: (wireId) => {
    logAction('selectWire', { wireId });
    set({ selectedWire: wireId, selectedGate: null });
  },
  clearSelection: () => {
    logAction('clearSelection');
    set({
      selectedGate: null,
      selectedWire: null,
      selectedGates: [],
      selectionBox: null
    });
  },

  // Clipboard & Delete Actions
  copySelection: () => {
    const { selectedGates, gates } = get();
    if (selectedGates.length === 0) return;

    const gatesToCopy = gates.filter(g => selectedGates.includes(g.id));
    logAction('copySelection', { count: gatesToCopy.length });
    set({ clipboard: gatesToCopy });
  },

  pasteSelection: () => {
    const { clipboard, gates } = get();
    if (clipboard.length === 0) return;

    logAction('pasteSelection', { count: clipboard.length });

    // Calculate center of clipboard items to paste relative to mouse or center
    // For simplicity, we just offset them by 20px
    const newGates = clipboard.map(gate => ({
      ...gate,
      id: Date.now() + Math.random(), // New ID
      x: gate.x + 20,
      y: gate.y + 20,
      inputs: [], // Reset connections
      outputs: [],
      value: 0
    }));

    set({
      gates: [...gates, ...newGates],
      selectedGates: newGates.map(g => g.id), // Select newly pasted items
      selectedGate: null
    });
  },

  deleteSelection: () => {
    const { selectedGates, selectedGate, selectedWire, wires, gates } = get();
    logAction('deleteSelection');

    let gatesToDelete = [...selectedGates];
    if (selectedGate) gatesToDelete.push(selectedGate);

    // Filter out wires connected to deleted gates
    const newWires = wires.filter(w =>
      !gatesToDelete.includes(w.fromGate) &&
      !gatesToDelete.includes(w.toGate) &&
      w.id !== selectedWire
    );

    const newGates = gates.filter(g => !gatesToDelete.includes(g.id));

    set({
      gates: newGates,
      wires: newWires,
      selectedGate: null,
      selectedWire: null,
      selectedGates: []
    });
  },

  // Multi-selection methods
  toggleGateSelection: (gateId) => {
    logAction('toggleGateSelection', { gateId });
    set((state) => {
      const isSelected = state.selectedGates.includes(gateId);
      if (isSelected) {
        return { selectedGates: state.selectedGates.filter(id => id !== gateId) };
      } else {
        return { selectedGates: [...state.selectedGates, gateId] };
      }
    });
  },

  selectMultipleGates: (gateIds) => {
    logAction('selectMultipleGates', { gateIds });
    set({
      selectedGates: gateIds,
      selectedGate: null,
      selectedWire: null
    });
  },

  addToSelection: (gateId) => {
    logAction('addToSelection', { gateId });
    set((state) => ({
      selectedGates: [...state.selectedGates, gateId]
    }));
  },

  removeFromSelection: (gateId) => {
    logAction('removeFromSelection', { gateId });
    set((state) => ({
      selectedGates: state.selectedGates.filter(id => id !== gateId)
    }));
  },

  setSelectionMode: (enabled) => {
    logAction('setSelectionMode', { enabled });
    set({ selectionMode: enabled });
  },

  setPreSelectedGates: (gateIds) => {
    set({ preSelectedGates: gateIds });
  },

  setSelectionBox: (box) => {
    logAction('setSelectionBox', { box });
    set({ selectionBox: box });
  },

  getGatesInSelectionBox: (box) => {
    const { gates } = get();
    if (!box) return [];

    const selMinX = Math.min(box.x1, box.x2);
    const selMaxX = Math.max(box.x1, box.x2);
    const selMinY = Math.min(box.y1, box.y2);
    const selMaxY = Math.max(box.y1, box.y2);

    return gates.filter(gate => {
      const gateMinX = gate.x;
      const gateMaxX = gate.x + gate.width;
      const gateMinY = gate.y;
      const gateMaxY = gate.y + gate.height;

      return !(
        gateMaxX < selMinX ||
        gateMinX > selMaxX ||
        gateMaxY < selMinY ||
        gateMinY > selMaxY
      );
    });
  },

  // Subcircuit creation from selection
  createSubcircuitFromSelected: (name, description) => {
    logAction('createSubcircuitFromSelected', { name, description });
    const { selectedGates, gates, wires } = get();

    if (selectedGates.length === 0) {
      console.error('[STATE] Gate\'lar tanlanmagan');
      return null;
    }

    const selectedGateObjects = gates.filter(g => selectedGates.includes(g.id));

    try {
      const result = createSubcircuitFromSelection(selectedGateObjects, wires, name);
      logAction('createSubcircuitFromSelected -> success', { result });
      return result;
    } catch (error) {
      console.error('[STATE] Subcircuit yaratishda xato:', error);
      return null;
    }
  },

  // Subcircuit editing
  enterSubcircuit: (subcircuitGate) => {
    logAction('enterSubcircuit', { subcircuitGate });
    set((state) => ({
      editingSubcircuit: subcircuitGate,
      subcircuitContext: [...state.subcircuitContext, {
        id: subcircuitGate.id,
        name: subcircuitGate.name
      }],
      gates: subcircuitGate.internalGates || [],
      wires: subcircuitGate.internalWires || [],
      selectedGate: null,
      selectedWire: null,
      selectedGates: []
    }));
  },

  exitSubcircuit: () => {
    logAction('exitSubcircuit');
    set((state) => {
      if (state.subcircuitContext.length <= 1) {
        return {
          editingSubcircuit: null,
          subcircuitContext: [],
          selectedGate: null,
          selectedWire: null,
          selectedGates: []
        };
      }

      const newContext = state.subcircuitContext.slice(0, -1);
      const parentSubcircuit = newContext[newContext.length - 1];

      return {
        subcircuitContext: newContext,
        editingSubcircuit: parentSubcircuit,
        selectedGate: null,
        selectedWire: null,
        selectedGates: []
      };
    });
  },

  isEditingSubcircuit: () => {
    const { editingSubcircuit } = get();
    return editingSubcircuit !== null;
  },

  // Simulyatsiya
  startSimulation: () => {
    logAction('startSimulation');
    set({ isSimulating: true });
  },
  stopSimulation: () => {
    logAction('stopSimulation');
    set({ isSimulating: false, signals: {} });
  },

  updateSignals: (newSignals) => {
    set({ signals: newSignals });
  },

  // Level boshqaruvi
  setLevel: (level) => {
    logAction('setLevel', { level });
    set({ currentLevel: level });
  },
  setSandboxMode: (enabled) => {
    logAction('setSandboxMode', { enabled });
    set({ isSandboxMode: enabled });
  },

  // O'yinni tozalash
  resetCanvas: () => {
    logAction('resetCanvas');
    set({
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
    });
  },

  // Sxemani saqlash/yuklash
  saveCircuit: () => {
    logAction('saveCircuit');
    const state = get();
    return {
      gates: state.gates,
      wires: state.wires
    };
  },

  loadCircuit: (circuit) => {
    logAction('loadCircuit', { circuit });
    set({
      gates: circuit.gates || [],
      wires: circuit.wires || [],
      signals: {},
      isSimulating: false
    });
  }
}));

export default useGameStore;
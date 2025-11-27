/**
 * Game Store
 * Asosiy o'yin holati - gates, wires, selection
 */

import { create } from 'zustand'
import { createSubcircuitFromSelection } from '../engine/subcircuits'
import type { Gate, Wire, SelectionBox, SignalMap } from '@/types'
import type { BreadcrumbItem } from '@/types'

// Loglar uchun yordamchi funksiya
const logAction = (actionName: string, ...args: any[]) => {
  console.log(`%c[STATE] Action: ${actionName}`, 'color: #2196F3; font-weight: bold;', ...args)
}

interface GameState {
  // O'yin holati
  currentLevel: number
  isPlaying: boolean
  isSandboxMode: boolean

  // Komponentlar
  gates: Gate[]
  wires: Wire[]
  selectedGate: string | number | null
  selectedWire: string | number | null

  // Multi-selection
  selectedGates: (string | number)[]
  preSelectedGates: (string | number)[]
  selectionMode: boolean
  selectionBox: SelectionBox | null

  // Subcircuit editing
  editingSubcircuit: any | null
  subcircuitContext: BreadcrumbItem[]

  // Signal simulyatsiyasi
  signals: SignalMap
  isSimulating: boolean

  // Clipboard
  clipboard: { gates: Gate[]; wires: Wire[] } | null

  // Actions
  addGate: (gate: Gate) => void
  removeGate: (gateId: string | number) => void
  updateGate: (gateId: string | number, updates: Partial<Gate>) => void
  updateGatePositions: (positions: Array<{ id: string | number; x: number; y: number }>) => void
  addWire: (wire: Omit<Wire, 'id' | 'signal'>) => void
  removeWire: (wireId: string | number) => void
  updateWire: (wireId: string | number, updates: Partial<Wire>) => void
  selectGate: (gateId: string | number) => void
  selectWire: (wireId: string | number) => void
  clearSelection: () => void
  toggleGateSelection: (gateId: string | number) => void
  selectMultipleGates: (gateIds: (string | number)[]) => void
  addToSelection: (gateId: string | number) => void
  removeFromSelection: (gateId: string | number) => void
  setSelectionMode: (enabled: boolean) => void
  setPreSelectedGates: (gateIds: (string | number)[]) => void
  setSelectionBox: (box: SelectionBox | null) => void
  getGatesInSelectionBox: (box: SelectionBox | null) => Gate[]
  createSubcircuitFromSelected: (name: string, description?: string) => any
  enterSubcircuit: (subcircuitGate: any) => void
  exitSubcircuit: () => void
  isEditingSubcircuit: () => boolean
  startSimulation: () => void
  stopSimulation: () => void
  updateSignals: (newSignals: SignalMap) => void
  setLevel: (level: number) => void
  setSandboxMode: (enabled: boolean) => void
  resetCanvas: () => void
  saveCircuit: () => { gates: Gate[]; wires: Wire[] }
  loadCircuit: (circuit: { gates: Gate[]; wires: Wire[] }) => void
  copySelection: () => void
  pasteSelection: () => void
  deleteSelection: () => void
}

const useGameStore = create<GameState>((set, get) => ({
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
  clipboard: null,

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
    // logAction('setPreSelectedGates', { gateIds }); // This is too noisy during selection
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
        name: subcircuitGate.name,
        type: 'subcircuit' as const
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
    // Bu juda tez-tez chaqirilishi mumkin, shuning uchun logni o'chirish yoki shartli qilish mumkin
    // logAction('updateSignals', { newSignals });
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
  },

  // Clipboard operations
  copySelection: () => {
    const { selectedGates, gates, wires } = get();
    if (selectedGates.length === 0) return;

    const selectedGateObjects = gates.filter(g => selectedGates.includes(g.id));
    const selectedWireObjects = wires.filter(w =>
      selectedGates.includes(w.fromGate!) && selectedGates.includes(w.toGate!)
    );

    set({
      clipboard: {
        gates: selectedGateObjects,
        wires: selectedWireObjects
      }
    });

    logAction('copySelection', { gates: selectedGateObjects.length, wires: selectedWireObjects.length });
  },

  pasteSelection: () => {
    const { clipboard } = get();
    if (!clipboard?.gates?.length) return;

    const idMap: Record<string | number, number> = {};
    const newGates = clipboard.gates.map(g => {
      const newId = Date.now() + Math.random();
      idMap[g.id] = newId;
      return { ...g, id: newId, x: g.x + 50, y: g.y + 50 };
    });

    const newWires = clipboard.wires.map(w => ({
      ...w,
      id: Date.now() + Math.random(),
      fromGate: idMap[w.fromGate!],
      toGate: idMap[w.toGate!]
    }));

    set((state) => ({
      gates: [...state.gates, ...newGates],
      wires: [...state.wires, ...newWires],
      selectedGates: newGates.map(g => g.id),
      selectedGate: null
    }));

    logAction('pasteSelection', { gates: newGates.length, wires: newWires.length });
  },

  deleteSelection: () => {
    const { selectedGates, selectedGate, selectedWire, gates, wires } = get();
    logAction('deleteSelection', { selectedGates, selectedGate, selectedWire });

    // Wire tanlangan bo'lsa, faqat uni o'chirish
    if (selectedWire) {
      set({
        wires: wires.filter(w => w.id !== selectedWire),
        selectedWire: null
      });
      return;
    }

    // Gate'larni o'chirish
    let gatesToDelete = [...selectedGates];
    if (selectedGate && !gatesToDelete.includes(selectedGate)) {
      gatesToDelete.push(selectedGate);
    }

    if (gatesToDelete.length === 0) return;

    // O'chirilgan gate'larga ulangan wire'larni ham o'chirish
    const newWires = wires.filter(w =>
      !gatesToDelete.includes(w.fromGate!) &&
      !gatesToDelete.includes(w.toGate!)
    );

    const newGates = gates.filter(g => !gatesToDelete.includes(g.id));

    set({
      gates: newGates,
      wires: newWires,
      selectedGate: null,
      selectedWire: null,
      selectedGates: []
    });
  }
}));

export default useGameStore;

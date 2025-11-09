# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a visual logic gate simulator built with React, Vite, and Konva. Users can create and simulate digital circuits by placing gates (AND, OR, NOT, etc.) on a canvas, connecting them with wires, and combining them into reusable subcircuits.

## Development Commands

- **Install dependencies**: `npm install`
- **Start dev server**: `npm run dev` (runs on port 3000, auto-opens browser)
- **Build for production**: `npm run build` (outputs to `dist/`)
- **Preview production build**: `npm run preview`
- **Testing**: Currently placeholder (`npm test` exits with error). Vitest + React Testing Library are planned.

## Architecture

### State Management (Zustand)

The application uses **5 main Zustand stores**, all in `src/store/`:

1. **gameStore.js** - Main circuit state
   - Gates, wires, selection state (single & multi-select)
   - Simulation signals and running state
   - Subcircuit navigation context (breadcrumb trail when editing nested circuits)

2. **subcircuitStore.js** - Subcircuit library & templates
   - Uses `persist` middleware for localStorage
   - Manages `SubcircuitManager` instance (from `src/engine/subcircuits.js`)
   - Global templates (built-in) vs custom templates (user-created)
   - Categories: logic, arithmetic, memory, io, custom

3. **subcircuitEditorStore.js** - Editor state
   - Uses `immer` middleware for immutable updates
   - Tracks editing mode (`'create'` | `'edit'` | `null`)
   - Creation methods: `'quick'`, `'wizard'`, `'template'`, `'visual-boundary'`
   - Internal circuit state (gates/wires being edited inside a subcircuit)
   - Undo/redo history for internal edits

4. **userPreferencesStore.js** - User settings
   - Editor mode preference (split-view, floating-panel, full-modal, inline-canvas)
   - Keyboard shortcuts
   - Sound effects toggle

5. **achievementStore.jsx** - Game stats & achievements
   - Track user progress, unlock achievements

### Simulation Engine (`src/engine/`)

- **simulation.js**: `SimulationEngine` class
  - Topological sort of gates to determine evaluation order
  - Evaluates gates in dependency order
  - Propagates signals through wires
  - Calls `simulateSubcircuit()` for SUBCIRCUIT type gates

- **subcircuitSimulation.js**: Handles nested circuit simulation
  - Maps parent inputs to internal circuit
  - Recursively simulates internal gates
  - Maps internal outputs back to parent

- **subcircuits.js**: Core subcircuit classes
  - `SubcircuitTemplate`: Schema for reusable subcircuits (name, icon, category, inputs, outputs, internalCircuit)
  - `SubcircuitManager`: Global registry of templates
  - `createSubcircuitFromSelection()`: Extracts selected gates/wires into new template

- **validation.js**: Input validation
  - `validateTemplate()`, `validateSelection()`, `validateGate()`, `validateWire()`
  - `sanitizeGates()`, `sanitizeWires()` - clean/normalize data
  - `validateConnectivity()` - ensure circuits are properly connected

- **portMapping.js**: I/O port management
  - `createPortMapping()` - maps external ports to internal circuit
  - `optimizePorts()` - determines optimal port positions
  - `PortDirection` enum (LEFT, RIGHT, TOP, BOTTOM)

- **gates.js**: Gate definitions
  - `GateTypes` enum (AND, OR, NOT, XOR, NAND, NOR, INPUT, OUTPUT, CLOCK, SUBCIRCUIT)
  - `gateLogic` - boolean logic functions for each gate type
  - `gateConfigs` - visual config (color, symbol, min/max inputs)
  - `createGate()` - factory function

### Canvas & Rendering (`src/components/`)

**Canvas.jsx** - Main Konva Stage wrapper
- Uses `react-konva` for 2D canvas rendering
- Manages wire dragging, multi-select rectangle, gate dragging
- Keyboard shortcuts (Ctrl+S = create subcircuit, Delete = remove, etc.)
- Lazy-loads creation flows and editor modes (DOM components)
- Renders: `PCBGateComponent`, `SpaceWireComponent`, `SubcircuitEditorManager`

**SubcircuitEditor/** - Multi-mode subcircuit editing system
- **SubcircuitEditorManager.jsx**: Router for Konva-based editor modes
  - Renders `InlineCanvasMode`, `FloatingPanelMode`, or `FullModalMode` inside Konva Stage
  - Lazy-loads `SplitViewMode` (DOM-based, rendered outside Konva)

- **modes/** - 4 editor UI modes (user can switch via preferences):
  - `InlineCanvasMode.jsx` - Edit subcircuit directly on main canvas
  - `FloatingPanelMode.jsx` - Floating Konva panel overlay
  - `FullModalMode.jsx` - Full-screen modal with separate Konva stage
  - `SplitViewMode.jsx` - Side-by-side split view (DOM-based)

- **creation/** - 4 creation flows (user picks via preferences):
  - `QuickCreate.jsx` - Fast creation with minimal input (just name)
  - `WizardCreate.jsx` - Step-by-step guided creation
  - `TemplateCreate.jsx` - Create from existing template
  - `VisualBoundaryCreate.jsx` - Draw visual boundary on canvas first

- **effects/** - Audio & visual effects
  - `SoundManager.jsx` - `soundService` singleton (uses Howler.js)
  - `AnimationController.jsx` - Manages transitions between editor modes

- **ui/** - Editor UI components
  - `EditorToolbar.jsx`, `EditorModeSelector.jsx`, `BreadcrumbNav.jsx`

**Gates/** - Gate rendering components
- `PCBGateComponent.jsx` - Main gate renderer (PCB-style visual theme)
- `PCBSubcircuitComponent.jsx` - Renders SUBCIRCUIT type gates
- `GateComponent.jsx` - (possibly legacy/alternate style)

**Wires/** - Wire rendering
- `SpaceWireComponent.jsx` - Animated wire with space theme
- `WireComponent.jsx` - (possibly legacy/alternate style)

### Theming

- **Space theme**: `src/constants/spaceTheme.js`, `SpaceBackground.jsx` (animated stars/nebula)
- **PCB theme**: Gates rendered as PCB-style components with green/copper aesthetic
- **Tailwind config**: Custom colors for gate types (`gate-and`, `gate-or`, etc.), wire states, animations

### Konva vs DOM Separation

**Critical architecture pattern**:
- Konva components (react-konva) must render inside `<Stage>` → `<Layer>`
- DOM components (HTML/Tailwind) render outside `<Stage>` (portals, overlays, modals)
- **SubcircuitEditorManager** renders **only Konva modes** (`InlineCanvasMode`, `FloatingPanelMode`, `FullModalMode`)
- **Canvas** renders **DOM-based modes** (`SplitViewMode`) and creation flows (`QuickCreate`, etc.) via lazy loading

### Key Patterns

1. **Multi-select**:
   - `selectedGates` (confirmed selection) vs `preSelectedGates` (inside selection rectangle)
   - Selection rectangle drawn on Konva layer, updates `preSelectedGates` in real-time

2. **Subcircuit nesting**:
   - `editingSubcircuit` in `subcircuitEditorStore` tracks current template being edited
   - `subcircuitContext` in `gameStore` maintains breadcrumb trail for nested editing
   - Double-click SUBCIRCUIT gate → `startEditing('edit', template)` → loads `internalGates`/`internalWires`

3. **Signal propagation**:
   - `runSimulation(gates, wires)` creates `SimulationEngine` instance
   - Returns `{ signals, gateOutputs }` object
   - Canvas rerenders with updated signal states on wires (green = active, gray = inactive)

4. **Undo/Redo**:
   - `subcircuitEditorStore` maintains `history` object with `past`, `present`, `future` arrays
   - Only applies to internal subcircuit edits, not main canvas

## Coding Conventions

- **Functional React** with hooks (no class components)
- **2-space indentation**
- **Component naming**: PascalCase (`GateCanvas.jsx`)
- **Hooks**: camelCase with `use` prefix (`useGameStore`)
- **Stores**: `<domain>Store` pattern
- **Logging**: Styled console logs with color-coded prefixes (`%c[CANVAS]`, `%c[STATE]`, `%c[SIMULATION]`)

## Commit Style

Use **Conventional Commits** prefixes seen in git log:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code restructuring
- Imperative mood, <72 chars summary
- Add context in body for behavior changes

## Known Patterns to Follow

1. **Always validate subcircuit data** with `validation.js` functions before creating templates
2. **Use portMapping.js** for consistent I/O port positioning
3. **Separate Konva rendering from DOM** - never mix `<Layer>` children with `<div>` children
4. **Update Zustand with immer** in `subcircuitEditorStore` to avoid mutation bugs
5. **Lazy-load heavy modals** to improve initial load time
6. **Play sounds via soundService** when `enableSounds` preference is true

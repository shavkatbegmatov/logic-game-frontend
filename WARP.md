# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Logic Gate Simulator** built with React, TypeScript, Vite, and Konva. It's an educational game that allows users to build and simulate digital logic circuits using visual logic gates, wires, and subcircuits. The application features a space-themed UI with animated backgrounds, particle effects, and achievements.

## Development Commands

### Development Server
```powershell
npm run dev
```
Starts Vite dev server on port 3000 and opens browser automatically.

### Build
```powershell
npm run build
```
Production build using Vite.

### Preview Build
```powershell
npm run preview
```
Preview production build locally.

### Type Checking
```powershell
npx tsc -p tsconfig.json --noEmit
```
Run TypeScript type checking without emitting files. This is the primary validation command used in CI.

### Installing Dependencies
```powershell
npm install
# or for CI environments
npm ci
```

## Architecture Overview

### State Management (Zustand)

The application uses **Zustand** for state management with multiple specialized stores:

1. **gameStore.ts** - Main application state
   - Gates, wires, selection state
   - Multi-selection with selection box
   - Signal simulation state
   - Canvas state (sandbox mode, current level)
   - All gate/wire CRUD operations

2. **subcircuitStore.ts** - Subcircuit template management
   - Template library (global and custom)
   - Template CRUD operations
   - SubcircuitManager instance
   - Category filtering and search
   - Import/export functionality
   - Uses Zustand persist middleware

3. **subcircuitEditorStore.ts** - Subcircuit editor state
   - Editor mode ('create' | 'edit' | 'preview')
   - Creation flow state ('quick' | 'wizard' | 'template' | 'visual')
   - Port mapping and validation
   - Internal circuit editing
   - Undo/redo history with immer middleware
   - Preview and simulation state

4. **userPreferencesStore.ts** - User settings and preferences
   - Keyboard shortcuts
   - Editor mode preferences (inline, floating, fullModal, splitView)
   - Sound settings
   - Visual preferences

5. **achievementStore.tsx** - Gamification
   - Achievement tracking and unlocking
   - User statistics (gates placed, circuits created, etc.)

### Simulation Engine

Located in `src/engine/`:

- **simulation.ts** - Core simulation engine
  - `SimulationEngine` class handles circuit simulation
  - Topological sorting for dependency resolution
  - Signal propagation through gates and wires
  - Handles both simple gates and subcircuits
  - Cycle detection for feedback loops

- **gates.ts** - Gate logic and configuration
  - Gate type definitions (AND, OR, NOT, XOR, NAND, NOR, INPUT, OUTPUT, CLOCK, SUBCIRCUIT)
  - Logic functions for each gate type
  - Gate configurations (colors, symbols, descriptions)
  - Gate factory function

- **subcircuits.ts** - Subcircuit system
  - `SubcircuitTemplate` class for template management
  - `SubcircuitManager` for organizing templates
  - Validation and port mapping
  - Template serialization and cloning

- **validation.ts** - Circuit validation
  - Template validation
  - Connectivity validation
  - Port validation
  - Bounds calculation

- **portMapping.ts** - Port mapping utilities
  - Automatic port detection for subcircuits
  - External connection mapping

### Component Architecture

**Main Components:**
- `App.tsx` - Root layout with Sidebar, Toolbar, Canvas, and SpaceBackground
- `Canvas/Canvas.tsx` - Main canvas using react-konva for rendering
  - Handles gate drag-and-drop from sidebar
  - Multi-selection with rectangle selection box
  - Wire drawing between gates
  - Gate and wire rendering
  - Keyboard shortcuts

**Specialized Components:**
- `Gates/` - Gate rendering components
  - `PCBGateComponent.tsx` - Individual gate rendering with PCB theme
  - `PCBSubcircuitComponent.tsx` - Subcircuit gate rendering

- `SubcircuitEditor/` - Complex subcircuit editing system
  - `creation/` - Different creation flows (QuickCreate, WizardCreate, TemplateCreate, VisualBoundaryCreate)
  - `modes/` - Editor display modes (FloatingPanelMode, FullModalMode, SplitViewMode)
  - `ui/` - Editor UI components
  - `effects/` - Sound and visual effects

- `Wires/` - Wire connection rendering
- `Sidebar/` - Gate palette with SubcircuitPanel
- `Toolbar/` - Main toolbar actions
- `Effects/` - Particle effects for gate interactions
- `SpaceBackground/` - Animated space-themed background

### Type System

All types are centralized in `src/types/`:
- `gates.ts` - Gate, Wire, Port, GateConfig, SelectionBox, SignalMap
- `subcircuit.ts` - SubcircuitTemplateConfig, ValidationResult, PortMapping
- `stores.ts` - Store-specific types
- `utils.ts` - Utility types
- `index.ts` - Barrel export for all types

**Import types using**: `import type { Gate, Wire, Port } from '@/types'`

### Key Architecture Patterns

1. **Lazy Loading** - SubcircuitEditor components are lazy loaded using `React.lazy()` to improve initial load time

2. **Simulation Flow**:
   - Gates are topologically sorted based on dependencies
   - Signal propagation happens in order from inputs to outputs
   - Subcircuits are simulated recursively
   - Special handling for INPUT, OUTPUT, and CLOCK gates

3. **Subcircuit Creation**:
   - User selects gates on canvas
   - Triggers creation flow with `Ctrl+G` (or configured shortcut)
   - Multiple creation methods supported (quick, wizard, visual boundary, template)
   - Auto-detects external connections to create ports
   - Validates and creates SubcircuitTemplate
   - Template can be instantiated as gates on canvas

4. **Multi-Selection**:
   - Click+drag on canvas creates selection box
   - Shift+click adds to selection
   - Selected gates can be moved together
   - Selected gates can be grouped into subcircuit

5. **Path Aliases**:
   - `@/` maps to `./src/` (configured in tsconfig.json)
   - Use `@/types`, `@/store`, `@/engine`, etc.

## TypeScript Configuration

- **Strict mode is OFF** (intentionally relaxed for incremental migration)
- JS files are allowed (`allowJs: true`) for gradual migration
- Bundler module resolution
- Path mapping: `@/*` → `./src/*`
- Target: ES2020

## Styling

- **Tailwind CSS** v4 for styling
- Custom gate colors defined in tailwind.config.js
- Space/cosmic theme with dark backgrounds
- Custom animations for signal pulse effects

## Testing

⚠️ **No test framework is currently configured.** The package.json test script shows: `"echo \"Error: no test specified\" && exit 1"`

To add tests, you would need to install and configure a testing framework (e.g., Vitest, Jest, React Testing Library).

## Git Workflow

The project uses GitHub Actions CI on all branches:
- Runs type checking: `npx tsc -p tsconfig.json --noEmit`
- Runs build: `npm run build`

## Important Conventions

1. **Logging** - Use colored console logs with context:
   - `[STATE]` - State changes (blue)
   - `[SIMULATION]` - Simulation engine (varies)
   - `[CANVAS]` - Canvas operations (purple)
   
2. **IDs** - Use `Date.now() + Math.random()` for gate/wire IDs or nanoid for templates

3. **Gate Properties**:
   - All gates have: id, type, x, y, width, height, inputs, outputs, value
   - Subcircuit gates additionally have: templateId, inputPorts, outputPorts, internalGates, internalWires

4. **Signal Values** - Signals are binary: `0 | 1` (type: Signal)

5. **Store Actions** - All state mutations should go through store actions, never mutate state directly

6. **Subcircuit Validation** - Always validate templates before creating instances

7. **Language** - Code comments and logs are primarily in Uzbek (Uzbek Latin script)

## Keyboard Shortcuts (Default)

Shortcuts are configurable via userPreferencesStore:
- `Ctrl+G` - Create subcircuit from selection
- `Ctrl+A` - Select all gates
- `Escape` - Clear selection / Exit editor
- `Delete` - Remove selected gates/wires

## Sound System

The application has a sound manager (`SoundManager.ts`) using Howler.js for audio feedback:
- Gate placement sounds
- Wire connection sounds
- Achievement unlocks
- Can be disabled in user preferences

## Known Patterns

1. **Multi-gate Operations**: When operating on multiple gates, store their IDs in `selectedGates` array and perform batch operations

2. **Wire Creation**: Wires connect gates via `fromGate`, `toGate`, with optional `fromIndex`/`toIndex` for subcircuits with multiple ports

3. **Subcircuit Ports**: Internal wires that cross the boundary become ports (auto-detected during creation)

4. **Signal Simulation**: Run on interval when `isSimulating` is true, otherwise compute on-demand

5. **Canvas Interactions**: react-konva Stage/Layer for rendering, mouse events for interactions

## Performance Considerations

- Subcircuit templates cache validation results for 5 seconds
- Simulation runs at 100ms intervals when active
- Large circuits with many gates/wires may impact performance
- Consider limiting recursion depth for nested subcircuits

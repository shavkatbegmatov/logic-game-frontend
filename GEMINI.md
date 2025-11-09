# GEMINI.md

## Project Overview

This is a logic gate simulation game built as a web application. The goal of the game is to solve puzzles by connecting different logic gates to achieve a desired output.

The frontend is built using **React** and **Vite**. The simulation canvas is rendered using **React Konva**. State management is handled by **Zustand**, and styling is done with **Tailwind CSS**.

The core logic for the simulation is located in `src/engine/simulation.js`, which includes a topological sort for gate evaluation and cycle detection. The main application component is `src/App.jsx`, which lays out the `Sidebar`, `Toolbar`, and `Canvas` components.

## Building and Running

### Prerequisites

- Node.js and npm (or a compatible package manager)

### Key Commands

The following commands are available in `package.json`:

-   **Install dependencies:**
    ```bash
    npm install
    ```

-   **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the application on `http://localhost:3000`.

-   **Build for production:**
    ```bash
    npm run build
    ```
    This will create a `dist` folder with the production-ready files.

-   **Preview the production build:**
    ```bash
    npm run preview
    ```

-   **Testing:**
    There are currently no tests configured for this project.

## Development Conventions

-   **Framework:** The project uses React with functional components and hooks.
-   **State Management:** Global application state is managed with Zustand. The store is defined in `src/store/gameStore.js`.
-   **Styling:** Tailwind CSS is used for styling. The configuration can be found in `tailwind.config.js`.
-   **Component Structure:** Components are organized by feature under the `src/components` directory (e.g., `Canvas`, `Gates`, `Sidebar`).
-   **Core Logic:** The simulation engine is separated from the UI components and resides in `src/engine`.

## Subcircuit Creation Flow (Ctrl+G)

This section details the process of creating a subcircuit from a selection of gates on the main canvas.

1.  **Trigger**: The user selects one or more gates and presses the `Ctrl+G` shortcut.

2.  **Keyboard Handler (`src/components/Canvas/Canvas.jsx`)**:
    *   A global `keydown` event listener in `Canvas.jsx` captures the shortcut.
    *   It retrieves the `shortcuts` configuration from `useUserPreferencesStore`.
    *   It gathers the `selectedGates` from `useGameStore` and *all* wires connected to those gates from the main `wires` array.
    *   It calls the `startCreation` action from `useSubcircuitEditorStore`, passing the selected gates and relevant wires.

3.  **Editor State (`src/store/subcircuitEditorStore.js`)**:
    *   The `startCreation` action sets the editor state to `isEditing = true` and `editingMode = 'create'`.
    *   Crucially, it copies the gates and wires from the action's payload into both `creationData` (for the creation process) and `internalGates`/`internalWires` (for rendering in the editor).

4.  **Creation UI (`src/components/SubcircuitEditor/creation/QuickCreate.jsx`)**:
    *   The `Canvas.jsx` component renders a creation flow component based on the editor state. For the default case, this is `QuickCreate.jsx`.
    *   `QuickCreate.jsx` reads the `creationData` from the store.
    *   It calls the `createSubcircuitFromSelection` function from the engine.

5.  **Engine Logic (`src/engine/subcircuits.js` & `validation.js`)**:
    *   `createSubcircuitFromSelection` is the core function.
    *   It first calls `validateSelection` from `validation.js` to check for potential issues. This validation logic is aware of `INPUT` and `OUTPUT` gates acting as port definitions.
    *   It then calls `createPortMapping` to analyze the selected gates and wires to determine the subcircuit's inputs and outputs.
    *   It filters out the `INPUT` and `OUTPUT` gates from the selection, as they are converted into ports, not kept as internal gates.
    *   Finally, it constructs a new `SubcircuitTemplate` object containing the normalized internal gates, wires, and the newly defined ports.

6.  **Completion**:
    *   The `SubcircuitTemplate` is returned to `QuickCreate.jsx`.
    *   `QuickCreate.jsx` calls its `onComplete` prop, which in turn calls `addTemplate` (from `subcircuitStore`) and `startEditing` (from `subcircuitEditorStore`) to transition the editor from 'create' mode to 'edit' mode with the newly created subcircuit.
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

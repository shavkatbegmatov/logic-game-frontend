# Repository Guidelines

## Project Structure & Module Organization
This Vite + React frontend loads through `src/main.jsx` and `App.jsx`. UI and layout pieces stay under `src/components` (feel free to add feature folders). Simulation rules and gate behaviours belong in `src/engine`; avoid duplicating logic in components. Global state lives in `src/store` (Zustand). Put puzzle definitions in `src/levels`, shared hooks in `src/hooks`, helpers in `src/utils`, and Tailwind layers in `src/styles`. Top-level configs: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`; the static shell sits in `index.html`.

## Build, Test, and Development Commands
Install dependencies with `npm install`. `npm run dev` starts Vite with HMR. `npm run build` emits the optimized bundle to `dist`. `npm run preview` serves that bundle for smoke tests. Update the placeholder `npm test` once Vitest is wired (see testing).

## Coding Style & Naming Conventions
Stick to functional React with hooks. Use 2-space indentation and run `npx prettier --write src` before review. Components: PascalCase (`GateCanvas.jsx`); hooks: camelCase prefixed with `use`; Zustand stores: `<domain>Store`. Favor descriptive Tailwind utility stacks and consolidate reusable classes in `src/styles`.

## Testing Guidelines
Adopt Vitest + React Testing Library for UI, and lightweight engine tests for deterministic gate output. Co-locate specs as `<name>.test.jsx` beside code or under `src/__tests__`. Cover `src/engine` calculations and Zustand selectors at minimum. When Vitest lands, set `npm test` to `vitest run` and document manual puzzle smoke tests (load sample levels, toggle gates, confirm highlights).

## Commit & Pull Request Guidelines
Prefer Conventional Commit prefixes (`feat:`, `fix:`, `refactor:`) as seen in the log. Keep the summary imperative and under 72 characters; add context in the body when behaviour changes. PRs should explain intent, list user-visible impacts, attach GIFs/screenshots of puzzle interactions, link issues, and note verification steps (`npm run build`, future `npm test`).

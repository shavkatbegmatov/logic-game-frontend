import React from 'react'
import Canvas from './components/Canvas/Canvas'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'

function App() {
  return (
    <div className="relative flex h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.08),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl mix-blend-screen holo-pulse" />
      <div className="pointer-events-none absolute right-[-18%] bottom-[-10%] h-[460px] w-[460px] rounded-full bg-indigo-500/25 blur-[160px] mix-blend-screen holo-pulse" />
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="scanline-overlay h-full w-full" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col border-l border-white/10 bg-slate-950/40 backdrop-blur-2xl">
        {/* Toolbar */}
        <Toolbar />

        {/* Canvas */}
        <div className="flex-1">
          <Canvas />
        </div>
      </div>
    </div>
  )
}

export default App

import React from 'react'
import Canvas from './components/Canvas/Canvas'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'

function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col backdrop-blur-xl bg-white/5 border-l border-white/10">
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

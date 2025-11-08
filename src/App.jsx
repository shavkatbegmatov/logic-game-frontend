import React, { useEffect } from 'react'
import Canvas from './components/Canvas/Canvas'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'
import SpaceBackground from './components/SpaceBackground/SpaceBackground'
import { Toaster } from 'react-hot-toast'

function App() {
  useEffect(() => {
    console.log('%c[APP] Ilova ishga tushdi va asosiy komponentlar o\'rnatildi.', 'color: #4CAF50; font-weight: bold;');
  }, []);

  return (
    <div className="relative flex h-screen overflow-hidden text-slate-100">
      {/* Space Background with animated stars and nebula */}
      <SpaceBackground />

      {/* Toast Notifications for achievements */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: 'rgba(26, 31, 58, 0.95)',
            color: '#F0F9FF',
            border: '1px solid rgba(0, 191, 255, 0.3)',
            boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)',
          },
        }}
      />

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

import React, { useEffect } from 'react'
import Canvas from './components/Canvas/Canvas'
import Sidebar from './components/Sidebar/Sidebar'
import Toolbar from './components/Toolbar/Toolbar'
import SpaceBackground from './components/SpaceBackground/SpaceBackground'
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel'
import { Toaster } from 'react-hot-toast'

function App() {
  useEffect(() => {
    console.log('%c[APP] Ilova ishga tushdi va asosiy komponentlar o\'rnatildi.', 'color: #4CAF50; font-weight: bold;');
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
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

      {/* Professional game container with proper spacing - Full Width */}
      <div className="flex h-[calc(100vh-32px)] md:h-[calc(100vh-40px)] gap-4 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900/95 mx-4 my-4">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <Toolbar />

          {/* Canvas */}
          <div className="flex-1 relative">
            <Canvas />
          </div>
        </div>

        {/* Properties Panel (Right Sidebar) */}
        <PropertiesPanel />
      </div>
    </div>
  )
}

export default App

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'

const BreadcrumbNav = ({ context, onNavigate }) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-4 z-40"
    >
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-full shadow-lg border border-slate-700 px-4 py-2 flex items-center gap-1">
        <button
          onClick={() => onNavigate(0)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
        </button>

        {context.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-gray-600" />
            <button
              onClick={() => onNavigate(index)}
              className={`px-3 py-1 rounded-lg hover:bg-slate-700 transition-colors text-sm ${
                index === context.length - 1
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.name || `Level ${index + 1}`}
            </button>
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  )
}

export default BreadcrumbNav
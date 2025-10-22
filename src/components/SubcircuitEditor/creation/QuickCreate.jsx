import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import { createSubcircuitFromSelection } from '../../../engine/subcircuits'
import SoundManager from '../effects/SoundManager'

const QuickCreate = ({ onComplete, onCancel }) => {
  const { creationData, updateCreationData } = useSubcircuitEditorStore()

  useEffect(() => {
    // Auto-create with smart defaults
    const autoCreate = async () => {
      const { selectedGates, selectedWires } = creationData

      if (!selectedGates || selectedGates.length === 0) {
        onCancel()
        return
      }

      // Generate smart name based on gates
      const gateTypes = [...new Set(selectedGates.map(g => g.type))]
      const smartName = gateTypes.length === 1
        ? `${gateTypes[0]} Module`
        : `Complex Circuit ${Date.now() % 1000}`

      // Create subcircuit
      try {
        const result = createSubcircuitFromSelection(
          selectedGates,
          selectedWires,
          smartName
        )

        if (result && result.template) {
          // Quick customization
          result.template.description = `Auto-generated from ${selectedGates.length} gates`
          result.template.icon = smartName.substring(0, 3).toUpperCase()
          result.template.category = 'custom'

          // Play success sound
          SoundManager.playSuccess()

          // Complete after brief animation
          setTimeout(() => {
            onComplete(result.template)
          }, 500)
        }
      } catch (error) {
        console.error('Quick create xatosi:', error)
        SoundManager.playError()
        onCancel()
      }
    }

    autoCreate()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: [0, 1.2, 1], rotate: 0 }}
        transition={{ duration: 0.5 }}
        className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 shadow-2xl"
      >
        <Zap className="h-16 w-16 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute mt-48 text-center"
      >
        <p className="text-lg font-semibold text-white">Quick Creating...</p>
        <p className="mt-1 text-sm text-gray-400">
          {creationData.selectedGates?.length || 0} gates
        </p>
      </motion.div>
    </motion.div>
  )
}

export default QuickCreate
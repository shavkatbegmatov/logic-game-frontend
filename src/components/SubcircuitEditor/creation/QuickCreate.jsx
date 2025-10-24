import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import { createSubcircuitFromSelection } from '../../../engine/subcircuits'
import SoundManager from '../effects/SoundManager'

const QuickCreate = ({ onComplete, onCancel }) => {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const hasStarted = React.useRef(false)

  useEffect(() => {
    // Faqat bir marta ishga tushirish
    if (hasStarted.current) return
    hasStarted.current = true

    // Auto-create with smart defaults
    const autoCreate = async () => {
      console.log('QuickCreate: autoCreate started')
      setIsProcessing(true)

      // Store'dan to'g'ridan-to'g'ri ma'lumot olish
      const storeState = useSubcircuitEditorStore.getState()
      const { creationData, isEditing, editingMode } = storeState

      console.log('QuickCreate: Store state:', {
        isEditing,
        editingMode,
        hasCreationData: !!creationData,
        selectedGatesCount: creationData?.selectedGates?.length || 0
      })

      // Ma'lumotlar hali yuklanmagan bo'lsa, kutamiz
      if (!creationData || !creationData.selectedGates || creationData.selectedGates.length === 0) {
        if (retryCount < 3) {
          console.warn(`QuickCreate: Ma'lumot topilmadi, retry ${retryCount + 1}/3`)
          setRetryCount(retryCount + 1)
          setTimeout(() => {
            hasStarted.current = false
            setIsProcessing(false)
          }, 200)
          return
        } else {
          console.error('QuickCreate: Gate\'lar topilmadi, bekor qilinmoqda')
          SoundManager.playError()
          onCancel()
          return
        }
      }

      const { selectedGates, selectedWires } = creationData

      console.log('QuickCreate: Processing gates:', selectedGates.length)

      // Generate smart name based on gates
      const gateTypes = [...new Set(selectedGates.map(g => g.type))]
      const smartName = gateTypes.length === 1
        ? `${gateTypes[0]} Module`
        : `Complex Circuit ${Date.now() % 1000}`

      // Create subcircuit
      try {
        const result = createSubcircuitFromSelection(
          selectedGates,
          selectedWires || [],
          smartName
        )

        console.log('QuickCreate: Subcircuit created successfully')

        if (result && result.template) {
          // Quick customization
          result.template.description = `Auto-generated from ${selectedGates.length} gates`
          result.template.icon = smartName.substring(0, 3).toUpperCase()
          result.template.category = 'custom'

          // Play success sound
          SoundManager.playSuccess()

          // Complete after brief animation
          setTimeout(() => {
            console.log('QuickCreate: Calling onComplete')
            onComplete(result.template)
          }, 800)
        } else {
          console.error('QuickCreate: Result yoki template mavjud emas')
          SoundManager.playError()
          onCancel()
        }
      } catch (error) {
        console.error('Quick create xatosi:', error)
        SoundManager.playError()
        onCancel()
      }
    }

    // Ma'lumotlar tayyor bo'lguncha kichik kutish
    const timeoutId = setTimeout(() => {
      autoCreate()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [retryCount, onComplete, onCancel])

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
        <p className="text-lg font-semibold text-white">
          {isProcessing ? 'Creating Subcircuit...' : 'Preparing...'}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {isProcessing && useSubcircuitEditorStore.getState().creationData?.selectedGates?.length
            ? `${useSubcircuitEditorStore.getState().creationData.selectedGates.length} gates`
            : 'Loading...'}
        </p>
      </motion.div>
    </motion.div>
  )
}

export default QuickCreate
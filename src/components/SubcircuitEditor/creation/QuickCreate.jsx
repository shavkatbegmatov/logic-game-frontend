import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import { createSubcircuitFromSelection } from '../../../engine/subcircuits'
import { soundService } from '../effects/SoundManager'

const QuickCreate = ({ onComplete, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const creationData = useSubcircuitEditorStore(state => state.creationData)

  useEffect(() => {
    const selectedGates = creationData?.selectedGates || []
    const selectedWires = creationData?.selectedWires || []

    // Agar ma'lumotlar hali tayyor bo'lmasa, jarayonni bekor qilish.
    // Bu holat aslida yuz bermasligi kerak, lekin himoya sifatida qo'shildi.
    if (!creationData || selectedGates.length === 0) {
      console.error("QuickCreate: Yaratish uchun ma'lumotlar topilmadi. Jarayon bekor qilinmoqda.");
      soundService.playError()
      onCancel()
      return
    }

    const autoCreate = async () => {
      setIsProcessing(true)
      console.log('QuickCreate: Avtomatik yaratish boshlandi', { gates: selectedGates.length, wires: selectedWires.length });

      const gateTypes = [...new Set(selectedGates.map(g => g.type))]
      const smartName = gateTypes.length === 1
        ? `${gateTypes[0]} Module`
        : `Complex Circuit ${Date.now() % 1000}`

      try {
        const result = createSubcircuitFromSelection(
          selectedGates,
          selectedWires,
          smartName,
          {
            autoDetectPorts: true,
            optimizePorts: true,
            validateResult: true,
            smartNaming: true
          }
        )

        console.log('QuickCreate: Subcircuit yaratish natijasi:', result)

        if (result && result.success && result.template) {
          if (result.warnings && result.warnings.length > 0) {
            console.warn('QuickCreate ogohlantirishlari:', result.warnings)
          }
          soundService.playSuccess()
          // Animatsiya tugashi uchun kichik pauza
          setTimeout(() => {
            onComplete(result.template)
          }, 800)
        } else {
          const errorMsg = result?.errors?.join('\n') || 'Noma\'lum xatolik';
          console.error('QuickCreate: Yaratishda xatolik:', errorMsg)
          soundService.playError()
          alert(`Subcircuit yaratishda xatolik:\n${errorMsg}`)
          onCancel()
        }
      } catch (error) {
        console.error('QuickCreate: Kutilmagan xato:', error)
        soundService.playError()
        onCancel()
      }
    }

    // Animatsiya ko'rinishi uchun kichik kechikish bilan ishga tushirish
    const timeoutId = setTimeout(autoCreate, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Bu effekt faqat bir marta, komponent ishga tushganda bajariladi.

  const selectedGateCount = creationData?.selectedGates?.length || 0

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
          {isProcessing ? 'Subcircuit yaratilmoqda...' : 'Tayyorlanmoqda...'}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {isProcessing && selectedGateCount
            ? `${selectedGateCount} element`
            : 'Yuklanmoqda...'}
        </p>
      </motion.div>
    </motion.div>
  )
}

export default QuickCreate

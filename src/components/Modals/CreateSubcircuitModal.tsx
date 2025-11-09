import React, { useState, useEffect } from 'react'
import { X, Cpu, Save, Package, Hash } from 'lucide-react'
import useGameStore from '../../store/gameStore'
import useSubcircuitStore from '../../store/subcircuitStore'

const CreateSubcircuitModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [category, setCategory] = useState('custom')
  const [isGlobal, setIsGlobal] = useState(false)
  const [portMapping, setPortMapping] = useState({ inputs: [], outputs: [] })
  const [errors, setErrors] = useState([])

  const {
    selectedGates,
    gates,
    wires,
    createSubcircuitFromSelected,
    clearSelection
  } = useGameStore()

  const {
    addTemplate,
    categories,
    validateTemplateName
  } = useSubcircuitStore()

  // Selected gate'lar o'zgarganda port'larni aniqlash
  useEffect(() => {
    if (selectedGates.length === 0) return

    const selectedGateObjects = gates.filter(g => selectedGates.includes(g.id))
    const selectedGateIds = new Set(selectedGates)

    // Tashqi ulanishlarni topish
    const externalInputs = []
    const externalOutputs = []

    wires.forEach(wire => {
      const fromSelected = selectedGateIds.has(wire.fromGate)
      const toSelected = selectedGateIds.has(wire.toGate)

      if (!fromSelected && toSelected) {
        // Tashqi input
        const toGate = gates.find(g => g.id === wire.toGate)
        externalInputs.push({
          wireId: wire.id,
          targetGate: toGate?.type || 'Unknown',
          targetIndex: wire.toIndex
        })
      } else if (fromSelected && !toSelected) {
        // Tashqi output
        const fromGate = gates.find(g => g.id === wire.fromGate)
        externalOutputs.push({
          wireId: wire.id,
          sourceGate: fromGate?.type || 'Unknown',
          sourceIndex: wire.fromIndex
        })
      }
    })

    // Port mapping yangilash
    setPortMapping({
      inputs: externalInputs.map((ext, index) => ({
        name: `IN${index}`,
        index: index,
        description: `Input ${index + 1}`
      })),
      outputs: externalOutputs.map((ext, index) => ({
        name: `OUT${index}`,
        index: index,
        description: `Output ${index + 1}`
      }))
    })

    // Auto-generate icon (first 3 letters)
    if (name && !icon) {
      setIcon(name.substring(0, 3).toUpperCase())
    }
  }, [selectedGates, gates, wires, name, icon])

  const handleCreate = () => {
    // Validatsiya
    const validationErrors = []

    if (!name || name.trim() === '') {
      validationErrors.push('Subcircuit nomi kiritilishi kerak')
    } else if (!validateTemplateName(name)) {
      validationErrors.push('Bu nom allaqachon ishlatilgan')
    }

    if (selectedGates.length === 0) {
      validationErrors.push('Kamida bitta gate tanlanishi kerak')
    }

    if (!icon || icon.trim() === '') {
      validationErrors.push('IC chip label kiritilishi kerak')
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    // Subcircuit yaratish
    const result = createSubcircuitFromSelected(name, description)

    if (result && result.template) {
      // Template'ni customize qilish
      result.template.icon = icon
      result.template.category = category
      result.template.description = description
      result.template.inputs = portMapping.inputs
      result.template.outputs = portMapping.outputs

      // Store'ga qo'shish
      const addResult = addTemplate(result.template, isGlobal)

      if (addResult.success) {
        // Muvaffaqiyatli yaratildi
        console.log('Subcircuit muvaffaqiyatli yaratildi:', addResult.template)

        // Selected gate'larni tozalash
        clearSelection()

        // Modal'ni yopish
        onClose()

        // Reset form
        setName('')
        setDescription('')
        setIcon('')
        setCategory('custom')
        setIsGlobal(false)
        setErrors([])
      } else {
        setErrors([addResult.error])
      }
    }
  }

  const handlePortNameChange = (type, index, newName) => {
    setPortMapping(prev => ({
      ...prev,
      [type]: prev[type].map((port, i) =>
        i === index ? { ...port, name: newName } : port
      )
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2">
              <Cpu className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Yangi Subcircuit Yaratish
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-red-400">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Name & Icon */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Subcircuit Nomi
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Adder, Counter, etc."
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                IC Label
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value.toUpperCase())}
                placeholder="FA"
                maxLength={4}
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-center text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Ta'rif
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Subcircuit nima qilishini tushuntiring..."
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Kategoriya
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                  className="rounded border-gray-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">
                  Global kutubxonaga qo'shish
                </span>
              </label>
            </div>
          </div>

          {/* Port Mapping */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
              <Hash className="h-4 w-4" />
              Port Konfiguratsiyasi
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Inputs */}
              <div>
                <h4 className="mb-2 text-xs font-medium text-gray-400">
                  Kirish Portlari ({portMapping.inputs.length})
                </h4>
                <div className="space-y-2">
                  {portMapping.inputs.map((input, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500/20 text-xs font-bold text-green-400">
                        {index}
                      </div>
                      <input
                        type="text"
                        value={input.name}
                        onChange={(e) => handlePortNameChange('inputs', index, e.target.value)}
                        className="flex-1 rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                  {portMapping.inputs.length === 0 && (
                    <p className="text-xs text-gray-500">Kirish portlari yo'q</p>
                  )}
                </div>
              </div>

              {/* Outputs */}
              <div>
                <h4 className="mb-2 text-xs font-medium text-gray-400">
                  Chiqish Portlari ({portMapping.outputs.length})
                </h4>
                <div className="space-y-2">
                  {portMapping.outputs.map((output, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/20 text-xs font-bold text-blue-400">
                        {index}
                      </div>
                      <input
                        type="text"
                        value={output.name}
                        onChange={(e) => handlePortNameChange('outputs', index, e.target.value)}
                        className="flex-1 rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                  {portMapping.outputs.length === 0 && (
                    <p className="text-xs text-gray-500">Chiqish portlari yo'q</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="rounded-lg border border-white/10 bg-slate-800/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Tanlangan gate'lar:</span>
              <span className="font-semibold text-white">{selectedGates.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-white/5"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedGates.length === 0}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Yaratish
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateSubcircuitModal

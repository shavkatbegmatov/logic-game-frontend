import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, Cpu, HardDrive, Wifi, Layers, Search, Star, TrendingUp } from 'lucide-react'
import { createSubcircuitFromSelection } from '@/engine/subcircuits.ts'
import { soundService } from '../effects/SoundManager'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'

const TemplateCreate = ({ onComplete, onCancel }) => {
  const { creationData } = useSubcircuitEditorStore()
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Predefined templates library
  const templates = [
    {
      id: 'half-adder',
      name: 'Half Adder',
      category: 'arithmetic',
      icon: '➕',
      color: '#10B981',
      description: 'Adds two single bits',
      difficulty: 'beginner',
      rating: 4.5,
      uses: 1200,
      gates: ['XOR', 'AND'],
      inputs: 2,
      outputs: 2
    },
    {
      id: 'full-adder',
      name: 'Full Adder',
      category: 'arithmetic',
      icon: '⊕',
      color: '#3B82F6',
      description: 'Adds two bits with carry',
      difficulty: 'intermediate',
      rating: 4.7,
      uses: 890,
      gates: ['XOR', 'AND', 'OR'],
      inputs: 3,
      outputs: 2
    },
    {
      id: 'multiplexer-2x1',
      name: '2:1 Multiplexer',
      category: 'selection',
      icon: '🔀',
      color: '#8B5CF6',
      description: 'Selects between two inputs',
      difficulty: 'beginner',
      rating: 4.3,
      uses: 1450,
      gates: ['AND', 'OR', 'NOT'],
      inputs: 3,
      outputs: 1
    },
    {
      id: 'decoder-2x4',
      name: '2:4 Decoder',
      category: 'conversion',
      icon: '📊',
      color: '#EC4899',
      description: 'Decodes 2-bit input to 4 outputs',
      difficulty: 'intermediate',
      rating: 4.6,
      uses: 670,
      gates: ['AND', 'NOT'],
      inputs: 2,
      outputs: 4
    },
    {
      id: 'd-flip-flop',
      name: 'D Flip-Flop',
      category: 'memory',
      icon: '💾',
      color: '#F59E0B',
      description: 'Data flip-flop for storage',
      difficulty: 'advanced',
      rating: 4.8,
      uses: 520,
      gates: ['NAND', 'NOT'],
      inputs: 2,
      outputs: 2
    },
    {
      id: 'counter-4bit',
      name: '4-bit Counter',
      category: 'sequential',
      icon: '🔢',
      color: '#14B8A6',
      description: 'Counts from 0 to 15',
      difficulty: 'advanced',
      rating: 4.9,
      uses: 380,
      gates: ['D-FF', 'XOR', 'AND'],
      inputs: 2,
      outputs: 4
    }
  ]

  const categories = [
    { id: 'all', name: 'All Templates', icon: Layers },
    { id: 'arithmetic', name: 'Arithmetic', icon: Cpu },
    { id: 'selection', name: 'Selection', icon: Package },
    { id: 'conversion', name: 'Conversion', icon: Wifi },
    { id: 'memory', name: 'Memory', icon: HardDrive },
    { id: 'sequential', name: 'Sequential', icon: Clock }
  ]

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/10'
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10'
      case 'advanced': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) return

    // Create subcircuit from template
    const template = createSubcircuitFromSelection(
      creationData?.selectedGates || [],
      creationData?.selectedWires || [],
      selectedTemplate.name
    )

    if (template?.template) {
      // Apply template settings
      template.template.description = selectedTemplate.description
      template.template.icon = selectedTemplate.icon
      template.template.category = selectedTemplate.category

      soundService.playSuccess()
      onComplete(template.template)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl rounded-2xl bg-slate-900 p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Template Library</h2>
          </div>

          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-lg bg-slate-800 pl-10 pr-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap
                  ${selectedCategory === category.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </button>
            )
          })}
        </div>

        {/* Templates grid */}
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
          {filteredTemplates.map(template => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTemplate(template)}
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all
                ${selectedTemplate?.id === template.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
            >
              {/* Difficulty badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="text-3xl p-2 rounded-lg"
                  style={{backgroundColor: `${template.color}20`}}
                >
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-300">{template.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-gray-300">{template.uses}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.gates.map(gate => (
                      <span key={gate} className="px-1.5 py-0.5 rounded bg-slate-700 text-xs text-gray-300">
                        {gate}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex gap-3 text-xs text-gray-500">
                    <span>↓ {template.inputs} in</span>
                    <span>↑ {template.outputs} out</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected template preview */}
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg bg-purple-500/10 border border-purple-500/20 p-3"
          >
            <p className="text-sm text-purple-400">
              Selected: <span className="font-semibold">{selectedTemplate.name}</span> - {selectedTemplate.description}
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-gray-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFromTemplate}
            disabled={!selectedTemplate}
            className={`rounded-lg px-4 py-2 text-white transition-all
              ${selectedTemplate
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
          >
            Create from Template
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default TemplateCreate
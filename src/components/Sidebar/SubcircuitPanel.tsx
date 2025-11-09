import React, { useState, useEffect } from 'react'
import { Cpu, Search, Plus, Package2, Folder, Star, Clock, Download, Upload, Trash2 } from 'lucide-react'
import useSubcircuitStore from '../../store/subcircuitStore'
import useGameStore from '../../store/gameStore'

const SubcircuitPanel = () => {
  const [activeCategory, setActiveCategory] = useState('all')

  const {
    templates,
    categories,
    searchQuery,
    setSearchQuery,
    getFilteredTemplates,
    removeTemplate,
    createSubcircuitInstance,
    getMostUsedTemplates,
    getRecentTemplates
  } = useSubcircuitStore()

  const { addGate } = useGameStore()

  const filteredTemplates = getFilteredTemplates()
  const mostUsed = getMostUsedTemplates(3)
  const recent = getRecentTemplates(3)

  // Template'ni canvas'ga qo'shish
  const handleAddToCanvas = (template) => {
    // Canvas o'rtasiga joylashtirish
    const x = (window.innerWidth - 280) / 2
    const y = window.innerHeight / 2

    const instance = createSubcircuitInstance(template.id, x, y)
    if (instance) {
      addGate(instance)
      console.log('Subcircuit instance qo\'shildi:', instance)
    }
  }

  // Drag start
  const handleDragStart = (e, template) => {
    // Subcircuit template ma'lumotlarini drag eventga qo'shish
    e.dataTransfer.setData('gateType', 'SUBCIRCUIT')
    e.dataTransfer.setData('templateId', template.id)
    e.dataTransfer.setData('templateData', JSON.stringify(template))
  }

  // Template o'chirish
  const handleDeleteTemplate = (templateId) => {
    if (confirm('Bu subcircuit template\'ni o\'chirishni xohlaysizmi?')) {
      removeTemplate(templateId)
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-900/95">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Subcircuits</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Subcircuit qidirish..."
            className="w-full rounded-lg border border-white/10 bg-slate-800/50 py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-white/10 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
            }`}
          >
            Barchasi
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                activeCategory === category
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      {searchQuery === '' && activeCategory === 'all' && (
        <div className="border-b border-white/10 p-4 space-y-3">
          {/* Most Used */}
          {mostUsed.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
                <Star className="h-3 w-3" />
                <span>Ko'p ishlatilgan</span>
              </div>
              <div className="space-y-1">
                {mostUsed.map(template => (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    onAdd={() => handleAddToCanvas(template)}
                    onDragStart={(e) => handleDragStart(e, template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Yaqinda yaratilgan</span>
              </div>
              <div className="space-y-1">
                {recent.map(template => (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    onAdd={() => handleAddToCanvas(template)}
                    onDragStart={(e) => handleDragStart(e, template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-500">
              Subcircuit topilmadi
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Yangi subcircuit yaratish uchun gate'larni tanlang va Ctrl+G bosing
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <TemplateItem
                key={template.id}
                template={template}
                onAdd={() => handleAddToCanvas(template)}
                onDragStart={(e) => handleDragStart(e, template)}
                onDelete={() => handleDeleteTemplate(template.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-white/10 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-slate-700/50">
            <Upload className="h-3.5 w-3.5" />
            Import
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-slate-700/50">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

// Template item component
const TemplateItem = ({ template, onAdd, onDragStart, onDelete, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`group relative rounded-lg border border-white/10 bg-slate-800/30 transition-all hover:bg-slate-800/50 hover:border-purple-500/30 ${
        compact ? 'p-2' : 'p-3'
      }`}
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        {/* IC Chip Preview */}
        <div className="relative flex h-10 w-12 items-center justify-center rounded bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-white/10">
          <span className="text-xs font-bold text-purple-300">
            {template.icon}
          </span>
          {/* Pin indicators */}
          <div className="absolute -left-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-green-400" />
          <div className="absolute -right-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-blue-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-white ${compact ? 'text-sm' : ''}`}>
            {template.name}
          </h4>
          {!compact && template.description && (
            <p className="text-xs text-gray-500 truncate">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-600">
              {template.inputs?.length || 0} in
            </span>
            <span className="text-xs text-gray-600">
              {template.outputs?.length || 0} out
            </span>
            {template.isGlobal && (
              <span className="text-xs text-purple-400">global</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isHovered && (
          <div className="flex items-center gap-1">
            <button
              onClick={onAdd}
              className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
              title="Canvas'ga qo'shish"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {!template.isGlobal && (
              <button
                onClick={onDelete}
                className="rounded p-1 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                title="O'chirish"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubcircuitPanel
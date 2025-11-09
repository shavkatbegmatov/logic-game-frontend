import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Settings, Link2, Eye, Save, CircuitBoard, Zap, Info } from 'lucide-react'
import useSubcircuitEditorStore from '../../../store/subcircuitEditorStore'
import { createSubcircuitFromSelection } from '@/engine/subcircuits.ts'
import { soundService } from '../effects/SoundManager'

const WizardCreate = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(0)
  const { creationData } = useSubcircuitEditorStore()

  const [wizardData, setWizardData] = useState({
    name: '',
    description: '',
    icon: '⚡',
    color: '#3B82F6',
    category: 'custom',
    inputs: [],
    outputs: [],
    customSettings: {
      propagationDelay: 1,
      powerConsumption: 'low',
      documentation: ''
    }
  })

  const steps = [
    { title: 'Gate Selection', icon: CircuitBoard },
    { title: 'Port Mapping', icon: Link2 },
    { title: 'Configuration', icon: Settings },
    { title: 'Preview & Save', icon: Eye }
  ]

  // Initialize with creation data
  useEffect(() => {
    if (creationData?.selectedGates) {
      // Auto-detect inputs/outputs from selected gates
      const gateTypes = [...new Set(creationData.selectedGates.map(g => g.type))]
      setWizardData(prev => ({
        ...prev,
        name: gateTypes.length === 1 ? `${gateTypes[0]} Module` : 'Custom Module',
        inputs: detectInputPorts(creationData.selectedGates, creationData.selectedWires),
        outputs: detectOutputPorts(creationData.selectedGates, creationData.selectedWires)
      }))
    }
  }, [creationData])

  const detectInputPorts = (gates, wires) => {
    // Find external connection points that serve as inputs
    const internalGateIds = new Set(gates.map(g => g.id))
    const inputs = []

    wires?.forEach(wire => {
      if (!internalGateIds.has(wire.fromGate) && internalGateIds.has(wire.toGate)) {
        const targetGate = gates.find(g => g.id === wire.toGate)
        if (!inputs.find(i => i.gateId === wire.toGate && i.port === wire.toIndex)) {
          inputs.push({
            id: `in_${inputs.length}`,
            name: `Input ${inputs.length + 1}`,
            gateId: wire.toGate,
            port: wire.toIndex,
            type: targetGate?.type || 'SIGNAL'
          })
        }
      }
    })

    return inputs
  }

  const detectOutputPorts = (gates, wires) => {
    // Find external connection points that serve as outputs
    const internalGateIds = new Set(gates.map(g => g.id))
    const outputs = []

    wires?.forEach(wire => {
      if (internalGateIds.has(wire.fromGate) && !internalGateIds.has(wire.toGate)) {
        const sourceGate = gates.find(g => g.id === wire.fromGate)
        if (!outputs.find(o => o.gateId === wire.fromGate && o.port === wire.fromIndex)) {
          outputs.push({
            id: `out_${outputs.length}`,
            name: `Output ${outputs.length + 1}`,
            gateId: wire.fromGate,
            port: wire.fromIndex,
            type: sourceGate?.type || 'SIGNAL'
          })
        }
      }
    })

    return outputs
  }

  const renderStepContent = () => {
    switch(step) {
      case 0: // Gate Selection
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CircuitBoard className="h-6 w-6 text-cyan-400" />
              Selected Components
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm text-gray-400 mb-2">Gates Selected</h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-cyan-400">
                    {creationData?.selectedGates?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {[...new Set(creationData?.selectedGates?.map(g => g.type) || [])].join(', ')}
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm text-gray-400 mb-2">Wires Connected</h3>
                <div className="text-3xl font-bold text-blue-400">
                  {creationData?.selectedWires?.length || 0}
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-cyan-400" />
                These components will be encapsulated into a reusable subcircuit module.
              </p>
            </div>
          </div>
        )

      case 1: // Port Mapping
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Link2 className="h-6 w-6 text-cyan-400" />
              Configure Ports
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Input Ports ({wizardData.inputs.length})</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {wizardData.inputs.map((input, idx) => (
                    <div key={input.id} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <input
                        type="text"
                        value={input.name}
                        onChange={(e) => {
                          const newInputs = [...wizardData.inputs]
                          newInputs[idx].name = e.target.value
                          setWizardData({...wizardData, inputs: newInputs})
                        }}
                        className="bg-transparent text-white text-sm outline-none flex-1"
                      />
                      <span className="text-xs text-gray-500 ml-2">{input.type}</span>
                    </div>
                  ))}
                  {wizardData.inputs.length === 0 && (
                    <p className="text-gray-500 text-sm">No input ports detected</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Output Ports ({wizardData.outputs.length})</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {wizardData.outputs.map((output, idx) => (
                    <div key={output.id} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <input
                        type="text"
                        value={output.name}
                        onChange={(e) => {
                          const newOutputs = [...wizardData.outputs]
                          newOutputs[idx].name = e.target.value
                          setWizardData({...wizardData, outputs: newOutputs})
                        }}
                        className="bg-transparent text-white text-sm outline-none flex-1"
                      />
                      <span className="text-xs text-gray-500 ml-2">{output.type}</span>
                    </div>
                  ))}
                  {wizardData.outputs.length === 0 && (
                    <p className="text-gray-500 text-sm">No output ports detected</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">
                Ports will be automatically created based on external connections
              </p>
            </div>
          </div>
        )

      case 2: // Configuration
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="h-6 w-6 text-cyan-400" />
              Module Configuration
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Module Name</label>
                <input
                  type="text"
                  value={wizardData.name}
                  onChange={(e) => setWizardData({...wizardData, name: e.target.value})}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter module name..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Description</label>
                <textarea
                  value={wizardData.description}
                  onChange={(e) => setWizardData({...wizardData, description: e.target.value})}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  rows={2}
                  placeholder="Describe what this module does..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Icon</label>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-800 rounded-lg px-3 py-2 text-2xl">
                      {wizardData.icon}
                    </div>
                    <select
                      value={wizardData.icon}
                      onChange={(e) => setWizardData({...wizardData, icon: e.target.value})}
                      className="bg-slate-800 text-white px-2 py-1 rounded outline-none text-sm"
                    >
                      <option value="⚡">⚡ Lightning</option>
                      <option value="🔌">🔌 Plug</option>
                      <option value="🎛️">🎛️ Control</option>
                      <option value="💾">💾 Save</option>
                      <option value="🔧">🔧 Wrench</option>
                      <option value="⚙️">⚙️ Gear</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Color Theme</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={wizardData.color}
                      onChange={(e) => setWizardData({...wizardData, color: e.target.value})}
                      className="bg-slate-800 rounded h-10 w-20 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">{wizardData.color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Preview & Save
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="h-6 w-6 text-cyan-400" />
              Preview & Save
            </h2>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="text-3xl p-2 rounded-lg"
                    style={{backgroundColor: `${wizardData.color}20`}}
                  >
                    {wizardData.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{wizardData.name || 'Unnamed Module'}</h3>
                    <p className="text-sm text-gray-400">{wizardData.description || 'No description'}</p>
                  </div>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${wizardData.color}20`,
                    color: wizardData.color
                  }}
                >
                  {wizardData.category}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Inputs</p>
                  <p className="text-sm text-cyan-400 font-medium">{wizardData.inputs.length} ports</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Outputs</p>
                  <p className="text-sm text-blue-400 font-medium">{wizardData.outputs.length} ports</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Components: {creationData?.selectedGates?.length || 0} gates</span>
                  <span className="text-gray-500">Complexity: {wizardData.customSettings.powerConsumption}</span>
                </div>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-green-400 flex items-center gap-2">
                <Save className="h-4 w-4" />
                Ready to create your subcircuit module!
              </p>
            </div>
          </div>
        )

      default:
        return null
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
        className="w-full max-w-3xl rounded-2xl bg-slate-900 p-6 shadow-2xl"
      >
        {/* Steps indicator */}
        <div className="mb-6 flex items-center justify-between">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon
            return (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      flex h-12 w-12 items-center justify-center rounded-full font-semibold transition-all
                      ${index <= step
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'bg-slate-700 text-gray-400'
                      }
                      ${index === step ? 'ring-4 ring-cyan-500/30' : ''}
                    `}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`mt-2 text-xs ${index <= step ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {stepItem.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      mx-4 h-0.5 w-16 transition-all
                      ${index < step ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-700'}
                    `}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="mb-6 min-h-[320px]">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-gray-400 hover:bg-white/5"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                onClick={() => {
                  setStep(step + 1)
                  soundService.playClick()
                }}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-white hover:brightness-110"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  // Create subcircuit with wizard data
                  const template = createSubcircuitFromSelection(
                    creationData.selectedGates,
                    creationData.selectedWires,
                    wizardData.name
                  )

                  if (template?.template) {
                    // Apply wizard configurations
                    template.template.description = wizardData.description
                    template.template.icon = wizardData.icon
                    template.template.color = wizardData.color
                    template.template.category = wizardData.category
                    template.template.inputs = wizardData.inputs
                    template.template.outputs = wizardData.outputs

                    soundService.playSuccess()
                    onComplete(template.template)
                  }
                }}
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 text-white hover:brightness-110 shadow-lg"
              >
                Create Subcircuit
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default WizardCreate

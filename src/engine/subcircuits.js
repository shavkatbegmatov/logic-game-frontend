// Subcircuit (Composite Gate) Engine
// Bu fayl subcircuit'larning asosiy funksionalligini ta'minlaydi

// Subcircuit template modeli
export class SubcircuitTemplate {
  constructor(config = {}) {
    this.id = config.id || Date.now() + Math.random();
    this.name = config.name || 'Untitled Subcircuit';
    this.description = config.description || '';
    this.icon = config.icon || 'SC'; // IC chip ustidagi label
    this.category = config.category || 'custom';
    this.version = config.version || '1.0.0';
    this.author = config.author || 'anonymous';
    this.createdAt = config.createdAt || new Date().toISOString();
    this.updatedAt = config.updatedAt || new Date().toISOString();

    // Input/Output portlari
    this.inputs = config.inputs || []; // [{name: 'A', index: 0}, ...]
    this.outputs = config.outputs || []; // [{name: 'Y', index: 0}, ...]

    // Ichki circuit
    this.internalCircuit = config.internalCircuit || {
      gates: [],
      wires: []
    };

    // Template turi (global yoki loyihaga xos)
    this.isGlobal = config.isGlobal || false;

    // Visual sozlamalar
    this.width = config.width || 120; // IC chip kengligi
    this.height = config.height || Math.max(80, Math.max(this.inputs.length, this.outputs.length) * 30);

    // Metadata
    this.tags = config.tags || [];
    this.isPublic = config.isPublic || false;
    this.usageCount = config.usageCount || 0;
  }

  // Template validatsiya
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Subcircuit nomi kiritilishi kerak');
    }

    if (this.inputs.length === 0 && this.outputs.length === 0) {
      errors.push('Kamida bitta input yoki output bo\'lishi kerak');
    }

    if (this.inputs.length > 32) {
      errors.push('Maximum 32 ta input bo\'lishi mumkin');
    }

    if (this.outputs.length > 32) {
      errors.push('Maximum 32 ta output bo\'lishi mumkin');
    }

    // Ichki circuit validatsiya
    if (!this.internalCircuit || !this.internalCircuit.gates || !this.internalCircuit.wires) {
      errors.push('Ichki circuit strukturasi noto\'g\'ri');
    }

    // Port nomlarining unikalligi
    const inputNames = new Set();
    for (const input of this.inputs) {
      if (inputNames.has(input.name)) {
        errors.push(`Takroriy input nomi: ${input.name}`);
      }
      inputNames.add(input.name);
    }

    const outputNames = new Set();
    for (const output of this.outputs) {
      if (outputNames.has(output.name)) {
        errors.push(`Takroriy output nomi: ${output.name}`);
      }
      outputNames.add(output.name);
    }

    return errors;
  }

  // Template'dan instance yaratish
  createInstance(x = 100, y = 100) {
    return {
      id: Date.now() + Math.random(),
      type: 'SUBCIRCUIT',
      templateId: this.id,
      name: this.name,
      icon: this.icon,
      x: x,
      y: y,
      width: this.width,
      height: this.height,
      inputs: new Array(this.inputs.length).fill(0),
      outputs: new Array(this.outputs.length).fill(0),
      inputPorts: this.inputs.map(p => ({...p})),
      outputPorts: this.outputs.map(p => ({...p})),
      // Ichki holat
      internalGates: JSON.parse(JSON.stringify(this.internalCircuit.gates)),
      internalWires: JSON.parse(JSON.stringify(this.internalCircuit.wires)),
      internalSignals: {},
      // Vizual sozlamalar
      rotation: 0,
      flipped: false,
      selected: false,
      highlighted: false
    };
  }

  // Template'ni JSON'ga eksport qilish
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      category: this.category,
      version: this.version,
      author: this.author,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      inputs: this.inputs,
      outputs: this.outputs,
      internalCircuit: this.internalCircuit,
      isGlobal: this.isGlobal,
      width: this.width,
      height: this.height,
      tags: this.tags,
      isPublic: this.isPublic,
      usageCount: this.usageCount
    };
  }

  // JSON'dan template import qilish
  static fromJSON(json) {
    return new SubcircuitTemplate(json);
  }
}

// Subcircuit Manager - template'larni boshqarish
export class SubcircuitManager {
  constructor() {
    this.templates = new Map();
    this.globalTemplates = new Map();
    this.customTemplates = new Map();
    this.categories = new Set(['logic', 'arithmetic', 'memory', 'io', 'custom']);
  }

  // Template qo'shish
  addTemplate(template, isGlobal = false) {
    const errors = template.validate();
    if (errors.length > 0) {
      throw new Error(`Template validatsiya xatosi: ${errors.join(', ')}`);
    }

    this.templates.set(template.id, template);

    if (isGlobal) {
      this.globalTemplates.set(template.id, template);
    } else {
      this.customTemplates.set(template.id, template);
    }

    // Kategoriyani qo'shish
    if (template.category && !this.categories.has(template.category)) {
      this.categories.add(template.category);
    }

    return template;
  }

  // Template olish
  getTemplate(id) {
    return this.templates.get(id);
  }

  // Barcha template'larni olish
  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  // Kategoriya bo'yicha template'larni olish
  getTemplatesByCategory(category) {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  // Template o'chirish
  removeTemplate(id) {
    const template = this.templates.get(id);
    if (template) {
      this.templates.delete(id);
      this.globalTemplates.delete(id);
      this.customTemplates.delete(id);
      return true;
    }
    return false;
  }

  // Template yangilash
  updateTemplate(id, updates) {
    const template = this.templates.get(id);
    if (template) {
      Object.assign(template, updates);
      template.updatedAt = new Date().toISOString();
      return template;
    }
    return null;
  }

  // Library eksport qilish
  exportLibrary(templateIds = null) {
    const templatesToExport = templateIds
      ? templateIds.map(id => this.templates.get(id)).filter(Boolean)
      : this.getAllTemplates();

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: templatesToExport.map(t => t.toJSON())
    };
  }

  // Library import qilish
  importLibrary(libraryData) {
    const imported = [];
    const errors = [];

    if (!libraryData.templates || !Array.isArray(libraryData.templates)) {
      throw new Error('Noto\'g\'ri library formati');
    }

    for (const templateData of libraryData.templates) {
      try {
        const template = SubcircuitTemplate.fromJSON(templateData);
        this.addTemplate(template, templateData.isGlobal);
        imported.push(template);
      } catch (error) {
        errors.push(`Template "${templateData.name}" import xatosi: ${error.message}`);
      }
    }

    return { imported, errors };
  }
}

// Tanlangan gate'lardan subcircuit yaratish
export function createSubcircuitFromSelection(selectedGates, allWires, name = 'New Subcircuit') {
  if (!selectedGates || selectedGates.length === 0) {
    throw new Error('Gate\'lar tanlanmagan');
  }

  const selectedGateIds = new Set(selectedGates.map(g => g.id));

  // Ichki va tashqi wire'larni ajratish
  const internalWires = [];
  const externalInputs = [];
  const externalOutputs = [];

  for (const wire of allWires) {
    const fromSelected = selectedGateIds.has(wire.fromGate);
    const toSelected = selectedGateIds.has(wire.toGate);

    if (fromSelected && toSelected) {
      // Ichki wire
      internalWires.push(wire);
    } else if (!fromSelected && toSelected) {
      // Tashqi input
      externalInputs.push({
        wire: wire,
        targetGate: wire.toGate,
        targetIndex: wire.toIndex
      });
    } else if (fromSelected && !toSelected) {
      // Tashqi output
      externalOutputs.push({
        wire: wire,
        sourceGate: wire.fromGate,
        sourceIndex: wire.fromIndex
      });
    }
  }

  // Input/Output portlarni yaratish
  const inputs = externalInputs.map((ext, index) => ({
    name: `IN${index}`,
    index: index,
    connectedGate: ext.targetGate,
    connectedIndex: ext.targetIndex
  }));

  const outputs = externalOutputs.map((ext, index) => ({
    name: `OUT${index}`,
    index: index,
    connectedGate: ext.sourceGate,
    connectedIndex: ext.sourceIndex
  }));

  // Pozitsiyalarni normalize qilish (0,0 dan boshlash)
  const minX = Math.min(...selectedGates.map(g => g.x));
  const minY = Math.min(...selectedGates.map(g => g.y));

  const normalizedGates = selectedGates.map(gate => ({
    ...gate,
    x: gate.x - minX,
    y: gate.y - minY
  }));

  // Subcircuit template yaratish
  const template = new SubcircuitTemplate({
    name: name,
    description: `${selectedGates.length} ta gate'dan iborat subcircuit`,
    icon: name.substring(0, 3).toUpperCase(),
    category: 'custom',
    inputs: inputs,
    outputs: outputs,
    internalCircuit: {
      gates: normalizedGates,
      wires: internalWires
    }
  });

  return {
    template: template,
    externalInputs: externalInputs,
    externalOutputs: externalOutputs
  };
}

// Subcircuit simulyatsiya funksiyasi
export function simulateSubcircuit(subcircuitGate, inputSignals, templateManager) {
  const template = templateManager.getTemplate(subcircuitGate.templateId);
  if (!template) {
    console.error('Subcircuit template topilmadi:', subcircuitGate.templateId);
    return new Array(subcircuitGate.outputs.length).fill(0);
  }

  // INPUT gate'larni yangilash
  const internalGates = [...subcircuitGate.internalGates];
  const internalWires = [...subcircuitGate.internalWires];

  // Tashqi input signallarini ichki INPUT gate'larga ulash
  for (let i = 0; i < template.inputs.length; i++) {
    const inputPort = template.inputs[i];
    const signal = inputSignals[i] || 0;

    // INPUT port bilan bog'langan ichki gate'ni topish
    const connectedWires = internalWires.filter(w =>
      w.fromGate === `INPUT_${inputPort.index}`
    );

    // Signal'ni yangilash
    for (const wire of connectedWires) {
      wire.signal = signal;
    }
  }

  // Ichki simulyatsiyani bajarish (recursive)
  // Bu yerda SimulationEngine'dan foydalanish kerak
  // Hozircha soddalashtirilgan versiya

  const outputSignals = new Array(template.outputs.length).fill(0);

  // OUTPUT gate'lardan signallarni olish
  for (let i = 0; i < template.outputs.length; i++) {
    const outputPort = template.outputs[i];

    // OUTPUT port bilan bog'langan ichki gate'ni topish
    const connectedWires = internalWires.filter(w =>
      w.toGate === `OUTPUT_${outputPort.index}`
    );

    if (connectedWires.length > 0) {
      outputSignals[i] = connectedWires[0].signal || 0;
    }
  }

  return outputSignals;
}

// Default kutubxona template'lari
export function createDefaultTemplates() {
  const templates = [];

  // Half Adder
  templates.push(new SubcircuitTemplate({
    name: 'Half Adder',
    description: '1-bit half adder (A + B = Sum, Carry)',
    icon: 'HA',
    category: 'arithmetic',
    isGlobal: true,
    inputs: [
      { name: 'A', index: 0 },
      { name: 'B', index: 1 }
    ],
    outputs: [
      { name: 'Sum', index: 0 },
      { name: 'Carry', index: 1 }
    ]
  }));

  // Full Adder
  templates.push(new SubcircuitTemplate({
    name: 'Full Adder',
    description: '1-bit full adder (A + B + Cin = Sum, Cout)',
    icon: 'FA',
    category: 'arithmetic',
    isGlobal: true,
    inputs: [
      { name: 'A', index: 0 },
      { name: 'B', index: 1 },
      { name: 'Cin', index: 2 }
    ],
    outputs: [
      { name: 'Sum', index: 0 },
      { name: 'Cout', index: 1 }
    ]
  }));

  // SR Latch
  templates.push(new SubcircuitTemplate({
    name: 'SR Latch',
    description: 'Set-Reset Latch memory element',
    icon: 'SR',
    category: 'memory',
    isGlobal: true,
    inputs: [
      { name: 'S', index: 0 },
      { name: 'R', index: 1 }
    ],
    outputs: [
      { name: 'Q', index: 0 },
      { name: 'Q\'', index: 1 }
    ]
  }));

  // D Flip-Flop
  templates.push(new SubcircuitTemplate({
    name: 'D Flip-Flop',
    description: 'Data Flip-Flop with clock',
    icon: 'DFF',
    category: 'memory',
    isGlobal: true,
    inputs: [
      { name: 'D', index: 0 },
      { name: 'CLK', index: 1 }
    ],
    outputs: [
      { name: 'Q', index: 0 },
      { name: 'Q\'', index: 1 }
    ]
  }));

  // Multiplexer 2:1
  templates.push(new SubcircuitTemplate({
    name: '2:1 MUX',
    description: '2-to-1 Multiplexer',
    icon: 'MX2',
    category: 'logic',
    isGlobal: true,
    inputs: [
      { name: 'I0', index: 0 },
      { name: 'I1', index: 1 },
      { name: 'S', index: 2 }
    ],
    outputs: [
      { name: 'Y', index: 0 }
    ]
  }));

  // Decoder 2:4
  templates.push(new SubcircuitTemplate({
    name: '2:4 Decoder',
    description: '2-to-4 line decoder',
    icon: 'DEC',
    category: 'logic',
    isGlobal: true,
    inputs: [
      { name: 'A0', index: 0 },
      { name: 'A1', index: 1 },
      { name: 'EN', index: 2 }
    ],
    outputs: [
      { name: 'Y0', index: 0 },
      { name: 'Y1', index: 1 },
      { name: 'Y2', index: 2 },
      { name: 'Y3', index: 3 }
    ]
  }));

  return templates;
}

export default {
  SubcircuitTemplate,
  SubcircuitManager,
  createSubcircuitFromSelection,
  simulateSubcircuit,
  createDefaultTemplates
};
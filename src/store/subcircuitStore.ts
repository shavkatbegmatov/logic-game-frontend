/**
 * Subcircuit Store
 * Subcircuit template'lar va manager
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SubcircuitManager, SubcircuitTemplate, createDefaultTemplates } from '../engine/subcircuits'

interface SubcircuitState {
  manager: SubcircuitManager
  templates: SubcircuitTemplate[]
  globalTemplates: SubcircuitTemplate[]
  customTemplates: SubcircuitTemplate[]
  selectedTemplateId: string | null
  editingTemplateId: string | null
  categories: string[]
  searchQuery: string
  selectedCategory: string

  initializeStore: () => void
  addTemplate: (templateConfig: any, isGlobal?: boolean) => { success: boolean; template?: SubcircuitTemplate; error?: string }
  removeTemplate: (templateId: string) => boolean
  updateTemplate: (templateId: string, updates: any) => SubcircuitTemplate | null
  getTemplate: (templateId: string) => SubcircuitTemplate | undefined
  selectTemplate: (templateId: string | null) => void
  startEditingTemplate: (templateId: string) => void
  stopEditingTemplate: () => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string) => void
  getFilteredTemplates: () => SubcircuitTemplate[]
  exportTemplates: (templateIds?: string[] | null) => any
  importTemplates: (libraryData: any) => { imported: any[]; errors: string[] }
  createSubcircuitInstance: (templateId: string, x: number, y: number) => any
  incrementUsageCount: (templateId: string) => void
  addCategory: (category: string) => void
  getTemplatesByCategory: (category: string) => SubcircuitTemplate[]
  getMostUsedTemplates: (limit?: number) => SubcircuitTemplate[]
  getRecentTemplates: (limit?: number) => SubcircuitTemplate[]
  validateTemplateName: (name: string, excludeId?: string | null) => boolean
  clearCustomTemplates: () => void
  resetToDefaults: () => void
}

const useSubcircuitStore = create<SubcircuitState>()(
  persist(
    (set, get) => ({
      // State
      manager: new SubcircuitManager(),
      templates: [], // Barcha template'lar
      globalTemplates: [], // Global kutubxona
      customTemplates: [], // Loyihaga xos template'lar
      selectedTemplateId: null,
      editingTemplateId: null,
      categories: ['logic', 'arithmetic', 'memory', 'io', 'custom'],
      searchQuery: '',
      selectedCategory: 'all',

      // Initialization
      initializeStore: () => {
        const manager = new SubcircuitManager();

        // Default template'larni yuklash
        const defaultTemplates = createDefaultTemplates();
        defaultTemplates.forEach(template => {
          manager.addTemplate(template, true);
        });

        set({
          manager: manager,
          templates: manager.getAllTemplates(),
          globalTemplates: Array.from(manager.globalTemplates.values()),
          customTemplates: Array.from(manager.customTemplates.values())
        });
      },

      // Template Management
      addTemplate: (templateConfig, isGlobal = false) => {
        const { manager } = get();

        try {
          const template = new SubcircuitTemplate(templateConfig);
          manager.addTemplate(template, isGlobal);

          set({
            templates: manager.getAllTemplates(),
            globalTemplates: Array.from(manager.globalTemplates.values()),
            customTemplates: Array.from(manager.customTemplates.values())
          });

          return { success: true, template };
        } catch (error) {
          console.error('Template qo\'shishda xato:', error);
          return { success: false, error: error.message };
        }
      },

      removeTemplate: (templateId) => {
        const { manager } = get();

        if (manager.removeTemplate(templateId)) {
          set({
            templates: manager.getAllTemplates(),
            globalTemplates: Array.from(manager.globalTemplates.values()),
            customTemplates: Array.from(manager.customTemplates.values()),
            selectedTemplateId: null,
            editingTemplateId: null
          });
          return true;
        }
        return false;
      },

      updateTemplate: (templateId, updates) => {
        const { manager } = get();

        const updated = manager.updateTemplate(templateId, updates);
        if (updated) {
          set({
            templates: manager.getAllTemplates(),
            globalTemplates: Array.from(manager.globalTemplates.values()),
            customTemplates: Array.from(manager.customTemplates.values())
          });
          return updated;
        }
        return null;
      },

      getTemplate: (templateId) => {
        const { manager } = get();
        return manager.getTemplate(templateId);
      },

      // Selection & Editing
      selectTemplate: (templateId) => {
        set({ selectedTemplateId: templateId });
      },

      startEditingTemplate: (templateId) => {
        set({ editingTemplateId: templateId });
      },

      stopEditingTemplate: () => {
        set({ editingTemplateId: null });
      },

      // Search & Filter
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      getFilteredTemplates: () => {
        const { templates, searchQuery, selectedCategory } = get();

        let filtered = templates;

        // Kategoriya bo'yicha filter
        if (selectedCategory && selectedCategory !== 'all') {
          filtered = filtered.filter(t => t.category === selectedCategory);
        }

        // Search query bo'yicha filter
        if (searchQuery && searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        return filtered;
      },

      // Import/Export
      exportTemplates: (templateIds = null) => {
        const { manager } = get();
        return manager.exportLibrary(templateIds);
      },

      importTemplates: (libraryData) => {
        const { manager } = get();

        try {
          const result = manager.importLibrary(libraryData);

          set({
            templates: manager.getAllTemplates(),
            globalTemplates: Array.from(manager.globalTemplates.values()),
            customTemplates: Array.from(manager.customTemplates.values())
          });

          return result;
        } catch (error) {
          console.error('Import xatosi:', error);
          return { imported: [], errors: [error.message] };
        }
      },

      // Instance Creation
      createSubcircuitInstance: (templateId, x, y) => {
        const { manager } = get();

        const template = manager.getTemplate(templateId);
        if (template) {
          return template.createInstance(x, y);
        }
        return null;
      },

      // Statistics
      incrementUsageCount: (templateId) => {
        const { manager } = get();

        const template = manager.getTemplate(templateId);
        if (template) {
          template.usageCount++;
          manager.updateTemplate(templateId, { usageCount: template.usageCount });
        }
      },

      // Categories
      addCategory: (category) => {
        const { categories } = get();

        if (!categories.includes(category)) {
          set({ categories: [...categories, category] });
        }
      },

      // Utility Methods
      getTemplatesByCategory: (category) => {
        const { manager } = get();
        return manager.getTemplatesByCategory(category);
      },

      getMostUsedTemplates: (limit = 5) => {
        const { templates } = get();

        return templates
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      },

      getRecentTemplates: (limit = 5) => {
        const { customTemplates } = get();

        return customTemplates
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      },

      // Validation
      validateTemplateName: (name, excludeId = null) => {
        const { templates } = get();

        const exists = templates.some(t =>
          t.name.toLowerCase() === name.toLowerCase() &&
          t.id !== excludeId
        );

        return !exists;
      },

      // Clear & Reset
      clearCustomTemplates: () => {
        const { manager } = get();

        // Faqat custom template'larni o'chirish
        Array.from(manager.customTemplates.keys()).forEach(id => {
          manager.removeTemplate(id);
        });

        set({
          templates: manager.getAllTemplates(),
          customTemplates: []
        });
      },

      resetToDefaults: () => {
        const manager = new SubcircuitManager();

        // Faqat default template'larni qayta yuklash
        const defaultTemplates = createDefaultTemplates();
        defaultTemplates.forEach(template => {
          manager.addTemplate(template, true);
        });

        set({
          manager: manager,
          templates: manager.getAllTemplates(),
          globalTemplates: Array.from(manager.globalTemplates.values()),
          customTemplates: [],
          selectedTemplateId: null,
          editingTemplateId: null,
          searchQuery: '',
          selectedCategory: 'all'
        });
      }
    }),
    {
      name: 'subcircuit-storage',
      partialize: (state) => ({
        customTemplates: state.customTemplates,
        categories: state.categories
      })
    }
  )
);

// Store ni boshlang'ich holatda initsializatsiya qilish
const initStore = () => {
  const store = useSubcircuitStore.getState();
  if (store.templates.length === 0) {
    store.initializeStore();
  }
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initStore();
}

export default useSubcircuitStore;
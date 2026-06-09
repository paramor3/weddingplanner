/* ============================================
   NikahPlanner — Data Store (localStorage)
   ============================================ */

const Store = (() => {
  const STORAGE_KEY = 'nikahplanner_data';

  // Default schema
  const defaultData = {
    settings: {
      weddingDate: '',
      groomName: '',
      brideName: '',
      createdAt: '',
    },
    checklist: [],
    guests: [],
    savings: [],
    timeline: [],
    moodboard: [],
    postNikah: [],
  };

  // Event listeners
  const listeners = {};

  /**
   * Load all data from localStorage
   * @returns {object}
   */
  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultData));
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all keys exist
      return {
        ...JSON.parse(JSON.stringify(defaultData)),
        ...parsed,
        settings: { ...defaultData.settings, ...(parsed.settings || {}) },
      };
    } catch (e) {
      console.error('Store: Error loading data', e);
      return JSON.parse(JSON.stringify(defaultData));
    }
  }

  /**
   * Save all data to localStorage
   * @param {object} data
   */
  function saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Store: Error saving data', e);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event — e.g. 'change', 'checklist', 'guests'
   * @param {*} payload
   */
  function emit(event, payload) {
    if (listeners[event]) {
      listeners[event].forEach(fn => fn(payload));
    }
    // Always emit a general 'change' event
    if (event !== 'change' && listeners['change']) {
      listeners['change'].forEach(fn => fn({ event, payload }));
    }
  }

  return {
    /**
     * Subscribe to store events
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(event, callback) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
      return () => {
        listeners[event] = listeners[event].filter(fn => fn !== callback);
      };
    },

    /**
     * Check if first run (no settings saved)
     * @returns {boolean}
     */
    isFirstRun() {
      const data = loadAll();
      return !data.settings.weddingDate;
    },

    // --- Settings ---
    getSettings() {
      return loadAll().settings;
    },

    saveSettings(settings) {
      const data = loadAll();
      data.settings = { ...data.settings, ...settings };
      if (!data.settings.createdAt) {
        data.settings.createdAt = new Date().toISOString();
      }
      saveAll(data);
      emit('settings', data.settings);
    },

    // --- Generic CRUD for collections ---

    /**
     * Get all items of a collection
     * @param {'checklist'|'guests'|'savings'|'timeline'|'moodboard'|'postNikah'} collection
     * @returns {Array}
     */
    getAll(collection) {
      const data = loadAll();
      return data[collection] || [];
    },

    /**
     * Get single item by id
     * @param {string} collection
     * @param {string} id
     * @returns {object|null}
     */
    getById(collection, id) {
      const items = this.getAll(collection);
      return items.find(item => item.id === id) || null;
    },

    /**
     * Add item to collection
     * @param {string} collection
     * @param {object} item — must have 'id' field
     * @returns {object} the added item
     */
    addItem(collection, item) {
      const data = loadAll();
      if (!data[collection]) data[collection] = [];
      data[collection].push(item);
      saveAll(data);
      emit(collection, { action: 'add', item, items: data[collection] });
      return item;
    },

    /**
     * Update item in collection
     * @param {string} collection
     * @param {string} id
     * @param {object} updates — partial object to merge
     * @returns {object|null} updated item
     */
    updateItem(collection, id, updates) {
      const data = loadAll();
      const items = data[collection] || [];
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updates };
      saveAll(data);
      emit(collection, { action: 'update', item: items[index], items });
      return items[index];
    },

    /**
     * Delete item from collection
     * @param {string} collection
     * @param {string} id
     * @returns {boolean}
     */
    deleteItem(collection, id) {
      const data = loadAll();
      const items = data[collection] || [];
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return false;
      const deleted = items.splice(index, 1)[0];
      saveAll(data);
      emit(collection, { action: 'delete', item: deleted, items });
      return true;
    },

    // --- Computed Aggregates ---

    /**
     * Total estimated budget from checklist
     * @returns {number}
     */
    getTotalBudget() {
      const items = this.getAll('checklist');
      return items.reduce((sum, item) => sum + (Number(item.budget) || 0), 0);
    },

    /**
     * Total savings amount
     * @returns {number}
     */
    getTotalSavings() {
      const items = this.getAll('savings');
      return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    },

    /**
     * Total estimated guests (pax)
     * @returns {number}
     */
    getTotalGuests() {
      const items = this.getAll('guests');
      return items.reduce((sum, item) => sum + (Number(item.pax) || 0), 0);
    },

    /**
     * Budget breakdown by checklist category
     * @returns {Object.<string, number>}
     */
    getBudgetByCategory() {
      const items = this.getAll('checklist');
      const result = {};
      items.forEach(item => {
        const cat = item.category || 'Lainnya';
        result[cat] = (result[cat] || 0) + (Number(item.budget) || 0);
      });
      return result;
    },

    /**
     * Guest count by category
     * @returns {Object.<string, number>}
     */
    getGuestsByCategory() {
      const items = this.getAll('guests');
      const result = {};
      items.forEach(item => {
        const cat = item.category || 'Lainnya';
        result[cat] = (result[cat] || 0) + (Number(item.pax) || 0);
      });
      return result;
    },

    /**
     * Checklist completion stats
     * @returns {{ total: number, completed: number, percentage: number }}
     */
    getChecklistStats() {
      const items = this.getAll('checklist');
      const total = items.length;
      const completed = items.filter(i => i.completed).length;
      return {
        total,
        completed,
        percentage: total ? Math.round((completed / total) * 100) : 0,
      };
    },

    /**
     * Clear all data (reset)
     */
    clearAll() {
      localStorage.removeItem(STORAGE_KEY);
      emit('change', { action: 'clear' });
    },
  };
})();

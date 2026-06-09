/* ============================================
   NikahPlanner — Data Store (localStorage + Firestore Cloud Sync)
   ============================================ */

const Store = (() => {
  const STORAGE_KEY = 'nikahplanner_data';

  // Cloud sync state
  let cloudSyncEnabled = false;
  let currentUid = null;
  let syncDebounceTimer = null;
  const SYNC_DEBOUNCE_MS = 1500;

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
      // Trigger cloud sync if enabled
      if (cloudSyncEnabled) {
        debouncedCloudSync(data);
      }
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

  // ==================== CLOUD SYNC ====================

  /**
   * Update sync indicator UI
   * @param {'syncing'|'synced'|'error'} status
   */
  function updateSyncUI(status) {
    const indicator = document.getElementById('sync-indicator');
    const dot = document.getElementById('sync-dot');
    const statusText = document.getElementById('sync-status');

    if (!indicator) return;
    indicator.style.display = 'flex';

    if (status === 'syncing') {
      if (dot) { dot.classList.add('syncing'); dot.style.background = ''; }
      if (statusText) statusText.textContent = 'Menyinkronkan...';
    } else if (status === 'synced') {
      if (dot) { dot.classList.remove('syncing'); dot.style.background = ''; }
      if (statusText) statusText.textContent = 'Data tersinkron';
    } else if (status === 'error') {
      if (dot) { dot.classList.remove('syncing'); dot.style.background = 'var(--color-danger)'; }
      if (statusText) statusText.textContent = 'Gagal sinkron';
    }
  }

  /**
   * Save data to Firestore
   * @param {object} data
   * @returns {Promise}
   */
  function syncToCloud(data) {
    if (!firebaseDb || !currentUid) return Promise.resolve();

    updateSyncUI('syncing');

    return firebaseDb
      .collection('users')
      .doc(currentUid)
      .set({
        plannerData: data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      .then(() => {
        updateSyncUI('synced');
        console.log('☁️ Data synced to cloud');
      })
      .catch((error) => {
        updateSyncUI('error');
        console.error('☁️ Cloud sync error:', error);
      });
  }

  /**
   * Debounced cloud sync — waits before syncing to batch rapid changes
   * @param {object} data
   */
  function debouncedCloudSync(data) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      syncToCloud(data);
    }, SYNC_DEBOUNCE_MS);
  }

  /**
   * Load data from Firestore
   * @returns {Promise<object|null>}
   */
  function loadFromCloud() {
    if (!firebaseDb || !currentUid) return Promise.resolve(null);

    return firebaseDb
      .collection('users')
      .doc(currentUid)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().plannerData) {
          console.log('☁️ Data loaded from cloud');
          return doc.data().plannerData;
        }
        return null;
      })
      .catch((error) => {
        console.error('☁️ Cloud load error:', error);
        return null;
      });
  }

  /**
   * Merge cloud data with local data
   * Cloud data takes priority, but missing collections fallback to local
   * @param {object} localData
   * @param {object} cloudData
   * @returns {object}
   */
  function mergeData(localData, cloudData) {
    if (!cloudData) return localData;
    if (!localData || !localData.settings.weddingDate) return cloudData;

    // If both exist, cloud takes priority (most recent)
    // But if cloud has no data in a collection and local does, keep local
    const merged = { ...JSON.parse(JSON.stringify(defaultData)) };

    // Settings: cloud wins if present
    merged.settings = cloudData.settings && cloudData.settings.weddingDate
      ? { ...defaultData.settings, ...cloudData.settings }
      : { ...defaultData.settings, ...localData.settings };

    // Collections: use cloud if it has items, otherwise fallback to local
    const collections = ['checklist', 'guests', 'savings', 'timeline', 'moodboard', 'postNikah'];
    collections.forEach(col => {
      if (cloudData[col] && cloudData[col].length > 0) {
        merged[col] = cloudData[col];
      } else if (localData[col] && localData[col].length > 0) {
        merged[col] = localData[col];
      }
    });

    return merged;
  }

  /**
   * Enable cloud sync for a given user
   * @param {string} uid — Firebase user ID
   * @returns {Promise}
   */
  function enableCloudSync(uid) {
    currentUid = uid;
    cloudSyncEnabled = true;

    // Load from cloud, merge with local, then sync back
    return loadFromCloud().then((cloudData) => {
      const localData = loadAll();
      const merged = mergeData(localData, cloudData);

      // Save merged data locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      // Sync merged data back to cloud (ensures cloud has latest)
      syncToCloud(merged);

      // Notify all listeners of data change
      emit('change', { action: 'cloud-sync', data: merged });

      updateSyncUI('synced');
      return merged;
    });
  }

  /**
   * Disable cloud sync (on logout) and clear local cache
   */
  function disableCloudSync() {
    cloudSyncEnabled = false;
    currentUid = null;
    clearTimeout(syncDebounceTimer);
    
    // Clear local storage cache to prevent session leaks
    localStorage.removeItem(STORAGE_KEY);
    
    const indicator = document.getElementById('sync-indicator');
    if (indicator) indicator.style.display = 'none';
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
      // Also clear cloud data if syncing
      if (cloudSyncEnabled && firebaseDb && currentUid) {
        firebaseDb.collection('users').doc(currentUid).delete().catch(e => {
          console.error('Store: Error clearing cloud data', e);
        });
      }
      emit('change', { action: 'clear' });
    },

    // --- Cloud Sync API ---
    enableCloudSync,
    disableCloudSync,
  };
})();

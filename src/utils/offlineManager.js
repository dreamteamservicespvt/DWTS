/**
 * Offline Manager - PWA Offline-First Functionality
 * Handles offline data caching and sync with IndexedDB
 */

const DB_NAME = 'DWTS_Offline';
const DB_VERSION = 1;
const STORES = {
  TASKS: 'tasks',
  PENDING_SYNC: 'pendingSync',
  SETTINGS: 'settings',
};

class OfflineManager {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = [];
    
    this.init();
    this.setupEventListeners();
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create tasks store
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          taskStore.createIndex('userId', 'userId', { unique: false });
          taskStore.createIndex('date', 'date', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
        }

        // Create pending sync store
        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          const syncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Setup online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners({ type: 'online' });
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners({ type: 'offline' });
    });
  }

  /**
   * Add listener for online/offline status changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach((cb) => cb(event));
  }

  /**
   * Save task to IndexedDB
   */
  async saveTask(task) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.put(task);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all tasks from IndexedDB
   */
  async getAllTasks(userId = null) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readonly');
      const store = transaction.objectStore(STORES.TASKS);
      
      let request;
      if (userId) {
        const index = store.index('userId');
        request = index.getAll(userId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete task from IndexedDB
   */
  async deleteTask(taskId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.delete(taskId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add operation to pending sync queue
   */
  async addToPendingSync(operation) {
    if (!this.db) await this.init();

    const pendingItem = {
      ...operation,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.add(pendingItem);

      request.onsuccess = () => {
        this.notifyListeners({ type: 'pendingSync', count: 1 });
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending sync operations
   */
  async getPendingSync() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readonly');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove from pending sync after successful sync
   */
  async removePendingSync(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending changes when back online
   */
  async syncPendingChanges() {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    this.notifyListeners({ type: 'syncStart' });

    try {
      const pending = await this.getPendingSync();
      
      for (const item of pending) {
        try {
          // Execute the pending operation
          // This should be implemented based on your Firebase operations
          await this.executePendingOperation(item);
          
          // Remove from pending after successful sync
          await this.removePendingSync(item.id);
        } catch (error) {
          console.error('Error syncing item:', item, error);
          
          // Increment retry count
          item.retries = (item.retries || 0) + 1;
          
          // If max retries reached, you might want to handle it differently
          if (item.retries >= 3) {
            console.warn('Max retries reached for item:', item);
          }
        }
      }

      this.notifyListeners({ type: 'syncComplete', synced: pending.length });
    } catch (error) {
      console.error('Error during sync:', error);
      this.notifyListeners({ type: 'syncError', error });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Execute pending operation (to be implemented with actual Firebase calls)
   */
  async executePendingOperation(item) {
    // This is a placeholder - implement actual Firebase operations here
    console.log('Executing pending operation:', item);
    
    // Example:
    // if (item.type === 'createTask') {
    //   await addDoc(collection(db, 'tasks'), item.data);
    // } else if (item.type === 'updateTask') {
    //   await updateDoc(doc(db, 'tasks', item.data.id), item.data);
    // } else if (item.type === 'deleteTask') {
    //   await deleteDoc(doc(db, 'tasks', item.data.id));
    // }
  }

  /**
   * Save setting
   */
  async saveSetting(key, value) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get setting
   */
  async getSetting(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if online
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Clear all offline data (use with caution)
   */
  async clearAllData() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [STORES.TASKS, STORES.PENDING_SYNC, STORES.SETTINGS],
        'readwrite'
      );

      const clearTasks = transaction.objectStore(STORES.TASKS).clear();
      const clearSync = transaction.objectStore(STORES.PENDING_SYNC).clear();
      const clearSettings = transaction.objectStore(STORES.SETTINGS).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
const offlineManager = new OfflineManager();
export default offlineManager;

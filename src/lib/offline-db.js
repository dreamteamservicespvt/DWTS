/**
 * IndexedDB Configuration using Dexie.js
 * 
 * Offline-first data storage for:
 * - Task sync queue (pending offline edits)
 * - Cached tasks (for offline viewing)
 * - Conflict resolution (when local and remote differ)
 * - Audit log cache (for fast UI)
 * 
 * Architecture:
 * - All writes go to IndexedDB first (optimistic updates)
 * - Background sync pushes to Firestore when online
 * - Conflict detection on sync compares versions
 * - FIFO queue processing with exponential backoff on errors
 * 
 * Tables:
 * 1. offlineQueue: Tasks awaiting sync to server
 * 2. cachedTasks: Local copy of user's tasks
 * 3. conflicts: Tasks with detected conflicts
 * 4. auditLogCache: Recent audit entries for quick display
 * 5. metadata: App metadata (last sync time, version, etc.)
 */

import Dexie from 'dexie';

// Initialize Dexie database
export const db = new Dexie('DWTS_OfflineDB');

// Define schema
db.version(1).stores({
  // Offline sync queue - FIFO processing
  offlineQueue: '++id, taskId, operation, timestamp, retryCount, userId',
  
  // Cached tasks for offline viewing
  cachedTasks: 'taskId, userId, date, updatedAt, syncedAt',
  
  // Conflicts detected during sync
  conflicts: '++id, taskId, userId, detectedAt, resolved',
  
  // Audit log cache
  auditLogCache: '++id, timestamp, actorId, action, targetId',
  
  // Metadata (last sync, app version, user preferences)
  metadata: 'key',
});

/**
 * Offline Queue Item Schema
 * {
 *   id: auto-increment
 *   taskId: string (Firestore doc ID)
 *   operation: 'create' | 'update' | 'delete'
 *   payload: object (task data)
 *   timestamp: Date (when queued)
 *   retryCount: number (for exponential backoff)
 *   maxRetries: number (default 5)
 *   userId: string
 *   status: 'pending' | 'processing' | 'failed'
 *   error: string (last error message)
 * }
 */

/**
 * Cached Task Schema
 * {
 *   taskId: string (primary key)
 *   userId: string
 *   date: string (YYYY-MM-DD)
 *   data: object (full task data)
 *   version: number (conflict detection)
 *   updatedAt: Date (local update time)
 *   syncedAt: Date (last successful sync)
 *   isDeleted: boolean
 * }
 */

/**
 * Conflict Schema
 * {
 *   id: auto-increment
 *   taskId: string
 *   userId: string
 *   localVersion: object (local task data)
 *   remoteVersion: object (server task data)
 *   detectedAt: Date
 *   resolved: boolean
 *   resolution: 'keep_local' | 'keep_remote' | 'merge' | null
 *   resolvedAt: Date
 * }
 */

/**
 * Audit Log Cache Schema
 * {
 *   id: auto-increment
 *   timestamp: Date
 *   actorId: string
 *   actorRole: string
 *   action: string
 *   targetType: string
 *   targetId: string
 *   before: object
 *   after: object
 *   metadata: object
 * }
 */

/**
 * Metadata Schema
 * {
 *   key: string (primary key) - e.g., 'lastSyncTime', 'appVersion'
 *   value: any
 *   updatedAt: Date
 * }
 */

// ==================== OFFLINE QUEUE OPERATIONS ====================

/**
 * Add task operation to offline queue
 * @param {string} operation - 'create' | 'update' | 'delete'
 * @param {object} taskData - Task data
 * @param {string} userId - User ID
 * @returns {Promise<number>} Queue item ID
 */
export const addToOfflineQueue = async (operation, taskData, userId) => {
  try {
    const queueItem = {
      taskId: taskData.id || `temp_${Date.now()}`,
      operation,
      payload: taskData,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 5,
      userId,
      status: 'pending',
      error: null,
    };
    
    const id = await db.offlineQueue.add(queueItem);
    console.log('✅ Added to offline queue:', { id, operation, taskId: queueItem.taskId });
    return id;
  } catch (error) {
    console.error('❌ Failed to add to offline queue:', error);
    throw error;
  }
};

/**
 * Get all pending items in queue
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Queue items
 */
export const getPendingQueueItems = async (userId) => {
  return await db.offlineQueue
    .where('userId').equals(userId)
    .and(item => item.status === 'pending')
    .sortBy('timestamp'); // FIFO
};

/**
 * Mark queue item as processing
 * @param {number} id - Queue item ID
 */
export const markQueueItemProcessing = async (id) => {
  await db.offlineQueue.update(id, { status: 'processing' });
};

/**
 * Mark queue item as failed and increment retry count
 * @param {number} id - Queue item ID
 * @param {string} error - Error message
 */
export const markQueueItemFailed = async (id, error) => {
  const item = await db.offlineQueue.get(id);
  const newRetryCount = (item?.retryCount || 0) + 1;
  const status = newRetryCount >= (item?.maxRetries || 5) ? 'failed' : 'pending';
  
  await db.offlineQueue.update(id, {
    status,
    error,
    retryCount: newRetryCount,
  });
  
  return { retryCount: newRetryCount, maxRetries: item?.maxRetries || 5 };
};

/**
 * Remove item from queue (after successful sync)
 * @param {number} id - Queue item ID
 */
export const removeFromQueue = async (id) => {
  await db.offlineQueue.delete(id);
  console.log('✅ Removed from queue:', id);
};

/**
 * Clear all queue items for user (e.g., after full sync)
 * @param {string} userId - User ID
 */
export const clearQueue = async (userId) => {
  await db.offlineQueue.where('userId').equals(userId).delete();
};

// ==================== CACHED TASKS OPERATIONS ====================

/**
 * Cache task for offline viewing
 * @param {object} task - Task data
 * @param {string} userId - User ID
 */
export const cacheTask = async (task, userId) => {
  try {
    const cachedTask = {
      taskId: task.id,
      userId,
      date: task.date,
      data: task,
      version: task.version || 1,
      updatedAt: new Date(),
      syncedAt: new Date(),
      isDeleted: false,
    };
    
    await db.cachedTasks.put(cachedTask);
    console.log('✅ Cached task:', task.id);
  } catch (error) {
    console.error('❌ Failed to cache task:', error);
  }
};

/**
 * Cache multiple tasks
 * @param {Array} tasks - Array of tasks
 * @param {string} userId - User ID
 */
export const cacheTasks = async (tasks, userId) => {
  try {
    const cachedTasks = tasks.map(task => ({
      taskId: task.id,
      userId,
      date: task.date,
      data: task,
      version: task.version || 1,
      updatedAt: new Date(),
      syncedAt: new Date(),
      isDeleted: false,
    }));
    
    await db.cachedTasks.bulkPut(cachedTasks);
    console.log('✅ Cached tasks:', tasks.length);
  } catch (error) {
    console.error('❌ Failed to cache tasks:', error);
  }
};

/**
 * Get cached task
 * @param {string} taskId - Task ID
 * @returns {Promise<object>} Cached task
 */
export const getCachedTask = async (taskId) => {
  const cached = await db.cachedTasks.get(taskId);
  return cached?.data;
};

/**
 * Get all cached tasks for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Cached tasks
 */
export const getCachedTasks = async (userId) => {
  const cached = await db.cachedTasks
    .where('userId').equals(userId)
    .and(task => !task.isDeleted)
    .toArray();
  
  return cached.map(item => item.data);
};

/**
 * Clear old cached tasks (older than 30 days)
 * @param {string} userId - User ID
 */
export const clearOldCache = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await db.cachedTasks
    .where('userId').equals(userId)
    .and(task => new Date(task.date) < thirtyDaysAgo)
    .delete();
};

// ==================== CONFLICT OPERATIONS ====================

/**
 * Add conflict
 * @param {string} taskId - Task ID
 * @param {string} userId - User ID
 * @param {object} localVersion - Local task data
 * @param {object} remoteVersion - Remote task data
 */
export const addConflict = async (taskId, userId, localVersion, remoteVersion) => {
  const conflict = {
    taskId,
    userId,
    localVersion,
    remoteVersion,
    detectedAt: new Date(),
    resolved: false,
    resolution: null,
    resolvedAt: null,
  };
  
  const id = await db.conflicts.add(conflict);
  console.warn('⚠️ Conflict detected:', { id, taskId });
  return id;
};

/**
 * Get unresolved conflicts for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Conflicts
 */
export const getUnresolvedConflicts = async (userId) => {
  return await db.conflicts
    .where('userId').equals(userId)
    .and(conflict => !conflict.resolved)
    .toArray();
};

/**
 * Resolve conflict
 * @param {number} conflictId - Conflict ID
 * @param {string} resolution - 'keep_local' | 'keep_remote' | 'merge'
 */
export const resolveConflict = async (conflictId, resolution) => {
  await db.conflicts.update(conflictId, {
    resolved: true,
    resolution,
    resolvedAt: new Date(),
  });
  console.log('✅ Conflict resolved:', { conflictId, resolution });
};

// ==================== AUDIT LOG CACHE ====================

/**
 * Cache audit log entries
 * @param {Array} logs - Audit log entries
 */
export const cacheAuditLogs = async (logs) => {
  await db.auditLogCache.bulkAdd(logs);
};

/**
 * Get cached audit logs
 * @param {number} limit - Max number of entries
 * @returns {Promise<Array>} Audit logs
 */
export const getCachedAuditLogs = async (limit = 100) => {
  return await db.auditLogCache
    .orderBy('timestamp')
    .reverse()
    .limit(limit)
    .toArray();
};

// ==================== METADATA OPERATIONS ====================

/**
 * Set metadata value
 * @param {string} key - Metadata key
 * @param {any} value - Metadata value
 */
export const setMetadata = async (key, value) => {
  await db.metadata.put({
    key,
    value,
    updatedAt: new Date(),
  });
};

/**
 * Get metadata value
 * @param {string} key - Metadata key
 * @returns {Promise<any>} Metadata value
 */
export const getMetadata = async (key) => {
  const item = await db.metadata.get(key);
  return item?.value;
};

/**
 * Get last sync time
 * @returns {Promise<Date>} Last sync time
 */
export const getLastSyncTime = async () => {
  return await getMetadata('lastSyncTime');
};

/**
 * Set last sync time
 * @param {Date} time - Sync time
 */
export const setLastSyncTime = async (time = new Date()) => {
  await setMetadata('lastSyncTime', time);
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clear entire database (for testing or logout)
 */
export const clearDatabase = async () => {
  await db.delete();
  console.log('✅ Database cleared');
};

/**
 * Get database stats
 * @returns {Promise<object>} Database statistics
 */
export const getDatabaseStats = async () => {
  const queueCount = await db.offlineQueue.count();
  const cachedTasksCount = await db.cachedTasks.count();
  const conflictsCount = await db.conflicts.where('resolved').equals(false).count();
  const auditLogsCount = await db.auditLogCache.count();
  
  return {
    queueCount,
    cachedTasksCount,
    unresolvedConflicts: conflictsCount,
    auditLogsCount,
    lastSyncTime: await getLastSyncTime(),
  };
};

export default db;

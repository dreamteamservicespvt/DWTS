/**
 * Offline Queue System using IndexedDB
 * Handles offline operations and syncs when online
 */

import { openDB } from 'idb';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const DB_NAME = 'dwts-offline';
const STORE_NAME = 'queue';
const DB_VERSION = 1;

// Initialize IndexedDB
let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('userId', 'userId');
          store.createIndex('status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Enqueue an offline action
 */
export async function enqueueAction(action) {
  const db = await getDB();
  const item = {
    ...action,
    timestamp: Date.now(),
    status: 'pending',
    retries: 0,
    lastError: null
  };
  
  const id = await db.add(STORE_NAME, item);
  console.log('📥 Queued offline action:', id, action.type);
  return id;
}

/**
 * Get all pending items in queue
 */
export async function getQueueItems(status = 'pending') {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('status');
  return index.getAll(status);
}

/**
 * Get queue status
 */
export async function getQueueStatus() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  
  return {
    total: all.length,
    pending: all.filter(i => i.status === 'pending').length,
    processing: all.filter(i => i.status === 'processing').length,
    failed: all.filter(i => i.status === 'failed').length,
    synced: all.filter(i => i.status === 'synced').length,
  };
}

/**
 * Update queue item status
 */
export async function updateQueueItem(id, updates) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const item = await store.get(id);
  
  if (item) {
    Object.assign(item, updates, { 
      lastUpdated: Date.now() 
    });
    await store.put(item);
  }
  
  await tx.done;
}

/**
 * Delete queue item
 */
export async function deleteQueueItem(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Clear synced items older than specified time
 */
export async function clearSyncedItems(olderThanMs = 24 * 60 * 60 * 1000) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const all = await store.getAll();
  
  const cutoff = Date.now() - olderThanMs;
  const toDelete = all.filter(
    item => item.status === 'synced' && item.timestamp < cutoff
  );
  
  for (const item of toDelete) {
    await store.delete(item.id);
  }
  
  await tx.done;
  console.log(`🗑️ Cleared ${toDelete.length} synced items`);
}

/**
 * Process queue - sync to Firestore
 */
export async function processQueue(onProgress) {
  if (!navigator.onLine) {
    console.log('⚠️ Cannot process queue: offline');
    return { success: false, reason: 'offline' };
  }

  const items = await getQueueItems('pending');
  
  if (items.length === 0) {
    console.log('✅ Queue is empty');
    return { success: true, processed: 0 };
  }

  console.log(`🔄 Processing ${items.length} queued items...`);
  
  let processed = 0;
  let failed = 0;
  const conflicts = [];

  for (const item of items) {
    try {
      await updateQueueItem(item.id, { status: 'processing' });
      
      // Execute the action
      const result = await executeAction(item);
      
      if (result.conflict) {
        conflicts.push({ item, serverData: result.serverData });
        await updateQueueItem(item.id, { 
          status: 'conflict',
          conflictData: result.serverData 
        });
      } else {
        await updateQueueItem(item.id, { status: 'synced' });
        processed++;
      }
      
      if (onProgress) {
        onProgress({ processed, failed, conflicts, total: items.length });
      }
    } catch (error) {
      console.error('❌ Failed to process queue item:', item.id, error);
      failed++;
      
      await updateQueueItem(item.id, {
        status: item.retries >= 2 ? 'failed' : 'pending',
        retries: (item.retries || 0) + 1,
        lastError: error.message
      });
    }
  }

  console.log(`✅ Queue processed: ${processed} synced, ${failed} failed, ${conflicts.length} conflicts`);
  
  return { 
    success: true, 
    processed, 
    failed, 
    conflicts 
  };
}

/**
 * Execute a queued action
 */
async function executeAction(item) {
  const { type, collection: collectionName, data, id: docId } = item.payload;

  switch (type) {
    case 'create': {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
        syncedFromOffline: true
      });
      return { success: true, docId: docRef.id };
    }

    case 'update': {
      const docRef = doc(db, collectionName, docId);
      
      // Check for conflicts (optional - implement conflict detection)
      // For now, just update
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
        syncedFromOffline: true
      });
      
      return { success: true };
    }

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

/**
 * Check if online and auto-process
 */
export function setupAutoSync() {
  window.addEventListener('online', async () => {
    console.log('🌐 Back online - processing queue...');
    await processQueue();
  });

  // Also process on page load if online
  if (navigator.onLine) {
    setTimeout(() => {
      processQueue();
    }, 1000);
  }
}

/**
 * Get conflict items for user resolution
 */
export async function getConflicts() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('status');
  return index.getAll('conflict');
}

/**
 * Resolve conflict
 */
export async function resolveConflict(itemId, resolution, mergedData) {
  const db = await getDB();
  const item = await db.get(STORE_NAME, itemId);
  
  if (!item) {
    throw new Error('Conflict item not found');
  }

  switch (resolution) {
    case 'keep-local':
      // Force update with local data
      await executeAction(item);
      await updateQueueItem(itemId, { status: 'synced' });
      break;
      
    case 'keep-server':
      // Discard local changes
      await updateQueueItem(itemId, { status: 'discarded' });
      break;
      
    case 'merge':
      // Use merged data
      item.payload.data = mergedData;
      await executeAction(item);
      await updateQueueItem(itemId, { status: 'synced' });
      break;
      
    default:
      throw new Error(`Unknown resolution: ${resolution}`);
  }
}

export default {
  enqueueAction,
  getQueueItems,
  getQueueStatus,
  processQueue,
  setupAutoSync,
  getConflicts,
  resolveConflict,
  clearSyncedItems
};

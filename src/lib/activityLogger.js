/**
 * Activity Logging System
 * Immutable audit trail for all critical actions
 */

import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Log an activity
 */
export async function logActivity({
  actorId,
  actorName,
  action,
  targetId,
  targetType,
  before = null,
  after = null,
  metadata = {}
}) {
  try {
    // Get device info
    const device = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`
    };

    const activityData = {
      actorId,
      actorName,
      action,
      targetId,
      targetType,
      before,
      after,
      metadata,
      device,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString() // For indexing
    };

    const docRef = await addDoc(collection(db, 'activityLog'), activityData);
    
    console.log(`📝 Activity logged: ${action} on ${targetType}/${targetId}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break main functionality
  }
}

/**
 * Get activity logs for a specific target
 */
export async function getActivityLogs({
  targetId,
  targetType,
  actorId,
  action,
  limitCount = 50
}) {
  const constraints = [];
  
  if (targetId) {
    constraints.push(where('targetId', '==', targetId));
  }
  if (targetType) {
    constraints.push(where('targetType', '==', targetType));
  }
  if (actorId) {
    constraints.push(where('actorId', '==', actorId));
  }
  if (action) {
    constraints.push(where('action', '==', action));
  }
  
  constraints.push(orderBy('timestamp', 'desc'));
  constraints.push(limit(limitCount));

  const q = query(collection(db, 'activityLog'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Export activity logs to CSV
 */
export function exportActivityLogsToCSV(logs) {
  const headers = [
    'Timestamp',
    'Actor',
    'Action',
    'Target Type',
    'Target ID',
    'Device',
    'Changes'
  ];

  const rows = logs.map(log => [
    new Date(log.timestamp?.toDate?.() || log.createdAt).toLocaleString(),
    log.actorName || log.actorId,
    log.action,
    log.targetType,
    log.targetId,
    log.device?.userAgent?.substring(0, 50) || 'Unknown',
    JSON.stringify({ before: log.before, after: log.after })
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => 
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Common activity types
 */
export const ACTIVITY_TYPES = {
  // User actions
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Client actions
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_DELETED: 'client.deleted',
  
  // Project actions
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  
  // Task actions
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_ASSIGNED: 'task.assigned',
  TASK_REASSIGNED: 'task.reassigned',
  TASK_STARTED: 'task.started',
  TASK_PROGRESS_UPDATED: 'task.progress_updated',
  TASK_SUBMITTED: 'task.submitted',
  TASK_APPROVED: 'task.approved',
  TASK_REWORK_REQUESTED: 'task.rework_requested',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  TASK_RESCHEDULED: 'task.rescheduled',
  
  // File actions
  FILE_UPLOADED: 'file.uploaded',
  FILE_DELETED: 'file.deleted',
  
  // Comment actions
  COMMENT_ADDED: 'comment.added',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted'
};

/**
 * Helper to log task status change
 */
export async function logTaskStatusChange(
  actorId,
  actorName,
  taskId,
  oldStatus,
  newStatus,
  comment = null
) {
  return logActivity({
    actorId,
    actorName,
    action: ACTIVITY_TYPES.TASK_UPDATED,
    targetId: taskId,
    targetType: 'task',
    before: { status: oldStatus },
    after: { status: newStatus },
    metadata: { comment }
  });
}

/**
 * Helper to log task assignment
 */
export async function logTaskAssignment(
  actorId,
  actorName,
  taskId,
  assignedTo,
  assignedToName
) {
  return logActivity({
    actorId,
    actorName,
    action: ACTIVITY_TYPES.TASK_ASSIGNED,
    targetId: taskId,
    targetType: 'task',
    after: { assignedTo, assignedToName }
  });
}

/**
 * Helper to log file upload
 */
export async function logFileUpload(
  actorId,
  actorName,
  taskId,
  fileName,
  fileUrl,
  fileSize
) {
  return logActivity({
    actorId,
    actorName,
    action: ACTIVITY_TYPES.FILE_UPLOADED,
    targetId: taskId,
    targetType: 'task',
    metadata: {
      fileName,
      fileUrl,
      fileSize
    }
  });
}

export default {
  logActivity,
  getActivityLogs,
  exportActivityLogsToCSV,
  logTaskStatusChange,
  logTaskAssignment,
  logFileUpload,
  ACTIVITY_TYPES
};

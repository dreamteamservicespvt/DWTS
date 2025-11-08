/**
 * Notification Service
 * Handle in-app and push notifications
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_OVERDUE: 'task_overdue',
  TASK_SUBMITTED: 'task_submitted',
  TASK_APPROVED: 'task_approved',
  TASK_REWORK: 'task_rework',
  TASK_COMMENT: 'task_comment',
  PROJECT_ASSIGNED: 'project_assigned',
  DEADLINE_APPROACHING: 'deadline_approaching',
  MENTION: 'mention'
};

/**
 * Create a notification
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  actionUrl = null,
  actionLabel = null,
  metadata = {}
}) {
  try {
    const notification = {
      userId,
      type,
      title,
      message,
      actionUrl,
      actionLabel,
      metadata,
      read: false,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return { id: docRef.id, ...notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create task assigned notification
 */
export async function notifyTaskAssigned(task, assignedUser) {
  const dueDate = task.endTime ? new Date(task.endTime).toLocaleDateString() : 'No deadline';
  
  return createNotification({
    userId: task.assignedTo,
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    title: '📋 New Task Assigned',
    message: `"${task.title}" assigned to you by ${assignedUser.name || 'Admin'}. Due: ${dueDate}`,
    actionUrl: `/tasks/${task.id}`,
    actionLabel: 'View Task',
    metadata: {
      taskId: task.id,
      taskTitle: task.title,
      impact: task.impact,
      deadline: task.endTime
    }
  });
}

/**
 * Create task due soon notification
 */
export async function notifyTaskDueSoon(task, userName) {
  return createNotification({
    userId: task.assignedTo,
    type: NOTIFICATION_TYPES.TASK_DUE_SOON,
    title: '⏰ Task Due Soon',
    message: `"${task.title}" is due in 1 hour!`,
    actionUrl: `/tasks/${task.id}`,
    actionLabel: 'Work on Task',
    metadata: {
      taskId: task.id,
      taskTitle: task.title,
      deadline: task.endTime
    }
  });
}

/**
 * Create task overdue notification
 */
export async function notifyTaskOverdue(task) {
  return createNotification({
    userId: task.assignedTo,
    type: NOTIFICATION_TYPES.TASK_OVERDUE,
    title: '🚨 Task Overdue',
    message: `"${task.title}" is overdue! Please update status.`,
    actionUrl: `/tasks/${task.id}`,
    actionLabel: 'Update Task',
    metadata: {
      taskId: task.id,
      taskTitle: task.title,
      deadline: task.endTime
    }
  });
}

/**
 * Create task submitted notification
 */
export async function notifyTaskSubmitted(task, submitterName, reviewers) {
  const notifications = [];
  
  for (const reviewerId of reviewers) {
    const notification = await createNotification({
      userId: reviewerId,
      type: NOTIFICATION_TYPES.TASK_SUBMITTED,
      title: '✅ Task Submitted for Review',
      message: `${submitterName} submitted "${task.title}" for your review.`,
      actionUrl: `/tasks/${task.id}`,
      actionLabel: 'Review Task',
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        submittedBy: task.assignedTo,
        submittedAt: task.submittedAt
      }
    });
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Create task approved notification
 */
export async function notifyTaskApproved(task, approverName) {
  return createNotification({
    userId: task.assignedTo,
    type: NOTIFICATION_TYPES.TASK_APPROVED,
    title: '🎉 Task Approved',
    message: `${approverName} approved your task "${task.title}"!`,
    actionUrl: `/tasks/${task.id}`,
    actionLabel: 'View Task',
    metadata: {
      taskId: task.id,
      taskTitle: task.title,
      approvedBy: task.approvedBy,
      approvedAt: task.approvedAt
    }
  });
}

/**
 * Create task rework notification
 */
export async function notifyTaskRework(task, reviewerName, feedback) {
  return createNotification({
    userId: task.assignedTo,
    type: NOTIFICATION_TYPES.TASK_REWORK,
    title: '🔄 Rework Requested',
    message: `${reviewerName} requested changes to "${task.title}": ${feedback}`,
    actionUrl: `/tasks/${task.id}`,
    actionLabel: 'View Feedback',
    metadata: {
      taskId: task.id,
      taskTitle: task.title,
      feedback,
      reviewedBy: task.reviewedBy,
      reviewedAt: task.reviewedAt
    }
  });
}

/**
 * Create project assigned notification
 */
export async function notifyProjectAssigned(project, teamMemberIds, assignedBy) {
  const notifications = [];
  
  for (const memberId of teamMemberIds) {
    const notification = await createNotification({
      userId: memberId,
      type: NOTIFICATION_TYPES.PROJECT_ASSIGNED,
      title: '📁 New Project Assignment',
      message: `You've been added to project "${project.name}" by ${assignedBy}.`,
      actionUrl: `/projects/${project.id}`,
      actionLabel: 'View Project',
      metadata: {
        projectId: project.id,
        projectName: project.name,
        clientId: project.clientId
      }
    });
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Subscribe to user notifications
 */
export function subscribeToNotifications(userId, callback) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifications);
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      read: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(userId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(docSnap =>
      updateDoc(doc(db, 'notifications', docSnap.id), {
        read: true,
        readAt: Timestamp.now()
      })
    );

    await Promise.all(updates);
    return updates.length;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread count
 */
export async function getUnreadCount(userId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Check and send due soon notifications (called by scheduled job)
 */
export async function checkDueSoonTasks() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Query tasks due within the next hour
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('status', 'in', ['pending', 'in-progress']),
      where('endTime', '>=', now),
      where('endTime', '<=', oneHourFromNow)
    );

    const snapshot = await getDocs(tasksQuery);
    const notifications = [];

    for (const docSnap of snapshot.docs) {
      const task = { id: docSnap.id, ...docSnap.data() };
      
      // Check if notification already sent
      const existingNotif = await getDocs(query(
        collection(db, 'notifications'),
        where('metadata.taskId', '==', task.id),
        where('type', '==', NOTIFICATION_TYPES.TASK_DUE_SOON)
      ));

      if (existingNotif.empty) {
        const notification = await notifyTaskDueSoon(task);
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error checking due soon tasks:', error);
    return [];
  }
}

/**
 * Check and send overdue notifications (called by scheduled job)
 */
export async function checkOverdueTasks() {
  try {
    const now = new Date();

    // Query overdue tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('status', 'in', ['pending', 'in-progress']),
      where('endTime', '<', now)
    );

    const snapshot = await getDocs(tasksQuery);
    const notifications = [];

    for (const docSnap of snapshot.docs) {
      const task = { id: docSnap.id, ...docSnap.data() };
      
      // Send daily reminder for overdue tasks
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentNotif = await getDocs(query(
        collection(db, 'notifications'),
        where('metadata.taskId', '==', task.id),
        where('type', '==', NOTIFICATION_TYPES.TASK_OVERDUE),
        where('createdAt', '>=', yesterday)
      ));

      if (recentNotif.empty) {
        const notification = await notifyTaskOverdue(task);
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
    return [];
  }
}

export default {
  NOTIFICATION_TYPES,
  createNotification,
  notifyTaskAssigned,
  notifyTaskDueSoon,
  notifyTaskOverdue,
  notifyTaskSubmitted,
  notifyTaskApproved,
  notifyTaskRework,
  notifyProjectAssigned,
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  checkDueSoonTasks,
  checkOverdueTasks
};

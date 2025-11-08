/**
 * Task Reminder Service
 * Handles 1-hour reminder, start-time reminder, and overdue notifications
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { createNotification } from './notificationService';

/**
 * Check for upcoming tasks and send reminders
 * Should be called every 15 minutes via a background service or Cloud Function
 */
export async function checkAndSendReminders() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];

    // Get all tasks for today
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('date', '==', today),
      where('status', 'in', ['pending', 'in-progress'])
    );

    const tasksSnap = await getDocs(tasksQuery);
    const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const task of tasks) {
      if (!task.startTime || !task.assignedTo) continue;

      const startTime = task.startTime.toDate();
      
      // Check if task starts in 1 hour (with 5-minute window)
      const timeDiff = startTime - now;
      const isOneHourBefore = timeDiff > 55 * 60 * 1000 && timeDiff <= 65 * 60 * 1000;

      // Check if task starts in 5 minutes
      const isFiveMinsBefore = timeDiff > 0 && timeDiff <= 10 * 60 * 1000;

      // Send notifications to each assignee
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];

      for (const userId of assignees) {
        // 1-hour reminder
        if (isOneHourBefore) {
          await createNotification({
            userId,
            type: 'reminder',
            title: `⏰ Reminder: Task starts in 1 hour`,
            message: `"${task.title}" starts at ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            metadata: {
              taskId: task.id,
              taskTitle: task.title,
              startTime: task.startTime,
            },
            actionUrl: `/tasks/${task.id}`,
          });
        }

        // Start time reminder
        if (isFiveMinsBefore) {
          await createNotification({
            userId,
            type: 'reminder',
            title: `🚀 Task starting soon!`,
            message: `"${task.title}" starts in a few minutes`,
            metadata: {
              taskId: task.id,
              taskTitle: task.title,
              startTime: task.startTime,
            },
            actionUrl: `/tasks/${task.id}`,
            priority: 'high',
          });
        }
      }
    }

    console.log(`Checked ${tasks.length} tasks for reminders`);
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

/**
 * Check for overdue tasks and notify admin
 * Should be called once daily
 */
export async function checkOverdueTasks() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all incomplete tasks from yesterday
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('date', '<=', yesterdayStr),
      where('status', 'in', ['pending', 'in-progress'])
    );

    const tasksSnap = await getDocs(tasksQuery);
    const overdueTasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (overdueTasks.length === 0) return;

    // Get all admins
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    const usersSnap = await getDocs(usersQuery);
    const admins = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Notify each admin
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'alert',
        title: `⚠️ ${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
        message: `You have ${overdueTasks.length} incomplete task(s) past their due date`,
        metadata: {
          overdueTasks: overdueTasks.map(t => ({
            id: t.id,
            title: t.title,
            date: t.date,
          })),
        },
        actionUrl: '/tasks?filter=overdue',
        priority: 'high',
      });
    }

    console.log(`Notified admins about ${overdueTasks.length} overdue tasks`);
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
  }
}

/**
 * Send daily task summary to all team members
 * Should be called every morning (e.g., 8 AM)
 */
export async function sendDailyTaskSummary() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all users
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const user of users) {
      // Get user's tasks for today
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('assignedTo', 'array-contains', user.id),
        where('date', '==', today)
      );

      const tasksSnap = await getDocs(tasksQuery);
      const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (tasks.length === 0) continue;

      // Sort by start time
      tasks.sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.toDate() - b.startTime.toDate();
      });

      const taskList = tasks.map((t, idx) => {
        const startTime = t.startTime?.toDate();
        const time = startTime 
          ? startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
          : '';
        return `${idx + 1}. ${time} - ${t.title}`;
      }).join('\n');

      await createNotification({
        userId: user.id,
        type: 'info',
        title: `☀️ Good morning! You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} today`,
        message: `Here's your schedule:\n${taskList}`,
        metadata: {
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            startTime: t.startTime,
          })),
        },
        actionUrl: '/dashboard',
      });
    }

    console.log(`Sent daily summary to ${users.length} users`);
  } catch (error) {
    console.error('Error sending daily summary:', error);
  }
}

/**
 * Setup reminder intervals (client-side)
 * Call this once when the app starts
 */
export function setupReminderService() {
  // Check reminders every 15 minutes
  setInterval(checkAndSendReminders, 15 * 60 * 1000);
  
  // Check immediately on start
  checkAndSendReminders();

  // Check overdue tasks once per day at midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;

  setTimeout(() => {
    checkOverdueTasks();
    // Then check every 24 hours
    setInterval(checkOverdueTasks, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Send daily summary at 8 AM
  const morning = new Date(now);
  morning.setHours(8, 0, 0, 0);
  if (morning < now) {
    morning.setDate(morning.getDate() + 1);
  }
  const msUntilMorning = morning - now;

  setTimeout(() => {
    sendDailyTaskSummary();
    // Then check every 24 hours
    setInterval(sendDailyTaskSummary, 24 * 60 * 60 * 1000);
  }, msUntilMorning);

  console.log('✅ Reminder service initialized');
}

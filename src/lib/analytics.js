/**
 * Analytics & Scoring Engine
 * Calculate performance scores and generate insights
 */

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Impact weights for scoring
 */
const IMPACT_WEIGHTS = {
  'Low': 1,
  'Medium': 2,
  'High': 3,
  'Critical': 4
};

/**
 * Calculate task score based on completion and impact
 */
export function calculateTaskScore(task) {
  const baseScore = IMPACT_WEIGHTS[task.impact || 'Medium'];
  let score = baseScore * 100;

  // Status multiplier
  const statusMultipliers = {
    'Approved': 1.0,
    'Completed': 1.0,
    'Submitted': 0.8,
    'In Progress': 0.5,
    'Not Started': 0,
    'Blocked': 0,
    'Rework': 0.6
  };

  score *= (statusMultipliers[task.status] || 0);

  // Bonus for early completion
  if (task.endTime && task.verifiedAt) {
    const endTime = new Date(task.endTime);
    const completedTime = task.verifiedAt?.toDate?.() || new Date(task.verifiedAt);
    
    if (completedTime < endTime) {
      const hoursEarly = (endTime - completedTime) / (1000 * 60 * 60);
      if (hoursEarly > 24) {
        score += 10; // More than a day early
      } else if (hoursEarly > 0) {
        score += 5; // Early completion
      }
    }
  }

  // Bonus for initiative (admin flagged)
  if (task.initiativeBonus) {
    score += 10;
  }

  // Penalty for being overdue at submission
  if (task.endTime && task.submittedAt) {
    const endTime = new Date(task.endTime);
    const submittedTime = task.submittedAt?.toDate?.() || new Date(task.submittedAt);
    
    if (submittedTime > endTime) {
      const hoursLate = (submittedTime - endTime) / (1000 * 60 * 60);
      score -= Math.min(hoursLate * 2, 20); // Max 20 point penalty
    }
  }

  return Math.max(0, Math.round(score));
}

/**
 * Calculate user performance score
 */
export async function calculateUserScore(userId, dateRange = null) {
  const constraints = [where('assignedTo', '==', userId)];
  
  if (dateRange) {
    const { start, end } = dateRange;
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(start)));
    constraints.push(where('createdAt', '<=', Timestamp.fromDate(end)));
  }

  const q = query(collection(db, 'tasks'), ...constraints);
  const snapshot = await getDocs(q);
  
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  if (tasks.length === 0) {
    return {
      totalScore: 0,
      averageScore: 0,
      tasksCompleted: 0,
      tasksTotal: 0,
      completionRate: 0,
      onTimeRate: 0
    };
  }

  const completedTasks = tasks.filter(t => 
    t.status === 'Approved' || t.status === 'Completed'
  );
  
  const onTimeTasks = completedTasks.filter(t => {
    if (!t.endTime || !t.verifiedAt) return false;
    const endTime = new Date(t.endTime);
    const completedTime = t.verifiedAt?.toDate?.() || new Date(t.verifiedAt);
    return completedTime <= endTime;
  });

  const totalScore = tasks.reduce((sum, task) => sum + calculateTaskScore(task), 0);
  const averageScore = totalScore / tasks.length;
  
  return {
    totalScore: Math.round(totalScore),
    averageScore: Math.round(averageScore),
    tasksCompleted: completedTasks.length,
    tasksTotal: tasks.length,
    completionRate: Math.round((completedTasks.length / tasks.length) * 100),
    onTimeRate: completedTasks.length > 0 
      ? Math.round((onTimeTasks.length / completedTasks.length) * 100)
      : 0,
    impactBreakdown: getImpactBreakdown(tasks)
  };
}

/**
 * Get impact breakdown
 */
function getImpactBreakdown(tasks) {
  const breakdown = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0
  };

  tasks.forEach(task => {
    const impact = task.impact || 'Medium';
    breakdown[impact] = (breakdown[impact] || 0) + 1;
  });

  return breakdown;
}

/**
 * Get team performance summary
 */
export async function getTeamPerformance(dateRange = null) {
  const usersSnapshot = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'member'))
  );
  
  const users = usersSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));

  const performanceData = await Promise.all(
    users.map(async user => {
      const score = await calculateUserScore(user.id, dateRange);
      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        photoURL: user.photoURL,
        ...score
      };
    })
  );

  // Sort by total score descending
  performanceData.sort((a, b) => b.totalScore - a.totalScore);

  return performanceData;
}

/**
 * Get client statistics
 */
export async function getClientStats(clientId, dateRange = null) {
  const constraints = [where('clientId', '==', clientId)];
  
  if (dateRange) {
    const { start, end } = dateRange;
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(start)));
    constraints.push(where('createdAt', '<=', Timestamp.fromDate(end)));
  }

  const q = query(collection(db, 'tasks'), ...constraints);
  const snapshot = await getDocs(q);
  
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const completedTasks = tasks.filter(t => 
    t.status === 'Approved' || t.status === 'Completed'
  );
  
  const billableTasks = tasks.filter(t => t.isBillable);
  const billableHours = billableTasks.reduce((sum, t) => 
    sum + (t.durationHours || 0), 0
  );

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    completionRate: tasks.length > 0 
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0,
    billableHours: Math.round(billableHours * 10) / 10,
    statusBreakdown: getStatusBreakdown(tasks),
    typeBreakdown: getTypeBreakdown(tasks)
  };
}

/**
 * Get status breakdown
 */
function getStatusBreakdown(tasks) {
  const breakdown = {};
  
  tasks.forEach(task => {
    const status = task.status || 'Not Started';
    breakdown[status] = (breakdown[status] || 0) + 1;
  });

  return breakdown;
}

/**
 * Get type breakdown
 */
function getTypeBreakdown(tasks) {
  const breakdown = {};
  
  tasks.forEach(task => {
    const type = task.taskType || 'Other';
    breakdown[type] = (breakdown[type] || 0) + 1;
  });

  return breakdown;
}

/**
 * Get daily task completion trend
 */
export async function getDailyCompletionTrend(days = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    collection(db, 'tasks'),
    where('verifiedAt', '>=', Timestamp.fromDate(startDate)),
    where('verifiedAt', '<=', Timestamp.fromDate(endDate))
  );
  
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Group by date
  const dateMap = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dateMap[dateKey] = 0;
  }

  tasks.forEach(task => {
    if (task.verifiedAt) {
      const date = task.verifiedAt.toDate?.() || new Date(task.verifiedAt);
      const dateKey = date.toISOString().split('T')[0];
      if (dateMap[dateKey] !== undefined) {
        dateMap[dateKey]++;
      }
    }
  });

  return Object.entries(dateMap).map(([date, count]) => ({
    date,
    count
  }));
}

/**
 * Get task density heatmap (by hour and day of week)
 */
export async function getTaskDensityHeatmap(dateRange = null) {
  const constraints = [];
  
  if (dateRange) {
    const { start, end } = dateRange;
    constraints.push(where('startTime', '>=', start.toISOString()));
    constraints.push(where('startTime', '<=', end.toISOString()));
  }

  const q = query(collection(db, 'tasks'), ...constraints);
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Initialize heatmap: [dayOfWeek][hour] = count
  const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));

  tasks.forEach(task => {
    if (task.startTime) {
      const date = new Date(task.startTime);
      const dayOfWeek = date.getDay(); // 0 = Sunday
      const hour = date.getHours();
      heatmap[dayOfWeek][hour]++;
    }
  });

  return heatmap;
}

export default {
  calculateTaskScore,
  calculateUserScore,
  getTeamPerformance,
  getClientStats,
  getDailyCompletionTrend,
  getTaskDensityHeatmap
};

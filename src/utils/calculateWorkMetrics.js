/**
 * Calculate comprehensive work metrics for team members
 * Includes both daily tasks and assigned work
 */

import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

/**
 * Calculate assigned work metrics
 * @param {Array} assignedWorks - Array of assigned work objects
 * @returns {Object} - Metrics object
 */
export const calculateAssignedWorkMetrics = (assignedWorks) => {
  if (!assignedWorks || assignedWorks.length === 0) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      submitted: 0,
      completed: 0,
      completionRate: 0,
      onTimeRate: 0,
    };
  }

  const total = assignedWorks.length;
  const pending = assignedWorks.filter(w => w.status === 'Pending').length;
  const inProgress = assignedWorks.filter(w => w.status === 'In Progress').length;
  const submitted = assignedWorks.filter(w => w.status === 'Submitted').length;
  const completed = assignedWorks.filter(w => w.status === 'Completed').length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Calculate on-time completion rate
  const completedOnTime = assignedWorks.filter(w => {
    if (w.status !== 'Completed' || !w.date || !w.updatedAt) return false;
    const dueDate = new Date(w.date);
    const completedDate = w.updatedAt?.toDate ? w.updatedAt.toDate() : new Date(w.updatedAt);
    return completedDate <= dueDate;
  }).length;
  
  const onTimeRate = completed > 0 ? Math.round((completedOnTime / completed) * 100) : 0;

  return {
    total,
    pending,
    inProgress,
    submitted,
    completed,
    completionRate,
    onTimeRate,
  };
};

/**
 * Calculate daily work metrics
 * @param {Array} assignedWorks - Array of assigned work objects
 * @param {Date} date - Target date (default: today)
 * @returns {Object} - Daily metrics
 */
export const calculateDailyWorkMetrics = (assignedWorks, date = new Date()) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  const dailyWorks = assignedWorks.filter(w => {
    if (!w.date) return false;
    const workDate = new Date(w.date);
    return isWithinInterval(workDate, { start: dayStart, end: dayEnd });
  });

  return {
    ...calculateAssignedWorkMetrics(dailyWorks),
    works: dailyWorks,
  };
};

/**
 * Calculate weekly work metrics
 * @param {Array} assignedWorks - Array of assigned work objects
 * @param {Date} date - Target date (default: today)
 * @returns {Object} - Weekly metrics
 */
export const calculateWeeklyWorkMetrics = (assignedWorks, date = new Date()) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  const weeklyWorks = assignedWorks.filter(w => {
    if (!w.date) return false;
    const workDate = new Date(w.date);
    return isWithinInterval(workDate, { start: weekStart, end: weekEnd });
  });

  return {
    ...calculateAssignedWorkMetrics(weeklyWorks),
    works: weeklyWorks,
  };
};

/**
 * Calculate monthly work metrics
 * @param {Array} assignedWorks - Array of assigned work objects
 * @param {Date} date - Target date (default: today)
 * @returns {Object} - Monthly metrics
 */
export const calculateMonthlyWorkMetrics = (assignedWorks, date = new Date()) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  const monthlyWorks = assignedWorks.filter(w => {
    if (!w.date) return false;
    const workDate = new Date(w.date);
    return isWithinInterval(workDate, { start: monthStart, end: monthEnd });
  });

  return {
    ...calculateAssignedWorkMetrics(monthlyWorks),
    works: monthlyWorks,
  };
};

/**
 * Calculate overall performance score combining tasks and assigned work
 * @param {Object} taskMetrics - Task metrics object
 * @param {Object} workMetrics - Assigned work metrics object
 * @returns {number} - Overall performance score (0-100)
 */
export const calculateOverallPerformance = (taskMetrics, workMetrics) => {
  // Task score contribution (50%)
  const taskScore = taskMetrics.workScore || 0;
  const taskContribution = taskScore * 0.5;
  
  // Assigned work completion contribution (30%)
  const workCompletionContribution = (workMetrics.completionRate || 0) * 0.3;
  
  // On-time delivery contribution (20%)
  const onTimeContribution = (workMetrics.onTimeRate || 0) * 0.2;
  
  const overallScore = taskContribution + workCompletionContribution + onTimeContribution;
  
  return Math.min(Math.round(overallScore), 100);
};

/**
 * Get comprehensive member statistics
 * @param {Object} member - Member object
 * @param {Array} tasks - Array of task objects
 * @param {Array} assignedWorks - Array of assigned work objects
 * @returns {Object} - Comprehensive statistics
 */
export const getMemberStatistics = (member, tasks, assignedWorks) => {
  const today = new Date();
  
  // Filter works for this member
  const memberWorks = assignedWorks.filter(w => 
    w.assignedTo && w.assignedTo.includes(member.uid)
  );
  
  // Calculate metrics for different time periods
  const dailyMetrics = calculateDailyWorkMetrics(memberWorks, today);
  const weeklyMetrics = calculateWeeklyWorkMetrics(memberWorks, today);
  const monthlyMetrics = calculateMonthlyWorkMetrics(memberWorks, today);
  const overallMetrics = calculateAssignedWorkMetrics(memberWorks);
  
  // Task metrics (assuming already calculated)
  const taskMetrics = {
    workScore: member.workScore || 0,
    totalHours: member.totalHours || 0,
    completedTasks: member.completedTasks || 0,
    taskCount: member.taskCount || 0,
  };
  
  // Overall performance score
  const overallPerformance = calculateOverallPerformance(taskMetrics, monthlyMetrics);
  
  return {
    daily: dailyMetrics,
    weekly: weeklyMetrics,
    monthly: monthlyMetrics,
    overall: overallMetrics,
    taskMetrics,
    overallPerformance,
    totalWorks: memberWorks.length,
  };
};

/**
 * Calculate priority-based metrics
 * @param {Array} assignedWorks - Array of assigned work objects
 * @returns {Object} - Priority breakdown
 */
export const calculatePriorityMetrics = (assignedWorks) => {
  if (!assignedWorks || assignedWorks.length === 0) {
    return {
      low: { total: 0, completed: 0, pending: 0 },
      medium: { total: 0, completed: 0, pending: 0 },
      high: { total: 0, completed: 0, pending: 0 },
    };
  }

  const priorities = {
    Low: { total: 0, completed: 0, pending: 0 },
    Medium: { total: 0, completed: 0, pending: 0 },
    High: { total: 0, completed: 0, pending: 0 },
  };

  assignedWorks.forEach(work => {
    const priority = work.priority || 'Medium';
    if (priorities[priority]) {
      priorities[priority].total++;
      if (work.status === 'Completed') {
        priorities[priority].completed++;
      } else if (work.status === 'Pending') {
        priorities[priority].pending++;
      }
    }
  });

  return {
    low: priorities.Low,
    medium: priorities.Medium,
    high: priorities.High,
  };
};

/**
 * Calculate task type distribution for assigned work
 * @param {Array} assignedWorks - Array of assigned work objects
 * @returns {Object} - Task type distribution
 */
export const calculateTaskTypeDistribution = (assignedWorks) => {
  if (!assignedWorks || assignedWorks.length === 0) return {};

  return assignedWorks.reduce((acc, work) => {
    const type = work.taskType || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Get performance trend (comparing current period with previous)
 * @param {Array} currentWorks - Current period assigned works
 * @param {Array} previousWorks - Previous period assigned works
 * @returns {Object} - Trend data
 */
export const getPerformanceTrend = (currentWorks, previousWorks) => {
  const currentMetrics = calculateAssignedWorkMetrics(currentWorks);
  const previousMetrics = calculateAssignedWorkMetrics(previousWorks);
  
  const completionTrend = currentMetrics.completionRate - previousMetrics.completionRate;
  const onTimeTrend = currentMetrics.onTimeRate - previousMetrics.onTimeRate;
  const volumeTrend = currentMetrics.total - previousMetrics.total;
  
  return {
    completionTrend: {
      value: completionTrend,
      direction: completionTrend > 0 ? 'up' : completionTrend < 0 ? 'down' : 'stable',
      percentage: previousMetrics.completionRate > 0 
        ? Math.abs(Math.round((completionTrend / previousMetrics.completionRate) * 100))
        : 0,
    },
    onTimeTrend: {
      value: onTimeTrend,
      direction: onTimeTrend > 0 ? 'up' : onTimeTrend < 0 ? 'down' : 'stable',
      percentage: previousMetrics.onTimeRate > 0
        ? Math.abs(Math.round((onTimeTrend / previousMetrics.onTimeRate) * 100))
        : 0,
    },
    volumeTrend: {
      value: volumeTrend,
      direction: volumeTrend > 0 ? 'up' : volumeTrend < 0 ? 'down' : 'stable',
      percentage: previousMetrics.total > 0
        ? Math.abs(Math.round((volumeTrend / previousMetrics.total) * 100))
        : 0,
    },
  };
};

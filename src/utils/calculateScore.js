/**
 * Calculate Work Score based on task parameters
 * Formula: Work Score = (Σ(TaskWeight × Impact × TimeSpent)) / TotalAvailableTime
 * 
 * @param {Array} tasks - Array of task objects
 * @param {number} totalAvailableTime - Total available time in hours (default: 12 hours for 9 AM - 9 PM)
 * @returns {number} - Work score normalized to 100
 */

const TASK_WEIGHTS = {
  Creative: 1.3,
  Technical: 1.2,
  'Client Handling': 1.1,
  Operational: 1.0,
  Meeting: 0.9,
  Misc: 0.8,
};

const IMPACT_MULTIPLIERS = {
  Low: 0.8,
  Medium: 1.0,
  High: 1.2,
};

export const calculateWorkScore = (tasks, totalAvailableTime = 12) => {
  if (!tasks || tasks.length === 0) return 0;

  const totalWeightedScore = tasks.reduce((sum, task) => {
    const taskWeight = TASK_WEIGHTS[task.type] || 1.0;
    const impactMultiplier = IMPACT_MULTIPLIERS[task.impact] || 1.0;
    const timeSpent = parseFloat(task.timeSpent) || 0;

    return sum + (taskWeight * impactMultiplier * timeSpent);
  }, 0);

  // Normalize to 100
  const score = (totalWeightedScore / totalAvailableTime) * 100;
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
};

/**
 * Calculate daily progress percentage
 * @param {Array} tasks - Array of task objects
 * @returns {number} - Progress percentage
 */
export const calculateDailyProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;

  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

/**
 * Calculate total hours worked
 * @param {Array} tasks - Array of task objects
 * @returns {number} - Total hours
 */
export const calculateTotalHours = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;

  return tasks.reduce((sum, task) => {
    return sum + (parseFloat(task.timeSpent) || 0);
  }, 0);
};

/**
 * Get task type distribution
 * @param {Array} tasks - Array of task objects
 * @returns {Object} - Object with task type counts
 */
export const getTaskTypeDistribution = (tasks) => {
  if (!tasks || tasks.length === 0) return {};

  return tasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Calculate average impact level
 * @param {Array} tasks - Array of task objects
 * @returns {string} - Average impact level
 */
export const calculateAverageImpact = (tasks) => {
  if (!tasks || tasks.length === 0) return 'Low';

  const impactScores = {
    Low: 1,
    Medium: 2,
    High: 3,
  };

  const avgScore = tasks.reduce((sum, task) => {
    return sum + (impactScores[task.impact] || 1);
  }, 0) / tasks.length;

  if (avgScore <= 1.5) return 'Low';
  if (avgScore <= 2.5) return 'Medium';
  return 'High';
};

/**
 * Get performance level based on work score
 * @param {number} score - Work score
 * @returns {Object} - Performance level and color
 */
export const getPerformanceLevel = (score) => {
  if (score >= 80) {
    return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
  } else if (score >= 60) {
    return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  } else if (score >= 40) {
    return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  } else {
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  }
};

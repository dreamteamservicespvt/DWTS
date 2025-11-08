/**
 * AI Summary Generation Utilities
 * These are placeholder functions for AI-powered features
 * In production, these would call actual AI APIs (OpenAI, Claude, etc.)
 */

/**
 * Generate daily summary for a user's tasks
 * @param {Object} user - User object
 * @param {Array} tasks - Array of tasks
 * @returns {string} - AI-generated summary
 */
export const generateDailySummary = (user, tasks) => {
  if (!tasks || tasks.length === 0) {
    return `${user.name} hasn't logged any tasks today.`;
  }

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const mainType = getMostFrequentTaskType(tasks);
  const totalHours = tasks.reduce((sum, t) => sum + parseFloat(t.timeSpent || 0), 0);

  return `${user.name} completed ${completedCount} out of ${tasks.length} tasks today, focusing primarily on ${mainType} work with ${totalHours.toFixed(1)} hours logged. ${getPerformanceNote(completedCount, tasks.length)}`;
};

/**
 * Generate motivational message based on user performance
 * @param {Object} user - User object
 * @param {number} score - Performance score
 * @returns {string} - Motivational message
 */
export const generateMotivationalMessage = (user, score) => {
  const messages = {
    excellent: [
      `🌟 Outstanding work, ${user.name}! You're crushing it today!`,
      `🚀 Incredible performance, ${user.name}! Keep up this amazing momentum!`,
      `💎 Exceptional work, ${user.name}! You're setting the bar high!`,
    ],
    good: [
      `👏 Great job today, ${user.name}! You're making solid progress!`,
      `✨ Well done, ${user.name}! Your consistency is impressive!`,
      `🎯 Nice work, ${user.name}! You're hitting your targets!`,
    ],
    average: [
      `💪 Keep pushing, ${user.name}! You've got this!`,
      `🌱 Good effort, ${user.name}! Every step forward counts!`,
      `⚡ You're doing well, ${user.name}! Let's aim even higher tomorrow!`,
    ],
    low: [
      `🌈 Tomorrow is a new opportunity, ${user.name}! You've got this!`,
      `💫 Every day is a fresh start, ${user.name}! Keep moving forward!`,
      `🎈 Don't worry, ${user.name}! Small steps lead to big achievements!`,
    ],
  };

  let category = 'low';
  if (score >= 80) category = 'excellent';
  else if (score >= 60) category = 'good';
  else if (score >= 40) category = 'average';

  const categoryMessages = messages[category];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
};

/**
 * Auto-generate task description based on title
 * @param {string} title - Task title
 * @returns {string} - Auto-generated description
 */
export const autoGenerateTaskDescription = (title) => {
  // In production, this would call an AI API
  // For now, we'll return a template-based description
  
  const keywords = {
    meeting: 'Conducted a meeting to discuss project progress and align on next steps.',
    design: 'Worked on design elements to improve user experience and visual appeal.',
    code: 'Developed and implemented code features to enhance functionality.',
    review: 'Reviewed work submissions and provided constructive feedback.',
    client: 'Engaged with client to understand requirements and provide updates.',
    testing: 'Performed comprehensive testing to ensure quality and reliability.',
    documentation: 'Created detailed documentation for future reference.',
    research: 'Conducted research to gather insights and inform decision-making.',
  };

  const lowerTitle = title.toLowerCase();
  
  for (const [keyword, description] of Object.entries(keywords)) {
    if (lowerTitle.includes(keyword)) {
      return description;
    }
  }

  return `Completed task: ${title}. Ensured quality standards and delivered on time.`;
};

/**
 * Generate AI insights for a team member
 * @param {Object} user - User object
 * @param {Array} tasks - Recent tasks
 * @param {number} score - Performance score
 * @returns {Object} - AI insights object
 */
export const generateAIInsights = (user, tasks, score) => {
  const taskTypes = tasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});

  const dominantType = Object.entries(taskTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
  const totalHours = tasks.reduce((sum, t) => sum + parseFloat(t.timeSpent || 0), 0);
  const avgHoursPerTask = tasks.length > 0 ? (totalHours / tasks.length).toFixed(1) : 0;

  return {
    summary: generateDailySummary(user, tasks),
    strengths: [`Strong focus on ${dominantType} tasks`, `Consistent task completion`],
    improvements: getImprovementSuggestions(tasks, score),
    workBalance: getWorkBalanceNote(taskTypes),
    burnoutRisk: assessBurnoutRisk(totalHours, tasks.length),
    recommendation: getRecommendation(score, dominantType),
  };
};

/**
 * Generate top performers summary
 * @param {Array} members - Array of members with scores
 * @returns {string} - Summary of top performers
 */
export const generateTopPerformersSummary = (members) => {
  const sorted = [...members].sort((a, b) => b.score - a.score).slice(0, 3);
  
  return sorted.map((member, idx) => {
    const medal = ['🥇', '🥈', '🥉'][idx];
    return `${medal} ${member.name} - ${member.score}% (${member.reason})`;
  }).join('\n');
};

// Helper functions
const getMostFrequentTaskType = (tasks) => {
  const types = tasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
};

const getPerformanceNote = (completed, total) => {
  const percentage = (completed / total) * 100;
  if (percentage >= 80) return 'Excellent completion rate! 🌟';
  if (percentage >= 60) return 'Good progress! 👍';
  if (percentage >= 40) return 'Keep pushing forward! 💪';
  return 'Room for improvement tomorrow! 🎯';
};

const getImprovementSuggestions = (tasks, score) => {
  const suggestions = [];
  
  if (score < 60) {
    suggestions.push('Consider increasing task completion rate');
  }
  
  const highImpactTasks = tasks.filter(t => t.impact === 'High').length;
  if (highImpactTasks < tasks.length * 0.3) {
    suggestions.push('Try focusing on more high-impact tasks');
  }
  
  return suggestions.length > 0 ? suggestions : ['Keep up the great work!'];
};

const getWorkBalanceNote = (taskTypes) => {
  const typeCount = Object.keys(taskTypes).length;
  if (typeCount >= 4) return 'Excellent work variety and balance';
  if (typeCount >= 2) return 'Good mix of different task types';
  return 'Consider diversifying task types for better balance';
};

const assessBurnoutRisk = (totalHours, taskCount) => {
  if (totalHours > 10 && taskCount > 15) return 'High - Consider taking breaks';
  if (totalHours > 8 || taskCount > 10) return 'Moderate - Maintain work-life balance';
  return 'Low - Healthy work pace';
};

const getRecommendation = (score, dominantType) => {
  if (score >= 80) {
    return `Excellent work on ${dominantType} tasks! Keep this momentum while ensuring work-life balance.`;
  } else if (score >= 60) {
    return `Good performance! Try increasing focus on high-impact ${dominantType} tasks tomorrow.`;
  } else {
    return `Focus on completing fewer high-quality ${dominantType} tasks rather than many low-impact ones.`;
  }
};

/**
 * AI Insights Generator
 * Deterministic insight generation based on task data analysis
 */

import { calculateUserScore, getDailyCompletionTrend } from './analytics';

/**
 * Generate insights for a user
 */
export async function generateUserInsights(userId, userName, dateRange = null) {
  const score = await calculateUserScore(userId, dateRange);
  
  const insights = [];
  const recommendations = [];

  // Completion rate insights
  if (score.completionRate >= 90) {
    insights.push({
      type: 'positive',
      icon: '🎯',
      message: `${userName} has an excellent completion rate of ${score.completionRate}%!`
    });
  } else if (score.completionRate >= 70) {
    insights.push({
      type: 'neutral',
      icon: '📊',
      message: `${userName} completed ${score.completionRate}% of assigned tasks.`
    });
  } else {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      message: `${userName}'s completion rate is ${score.completionRate}%. Consider task load adjustment.`
    });
    recommendations.push('Review current task assignments and priorities');
  }

  // On-time delivery insights
  if (score.onTimeRate >= 85) {
    insights.push({
      type: 'positive',
      icon: '⏰',
      message: `Outstanding time management with ${score.onTimeRate}% on-time delivery!`
    });
  } else if (score.onTimeRate < 60) {
    insights.push({
      type: 'warning',
      icon: '⏳',
      message: `Only ${score.onTimeRate}% of tasks completed on time.`
    });
    recommendations.push('Consider breaking large tasks into smaller milestones');
    recommendations.push('Review scheduling - tasks may be too tightly packed');
  }

  // Impact analysis
  const { impactBreakdown } = score;
  const criticalTasks = impactBreakdown.Critical || 0;
  const highTasks = impactBreakdown.High || 0;
  
  if (criticalTasks > 0) {
    insights.push({
      type: 'info',
      icon: '🔥',
      message: `Handled ${criticalTasks} critical tasks successfully!`
    });
  }

  // Performance trend
  const avgScore = score.averageScore;
  if (avgScore >= 150) {
    insights.push({
      type: 'positive',
      icon: '⭐',
      message: `Exceptional performance with average score of ${avgScore}!`
    });
  } else if (avgScore >= 100) {
    insights.push({
      type: 'positive',
      icon: '✅',
      message: `Solid performance with average score of ${avgScore}.`
    });
  }

  // Recommendations based on data
  if (score.tasksTotal > 20 && score.completionRate < 80) {
    recommendations.push('Task load might be too high - consider prioritization');
  }

  if (highTasks + criticalTasks > score.tasksTotal * 0.7) {
    recommendations.push('High concentration of critical tasks - ensure adequate support');
  }

  return {
    userId,
    userName,
    period: dateRange ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}` : 'All time',
    score,
    insights,
    recommendations,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate team insights
 */
export async function generateTeamInsights() {
  const trend = await getDailyCompletionTrend(7);
  
  const insights = [];
  const recommendations = [];

  // Calculate weekly total
  const weeklyTotal = trend.reduce((sum, day) => sum + day.count, 0);
  const dailyAverage = Math.round(weeklyTotal / 7);

  insights.push({
    type: 'info',
    icon: '📈',
    message: `Team completed ${weeklyTotal} tasks this week (${dailyAverage}/day average).`
  });

  // Find best day
  const bestDay = trend.reduce((best, current) => 
    current.count > best.count ? current : best
  );
  
  insights.push({
    type: 'positive',
    icon: '🏆',
    message: `Most productive day: ${new Date(bestDay.date).toLocaleDateString()} with ${bestDay.count} completions.`
  });

  // Find trends
  const firstHalf = trend.slice(0, 3).reduce((sum, d) => sum + d.count, 0);
  const secondHalf = trend.slice(4).reduce((sum, d) => sum + d.count, 0);

  if (secondHalf > firstHalf * 1.2) {
    insights.push({
      type: 'positive',
      icon: '📊',
      message: 'Team productivity is trending upward!'
    });
  } else if (secondHalf < firstHalf * 0.8) {
    insights.push({
      type: 'warning',
      icon: '📉',
      message: 'Productivity declined this week - check for blockers.'
    });
    recommendations.push('Hold team standup to identify blockers');
  }

  // Best practices
  if (weeklyTotal >= 50) {
    recommendations.push('Great momentum! Consider documenting workflows for new members');
  }

  return {
    period: 'Last 7 days',
    weeklyTotal,
    dailyAverage,
    trend,
    insights,
    recommendations,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate task scheduling insights
 */
export function generateSchedulingInsights(tasks) {
  const insights = [];
  const recommendations = [];

  // Analyze task density per day
  const tasksByDate = {};
  tasks.forEach(task => {
    if (task.startTime) {
      const date = new Date(task.startTime).toISOString().split('T')[0];
      tasksByDate[date] = (tasksByDate[date] || 0) + 1;
    }
  });

  // Find overloaded days
  const overloadedDays = Object.entries(tasksByDate)
    .filter(([, count]) => count > 8)
    .sort((a, b) => b[1] - a[1]);

  if (overloadedDays.length > 0) {
    insights.push({
      type: 'warning',
      icon: '📅',
      message: `${overloadedDays.length} day(s) have heavy task concentration (${overloadedDays[0][1]} tasks on ${overloadedDays[0][0]}).`
    });
    recommendations.push('Consider redistributing tasks for better work-life balance');
  }

  // Analyze task duration
  const shortTasks = tasks.filter(t => t.durationHours && t.durationHours < 2).length;
  const longTasks = tasks.filter(t => t.durationHours && t.durationHours > 4).length;

  if (longTasks > tasks.length * 0.3) {
    insights.push({
      type: 'info',
      icon: '⏱️',
      message: `${Math.round((longTasks / tasks.length) * 100)}% of tasks are long-duration (>4h).`
    });
    recommendations.push('Break long tasks into smaller subtasks for better tracking');
  }

  // Morning vs afternoon scheduling
  const morningTasks = tasks.filter(t => {
    if (!t.startTime) return false;
    const hour = new Date(t.startTime).getHours();
    return hour >= 6 && hour < 12;
  }).length;

  const afternoonTasks = tasks.filter(t => {
    if (!t.startTime) return false;
    const hour = new Date(t.startTime).getHours();
    return hour >= 12 && hour < 18;
  }).length;

  if (afternoonTasks > morningTasks * 1.5) {
    insights.push({
      type: 'info',
      icon: '🌅',
      message: 'Most tasks scheduled in afternoon. Consider front-loading critical work.'
    });
  }

  return {
    insights,
    recommendations,
    stats: {
      totalTasks: tasks.length,
      overloadedDays: overloadedDays.length,
      shortTasks,
      longTasks,
      morningTasks,
      afternoonTasks
    }
  };
}

/**
 * Generate motivational summary
 */
export function generateMotivationalSummary(score) {
  const messages = [];

  if (score.completionRate >= 90) {
    messages.push('🌟 You\'re crushing it!');
  } else if (score.completionRate >= 75) {
    messages.push('💪 Great work this week!');
  } else if (score.completionRate >= 50) {
    messages.push('📈 Keep pushing forward!');
  } else {
    messages.push('🎯 Let\'s focus and improve!');
  }

  if (score.onTimeRate >= 85) {
    messages.push('⏰ Excellent time management!');
  }

  if (score.tasksCompleted > 20) {
    messages.push(`🏆 ${score.tasksCompleted} tasks completed - amazing!`);
  }

  return messages.join(' ');
}

/**
 * Generate daily summary for email/notification
 */
export async function generateDailySummary(userId, userName) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateRange = {
    start: today,
    end: tomorrow
  };

  const insights = await generateUserInsights(userId, userName, dateRange);
  const motivational = generateMotivationalSummary(insights.score);

  return {
    subject: `Daily Summary for ${userName}`,
    motivational,
    tasksCompleted: insights.score.tasksCompleted,
    tasksTotal: insights.score.tasksTotal,
    completionRate: insights.score.completionRate,
    insights: insights.insights,
    recommendations: insights.recommendations
  };
}

export default {
  generateUserInsights,
  generateTeamInsights,
  generateSchedulingInsights,
  generateMotivationalSummary,
  generateDailySummary
};

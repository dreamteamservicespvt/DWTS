/**
 * WhatsApp Report Sharing Utility
 * Generates formatted reports and opens WhatsApp share
 */

/**
 * Generate WhatsApp report text for individual member
 * @param {Object} data - Member data
 * @param {string} language - Language code ('en' or 'te')
 * @returns {string} Formatted report text
 */
export const generateMemberReport = (data, language = 'en') => {
  const {
    name,
    date,
    completedTasks,
    totalTasks,
    efficiency,
    badge,
    workScore,
    totalHours,
  } = data;

  if (language === 'te') {
    return `📊 *DWTS రిపోర్ట్*

👤 *పేరు:* ${name}
📅 *తేదీ:* ${date}

✅ *పూర్తయిన పనులు:* ${completedTasks}/${totalTasks}
⚡ *సామర్థ్యం:* ${efficiency}%
🎯 *వర్క్ స్కోర్:* ${workScore}%
⏱️ *గంటలు:* ${totalHours}h
🏆 *బ్యాడ్జ్:* ${badge}

_DWTS AI - డ్రీమ్ టీమ్ వర్క్ ట్రాకర్_
"మీ పనిని ట్రాక్ చేస్తుంది, ప్రేరేపిస్తుంది మరియు మీ భాషలో మాట్లాడుతుంది."`;
  }

  return `📊 *DWTS Report*

👤 *Name:* ${name}
📅 *Date:* ${date}

✅ *Completed Tasks:* ${completedTasks}/${totalTasks}
⚡ *Efficiency:* ${efficiency}%
🎯 *Work Score:* ${workScore}%
⏱️ *Hours Logged:* ${totalHours}h
🏆 *Badge:* ${badge}

_DWTS AI - Dream Team Work Tracker_
"AI that tracks, motivates, and speaks your language."`;
};

/**
 * Generate WhatsApp report text for team (admin view)
 * @param {Object} data - Team data
 * @param {string} language - Language code ('en' or 'te')
 * @returns {string} Formatted report text
 */
export const generateTeamReport = (data, language = 'en') => {
  const {
    month,
    totalMembers,
    totalTasks,
    completedTasks,
    avgEfficiency,
    topPerformers,
    totalHours,
  } = data;

  if (language === 'te') {
    const performersText = topPerformers
      .slice(0, 3)
      .map((p, i) => `${['🥇', '🥈', '🥉'][i]} ${p.name} - ${p.score}%`)
      .join('\n');

    return `📊 *DWTS టీమ్ రిపోర్ట్*

📅 *నెల:* ${month}

👥 *మొత్తం సభ్యులు:* ${totalMembers}
📝 *మొత్తం పనులు:* ${totalTasks}
✅ *పూర్తయింది:* ${completedTasks}
⚡ *సగటు సామర్థ్యం:* ${avgEfficiency}%
⏱️ *మొత్తం గంటలు:* ${totalHours}h

🏆 *టాప్ పెర్ఫార్మర్లు:*
${performersText}

_DWTS AI - డ్రీమ్ టీమ్ వర్క్ ట్రాకర్_`;
  }

  const performersText = topPerformers
    .slice(0, 3)
    .map((p, i) => `${['🥇', '🥈', '🥉'][i]} ${p.name} - ${p.score}%`)
    .join('\n');

  return `📊 *DWTS Team Report*

📅 *Month:* ${month}

👥 *Total Members:* ${totalMembers}
📝 *Total Tasks:* ${totalTasks}
✅ *Completed:* ${completedTasks}
⚡ *Average Efficiency:* ${avgEfficiency}%
⏱️ *Total Hours:* ${totalHours}h

🏆 *Top Performers:*
${performersText}

_DWTS AI - Dream Team Work Tracker_`;
};

/**
 * Share report via WhatsApp
 * @param {string} text - Formatted report text
 * @param {string} phoneNumber - Optional phone number to send to
 */
export const shareViaWhatsApp = (text, phoneNumber = '') => {
  const encodedText = encodeURIComponent(text);
  
  // If phone number provided, send directly to that number
  // Otherwise, open WhatsApp with text ready to share
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  // Open in new window
  window.open(url, '_blank');
};

/**
 * Generate daily AI summary for member
 * @param {Object} tasks - Array of tasks
 * @param {string} language - Language code
 * @returns {string} AI-generated summary
 */
export const generateDailySummary = (tasks, language = 'en') => {
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const highImpactTasks = tasks.filter((t) => t.impact === 'High').length;

  if (language === 'te') {
    if (percentage === 100) {
      return `🎉 అద్భుతం! మీరు నేడు ${completed} పనులన్నిటినీ పూర్తి చేశారు. మీ కృషి అద్భుతమైనది! 💪`;
    } else if (percentage >= 80) {
      return `👏 గొప్ప పని! మీరు నేడు ${completed}/${total} పనులు పూర్తి చేశారు (${percentage}%). కొనసాగించండి! 🌟`;
    } else if (percentage >= 60) {
      return `📊 మంచి పురోగతి! మీరు ${completed}/${total} పనులు పూర్తి చేశారు. ${highImpactTasks > 0 ? `మీరు ${highImpactTasks} అధిక ప్రభావ పనులు నిర్వహించారు. 🎯` : ''}`;
    } else if (percentage > 0) {
      return `💪 ఇంకా సమయం ఉంది! మీరు ${completed}/${total} పనులు పూర్తి చేశారు. మీరు చేయగలరు! 🚀`;
    } else {
      return `⏰ నేటి పనులను ప్రారంభించండి. మీరు చేయగలరు! 💫`;
    }
  }

  // English summaries
  if (percentage === 100) {
    return `🎉 Amazing! You completed all ${completed} tasks today. Your dedication is outstanding! 💪`;
  } else if (percentage >= 80) {
    return `👏 Great job! You completed ${completed} out of ${total} tasks today (${percentage}%). Keep it up! 🌟`;
  } else if (percentage >= 60) {
    return `📊 Good progress! You completed ${completed}/${total} tasks. ${highImpactTasks > 0 ? `You handled ${highImpactTasks} high-impact tasks. 🎯` : ''}`;
  } else if (percentage > 0) {
    return `💪 There's still time! You've completed ${completed}/${total} tasks. You can do this! 🚀`;
  } else {
    return `⏰ Time to start your tasks for today. You've got this! 💫`;
  }
};

/**
 * Generate monthly AI summary for member
 * @param {Object} data - Monthly performance data
 * @param {string} language - Language code
 * @returns {string} AI-generated monthly summary
 */
export const generateMonthlySummary = (data, language = 'en') => {
  const {
    month,
    totalTasks,
    completedTasks,
    avgScore,
    consistency,
    highImpactCount,
    mostActiveHour,
  } = data;

  const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (language === 'te') {
    return `📊 *${month} నెలవారీ సారాంశం*

${
  avgScore >= 85
    ? '🌟 అద్భుతమైన నెల! మీరు స్టార్ పెర్ఫార్మర్!'
    : avgScore >= 70
    ? '⭐ మంచి ప్రదర్శన! మీరు చురుకైన పెర్ఫార్మర్.'
    : '📈 మెరుగుదల అవసరం. మీరు చేయగలరు!'
}

మీరు ${completedTasks} పనులు పూర్తి చేశారు (మొత్తం ${totalTasks}). మీ సామర్థ్యం ${efficiency}% మరియు సగటు స్కోర్ ${avgScore}%.

${
  consistency >= 85
    ? '🔥 అద్భుతమైన స్థిరత్వం! మీరు దాదాపు ప్రతిరోజూ పని చేశారు.'
    : consistency >= 70
    ? '📅 మంచి స్థిరత్వం. మీరు చాలా రోజులు చురుకుగా ఉన్నారు.'
    : '⚠️ స్థిరత్వంపై దృష్టి పెట్టండి. ప్రతిరోజూ పని చేయడానికి ప్రయత్నించండి.'
}

${highImpactCount > 0 ? `🎯 మీరు ${highImpactCount} అధిక ప్రభావ పనులు నిర్వహించారు - అద్భుతం!` : ''}

${mostActiveHour ? `⏰ మీరు ${mostActiveHour} గంటల మధ్య అత్యంత చురుకుగా ఉన్నారు.` : ''}

_మీ కృషి గౌరవనీయమైనది. కొనసాగించండి! 💪_`;
  }

  // English summary
  return `📊 *${month} Monthly Summary*

${
  avgScore >= 85
    ? '🌟 Outstanding month! You are a Star Performer!'
    : avgScore >= 70
    ? '⭐ Great performance! You are an Active Performer.'
    : '📈 Room for improvement. You can do better!'
}

You completed ${completedTasks} tasks out of ${totalTasks}. Your efficiency is ${efficiency}% with an average score of ${avgScore}%.

${
  consistency >= 85
    ? '🔥 Excellent consistency! You worked almost every day.'
    : consistency >= 70
    ? '📅 Good consistency. You were active most days.'
    : '⚠️ Focus on consistency. Try to work every day.'
}

${highImpactCount > 0 ? `🎯 You handled ${highImpactCount} high-impact tasks - impressive!` : ''}

${mostActiveHour ? `⏰ You're most productive around ${mostActiveHour}.` : ''}

_Your dedication is commendable. Keep going! 💪_`;
};

export default {
  generateMemberReport,
  generateTeamReport,
  shareViaWhatsApp,
  generateDailySummary,
  generateMonthlySummary,
};

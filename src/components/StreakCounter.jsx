import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

const StreakCounter = ({ streakDays = 0, className = '' }) => {
  const { t } = useTranslation();

  const getStreakColor = (days) => {
    if (days >= 30) return 'from-purple-500 to-pink-500';
    if (days >= 14) return 'from-orange-500 to-red-500';
    if (days >= 7) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getStreakEmoji = (days) => {
    if (days >= 30) return '🔥🔥🔥';
    if (days >= 14) return '🔥🔥';
    if (days >= 7) return '🔥';
    return '✨';
  };

  const getStreakMessage = (days) => {
    if (days >= 30) {
      return t('language') === 'te' 
        ? 'అద్భుతమైన స్ట్రీక్! మీరు అసాధారణులు!'
        : 'Amazing streak! You\'re unstoppable!';
    }
    if (days >= 14) {
      return t('language') === 'te'
        ? 'గొప్ప స్ట్రీక్! కొనసాగించండి!'
        : 'Great streak! Keep it going!';
    }
    if (days >= 7) {
      return t('language') === 'te'
        ? 'మంచి స్ట్రీక్! మీరు బాగా చేస్తున్నారు!'
        : 'Nice streak! You\'re doing great!';
    }
    if (days > 0) {
      return t('language') === 'te'
        ? 'కొత్త స్ట్రీక్ ప్రారంభం! కొనసాగించండి!'
        : 'New streak started! Keep going!';
    }
    return t('language') === 'te'
      ? 'నేడు మీ స్ట్రీక్ ప్రారంభించండి!'
      : 'Start your streak today!';
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`glass-card p-6 rounded-2xl ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{
              rotate: streakDays > 0 ? [0, 10, -10, 10, 0] : 0,
            }}
            transition={{
              duration: 0.5,
              repeat: streakDays > 0 ? Infinity : 0,
              repeatDelay: 2,
            }}
          >
            <Flame className={`w-6 h-6 ${streakDays > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          </motion.div>
          <h3 className="text-lg font-semibold">
            {t('gamification.streak')}
          </h3>
        </div>
        {streakDays >= 7 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
          >
            <TrendingUp className="w-3 h-3" />
            <span>On Fire!</span>
          </motion.div>
        )}
      </div>

      <div className="text-center space-y-4">
        {/* Streak Number */}
        <motion.div
          key={streakDays}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className={`text-6xl font-bold bg-gradient-to-r ${getStreakColor(streakDays)} bg-clip-text text-transparent`}>
            {streakDays}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
            {t('gamification.days')}
          </div>
        </motion.div>

        {/* Streak Emoji */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="text-4xl"
        >
          {getStreakEmoji(streakDays)}
        </motion.div>

        {/* Streak Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        >
          {getStreakMessage(streakDays)}
        </motion.p>

        {/* Progress Bar to Next Milestone */}
        {streakDays > 0 && streakDays < 30 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('language') === 'te' ? 'తర్వాత మైలురాయి' : 'Next milestone'}</span>
              <span>
                {streakDays < 7 ? '7' : streakDays < 14 ? '14' : '30'} {t('gamification.days')}
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    streakDays < 7
                      ? (streakDays / 7) * 100
                      : streakDays < 14
                      ? ((streakDays - 7) / 7) * 100
                      : ((streakDays - 14) / 16) * 100
                  }%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="progress-fill"
              />
            </div>
          </div>
        )}

        {/* Call to Action */}
        {streakDays === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
          >
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {t('language') === 'te'
                ? '💡 టిప్: ప్రతిరోజూ కనీసం ఒక పనిని పూర్తి చేయండి!'
                : '💡 Tip: Complete at least one task every day!'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Streak Freeze Warning */}
      {streakDays > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
        >
          <p className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
            {t('language') === 'te'
              ? '⚠️ మీ స్ట్రీక్‌ను నిలుపుకోవడానికి రేపు పనిని పూర్తి చేయండి!'
              : '⚠️ Complete a task tomorrow to maintain your streak!'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StreakCounter;

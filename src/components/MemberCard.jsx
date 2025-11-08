import { motion } from 'framer-motion';
import { Clock, Target, TrendingUp, Activity } from 'lucide-react';
import ProgressRing from './ProgressRing';
import { getPerformanceLevel } from '../utils/calculateScore';
import { format } from 'date-fns';

/**
 * MemberCard Component
 * Displays a team member's performance summary
 * Used in Admin Panel and Dashboard
 */
const MemberCard = ({ member, onClick, delay = 0 }) => {
  const performance = getPerformanceLevel(member.workScore || 0);
  const completionRate = member.taskCount > 0 
    ? Math.round((member.completedTasks / member.taskCount) * 100)
    : 0;

  const getStatusColor = () => {
    const lastActive = member.lastActive ? new Date(member.lastActive) : null;
    if (!lastActive) return 'text-gray-500';
    
    const hoursSinceActive = (new Date() - lastActive) / (1000 * 60 * 60);
    if (hoursSinceActive < 2) return 'text-green-500';
    if (hoursSinceActive < 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    const lastActive = member.lastActive ? new Date(member.lastActive) : null;
    if (!lastActive) return 'Not Updated';
    
    const hoursSinceActive = (new Date() - lastActive) / (1000 * 60 * 60);
    if (hoursSinceActive < 2) return '🟢 Active';
    if (hoursSinceActive < 6) return '🟡 Idle';
    return '⚪ Inactive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className="glass-card p-6 rounded-2xl card-hover cursor-pointer group"
    >
      {/* Header with Avatar and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=0057FF&color=fff&size=128`}
              alt={member.name}
              className="w-16 h-16 rounded-full object-cover border-3 border-primary-400 shadow-lg"
            />
            {/* Activity Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${
              getStatusColor().includes('green') ? 'bg-green-500' :
              getStatusColor().includes('yellow') ? 'bg-yellow-500' :
              'bg-gray-400'
            }`} />
          </div>

          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {member.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {member.email}
            </p>
            <span className="text-xs font-medium">
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Performance Badge */}
        <span className={`badge ${
          performance.level === 'Excellent' ? 'badge-success' :
          performance.level === 'Good' ? 'badge-info' :
          performance.level === 'Average' ? 'badge-warning' :
          'badge-danger'
        }`}>
          {performance.level}
        </span>
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center my-4">
        <ProgressRing 
          progress={member.workScore || 0} 
          size={100} 
          strokeWidth={8}
          showLabel={true}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Tasks */}
        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Tasks</span>
          </div>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {member.completedTasks || 0}/{member.taskCount || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {completionRate}% done
          </p>
        </div>

        {/* Hours */}
        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Hours</span>
          </div>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {(member.totalHours || 0).toFixed(1)}h
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            this month
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Daily Progress</span>
          <span>{member.progress || 0}%</span>
        </div>
        <div className="progress-bar">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${member.progress || 0}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="progress-fill"
          />
        </div>
      </div>

      {/* Footer - Last Active */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400 flex items-center">
            <Activity className="w-3 h-3 mr-1" />
            Last active
          </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {member.lastActive 
              ? format(new Date(member.lastActive), 'MMM dd, hh:mm a')
              : 'Never'
            }
          </span>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-aqua-500/0 group-hover:from-primary-500/5 group-hover:to-aqua-500/5 rounded-2xl transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default MemberCard;

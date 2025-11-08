import { motion } from 'framer-motion';

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient = 'from-blue-500 to-cyan-500',
  trend,
  trendValue,
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ 
        y: -8,
        boxShadow: '0 20px 40px -10px rgba(0, 87, 255, 0.3)'
      }}
      className="glass-premium p-6 rounded-3xl shadow-premium card-hover relative overflow-hidden group"
    >
      {/* Background gradient blur effect */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
              {title}
            </p>
            <motion.h3 
              className="text-4xl font-extrabold text-gradient-premium mb-1"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
            >
              {value}
            </motion.h3>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          
          <motion.div 
            className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        {/* Progress bar or trend */}
        {trend && (
          <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              vs last period
            </span>
          </div>
        )}
      </div>

      {/* Animated glow effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
    </motion.div>
  );
};

export default KPICard;

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ProgressRing = ({ progress, size = 120, strokeWidth = 8, showLabel = true }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const getColor = () => {
    if (progress >= 80) return '#10b981'; // green
    if (progress >= 60) return '#3b82f6'; // blue
    if (progress >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getGradientId = () => `gradient-${size}-${progress}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={getGradientId()} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1890ff" />
            <stop offset="100%" stopColor="#13c2c2" />
          </linearGradient>
        </defs>
        
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${getGradientId()})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {/* Center Label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-3xl font-bold text-gradient"
          >
            {Math.round(displayProgress)}%
          </motion.span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Complete
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressRing;

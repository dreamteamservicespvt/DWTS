import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

/**
 * Premium Glass Card Component
 * Features: Glassmorphism effect, subtle shadow, smooth animations
 */
export const GlassCard = ({ 
  children, 
  className = '', 
  hover = true,
  onClick,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      className={cn(
        'backdrop-blur-xl bg-white/80 dark:bg-gray-900/80',
        'border border-white/20 dark:border-gray-700/50',
        'rounded-3xl shadow-glass',
        'transition-all duration-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated Button Component
 * Features: Smooth transitions, loading states, multiple variants
 */
export const AnimatedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled = false,
  ...props
}) => {
  const variants = {
    primary: 'bg-brand-primary hover:bg-primary-600 text-white shadow-premium',
    secondary: 'bg-brand-secondary hover:bg-secondary-600 text-white shadow-lg',
    accent: 'bg-brand-accent hover:bg-accent-600 text-gray-900 shadow-lg',
    outline: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white',
    ghost: 'text-brand-primary hover:bg-primary-50 dark:hover:bg-primary-900/20',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base rounded-2xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
    xl: 'px-10 py-5 text-xl rounded-3xl',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'font-medium transition-all duration-200',
        'flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="text-lg">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

/**
 * Premium Progress Bar Component
 */
export const ProgressBar = ({ 
  progress = 0, 
  showLabel = true,
  size = 'md',
  color = 'primary',
  animated = true,
  className = ''
}) => {
  const colors = {
    primary: 'bg-brand-primary',
    secondary: 'bg-brand-secondary',
    accent: 'bg-brand-accent',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-semibold text-brand-primary">{progress}%</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        sizes[size]
      )}>
        <motion.div
          className={cn('rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: animated ? 0.5 : 0, ease: 'easeOut' }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
};

/**
 * Status Badge Component
 */
export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const statusConfig = {
    'Not Started': { color: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-400' },
    'In Progress': { color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
    'Submitted': { color: 'bg-purple-100 text-purple-700 border-purple-300', dot: 'bg-purple-500' },
    'Approved': { color: 'bg-green-100 text-green-700 border-green-300', dot: 'bg-green-500' },
    'Rework': { color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' },
    'Completed': { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const config = statusConfig[status] || statusConfig['Not Started'];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        config.color,
        sizes[size],
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full animate-pulse', config.dot)} />
      {status}
    </motion.span>
  );
};

/**
 * Client Card Component
 */
export const ClientCard = ({ client, onClick, className = '' }) => {
  return (
    <GlassCard
      onClick={onClick}
      className={cn('p-6 cursor-pointer group', className)}
    >
      <div className="flex items-start gap-4">
        {/* Client Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
          {client.logoUrl ? (
            <img 
              src={client.logoUrl} 
              alt={client.name} 
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            client.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Client Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {client.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {client.industry}
          </p>
          
          {/* Stats */}
          <div className="flex gap-4 mt-3">
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Projects:</span>
              <span className="ml-1 font-semibold text-brand-primary">
                {client.projectCount || 0}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Tasks:</span>
              <span className="ml-1 font-semibold text-brand-secondary">
                {client.taskCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={client.status || 'Active'} size="sm" />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(client.startDate).toLocaleDateString()}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

/**
 * Project Card Component
 */
export const ProjectCard = ({ project, onClick, className = '' }) => {
  const progress = project.progress || 0;
  
  return (
    <GlassCard
      onClick={onClick}
      className={cn('p-6 cursor-pointer group', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-primary transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {project.clientName}
          </p>
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
        {project.description}
      </p>

      <ProgressBar progress={progress} size="sm" color="primary" />

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Type:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {project.type}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tasks:</span>
            <span className="ml-1 font-medium text-brand-primary">
              {project.taskCount || 0}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Due: {new Date(project.deadline).toLocaleDateString()}
        </div>
      </div>
    </GlassCard>
  );
};

/**
 * Empty State Component
 */
export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {icon && (
        <motion.div
          className="text-6xl mb-4 text-gray-400"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      {action}
    </motion.div>
  );
};

/**
 * Loading Spinner Component
 */
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <motion.div
      className={cn(
        'border-brand-primary border-t-transparent rounded-full',
        sizes[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

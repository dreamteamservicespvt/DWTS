import React from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Palette, 
  Users, 
  Briefcase, 
  MessageSquare, 
  MoreHorizontal,
  Clock,
  TrendingUp,
  Edit,
  Trash2,
  ExternalLink,
  UserPlus,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const TASK_ICONS = {
  Creative: Palette,
  Technical: Code,
  'Client Handling': Users,
  Operational: Briefcase,
  Meeting: MessageSquare,
  Misc: MoreHorizontal,
};

const TASK_COLORS = {
  Creative: 'from-purple-400 to-pink-500',
  Technical: 'from-blue-400 to-cyan-500',
  'Client Handling': 'from-green-400 to-emerald-500',
  Operational: 'from-orange-400 to-amber-500',
  Meeting: 'from-indigo-400 to-purple-500',
  Misc: 'from-gray-400 to-slate-500',
};

const IMPACT_COLORS = {
  Low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  Medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

const STATUS_ICONS = {
  Completed: '✅',
  'In Progress': '⏳',
  Pending: '🏁',
};

const TaskCard = ({ task, onEdit, onDelete, onAssign, onApprove, onRequestRework, showAssignButton = false, showApprovalButtons = false }) => {
  const Icon = TASK_ICONS[task.type] || MoreHorizontal;
  const gradientColor = TASK_COLORS[task.type] || TASK_COLORS.Misc;
  
  // Assignment status
  const getAssignmentStatus = () => {
    if (!task.assignedTo || task.assignedTo.length === 0) {
      return { label: 'Unassigned', color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', icon: UserPlus };
    }
    
    if (task.status === 'submitted') {
      return { label: 'Submitted', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
    }
    
    if (task.status === 'approved') {
      return { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle };
    }
    
    if (task.status === 'rework') {
      return { label: 'Rework', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle };
    }
    
    const now = new Date();
    const endTime = task.endTime?.toDate?.();
    if (endTime && endTime < now && task.status !== 'approved') {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle };
    }
    
    return { label: `Assigned (${task.assignedTo.length})`, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Users };
  };
  
  const assignmentStatus = getAssignmentStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card p-5 rounded-2xl card-hover"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {task.title}
              </h3>
              <span className="text-lg">{STATUS_ICONS[task.status]}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-2">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(task)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Edit task"
            >
              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(task)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Task Type */}
        <span className="badge badge-info">
          {task.type}
        </span>

        {/* Impact Level */}
        <span className={`badge ${IMPACT_COLORS[task.impact]}`}>
          <TrendingUp className="w-3 h-3 mr-1" />
          {task.impact} Impact
        </span>

        {/* Time Spent */}
        {task.timeSpent && (
          <span className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
            <Clock className="w-3 h-3 mr-1" />
            {task.timeSpent}h
          </span>
        )}

        {/* Status */}
        <span className={`badge ${
          task.status === 'Completed' || task.status === 'approved'
            ? 'badge-success' 
            : task.status === 'In Progress' || task.status === 'in-progress'
            ? 'badge-warning' 
            : 'badge-info'
        }`}>
          {task.status}
        </span>
        
        {/* Assignment Status Badge */}
        <span 
          className={`badge ${assignmentStatus.color} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => showAssignButton && onAssign && onAssign(task)}
          title={assignmentStatus.label === 'Unassigned' ? 'Click to assign' : assignmentStatus.label}
        >
          {React.createElement(assignmentStatus.icon, { className: 'w-3 h-3 mr-1' })}
          {assignmentStatus.label}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {task.date ? format(new Date(task.date), 'MMM dd, yyyy • hh:mm a') : 'No date'}
        </span>

        <div className="flex items-center gap-2">
          {task.proofURL && (
            <motion.a
              href={task.proofURL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              <span>View Proof</span>
              <ExternalLink className="w-3 h-3" />
            </motion.a>
          )}
          
          {/* Assign Button for Admins */}
          {showAssignButton && onAssign && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAssign(task)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              title="Assign task"
            >
              <UserPlus className="w-3 h-3" />
              Assign
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Approval Buttons (Admin only, when task is submitted) */}
      {showApprovalButtons && task.status === 'submitted' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onApprove && onApprove(task)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRequestRework && onRequestRework(task)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Request Rework
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;

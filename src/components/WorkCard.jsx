import { motion } from 'framer-motion';
import { 
  Calendar,
  Clock,
  AlertCircle,
  Paperclip,
  Play,
  Upload,
  Send,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  Eye,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY_COLORS = {
  Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
};

const STATUS_COLORS = {
  Pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Submitted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Rework: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

const WorkCard = ({ work, onClick, onStart, onUpload, onSubmit, onComment, delay = 0 }) => {
  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'High': return '📕';
      case 'Medium': return '📙';
      case 'Low': return '📘';
      default: return '📄';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <AlertCircle className="w-4 h-4" />;
      case 'In Progress': return <Play className="w-4 h-4" />;
      case 'Submitted': return <Send className="w-4 h-4" />;
      case 'Rework': return <RefreshCw className="w-4 h-4" />;
      case 'Completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'Blocked': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)' }}
      className="glass-card p-6 rounded-2xl cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[work.priority] || PRIORITY_COLORS.Medium}`}>
              {getPriorityIcon(work.priority)} {work.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${STATUS_COLORS[work.status] || STATUS_COLORS.Pending}`}>
              {getStatusIcon(work.status)}
              <span>{work.status}</span>
            </span>
          </div>
          <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {work.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {work.taskType}
          </p>
        </div>
      </div>

      {/* Client/Project Info */}
      {(work.clientName || work.projectName) && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          {work.clientName && (
            <div className="flex items-center space-x-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{work.clientName}</span>
            </div>
          )}
          {work.projectName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
              {work.projectName}
            </p>
          )}
        </div>
      )}

      {/* Description */}
      {work.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {work.description}
        </p>
      )}

      {/* Date & Time */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(work.date), 'MMM dd, yyyy')}</span>
        </div>
        {work.startTime && (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>
              {work.startTime}
              {work.endTime && ` - ${work.endTime}`}
            </span>
          </div>
        )}
      </div>

      {/* Attachments & Comments Count */}
      <div className="flex items-center space-x-4 mb-4 text-sm">
        {work.attachments && work.attachments.length > 0 && (
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Paperclip className="w-4 h-4" />
            <span>{work.attachments.length} file{work.attachments.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {work.comments && work.comments.length > 0 && (
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <MessageSquare className="w-4 h-4" />
            <span>{work.comments.length}</span>
          </div>
        )}
      </div>

      {/* Assigned By */}
      <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Assigned by:</span>
        <span className="text-sm font-semibold">{work.assignedByName}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {work.status === 'Pending' && onStart && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onStart(work);
            }}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Start</span>
          </motion.button>
        )}

        {work.status === 'In Progress' && onUpload && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onUpload(work);
            }}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Deliverable</span>
          </motion.button>
        )}

        {(work.status === 'In Progress' && work.submissions && work.submissions.length > 0) && onSubmit && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onSubmit(work);
            }}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Mark Submitted</span>
          </motion.button>
        )}

        {work.status === 'Rework' && onUpload && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onUpload(work);
            }}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Update & Resubmit</span>
          </motion.button>
        )}

        {onComment && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onComment(work);
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comment</span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </motion.button>
      </div>

      {/* Rework Notice */}
      {work.status === 'Rework' && work.adminFeedback && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-lg"
        >
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">
            ⚠️ Rework Requested
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-400">
            {work.adminFeedback}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WorkCard;

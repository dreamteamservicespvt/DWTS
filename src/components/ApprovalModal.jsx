/**
 * ApprovalModal - Task approval/rework request with confetti
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Send,
  Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { logActivity } from '../lib/activityLogger';
import ConfettiCelebration from './ConfettiCelebration';

export default function ApprovalModal({ task, mode = 'approve', onClose, onSuccess }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isApproval = mode === 'approve';

  const handleSubmit = async () => {
    if (!isApproval && !feedback.trim()) {
      toast.error('Please provide feedback for rework');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        status: isApproval ? 'approved' : 'rework',
        feedback: feedback.trim() || (isApproval ? 'Approved!' : ''),
        approvedAt: isApproval ? Timestamp.now() : null,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'tasks', task.id), updateData);

      await logActivity({
        taskId: task.id,
        action: isApproval ? 'task_approved' : 'rework_requested',
        message: isApproval 
          ? `Task approved: ${task.title}` 
          : `Rework requested: ${task.title}`,
        metadata: { feedback: feedback.trim() }
      });

      if (isApproval) {
        setShowConfetti(true);
        setTimeout(() => {
          toast.success('🎉 Task approved!');
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        toast.success('Rework request sent');
        if (onSuccess) onSuccess();
        onClose();
      }

    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showConfetti && <ConfettiCelebration />}
      
      <AnimatePresence>
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className={`p-6 ${isApproval ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'} text-white`}>
              <div className="flex items-center gap-3">
                {isApproval ? (
                  <>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Approve Task</h2>
                      <p className="text-sm text-white/80">Mark this task as complete</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Request Rework</h2>
                      <p className="text-sm text-white/80">Send feedback to improve</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Task Info */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {task.title}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {task.clientName && `${task.clientName} • `}
                  {task.projectName || 'No project'}
                </p>
              </div>

              {/* Deliverables */}
              {task.deliverables && task.deliverables.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Deliverables Submitted:
                  </p>
                  <div className="space-y-1">
                    {task.deliverables.map((item, idx) => (
                      <div key={idx} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <a 
                          href={item} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline truncate"
                        >
                          {item.includes('cloudinary') ? 'View file' : item}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                  {isApproval ? 'Appreciation Message (Optional)' : 'Feedback (Required)'}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={isApproval 
                    ? 'Great work! Keep it up...' 
                    : 'Please improve the following...'
                  }
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
                <p className="text-xs text-neutral-500 mt-1 text-right">
                  {feedback.length}/500
                </p>
              </div>

              {isApproval && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800 dark:text-green-200">
                    Approving will trigger a celebration and update task status to complete!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-neutral-50 dark:bg-neutral-800 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (!isApproval && !feedback.trim())}
                className={`px-6 py-2.5 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  isApproval 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-500'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    {isApproval ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {isApproval ? 'Approve Task' : 'Send Feedback'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle,
  RefreshCw,
  Eye,
  Download,
  MessageSquare,
  FileText,
  Calendar,
  User,
  Paperclip
} from 'lucide-react';
import { doc, updateDoc, arrayUnion, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { celebrateTaskCompletion } from './ConfettiCelebration';

const ReviewModal = ({ work, onClose, onReviewed }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(
    work.submissions && work.submissions.length > 0 ? work.submissions[work.submissions.length - 1] : null
  );

  const handleApprove = async () => {
    try {
      setLoading(true);
      const workRef = doc(db, 'assignedWork', work.id);

      await updateDoc(workRef, {
        status: 'Completed',
        completedAt: serverTimestamp(),
        adminFeedback: feedback || 'Approved - Great work!',
        activityLog: arrayUnion({
          action: 'approved',
          by: 'admin',
          timestamp: new Date().toISOString(),
          message: 'Work approved and marked as completed',
          feedback: feedback || 'Approved - Great work!'
        })
      });

      // Create notification for member
      if (work.assignedTo && work.assignedTo.length > 0) {
        await addDoc(collection(db, 'notifications'), {
          userId: work.assignedTo[0],
          type: 'work_approved',
          title: 'Work Approved! 🎉',
          message: `Your work "${work.title}" has been approved!`,
          workId: work.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      celebrateTaskCompletion();
      toast.success('Work approved — Great job! 🎉', {
        icon: '✅',
        duration: 5000
      });

      if (onReviewed) {
        onReviewed();
      }

      onClose();
    } catch (error) {
      console.error('Error approving work:', error);
      toast.error('Failed to approve work');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRework = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback for rework');
      return;
    }

    try {
      setLoading(true);
      const workRef = doc(db, 'assignedWork', work.id);

      await updateDoc(workRef, {
        status: 'Rework',
        adminFeedback: feedback,
        reworkRequestedAt: serverTimestamp(),
        activityLog: arrayUnion({
          action: 'rework_requested',
          by: 'admin',
          timestamp: new Date().toISOString(),
          message: 'Rework requested',
          feedback: feedback
        })
      });

      // Create notification for member
      if (work.assignedTo && work.assignedTo.length > 0) {
        await addDoc(collection(db, 'notifications'), {
          userId: work.assignedTo[0],
          type: 'work_rework',
          title: 'Rework Requested',
          message: `Rework needed for: ${work.title}`,
          workId: work.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      toast.success('Rework request sent to assignee');

      if (onReviewed) {
        onReviewed();
      }

      onClose();
    } catch (error) {
      console.error('Error requesting rework:', error);
      toast.error('Failed to request rework');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('video/')) return '🎥';
    if (type?.includes('pdf')) return '📄';
    return '📎';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-premium rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Review Submission</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Preview deliverables and provide feedback
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Work Info */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{work.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                      {work.taskType}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-semibold">
                      {work.status}
                    </span>
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-semibold">
                      {work.priority} Priority
                    </span>
                  </div>

                  {work.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{work.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Submitted by: {selectedSubmission?.submittedByName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {selectedSubmission?.submittedAt 
                          ? format(new Date(selectedSubmission.submittedAt), 'MMM dd, yyyy hh:mm a')
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions Tabs */}
            {work.submissions && work.submissions.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {work.submissions.map((submission, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSubmission(submission)}
                    className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                      selectedSubmission === submission
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Submission {index + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Submission Note */}
            {selectedSubmission?.note && (
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <h4 className="font-semibold">Submission Note</h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{selectedSubmission.note}</p>
              </div>
            )}

            {/* Deliverables */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center space-x-2">
                <Paperclip className="w-5 h-5" />
                <span>Deliverables ({selectedSubmission?.files?.length || 0})</span>
              </h4>
              
              {selectedSubmission?.files && selectedSubmission.files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSubmission.files.map((file, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ y: -4 }}
                      className="glass-card p-4 rounded-xl"
                    >
                      {/* File Preview */}
                      {file.type?.startsWith('image/') ? (
                        <div className="mb-3 rounded-xl overflow-hidden">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ) : file.type?.startsWith('video/') ? (
                        <div className="mb-3 rounded-xl overflow-hidden">
                          <video
                            src={file.url}
                            controls
                            className="w-full h-48 object-cover bg-black"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center">
                          <FileText className="w-16 h-16 text-gray-400" />
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </a>
                          <a
                            href={file.url}
                            download={file.name}
                            className="p-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/30 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No deliverables uploaded yet
                </div>
              )}
            </div>

            {/* Feedback Section */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Feedback / Comments
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-field resize-none"
                rows={5}
                placeholder="Add feedback or comments..."
              />
            </div>

            {/* Previous Comments */}
            {work.comments && work.comments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Previous Comments</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                  {work.comments.map((comment, index) => (
                    <div key={index} className="glass-card p-4 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={comment.byPhoto}
                          alt={comment.byName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-sm">{comment.byName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(comment.timestamp), 'MMM dd, yyyy hh:mm a')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="spinner border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={handleRequestRework}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="spinner border-white"></div>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Request Rework</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-8 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;

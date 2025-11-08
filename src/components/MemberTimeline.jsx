/**
 * MemberTimeline - Daily hourly timeline for team members
 * Shows assigned tasks with time slots, client badges, deliverable status
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  Upload,
  AlertCircle,
  Calendar,
  Briefcase,
  FileText,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logActivity } from '../lib/activityLogger';
import FileUploader from './FileUploader';

const STATUS_CONFIG = {
  pending: {
    label: 'Not Started',
    icon: Circle,
    color: 'text-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
  },
  'in-progress': {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  submitted: {
    label: 'Submitted',
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  rework: {
    label: 'Needs Work',
    icon: AlertCircle,
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
};

export default function MemberTimeline({ selectedDate = new Date() }) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null);
  const [showUploader, setShowUploader] = useState(null);

  const dateStr = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    fetchTasks();
  }, [currentUser, dateStr]);

  async function fetchTasks() {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'tasks'),
        where('assignedTo', 'array-contains', currentUser.uid),
        where('date', '==', dateStr)
      );
      
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by start time
      tasksData.sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.toDate() - b.startTime.toDate();
      });

      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      await logActivity({
        taskId,
        action: 'status_updated',
        message: `Status changed to ${newStatus}`,
        metadata: { newStatus }
      });

      toast.success(`Status updated to ${newStatus}`);
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleFileUploaded = async (taskId, files) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const existingDeliverables = task?.deliverables || [];
      
      await updateDoc(doc(db, 'tasks', taskId), {
        deliverables: [...existingDeliverables, ...files.map(f => f.url)],
        status: 'submitted',
        submittedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await logActivity({
        taskId,
        action: 'deliverable_uploaded',
        message: `Uploaded ${files.length} file(s) and marked as submitted`,
        metadata: { files: files.map(f => f.url) }
      });

      toast.success('✅ Deliverable uploaded and marked submitted');
      setShowUploader(null);
      fetchTasks();
    } catch (error) {
      console.error('Error uploading deliverable:', error);
      toast.error('Failed to upload deliverable');
    }
  };

  // Generate hourly slots (6 AM - 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Today's Timeline
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            {tasks.filter(t => t.status === 'approved').length} completed
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-800 rounded-2xl">
          <Calendar className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 font-semibold mb-2">
            No tasks assigned today
          </p>
          <p className="text-sm text-neutral-500">
            Check back later or view other dates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const StatusIcon = STATUS_CONFIG[task.status]?.icon || Circle;
            const isExpanded = expandedTask === task.id;
            const startTime = task.startTime?.toDate();
            const endTime = task.endTime?.toDate();
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Task Header */}
                <button
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className="w-full p-4 text-left flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  {/* Time */}
                  <div className="flex-shrink-0 text-center">
                    <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {startTime?.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                    <p className="text-xs text-neutral-500">to</p>
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {endTime?.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                  </div>

                  {/* Vertical line */}
                  <div className="w-px bg-gradient-to-b from-blue-500 to-indigo-500 self-stretch"></div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1 truncate">
                          {task.title}
                        </h3>
                        {task.clientName && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {task.clientName}
                            {task.projectName && ` • ${task.projectName}`}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {STATUS_CONFIG[task.status]?.label}
                        </span>
                      </div>
                    </div>

                    {/* Task metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">{task.taskType}</span>
                      </span>
                      
                      {task.priority && (
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                      
                      {task.durationHours && (
                        <span>{task.durationHours}h</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-neutral-200 dark:border-neutral-700"
                    >
                      <div className="p-4 space-y-4">
                        
                        {/* Description */}
                        {task.description && (
                          <div>
                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                              Description
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {task.description}
                            </p>
                          </div>
                        )}

                        {/* Assignment Notes */}
                        {task.assignmentNotes && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Instructions
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {task.assignmentNotes}
                            </p>
                          </div>
                        )}

                        {/* Deliverables */}
                        {task.deliverables && task.deliverables.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                              Expected Deliverables
                            </p>
                            <div className="space-y-1">
                              {task.deliverables.map((item, idx) => (
                                <p key={idx} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  {item}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                              className="flex-1 min-w-[140px] px-4 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Start Work
                            </button>
                          )}

                          {(task.status === 'in-progress' || task.status === 'rework') && (
                            <>
                              <button
                                onClick={() => setShowUploader(task.id)}
                                className="flex-1 min-w-[140px] px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                Add Deliverable
                              </button>
                            </>
                          )}

                          {task.status === 'submitted' && (
                            <div className="flex-1 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-300 font-semibold text-center">
                              ✅ Awaiting approval
                            </div>
                          )}

                          {task.status === 'approved' && (
                            <div className="flex-1 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 font-semibold text-center">
                              🎉 Approved!
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* File Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Upload Deliverable
              </h3>
              <FileUploader
                onFilesUploaded={(files) => handleFileUploaded(showUploader, files)}
                maxFiles={5}
                acceptedFileTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx', '.zip']}
              />
              <button
                onClick={() => setShowUploader(null)}
                className="mt-4 w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

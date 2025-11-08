/**
 * AssignPanel - Quick task assignment component
 * Mobile-first slide-up panel with conflict detection
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  X,
  Calendar,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Send,
  Search,
  User,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logActivity } from '../lib/activityLogger';
import { notifyTaskAssigned } from '../lib/notificationService';

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'High', label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

export default function AssignPanel({ task, onClose, onAssigned }) {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  
  const [formData, setFormData] = useState({
    assignedTo: task?.assignedTo || [],
    date: task?.date || new Date().toISOString().split('T')[0],
    startTime: task?.startTime?.toDate ? 
      task.startTime.toDate().toISOString().slice(11, 16) : 
      '09:00',
    endTime: task?.endTime?.toDate ? 
      task.endTime.toDate().toISOString().slice(11, 16) : 
      '11:00',
    duration: '',
    deliverables: task?.deliverables?.[0] || '',
    priority: task?.priority || 'Medium',
    notes: task?.assignmentNotes || '',
    notifyEmail: true,
  });

  // Fetch team members
  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        setLoadingData(true);
        const usersSnap = await getDocs(collection(db, 'users'));
        const members = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === 'member' || user.role === 'manager');
        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setLoadingData(false);
      }
    }
    fetchTeamMembers();
  }, []);

  // Auto-calculate duration
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const [startH, startM] = formData.startTime.split(':').map(Number);
      const [endH, endM] = formData.endTime.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      const diffMins = endMins - startMins;
      
      if (diffMins > 0) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setFormData(prev => ({ 
          ...prev, 
          duration: `${hours}h ${mins}m` 
        }));
      } else {
        setFormData(prev => ({ ...prev, duration: '' }));
      }
    }
  }, [formData.startTime, formData.endTime]);

  // Check for conflicts when assignee or time changes
  useEffect(() => {
    async function checkConflicts() {
      if (!formData.assignedTo.length || !formData.date || !formData.startTime) return;
      
      try {
        const conflicts = [];
        
        for (const memberId of formData.assignedTo) {
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('assignedTo', 'array-contains', memberId),
            where('date', '==', formData.date)
          );
          
          const tasksSnap = await getDocs(tasksQuery);
          
          tasksSnap.docs.forEach(doc => {
            const existingTask = doc.data();
            if (!existingTask.startTime || !existingTask.endTime) return;
            
            const existingStart = existingTask.startTime.toDate();
            const existingEnd = existingTask.endTime.toDate();
            
            const newStart = new Date(`${formData.date}T${formData.startTime}`);
            const newEnd = new Date(`${formData.date}T${formData.endTime}`);
            
            // Check overlap
            if (
              (newStart >= existingStart && newStart < existingEnd) ||
              (newEnd > existingStart && newEnd <= existingEnd) ||
              (newStart <= existingStart && newEnd >= existingEnd)
            ) {
              const member = teamMembers.find(m => m.id === memberId);
              conflicts.push({
                member: member?.name || 'Team member',
                task: existingTask.title,
                time: `${existingStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${existingEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              });
            }
          });
        }
        
        setConflicts(conflicts);
        if (conflicts.length > 0) {
          setShowConflictWarning(true);
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    }
    
    const timer = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timer);
  }, [formData.assignedTo, formData.date, formData.startTime, formData.endTime, teamMembers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleAssignee = (memberId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberId)
        ? prev.assignedTo.filter(id => id !== memberId)
        : [...prev.assignedTo, memberId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.assignedTo.length === 0) {
      toast.error('Please select at least one team member');
      return;
    }

    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if (endH * 60 + endM <= startH * 60 + startM) {
      toast.error('End time must be after start time');
      return;
    }

    // Check for 8+ hour duration
    const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationMins > 480) { // 8 hours
      const confirmed = window.confirm(
        'This task is longer than 8 hours. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }

    try {
      setLoading(true);

      const startDate = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDate = new Date(`${formData.date}T${formData.endTime}:00`);

      const assignmentData = {
        assignedTo: formData.assignedTo,
        date: formData.date,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        durationHours: (durationMins / 60).toFixed(1),
        deliverables: formData.deliverables ? [formData.deliverables] : [],
        priority: formData.priority,
        assignmentNotes: formData.notes,
        assignedBy: currentUser.uid,
        assignedByName: userProfile?.name || 'Admin',
        assignedAt: Timestamp.now(),
        status: task?.status || 'pending',
        updatedAt: Timestamp.now(),
      };

      // Update task
      await updateDoc(doc(db, 'tasks', task.id), assignmentData);

      // Log activity
      await logActivity({
        taskId: task.id,
        action: 'task_assigned',
        message: `Task assigned to ${formData.assignedTo.length} member(s)`,
        metadata: { assignees: formData.assignedTo, ...assignmentData }
      });

      // Notify assignees
      for (const memberId of formData.assignedTo) {
        const member = teamMembers.find(m => m.id === memberId);
        if (member) {
          await notifyTaskAssigned(
            { id: task.id, ...task, ...assignmentData },
            { name: userProfile?.name || 'Admin' }
          );
        }
      }

      toast.success('✅ Assigned — notification sent');
      
      if (onAssigned) {
        onAssigned(task.id);
      }
      
      onClose();

    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 rounded-t-3xl sm:rounded-t-2xl text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Assign task</h2>
                <p className="text-xs text-white/80">Team will see this in their Today timeline</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Task Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {task?.title || 'Untitled Task'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {task?.clientName && `${task.clientName} • `}
                {task?.projectName || 'No project'}
              </p>
            </div>

            {/* Assign to (with search) */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                <Users className="w-4 h-4 inline mr-1" />
                Assign to <span className="text-red-500">*</span>
              </label>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search teammates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              {/* Member list */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loadingData ? (
                  <div className="text-center py-8 text-neutral-500">Loading...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">No members found</div>
                ) : (
                  filteredMembers.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        formData.assignedTo.includes(member.id)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedTo.includes(member.id)}
                        onChange={() => toggleAssignee(member.id)}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {member.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {member.email}
                        </p>
                      </div>

                      {member.role === 'manager' && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                          Manager
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Start time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                  <Clock className="w-3 h-3 inline mr-1" />
                  End time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* Duration display */}
            {formData.duration && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Duration: {formData.duration}
                </span>
              </motion.div>
            )}

            {/* Conflict Warning */}
            <AnimatePresence>
              {showConflictWarning && conflicts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900 dark:text-orange-100 text-sm mb-2">
                        Conflict detected — this member already has work at this time
                      </p>
                      <ul className="space-y-1 text-xs text-orange-800 dark:text-orange-200">
                        {conflicts.map((conflict, idx) => (
                          <li key={idx}>
                            <strong>{conflict.member}</strong>: {conflict.task} ({conflict.time})
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                        Overbook anyway?
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setShowConflictWarning(false)}
                          className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Continue anyway
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, assignedTo: [] }));
                            setShowConflictWarning(false);
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 text-xs rounded-lg border border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                        >
                          Choose different time
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deliverables */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                <FileText className="w-4 h-4 inline mr-1" />
                Deliverables
              </label>
              <input
                type="text"
                name="deliverables"
                value={formData.deliverables}
                onChange={handleChange}
                placeholder="e.g., raw footage, 2-min edit"
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                Priority / Impact
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      formData.priority === option.value
                        ? option.color + ' ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                maxLength={200}
                rows={3}
                placeholder="Short instruction (max 200 chars)"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
              <p className="text-xs text-neutral-500 mt-1 text-right">
                {formData.notes.length}/200
              </p>
            </div>

            {/* Notify via email */}
            <label className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                name="notifyEmail"
                checked={formData.notifyEmail}
                onChange={handleChange}
                className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Notify via email
                </p>
                <p className="text-xs text-neutral-500">
                  In-app notification sent by default
                </p>
              </div>
            </label>

          </form>

          {/* Footer */}
          <div className="bg-neutral-50 dark:bg-neutral-800 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || formData.assignedTo.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Save & Notify
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

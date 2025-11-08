/**
 * Enhanced Task Form for Admin
 * Full task creation with client/project/member assignment
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Save,
  X,
  Calendar,
  Clock,
  User,
  Briefcase,
  FolderOpen,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logActivity } from '../lib/activityLogger';
import { notifyTaskAssigned } from '../lib/notificationService';

const TASK_TYPES = ['Shooting', 'Editing', 'Design', 'Posting', 'AdRun', 'Meeting', 'Other'];
const IMPACT_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTIONS = ['pending', 'in-progress', 'submitted', 'approved', 'rework'];

export default function AdminTaskForm({ onClose, onTaskSaved, editTask = null }) {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Dropdown data
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: editTask?.clientId || '',
    projectId: editTask?.projectId || '',
    assignedTo: editTask?.assignedTo || '',
    title: editTask?.title || '',
    description: editTask?.description || '',
    taskType: editTask?.taskType || 'Design',
    impact: editTask?.impact || 'Medium',
    status: editTask?.status || 'pending',
    date: editTask?.date || new Date().toISOString().split('T')[0],
    startTime: editTask?.startTime?.toDate ? 
      editTask.startTime.toDate().toISOString().slice(0, 16) : 
      new Date().toISOString().slice(0, 16),
    endTime: editTask?.endTime?.toDate ? 
      editTask.endTime.toDate().toISOString().slice(0, 16) : 
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    priority: editTask?.priority || 1,
  });

  // Fetch clients, projects, and team members
  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);

        // Fetch clients
        const clientsSnap = await getDocs(collection(db, 'clients'));
        const clientsData = clientsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsData);

        // Fetch all projects
        const projectsSnap = await getDocs(collection(db, 'projects'));
        const projectsData = projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllProjects(projectsData);

        // Fetch team members (users with role member or manager)
        const usersSnap = await getDocs(collection(db, 'users'));
        const membersData = usersSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.role === 'member' || user.role === 'manager');
        setTeamMembers(membersData);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data');
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  // Filter projects when client changes
  useEffect(() => {
    if (formData.clientId) {
      const filtered = allProjects.filter(p => p.clientId === formData.clientId);
      setProjects(filtered);
      
      // Reset project if it doesn't belong to selected client
      if (formData.projectId && !filtered.find(p => p.id === formData.projectId)) {
        setFormData(prev => ({ ...prev, projectId: '' }));
      }
    } else {
      setProjects([]);
      setFormData(prev => ({ ...prev, projectId: '' }));
    }
  }, [formData.clientId, allProjects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.clientId) {
      toast.error('Please select a client');
      return;
    }
    if (!formData.assignedTo) {
      toast.error('Please assign to a team member');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      setLoading(true);

      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);

      if (endDate <= startDate) {
        toast.error('End time must be after start time');
        setLoading(false);
        return;
      }

      // Calculate duration in hours
      const durationMs = endDate - startDate;
      const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;

      const taskData = {
        clientId: formData.clientId,
        projectId: formData.projectId || null,
        assignedTo: formData.assignedTo,
        title: formData.title,
        description: formData.description,
        taskType: formData.taskType,
        impact: formData.impact,
        status: formData.status,
        date: formData.date,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        durationHours,
        priority: parseInt(formData.priority),
        progress: editTask?.progress || 0,
        deliverables: editTask?.deliverables || [],
        feedback: editTask?.feedback || '',
        createdBy: currentUser.uid,
        updatedAt: Timestamp.now(),
      };

      let taskId = editTask?.id;

      if (editTask) {
        // Update existing task
        await updateDoc(doc(db, 'tasks', editTask.id), taskData);
        
        await logActivity({
          taskId: editTask.id,
          action: 'task_updated',
          message: `Task "${formData.title}" updated`,
          metadata: { updates: taskData }
        });

        toast.success('Task updated successfully!');
      } else {
        // Create new task
        taskData.createdAt = Timestamp.now();
        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        taskId = docRef.id;

        await logActivity({
          taskId: docRef.id,
          action: 'task_created',
          message: `Task "${formData.title}" created and assigned to ${teamMembers.find(m => m.id === formData.assignedTo)?.name}`,
          metadata: taskData
        });

        // Send notification to assigned user
        const assignedUser = teamMembers.find(m => m.id === formData.assignedTo);
        if (assignedUser) {
          await notifyTaskAssigned(
            { id: docRef.id, ...taskData },
            { name: userProfile?.name || 'Admin' }
          );
        }

        toast.success('✅ Task created and assigned!');
      }

      if (onTaskSaved) {
        onTaskSaved(taskId);
      }

      onClose();

    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-center mt-4 text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {editTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <p className="text-white/80 text-sm">
                  Assign work to team members with detailed scheduling
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              
              {/* Client & Project Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                    <FolderOpen className="w-4 h-4 inline mr-1" />
                    Project (Optional)
                  </label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    disabled={!formData.clientId}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.title}
                      </option>
                    ))}
                  </select>
                  {!formData.clientId && (
                    <p className="text-xs text-neutral-500 mt-1">Select a client first</p>
                  )}
                </div>
              </div>

              {/* Assign to Team Member */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                  <User className="w-4 h-4 inline mr-1" />
                  Assign To <span className="text-red-500">*</span>
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  required
                >
                  <option value="">Select Team Member</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="E.g., Design Instagram reel for product launch"
                  required
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder="Add detailed instructions, requirements, or context..."
                />
              </div>

              {/* Task Type & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                    Task Type
                  </label>
                  <select
                    name="taskType"
                    value={formData.taskType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    {TASK_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                    Impact Level
                  </label>
                  <select
                    name="impact"
                    value={formData.impact}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    {IMPACT_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Scheduling */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                      <Clock className="w-4 h-4 inline mr-1" />
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Duration Calculator */}
                {formData.startTime && formData.endTime && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-white dark:bg-neutral-800 rounded-lg"
                  >
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      <strong>Duration:</strong>{' '}
                      {(() => {
                        const start = new Date(formData.startTime);
                        const end = new Date(formData.endTime);
                        const diff = end - start;
                        if (diff <= 0) return 'Invalid time range';
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        return `${hours}h ${minutes}m`;
                      })()}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
                    Priority (1-5)
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    min="1"
                    max="5"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              {/* Assignment Quick Tip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">💡 Quick Tip:</p>
                  <p className="text-xs">
                    After creating the task, you can quickly assign it to team members using the "Assign" button on the task card. 
                    Or assign now by filling in team member above!
                  </p>
                </div>
              </motion.div>

            </div>
          </form>

          {/* Footer Actions */}
          <div className="bg-neutral-50 dark:bg-neutral-800 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editTask ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

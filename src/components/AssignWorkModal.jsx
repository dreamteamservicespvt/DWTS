import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar,
  Clock,
  AlertCircle,
  Paperclip,
  Send,
  Users,
  Search,
  Bell,
  BellOff,
  Zap,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import { useAuth } from '../context/AuthContext';
import { getMemberStatistics } from '../utils/calculateWorkMetrics';
import toast from 'react-hot-toast';

const TASK_TYPES = ['Shooting', 'Editing', 'Design', 'Posting', 'Ad', 'Other'];
const PRIORITY_LEVELS = [
  { value: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '📘' },
  { value: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '📙' },
  { value: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '📕' }
];

const AssignWorkModal = ({ isOpen, onClose, onWorkAssigned }) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberStats, setMemberStats] = useState({});
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [memberActiveTasks, setMemberActiveTasks] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    clientName: '',
    clientLogo: '',
    projectId: '',
    projectName: '',
    description: '',
    taskType: 'Shooting',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    priority: 'Medium',
    attachments: [],
    assignedTo: [], // Array of { uid, name, email, photoURL }
    notify: true,
    autoReminders: true
  });

  // Fetch team members, clients, and projects
  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      fetchClients();
      fetchProjects();
    }
  }, [isOpen]);

  // Filter members based on search
  useEffect(() => {
    if (memberSearch.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.email.toLowerCase().includes(memberSearch.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [memberSearch, members]);

  // Filter projects when client changes
  useEffect(() => {
    if (formData.clientId) {
      const clientProjects = projects.filter(p => p.clientId === formData.clientId);
      setFilteredProjects(clientProjects);
    } else {
      setFilteredProjects(projects);
    }
  }, [formData.clientId, projects]);

  const fetchMembers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const membersList = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'member');

      // Fetch all assigned work
      const assignedWorkSnapshot = await getDocs(collection(db, 'assignedWork'));
      const allAssignedWork = assignedWorkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch active task counts and calculate comprehensive stats for each member
      const taskCounts = {};
      const stats = {};
      
      for (const member of membersList) {
        // Count active tasks
        const tasksQuery = query(
          collection(db, 'assignedWork'),
          where('assignedTo', 'array-contains', member.uid),
          where('status', 'in', ['Pending', 'In Progress'])
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        taskCounts[member.uid] = tasksSnapshot.size;

        // Get comprehensive statistics
        const memberTasks = []; // We don't need daily tasks here, just assigned work stats
        const memberWork = allAssignedWork.filter(w => 
          w.assignedTo && w.assignedTo.includes(member.uid)
        );
        
        const memberWithStats = {
          ...member,
          workScore: 0,
          totalHours: 0,
          completedTasks: 0,
          taskCount: 0
        };
        
        stats[member.uid] = getMemberStatistics(memberWithStats, memberTasks, allAssignedWork);
      }

      setMemberActiveTasks(taskCounts);
      setMemberStats(stats);
      setMembers(membersList);
      setFilteredMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load team members');
    }
  };

  const fetchClients = async () => {
    try {
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clientsList = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsList = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsList);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    const selectedClient = clients.find(c => c.id === clientId);
    
    setFormData(prev => ({
      ...prev,
      clientId,
      clientName: selectedClient?.name || '',
      clientLogo: selectedClient?.logo || '',
      projectId: '',
      projectName: ''
    }));
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    const selectedProject = filteredProjects.find(p => p.id === projectId);
    
    setFormData(prev => ({
      ...prev,
      projectId,
      projectName: selectedProject?.name || ''
    }));
  };

  const handleMemberToggle = (member) => {
    const isSelected = formData.assignedTo.some(m => m.uid === member.uid);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.filter(m => m.uid !== member.uid)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedTo: [...prev.assignedTo, {
          uid: member.uid,
          name: member.name,
          email: member.email,
          photoURL: member.photoURL
        }]
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingFiles(true);

      // Upload to Cloudinary
      const uploadResults = await uploadMultipleToCloudinary(
        files,
        null, // No progress callback needed for admin modal
        {
          folder: 'dwts-work-attachments',
          maxSize: 50 * 1024 * 1024 // 50MB
        }
      );

      const successfulUploads = uploadResults.filter(result => result.success);

      if (successfulUploads.length > 0) {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...successfulUploads]
        }));
        toast.success(`✅ ${successfulUploads.length} file(s) uploaded successfully`);
      }

      const failedUploads = uploadResults.filter(result => !result.success);
      if (failedUploads.length > 0) {
        toast.error(`❌ ${failedUploads.length} file(s) failed to upload`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a work title');
      return;
    }

    if (formData.assignedTo.length === 0) {
      toast.error('Please select at least one team member to assign this work');
      return;
    }

    try {
      setLoading(true);

      // Create work document for each assigned member
      const workPromises = formData.assignedTo.map(async (member) => {
        const workData = {
          title: formData.title,
          clientId: formData.clientId,
          clientName: formData.clientName,
          clientLogo: formData.clientLogo,
          projectId: formData.projectId,
          projectName: formData.projectName,
          description: formData.description,
          taskType: formData.taskType,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          priority: formData.priority,
          attachments: formData.attachments,
          assignedTo: [member.uid],
          assignedToDetails: [{
            uid: member.uid,
            name: member.name,
            email: member.email,
            photoURL: member.photoURL
          }],
          assignedBy: userProfile.uid,
          assignedByName: userProfile.name,
          status: 'Pending',
          submissions: [],
          comments: [],
          activityLog: [
            {
              action: 'assigned',
              by: userProfile.uid,
              byName: userProfile.name,
              to: member.uid,
              toName: member.name,
              timestamp: new Date().toISOString(),
              message: `Work assigned to ${member.name}`
            }
          ],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'assignedWork'), workData);

        // Create notification for the member
        if (formData.notify) {
          await addDoc(collection(db, 'notifications'), {
            userId: member.uid,
            type: 'work_assigned',
            title: 'New Work Assigned',
            message: `${userProfile.name} assigned you: ${formData.title}`,
            workId: docRef.id,
            read: false,
            createdAt: serverTimestamp()
          });
        }

        return { docRef, member };
      });

      await Promise.all(workPromises);

      // Success notification
      const memberNames = formData.assignedTo.map(m => m.name).join(', ');
      toast.success(
        formData.assignedTo.length === 1
          ? `Work assigned to ${memberNames} — Notification sent.`
          : `Work assigned to ${formData.assignedTo.length} members — Notifications sent.`,
        { duration: 5000 }
      );

      // Reset form
      setFormData({
        title: '',
        clientId: '',
        clientName: '',
        clientLogo: '',
        projectId: '',
        projectName: '',
        description: '',
        taskType: 'Shooting',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        priority: 'Medium',
        attachments: [],
        assignedTo: [],
        notify: true,
        autoReminders: true
      });

      if (onWorkAssigned) {
        onWorkAssigned();
      }

      onClose();
    } catch (error) {
      console.error('Error assigning work:', error);
      toast.error('Failed to assign work. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="glass-premium rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-premium-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create & Assign Work</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Assign work to team members and track progress
                  </p>
                </div>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Work Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Work Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="E.g., Create Instagram reels for Product Launch"
                required
              />
            </div>

            {/* Client & Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Client</label>
                <select
                  value={formData.clientId}
                  onChange={handleClientChange}
                  className="select-field"
                >
                  <option value="">Select client (optional)</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Project</label>
                <select
                  value={formData.projectId}
                  onChange={handleProjectChange}
                  className="select-field"
                  disabled={!formData.clientId && filteredProjects.length === 0}
                >
                  <option value="">Select project (optional)</option>
                  {filteredProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Description / Brief
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field resize-none"
                rows={4}
                placeholder="Add reference links or notes. Be specific about what you expect..."
              />
            </div>

            {/* Task Type & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Task Type</label>
                <select
                  value={formData.taskType}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskType: e.target.value }))}
                  className="select-field"
                >
                  {TASK_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Impact / Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_LEVELS.map(level => (
                    <motion.button
                      key={level.value}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData(prev => ({ ...prev, priority: level.value }))}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        formData.priority === level.value
                          ? level.color + ' ring-2 ring-offset-2 ring-current'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="mr-1">{level.icon}</span>
                      {level.value}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                <Paperclip className="inline w-4 h-4 mr-1" />
                Attachments
              </label>
              
              {formData.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {uploadingFiles ? 'Uploading...' : 'Click to upload reference files'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Images, videos, PDFs, or documents
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFiles}
                />
              </label>
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Assign To <span className="text-red-500">*</span>
              </label>

              {/* Selected Members */}
              {formData.assignedTo.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.assignedTo.map(member => (
                    <motion.div
                      key={member.uid}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full"
                    >
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => handleMemberToggle(member)}
                        className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Member Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search team members..."
                />
              </div>

              {/* Member List */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl max-h-64 overflow-y-auto custom-scrollbar">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map(member => {
                    const isSelected = formData.assignedTo.some(m => m.uid === member.uid);
                    const activeTaskCount = memberActiveTasks[member.uid] || 0;
                    const stats = memberStats[member.uid];

                    return (
                      <motion.button
                        key={member.uid}
                        type="button"
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        onClick={() => handleMemberToggle(member)}
                        className={`w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={member.photoURL}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                            {stats && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                  {stats.weekly?.completionRate || 0}% weekly
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                  {stats.monthly?.completed || 0}/{stats.monthly?.total || 0} monthly
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium">
                            {activeTaskCount} active
                          </span>
                          {stats && stats.overall?.completionRate !== undefined && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              stats.overall.completionRate >= 80 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : stats.overall.completionRate >= 60
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : stats.overall.completionRate >= 40
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {stats.overall.completionRate}%
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No members found
                  </div>
                )}
              </div>
            </div>

            {/* Notification Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  {formData.notify ? (
                    <Bell className="w-5 h-5 text-blue-500" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold">Send Notification</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      In-app + email notification to assigned members
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, notify: !prev.notify }))}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    formData.notify ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.notify ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-semibold">Auto-Reminders</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reminder at 1 day before / 1 hour before
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, autoReminders: !prev.autoReminders }))}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    formData.autoReminders ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.autoReminders ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                type="submit"
                disabled={loading || formData.assignedTo.length === 0}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="spinner border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Assign Work</span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AssignWorkModal;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Save,
  Sparkles,
  Upload,
  X,
  CheckCircle,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { autoGenerateTaskDescription } from '../utils/aiSummary';
import { celebrateTaskCompletion } from '../components/ConfettiCelebration';

const TASK_TYPES = ['Creative', 'Technical', 'Client Handling', 'Operational', 'Meeting', 'Misc'];
const IMPACT_LEVELS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];
const TIME_OPTIONS = [
  '0.25', '0.5', '0.75', '1', '1.5', '2', '2.5', '3', '3.5', '4',
  '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9',
  '9.5', '10', '10.5', '11', '11.5', '12'
];

const TaskForm = ({ onClose, onTaskAdded, editTask = null }) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [formData, setFormData] = useState(
    editTask || {
      title: '',
      description: '',
      type: 'Operational',
      timeSpent: '1',
      impact: 'Medium',
      status: 'In Progress',
      proofURL: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAutoDescribe = () => {
    if (!formData.title) {
      toast.error('Please enter a task title first');
      return;
    }

    const description = autoGenerateTaskDescription(formData.title);
    setFormData(prev => ({
      ...prev,
      description,
    }));
    toast.success('AI description generated!');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingProof(true);

      // Use the Cloudinary upload utility
      const { uploadToCloudinary } = await import('../utils/cloudinaryUpload');
      const secureUrl = await uploadToCloudinary(file);

      setFormData(prev => ({
        ...prev,
        proofURL: secureUrl,
      }));
      toast.success('Proof uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload proof');
      
      // Fallback: Use a placeholder if upload fails
      setFormData(prev => ({
        ...prev,
        proofURL: `https://via.placeholder.com/400x300?text=${encodeURIComponent(file.name)}`,
      }));
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    try {
      setLoading(true);

      const taskData = {
        ...formData,
        userId: userProfile.uid,
        userName: userProfile.name,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'tasks'), taskData);

      // Celebrate if task is completed
      if (formData.status === 'Completed') {
        celebrateTaskCompletion();
        toast.success('🎉 Task completed! Great job!', {
          icon: '🎊',
          duration: 4000,
        });
      } else {
        toast.success('✅ Task added successfully!');
      }
      
      if (onTaskAdded) {
        onTaskAdded();
      }

      if (onClose) {
        onClose();
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'Operational',
        timeSpent: '1',
        impact: 'Medium',
        status: 'In Progress',
        proofURL: '',
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="glass-premium rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-premium-lg relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background gradient */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-400/20 rounded-full blur-3xl" />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-extrabold text-gradient-premium">
                  {editTask ? 'Edit Task' : 'Add New Task'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track your daily work and productivity
                </p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
            </motion.button>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field py-4 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
              placeholder="E.g., Design landing page mockup"
              required
            />
          </motion.div>

          {/* Task Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                Task Description <span className="text-red-500">*</span>
              </label>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAutoDescribe}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Auto-describe</span>
              </motion.button>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input-field resize-none py-4 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
              placeholder="Describe what you worked on in detail..."
              required
            />
          </motion.div>

          {/* Task Type & Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="select-field"
                required
              >
                {TASK_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Impact Level <span className="text-red-500">*</span>
              </label>
              <select
                name="impact"
                value={formData.impact}
                onChange={handleChange}
                className="select-field"
                required
              >
                {IMPACT_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Spent & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Time Spent (hours) <span className="text-red-500">*</span>
              </label>
              <select
                name="timeSpent"
                value={formData.timeSpent}
                onChange={handleChange}
                className="select-field"
                required
              >
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>
                    {time} {parseFloat(time) === 1 ? 'hour' : 'hours'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="select-field"
                required
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Proof Upload - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Proof/Screenshot (optional)
            </label>
            
            {formData.proofURL ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group"
              >
                <img
                  src={formData.proofURL}
                  alt="Task proof"
                  className="w-full h-56 object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <motion.button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, proofURL: '' }))}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-3 right-3 p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </motion.button>
                <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs font-medium">Click × to remove image</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.02, borderColor: 'rgb(0, 87, 255)' }}
                className="border-3 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 hover:border-blue-500 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                {/* Animated background */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 blur-3xl"
                />
                
                <input
                  type="file"
                  id="proof-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingProof}
                />
                <label
                  htmlFor="proof-upload"
                  className="cursor-pointer flex flex-col items-center relative z-10"
                >
                  {uploadingProof ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <div className="spinner border-blue-600"></div>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                      >
                        <Upload className="w-8 h-8 text-white" />
                      </motion.div>
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Drop your file here or click to browse
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </span>
                    </>
                  )}
                </label>
              </motion.div>
            )}
          </motion.div>

          {/* Submit Button - Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center space-x-4 pt-6"
          >
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03, boxShadow: '0 20px 40px -10px rgba(0, 87, 255, 0.4)' }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="relative flex-1 py-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-white font-bold rounded-2xl shadow-premium-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              <span className="relative flex items-center justify-center space-x-2">
                {loading ? (
                  <div className="spinner border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span className="text-lg">{editTask ? 'Update Task' : 'Add Task'}</span>
                  </>
                )}
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-2xl font-bold text-gray-700 dark:text-gray-300 transition-all duration-300 shadow-lg"
            >
              Cancel
            </motion.button>
          </motion.div>

          {/* Success Indicator - Enhanced */}
          {formData.status === 'Completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex items-center space-x-3 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 360, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </motion.div>
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">
                  🎉 Awesome! This task will be marked as completed.
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  You'll see a celebration when you submit!
                </p>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
};

export default TaskForm;

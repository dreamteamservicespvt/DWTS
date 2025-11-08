import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    photoURL: userProfile?.photoURL || '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await updateUserProfile({
        name: formData.name,
        photoURL: formData.photoURL,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-2xl"
      >
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold">Profile Information</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center space-x-6">
            <img
              src={formData.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary-400"
            />
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2">
                Profile Photo URL
              </label>
              <input
                type="url"
                name="photoURL"
                value={formData.photoURL}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter photo URL"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Or use UI Avatars: Leave empty to auto-generate based on your name
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Your full name"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              className="input-field bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Role
            </label>
            <input
              type="text"
              value={userProfile?.role?.toUpperCase() || 'MEMBER'}
              className="input-field bg-gray-100 dark:bg-gray-800 cursor-not-allowed capitalize"
              disabled
            />
          </div>

          {/* Save Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="btn-gradient w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="spinner border-white"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 rounded-2xl text-center"
      >
        <h3 className="font-semibold mb-2">Daily Work Tracking System</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Version 1.0.0 • Built with React, Firebase & AI
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span>© 2025 DWTS</span>
          <span>•</span>
          <span>Made with ❤️</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        await signup(formData.email, formData.password, formData.name, 'member');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animated-gradient bg-gradient-to-br from-blue-600 via-cyan-400 to-teal-300 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Title with enhanced animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div 
            className="w-24 h-24 bg-white rounded-3xl shadow-premium-lg mx-auto mb-6 flex items-center justify-center animate-glow relative overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-400 opacity-10" />
            <span className="text-5xl font-bold text-gradient-premium">D</span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl font-extrabold text-white mb-3 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Welcome to <span className="text-gradient-gold">DWTS</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/90 text-lg font-medium"
          >
            Daily Work Tracking System
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/70 text-sm mt-2"
          >
            Track, Analyze, and Excel 🚀
          </motion.p>
        </motion.div>

        {/* Form Card with Premium Glass Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className="glass-premium p-8 rounded-3xl shadow-premium-lg backdrop-blur-2xl border-2 border-white/30"
        >
          {/* Toggle Buttons with Enhanced Animation */}
          <div className="flex gap-2 mb-8 p-1.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg">
            <motion.button
              type="button"
              onClick={() => setIsLogin(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-premium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setIsLogin(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-premium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Sign Up
              </span>
            </motion.button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (Sign up only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="input-field pl-12 pr-4 py-4 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
                    placeholder="John Doe"
                  />
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </motion.div>
            )}

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field pl-12 pr-4 py-4 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
                  placeholder="your@email.com"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field pl-12 pr-12 py-4 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Confirm Password (Sign up only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    className="input-field pl-12 pr-4 py-4 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </motion.div>
            )}

            {/* Submit Button with Premium Styling */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03, boxShadow: "0 20px 40px -10px rgba(0, 87, 255, 0.4)" }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="relative w-full py-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-white font-bold rounded-2xl shadow-premium-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
            >
              {/* Shine effect on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              <span className="relative flex items-center justify-center space-x-2">
                {loading ? (
                  <div className="spinner border-white"></div>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    <span className="text-lg">{isLogin ? 'Login to Continue' : 'Create Account'}</span>
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Demo Credentials / Instructions */}
          {isLogin ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 space-y-3"
            >
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-800 dark:text-orange-200 mb-2 font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>First Time User?</span>
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Click "Sign Up" above to create your account first. Demo credentials below are placeholders - you need to create these users.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-blue-800 dark:text-blue-200 mb-3 font-semibold">
                  🔐 Demo Credentials (Create these first):
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        email: 'admin@dwts.com',
                        password: 'admin123'
                      });
                      toast.info('Admin credentials filled. Click Login to continue.');
                    }}
                    className="w-full text-left px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      👤 Admin: admin@dwts.com / admin123
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      Click to auto-fill
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        email: 'member@dwts.com',
                        password: 'member123'
                      });
                      toast.info('Member credentials filled. Click Login to continue.');
                    }}
                    className="w-full text-left px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      👥 Member: member@dwts.com / member123
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      Click to auto-fill
                    </p>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"
            >
              <p className="text-xs text-green-800 dark:text-green-200 mb-2 font-semibold">
                ✨ Creating Your First Account
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                New accounts are created as "Member" by default. To become an admin:
              </p>
              <ol className="text-xs text-green-700 dark:text-green-300 list-decimal list-inside space-y-1">
                <li>Create account here</li>
                <li>Go to Firebase Console → Firestore</li>
                <li>Find your user document</li>
                <li>Change role from "member" to "admin"</li>
              </ol>
            </motion.div>
          )}
        </motion.div>

        {/* Footer with enhanced styling */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 space-y-3"
        >
          <p className="text-white/90 text-sm font-medium">
            Built with ❤️ using AI-powered development
          </p>
          <div className="flex items-center justify-center space-x-4 text-white/70 text-xs">
            <span>🔒 Secure</span>
            <span>•</span>
            <span>⚡ Fast</span>
            <span>•</span>
            <span>🎨 Beautiful</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

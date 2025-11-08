import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Shield,
  Settings,
  X,
  Building2,
  FolderKanban,
  Calendar,
  Briefcase,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'member'],
    },
    {
      name: 'My Work',
      icon: Briefcase,
      path: '/my-work',
      roles: ['member'],
    },
    {
      name: 'My Tasks',
      icon: ListTodo,
      path: '/tasks',
      roles: ['member'],
    },
    {
      name: 'Clients',
      icon: Building2,
      path: '/clients',
      roles: ['admin'],
    },
    {
      name: 'Projects',
      icon: FolderKanban,
      path: '/projects',
      roles: ['admin'],
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      roles: ['admin', 'member'],
    },
    {
      name: 'Admin Panel',
      icon: Shield,
      path: '/admin',
      roles: ['admin'],
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['admin', 'member'],
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    isAdmin ? item.roles.includes('admin') : item.roles.includes('member')
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky left-0 top-0 h-screen w-64 
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 
          z-50 lg:z-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-aqua-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">DWTS</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Work Tracker</p>
              </div>
            </motion.div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-aqua-500 text-white shadow-lg'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                    <span className="font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="glass-card p-4 rounded-xl">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                💡 <span className="font-semibold">Pro Tip</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Track your tasks regularly for better insights!
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

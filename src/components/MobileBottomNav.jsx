import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ListTodo, 
  BarChart3, 
  Settings,
  PlusCircle,
  Users,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = ({ onAddTask }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const memberNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/my-work', icon: Briefcase, label: 'My Work' },
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const adminNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin', icon: Users, label: 'Team' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = isAdmin ? adminNavItems : memberNavItems;

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-premium-lg"
    >
      <div className="grid grid-cols-5 h-20">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          if (index === 2 && !isAdmin) {
            // Center button for adding tasks (members only)
            return (
              <motion.button
                key="add"
                onClick={onAddTask}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center relative"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-14 h-14 -mt-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full shadow-premium-lg flex items-center justify-center"
                >
                  <PlusCircle className="w-7 h-7 text-white" />
                </motion.div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                  Add Task
                </span>
              </motion.button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl ${
                  active ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'animate-bounce-in' : ''}`} />
              </motion.div>
              
              <span className={`text-xs font-semibold ${active ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;

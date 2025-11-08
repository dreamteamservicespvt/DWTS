import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import ClientList from './pages/ClientList';
import ProjectList from './pages/ProjectList';
import MyWork from './pages/MyWork';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Loading from './components/Loading';
import OfflineIndicator from './components/OfflineIndicator';
import MobileBottomNav from './components/MobileBottomNav';
import TaskForm from './pages/TaskForm';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userProfile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Layout Component
const MainLayout = ({ children }) => {
  const { isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth >= 1024; // lg breakpoint
  });
  const [showTaskForm, setShowTaskForm] = useState(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto overflow-x-hidden">
        {/* Mobile Menu Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-premium"
        >
          <Menu className="w-6 h-6" />
        </motion.button>

        {/* Navbar */}
        <Navbar />

        {/* Page Content with animations */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 sm:p-6 lg:p-8 w-full mb-20 md:mb-0"
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </motion.main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onAddTask={() => setShowTaskForm(true)} />

        {/* Task Form Modal */}
        {showTaskForm && !isAdmin && (
          <TaskForm
            onClose={() => setShowTaskForm(false)}
            onTaskAdded={() => {
              setShowTaskForm(false);
              // Optionally refresh data
            }}
          />
        )}
      </div>
    </div>
  );
};

// App Component
function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          currentUser ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Tasks />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-work"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyWork />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Analytics />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <ProtectedRoute adminOnly>
            <MainLayout>
              <ClientList />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute adminOnly>
            <MainLayout>
              <ProjectList />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <MainLayout>
              <AdminPanel />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={currentUser ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <Navigate
            to={currentUser ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#1f2937',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 20px 40px -10px rgba(0, 87, 255, 0.2), 0 0 20px -5px rgba(0, 196, 180, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              style: {
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              },
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              style: {
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
                borderColor: 'rgba(59, 130, 246, 0.3)',
              },
            },
          }}
        />
        <OfflineIndicator />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Calendar, Edit, TrendingUp, FileText, Activity } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { GlassCard, AnimatedButton, StatusBadge, ProgressBar, LoadingSpinner } from '../components/PremiumUI';

const ClientDetail = ({ client, onClose, onEdit }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Fetch projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('clientId', '==', client.id)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsData);

        // Fetch tasks
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('clientId', '==', client.id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(tasksData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching client data:', error);
        setLoading(false);
      }
    };

    fetchClientData();
  }, [client.id]);

  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl my-8"
      >
        <GlassCard className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              {/* Client Logo */}
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {client.logoUrl ? (
                  <img 
                    src={client.logoUrl} 
                    alt={client.name} 
                    className="w-full h-full object-cover rounded-3xl"
                  />
                ) : (
                  client.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Client Info */}
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">
                  {client.name}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                  {client.industry}
                </p>
                <StatusBadge status={client.status || 'Active'} />
              </div>
            </div>

            <div className="flex gap-2">
              <AnimatedButton
                variant="primary"
                size="md"
                icon={<Edit />}
                onClick={onEdit}
              >
                Edit
              </AnimatedButton>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                  <Mail className="text-brand-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {client.email || 'Not provided'}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center">
                  <Phone className="text-brand-secondary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {client.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center">
                  <Calendar className="text-brand-accent" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {client.startDate ? new Date(client.startDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <Calendar className="text-red-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Renewal Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {client.renewalDate ? new Date(client.renewalDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Projects</p>
                  <p className="text-3xl font-bold text-brand-primary">{projects.length}</p>
                </div>
                <TrendingUp className="text-brand-primary" size={32} />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-brand-secondary">{totalTasks}</p>
                </div>
                <Activity className="text-brand-secondary" size={32} />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-500">{completedTasks}</p>
                </div>
                <FileText className="text-green-500" size={32} />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-brand-accent">{completionRate}%</p>
                </div>
                <TrendingUp className="text-brand-accent" size={32} />
              </div>
            </GlassCard>
          </div>

          {/* Progress */}
          <GlassCard className="p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Overall Progress
            </h3>
            <ProgressBar progress={completionRate} size="lg" color="primary" showLabel />
          </GlassCard>

          {/* Monthly Plan */}
          {client.planDetails && (
            <GlassCard className="p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Monthly Content Plan
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {client.planDetails}
              </p>
            </GlassCard>
          )}

          {/* Recent Projects */}
          {projects.length > 0 && (
            <GlassCard className="p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Projects ({projects.length})
              </h3>
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <motion.div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.type} • {project.month}
                      </p>
                    </div>
                    <StatusBadge status={project.status} size="sm" />
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Notes */}
          {client.notes && (
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Notes
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {client.notes}
              </p>
            </GlassCard>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default ClientDetail;

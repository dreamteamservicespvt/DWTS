import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  FolderKanban,
  Calendar as CalendarIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { GlassCard, AnimatedButton, EmptyState, LoadingSpinner, ProjectCard } from '../components/PremiumUI';
import ProjectForm from './ProjectForm';
import toast from 'react-hot-toast';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch projects and clients
  useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const clientsQuery = query(collection(db, 'clients'));
    
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsData);
      setFilteredProjects(projectsData);
      setLoading(false);
    });

    const unsubClients = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsData);
    });

    return () => {
      unsubProjects();
      unsubClients();
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = projects;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    // Client filter
    if (filterClient !== 'all') {
      filtered = filtered.filter(project => project.clientId === filterClient);
    }

    setFilteredProjects(filtered);
  }, [searchQuery, filterStatus, filterClient, projects]);

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'In Progress').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    notStarted: projects.filter(p => p.status === 'Not Started').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-white to-secondary-50/30 dark:from-brand-dark dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">
              Project Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage content projects and deliverables
            </p>
          </div>
          
          <AnimatedButton
            variant="primary"
            size="lg"
            icon={<Plus />}
            onClick={() => {
              setSelectedProject(null);
              setShowForm(true);
            }}
          >
            Create Project
          </AnimatedButton>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-brand-primary">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <FolderKanban className="text-brand-primary" size={24} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-blue-500">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Clock className="text-blue-500" size={24} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="text-green-500" size={24} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Not Started</p>
              <p className="text-3xl font-bold text-gray-500">{stats.notStarted}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-500/10 flex items-center justify-center">
              <AlertCircle className="text-gray-500" size={24} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-primary focus:outline-none transition-colors"
          >
            <option value="all">All Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-primary focus:outline-none transition-colors"
          >
            <option value="all">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <GlassCard className="p-12">
          <EmptyState
            icon={<FolderKanban />}
            title="No projects found"
            description={searchQuery || filterStatus !== 'all' || filterClient !== 'all' 
              ? "Try adjusting your filters" 
              : "Create your first project to get started"}
            action={
              !searchQuery && filterStatus === 'all' && filterClient === 'all' && (
                <AnimatedButton
                  variant="primary"
                  icon={<Plus />}
                  onClick={() => {
                    setSelectedProject(null);
                    setShowForm(true);
                  }}
                >
                  Create First Project
                </AnimatedButton>
              )
            }
          />
        </GlassCard>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <ProjectCard 
                project={project}
                onClick={() => {
                  setSelectedProject(project);
                  setShowForm(true);
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Project Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ProjectForm
            project={selectedProject}
            clients={clients}
            onClose={() => {
              setShowForm(false);
              setSelectedProject(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectList;

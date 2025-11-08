import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Mail, 
  Phone,
  Calendar,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { GlassCard, AnimatedButton, EmptyState, LoadingSpinner, ClientCard } from '../components/PremiumUI';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';
import toast from 'react-hot-toast';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch clients from Firestore
  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsData);
      setFilteredClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const handleEdit = (client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;

    try {
      await deleteDoc(doc(db, 'clients', clientId));
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleView = (client) => {
    setSelectedClient(client);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-white to-primary-50/30 dark:from-brand-dark dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">
              Client Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your creative agency clients
            </p>
          </div>
          
          <AnimatedButton
            variant="primary"
            size="lg"
            icon={<Plus />}
            onClick={() => {
              setSelectedClient(null);
              setShowForm(true);
            }}
          >
            Add New Client
          </AnimatedButton>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search clients by name or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Button */}
          <AnimatedButton
            variant="outline"
            size="md"
            icon={<Filter />}
          >
            Filters
          </AnimatedButton>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Clients</p>
              <p className="text-3xl font-bold text-brand-primary">{clients.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <Building2 className="text-brand-primary" size={24} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-brand-secondary">
                {clients.reduce((sum, client) => sum + (client.projectCount || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center">
              <TrendingUp className="text-brand-secondary" size={24} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</p>
              <p className="text-3xl font-bold text-brand-accent">
                {clients.filter(c => {
                  const createdDate = new Date(c.createdAt);
                  const now = new Date();
                  return createdDate.getMonth() === now.getMonth() && 
                         createdDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center">
              <Calendar className="text-brand-accent" size={24} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Renewals Due</p>
              <p className="text-3xl font-bold text-red-500">
                {clients.filter(c => {
                  if (!c.renewalDate) return false;
                  const renewal = new Date(c.renewalDate);
                  const now = new Date();
                  const daysUntil = Math.floor((renewal - now) / (1000 * 60 * 60 * 24));
                  return daysUntil <= 30 && daysUntil >= 0;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Calendar className="text-red-500" size={24} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <GlassCard className="p-12">
          <EmptyState
            icon={<Building2 />}
            title="No clients found"
            description={searchQuery ? "Try adjusting your search query" : "Get started by adding your first client"}
            action={
              !searchQuery && (
                <AnimatedButton
                  variant="primary"
                  icon={<Plus />}
                  onClick={() => {
                    setSelectedClient(null);
                    setShowForm(true);
                  }}
                >
                  Add First Client
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
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="relative group"
            >
              <ClientCard 
                client={client} 
                onClick={() => handleView(client)}
              />
              
              {/* Action Menu */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(client);
                    }}
                    className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:bg-brand-primary hover:text-white transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(client.id);
                    }}
                    className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Client Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ClientForm
            client={selectedClient}
            onClose={() => {
              setShowForm(false);
              setSelectedClient(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Client Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedClient && (
          <ClientDetail
            client={selectedClient}
            onClose={() => {
              setShowDetail(false);
              setSelectedClient(null);
            }}
            onEdit={() => {
              setShowDetail(false);
              setShowForm(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientList;

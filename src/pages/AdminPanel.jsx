import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Users,
  TrendingUp,
  Award,
  AlertCircle,
  Mail,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Target,
  Search,
  Filter,
  Grid3x3,
  List,
  Plus,
  Briefcase,
  CheckCircle,
} from 'lucide-react';
import Loading from '../components/Loading';
import ProgressRing from '../components/ProgressRing';
import MemberCard from '../components/MemberCard';
import AssignWorkModal from '../components/AssignWorkModal';
import ReviewModal from '../components/ReviewModal';
import { calculateWorkScore, getPerformanceLevel } from '../utils/calculateScore';
import { getMemberStatistics, calculateOverallPerformance } from '../utils/calculateWorkMetrics';
import { generateTopPerformersSummary } from '../utils/aiSummary';
import { format, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [allAssignedWorks, setAllAssignedWorks] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showAssignWorkModal, setShowAssignWorkModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWorkForReview, setSelectedWorkForReview] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [assignedWorkStats, setAssignedWorkStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    submitted: 0,
    completed: 0
  });

  useEffect(() => {
    fetchMembersData();
    const unsubscribe = fetchAssignedWorkStats();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const fetchMembersData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'member');

      // Fetch ALL assigned works
      const assignedWorksSnapshot = await getDocs(collection(db, 'assignedWork'));
      const allWorks = assignedWorksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllAssignedWorks(allWorks);

      // Fetch this month's tasks for each member
      const monthStart = startOfMonth(new Date());

      const membersWithData = await Promise.all(
        users.map(async (user) => {
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            where('date', '>=', monthStart.toISOString()),
            orderBy('date', 'desc')
          );

          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const workScore = calculateWorkScore(tasks);
          const totalHours = tasks.reduce((sum, t) => sum + parseFloat(t.timeSpent || 0), 0);
          const completedTasks = tasks.filter(t => t.status === 'Completed').length;
          const performance = getPerformanceLevel(workScore);

          // Get comprehensive work statistics
          const stats = getMemberStatistics(
            { ...user, workScore, totalHours, completedTasks, taskCount: tasks.length },
            tasks,
            allWorks
          );

          return {
            ...user,
            tasks,
            taskCount: tasks.length,
            workScore,
            totalHours,
            completedTasks,
            performance,
            lastActive: tasks[0]?.date || null,
            // Add comprehensive statistics
            workStats: stats,
            overallPerformance: stats.overallPerformance,
          };
        })
      );

      // Sort by overall performance score
      membersWithData.sort((a, b) => b.overallPerformance - a.overallPerformance);
      setMembers(membersWithData);
    } catch (error) {
      console.error('Error fetching members data:', error);
      toast.error('Failed to load members data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowDetails(true);
  };

  const handleSendMotivation = (member) => {
    // This would integrate with an email service
    toast.success(`Motivation message sent to ${member.name}!`);
  };

  const fetchAssignedWorkStats = () => {
    try {
      // Listen to assigned work in real-time
      // Try with ordering first, fall back to simple query if index doesn't exist
      let q;
      try {
        q = query(collection(db, 'assignedWork'), orderBy('createdAt', 'desc'));
      } catch (indexError) {
        console.warn('Index not available, using simple query:', indexError);
        q = collection(db, 'assignedWork');
      }
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const workData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          console.log('📊 Assigned Work Data:', workData); // Debug log
          
          // Calculate stats
          const stats = {
            total: workData.length,
            pending: workData.filter(w => w.status === 'Pending').length,
            inProgress: workData.filter(w => w.status === 'In Progress').length,
            submitted: workData.filter(w => w.status === 'Submitted').length,
            completed: workData.filter(w => w.status === 'Completed').length
          };
          
          console.log('📈 Assigned Work Stats:', stats); // Debug log
          
          setAssignedWorkStats(stats);
          
          // Get pending reviews
          const reviews = workData.filter(w => w.status === 'Submitted');
          console.log('⏳ Pending Reviews:', reviews); // Debug log
          setPendingReviews(reviews);
        },
        (error) => {
          console.error('Error fetching assigned work:', error);
          toast.error('Failed to load assigned work. Check Firestore permissions.');
          // Set default stats on error
          setAssignedWorkStats({
            total: 0,
            pending: 0,
            inProgress: 0,
            submitted: 0,
            completed: 0
          });
          setPendingReviews([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up assigned work listener:', error);
      toast.error('Failed to initialize assigned work tracker');
      // Return a no-op function if setup fails
      return () => {};
    }
  };

  const handleReviewWork = (work) => {
    setSelectedWorkForReview(work);
    setShowReviewModal(true);
  };

  if (loading) {
    return <Loading message="Loading admin panel..." />;
  }

  const topPerformers = members.slice(0, 3).map((m, idx) => ({
    name: m.name,
    score: m.overallPerformance,
    reason: `${m.performance.level} • ${m.workStats?.monthly?.completed || 0}/${m.workStats?.monthly?.total || 0} work done`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Control Panel</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage team members and monitor performance
          </p>
        </div>
        
        {/* Create Work Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(0, 87, 255, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAssignWorkModal(true)}
          className="hidden md:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Create & Assign Work</span>
        </motion.button>
      </motion.div>

      {/* Mobile Create Work Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAssignWorkModal(true)}
        className="md:hidden w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg"
      >
        <Plus className="w-5 h-5" />
        <span>Create & Assign Work</span>
      </motion.button>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Members"
          value={members.length}
          icon={Users}
          color="from-blue-400 to-cyan-500"
        />
        <StatCard
          title="Active Work"
          value={assignedWorkStats.inProgress}
          icon={Briefcase}
          color="from-purple-400 to-pink-500"
        />
        <StatCard
          title="Pending Reviews"
          value={assignedWorkStats.submitted}
          icon={AlertCircle}
          color="from-orange-400 to-amber-500"
        />
        <StatCard
          title="Total Tasks"
          value={members.reduce((sum, m) => sum + m.taskCount, 0)}
          icon={Target}
          color="from-green-400 to-emerald-500"
        />
        <StatCard
          title="Completed"
          value={assignedWorkStats.completed}
          icon={CheckCircle}
          color="from-teal-400 to-cyan-500"
        />
      </div>

      {/* Pending Reviews Section */}
      {pendingReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold">⚡ Pending Reviews ({pendingReviews.length})</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingReviews.slice(0, 6).map((work) => (
              <motion.div
                key={work.id}
                whileHover={{ y: -4 }}
                className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl cursor-pointer border border-orange-200 dark:border-orange-800"
                onClick={() => handleReviewWork(work)}
              >
                <p className="font-semibold mb-1 line-clamp-1">{work.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {work.assignedToDetails?.[0]?.name || 'Unknown'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {work.submissions?.length || 0} file(s)
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg"
                  >
                    Review
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">🏆 Top Performers This Month</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((performer, idx) => (
            <div
              key={idx}
              className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{['🥇', '🥈', '🥉'][idx]}</div>
                <div>
                  <p className="font-semibold">{performer.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Score: {performer.score}% • {performer.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Members Table/Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Team Members Performance</h3>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">Table</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="text-sm font-medium">Grid</span>
            </motion.button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Daily Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Weekly Work
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Monthly Work
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.map((member, idx) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.photoURL}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <ProgressRing progress={member.overallPerformance} size={50} strokeWidth={4} showLabel={false} />
                        <span className="font-semibold text-lg">{member.overallPerformance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-semibold">{member.completedTasks}/{member.taskCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.totalHours.toFixed(1)}h
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-semibold">
                          {member.workStats?.weekly?.completed || 0}/{member.workStats?.weekly?.total || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.workStats?.weekly?.completionRate || 0}% done
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-semibold">
                          {member.workStats?.monthly?.completed || 0}/{member.workStats?.monthly?.total || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.workStats?.monthly?.completionRate || 0}% done
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${member.performance.level === 'Excellent' ? 'badge-success' : member.performance.level === 'Good' ? 'badge-info' : member.performance.level === 'Average' ? 'badge-warning' : 'badge-danger'}`}>
                        {member.performance.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewDetails(member)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSendMotivation(member)}
                          className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Send motivation"
                        >
                          <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member, idx) => (
              <MemberCard
                key={member.id}
                member={member}
                onClick={() => handleViewDetails(member)}
                delay={idx * 0.1}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Member Details Modal */}
      {showDetails && selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Assign Work Modal */}
      <AssignWorkModal
        isOpen={showAssignWorkModal}
        onClose={() => setShowAssignWorkModal(false)}
        onWorkAssigned={() => {
          fetchAssignedWorkStats();
        }}
      />

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedWorkForReview && (
          <ReviewModal
            work={selectedWorkForReview}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedWorkForReview(null);
            }}
            onReviewed={() => {
              fetchAssignedWorkStats();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-card p-6 rounded-2xl"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const MemberDetailsModal = ({ member, onClose }) => {
  const { workStats } = member;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📊 Performance Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <div className="flex items-center space-x-4">
            <img
              src={member.photoURL}
              alt={member.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-primary-400"
            />
            <div>
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{member.email}</p>
              <span className={`badge ${member.performance.level === 'Excellent' ? 'badge-success' : 'badge-info'} mt-2`}>
                {member.performance.level}
              </span>
            </div>
          </div>

          {/* Overall Performance */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Performance Score</p>
                <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400">{member.overallPerformance}%</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Combined: Tasks ({member.workScore}%) + Assigned Work
                </p>
              </div>
              <ProgressRing progress={member.overallPerformance} size={80} strokeWidth={6} />
            </div>
          </div>

          {/* Daily, Weekly, Monthly Breakdown */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Work Breakdown</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Daily */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">📅 Today</p>
                  <span className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-800 rounded-full">
                    {workStats?.daily?.total || 0} tasks
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                    <span className="font-semibold">{workStats?.daily?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">In Progress:</span>
                    <span className="font-semibold">{workStats?.daily?.inProgress || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span className="font-semibold">{workStats?.daily?.pending || 0}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-orange-200 dark:border-orange-800">
                    <div className="flex justify-between font-semibold">
                      <span>Completion Rate:</span>
                      <span className="text-orange-600 dark:text-orange-400">{workStats?.daily?.completionRate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">📊 This Week</p>
                  <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded-full">
                    {workStats?.weekly?.total || 0} tasks
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                    <span className="font-semibold">{workStats?.weekly?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">In Progress:</span>
                    <span className="font-semibold">{workStats?.weekly?.inProgress || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span className="font-semibold">{workStats?.weekly?.pending || 0}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between font-semibold">
                      <span>Completion Rate:</span>
                      <span className="text-blue-600 dark:text-blue-400">{workStats?.weekly?.completionRate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">📈 This Month</p>
                  <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 rounded-full">
                    {workStats?.monthly?.total || 0} tasks
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                    <span className="font-semibold">{workStats?.monthly?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">In Progress:</span>
                    <span className="font-semibold">{workStats?.monthly?.inProgress || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span className="font-semibold">{workStats?.monthly?.pending || 0}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-green-200 dark:border-green-800">
                    <div className="flex justify-between font-semibold">
                      <span>Completion Rate:</span>
                      <span className="text-green-600 dark:text-green-400">{workStats?.monthly?.completionRate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task Metrics */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Daily Tasks Performance</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Task Score</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{member.workScore}%</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{member.completedTasks}/{member.taskCount}</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{member.totalHours.toFixed(1)}h</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Hours/Task</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {member.taskCount > 0 ? (member.totalHours / member.taskCount).toFixed(1) : '0'}h
                </p>
              </div>
            </div>
          </div>

          {/* Overall Assigned Work Stats */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>All Assigned Work</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Assigned</p>
                <p className="text-2xl font-bold">{workStats?.overall?.total || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{workStats?.overall?.completionRate || 0}%</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">On-Time Rate</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{workStats?.overall?.onTimeRate || 0}%</p>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div>
            <h4 className="font-semibold mb-3">Recent Daily Tasks</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {member.tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {task.type} • {task.timeSpent}h • {format(new Date(task.date), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
              {member.tasks.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent tasks</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminPanel;

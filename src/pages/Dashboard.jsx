import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Target,
  Sparkles,
  Users,
  BarChart3,
  Calendar,
  Zap,
  Award,
  Activity,
  Plus
} from 'lucide-react';
import ProgressRing from '../components/ProgressRing';
import TaskCard from '../components/TaskCard';
import Loading from '../components/Loading';
import KPICard from '../components/KPICard';
import {
  calculateWorkScore,
  calculateDailyProgress,
  calculateTotalHours,
} from '../utils/calculateScore';
import {
  generateDailySummary,
  generateMotivationalMessage,
  generateAIInsights,
} from '../utils/aiSummary';
import { format, startOfDay, endOfDay } from 'date-fns';

const Dashboard = () => {
  const { userProfile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState([]);
  const [stats, setStats] = useState({
    workScore: 0,
    progress: 0,
    totalHours: 0,
    completedTasks: 0,
  });
  const [aiInsights, setAiInsights] = useState(null);
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        await fetchAdminData();
      } else {
        await fetchMemberData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberData = async () => {
    // Fetch today's tasks for the current user
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userProfile.uid),
      where('date', '>=', todayStart.toISOString()),
      where('date', '<=', todayEnd.toISOString()),
      orderBy('date', 'desc')
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    setTodayTasks(tasks);

    // Calculate stats
    const workScore = calculateWorkScore(tasks);
    const progress = calculateDailyProgress(tasks);
    const totalHours = calculateTotalHours(tasks);
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;

    setStats({
      workScore,
      progress,
      totalHours,
      completedTasks,
    });

    // Generate AI insights
    const insights = generateAIInsights(userProfile, tasks, workScore);
    setAiInsights(insights);
  };

  const fetchAdminData = async () => {
    // Fetch all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch today's tasks for all users
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const membersWithStats = await Promise.all(
      users
        .filter(user => user.role === 'member')
        .map(async (user) => {
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            where('date', '>=', todayStart.toISOString()),
            where('date', '<=', todayEnd.toISOString())
          );

          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const workScore = calculateWorkScore(tasks);
          const progress = calculateDailyProgress(tasks);
          const totalHours = calculateTotalHours(tasks);

          return {
            ...user,
            tasks,
            workScore,
            progress,
            totalHours,
            lastUpdated: tasks[0]?.date || null,
          };
        })
    );

    setAllMembers(membersWithStats);

    // Calculate overall stats
    const totalTasks = membersWithStats.reduce((sum, m) => sum + m.tasks.length, 0);
    const completedTasks = membersWithStats.reduce(
      (sum, m) => sum + m.tasks.filter(t => t.status === 'Completed').length,
      0
    );
    const avgScore = membersWithStats.reduce((sum, m) => sum + m.workScore, 0) / membersWithStats.length || 0;

    setStats({
      totalMembers: membersWithStats.length,
      activeMembersToday: membersWithStats.filter(m => m.tasks.length > 0).length,
      totalTasks,
      completedTasks,
      avgScore: Math.round(avgScore),
    });
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Premium Header with gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 shadow-premium-lg"
      >
        {/* Animated background elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"
        />
        
        <div className="relative z-10">
          <motion.h1 
            className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back, <span className="text-yellow-300">{userProfile?.name}</span>! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/90 text-lg font-medium flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </motion.p>
          
          {!isAdmin && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 text-sm mt-3"
            >
              Let's make today productive! 🚀
            </motion.p>
          )}
        </div>
      </motion.div>

      {isAdmin ? <AdminDashboard stats={stats} members={allMembers} /> : <MemberDashboard stats={stats} tasks={todayTasks} insights={aiInsights} userProfile={userProfile} />}
      
      {/* Floating Action Button for adding tasks (Mobile) */}
      {!isAdmin && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fab fixed bottom-24 md:bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow-premium-lg flex items-center justify-center z-40 animate-pulse-scale"
          onClick={() => {/* This will be connected to TaskForm modal */}}
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      )}
    </div>
  );
};

// Member Dashboard View
const MemberDashboard = ({ stats, tasks, insights, userProfile }) => {
  return (
    <>
      {/* Premium KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Work Score"
          value={`${stats.workScore}%`}
          subtitle="Overall performance"
          icon={TrendingUp}
          gradient="from-blue-500 via-cyan-500 to-teal-400"
          trend="up"
          trendValue="+12%"
          delay={0}
        />
        
        <KPICard
          title="Hours Today"
          value={`${stats.totalHours.toFixed(1)}h`}
          subtitle="Out of 12h available"
          icon={Clock}
          gradient="from-orange-400 via-amber-500 to-yellow-400"
          trend="up"
          trendValue="+2.5h"
          delay={0.1}
        />
        
        <KPICard
          title="Tasks Done"
          value={`${stats.completedTasks}/${tasks.length}`}
          subtitle={`${stats.progress}% completion`}
          icon={CheckCircle}
          gradient="from-green-400 via-emerald-500 to-teal-500"
          trend="up"
          trendValue="+3 tasks"
          delay={0.2}
        />
        
        <KPICard
          title="Productivity"
          value={`${stats.progress}%`}
          subtitle="Daily target progress"
          icon={Zap}
          gradient="from-purple-500 via-pink-500 to-rose-400"
          trend={stats.progress >= 75 ? 'up' : stats.progress >= 50 ? 'neutral' : 'down'}
          trendValue={`${stats.progress >= 50 ? '+' : ''}${Math.round(stats.progress - 60)}%`}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Progress Circle - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          whileHover={{ y: -5 }}
          className="glass-premium p-8 rounded-3xl text-center shadow-premium relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full blur-3xl opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold">Today's Progress</h3>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <ProgressRing progress={stats.progress} size={180} strokeWidth={14} />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl"
            >
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {generateMotivationalMessage(userProfile, stats.workScore)}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* AI Insights - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          whileHover={{ y: -5 }}
          className="lg:col-span-2 glass-premium p-8 rounded-3xl shadow-premium relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-500 to-pink-400 rounded-full blur-3xl opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gradient-premium">AI-Powered Insights</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Personalized recommendations</p>
              </div>
            </div>

            {insights && (
              <div className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl"
                >
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <span>📊</span> Daily Summary
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {insights.summary}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl"
                >
                  <h4 className="text-sm font-bold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
                    <span>💪</span> Your Strengths
                  </h4>
                  <ul className="space-y-2">
                    {insights.strengths.map((strength, idx) => (
                      <motion.li 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + idx * 0.1 }}
                        className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl"
                >
                  <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <span>🎯</span> Recommendation
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {insights.recommendation}
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700"
                >
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Work Balance</p>
                    <p className="text-lg font-bold text-gradient-premium">{insights.workBalance}</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Burnout Risk</p>
                    <p className="text-lg font-bold text-gradient-premium">{insights.burnoutRisk}</p>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Tasks - Premium Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gradient-premium mb-1">Today's Tasks</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {stats.completedTasks} completed
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-2xl shadow-premium hover:shadow-premium-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </motion.button>
        </div>

        {tasks.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {tasks.slice(0, 6).map((task, idx) => (
              <motion.div
                key={task.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-premium p-16 rounded-3xl text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
            
            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Calendar className="w-24 h-24 mx-auto mb-6 text-blue-400 dark:text-blue-500" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-3 text-gradient-premium">No tasks yet today</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Start tracking your work by adding your first task and boost your productivity!
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-2xl shadow-premium hover:shadow-premium-lg transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Task</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

// Admin Dashboard View
const AdminDashboard = ({ stats, members }) => {
  return (
    <>
      {/* Premium Admin KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Members"
          value={stats.totalMembers}
          subtitle="Team size"
          icon={Users}
          gradient="from-blue-500 via-cyan-500 to-teal-400"
          trend="up"
          trendValue="+2"
          delay={0}
        />
        <KPICard
          title="Active Today"
          value={stats.activeMembersToday}
          subtitle={`${Math.round((stats.activeMembersToday / stats.totalMembers) * 100)}% engagement`}
          icon={Activity}
          gradient="from-green-400 via-emerald-500 to-teal-500"
          trend="up"
          trendValue="+15%"
          delay={0.1}
        />
        <KPICard
          title="Total Tasks"
          value={stats.totalTasks}
          subtitle={`${stats.completedTasks} completed`}
          icon={Target}
          gradient="from-orange-400 via-amber-500 to-yellow-400"
          trend="up"
          trendValue="+24"
          delay={0.2}
        />
        <KPICard
          title="Avg Score"
          value={`${stats.avgScore}%`}
          subtitle="Team performance"
          icon={Award}
          gradient="from-purple-500 via-pink-500 to-rose-400"
          trend={stats.avgScore >= 70 ? 'up' : 'neutral'}
          trendValue="+8%"
          delay={0.3}
        />
      </div>

      {/* Team Members Grid - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gradient-premium mb-1">Team Overview</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {members.length} team members • {members.filter(m => m.tasks.length > 0).length} active today
            </p>
          </div>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
        >
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 }
              }}
            >
              <MemberCard member={member} delay={0} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="glass-card p-6 rounded-2xl"
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

// Member Card Component
const MemberCard = ({ member, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 rounded-2xl card-hover"
  >
    <div className="flex items-center space-x-4 mb-4">
      <img
        src={member.photoURL}
        alt={member.name}
        className="w-14 h-14 rounded-full object-cover border-2 border-primary-400"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{member.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Work Score</span>
        <span className="font-semibold text-primary-600 dark:text-primary-400">{member.workScore}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Today</span>
        <span className="font-semibold">{member.tasks.length}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Hours Logged</span>
        <span className="font-semibold">{member.totalHours.toFixed(1)}h</span>
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="progress-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${member.progress}%` }}
          className="progress-fill"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {member.progress}% completion rate
      </p>
    </div>
  </motion.div>
);

export default Dashboard;

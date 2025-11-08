import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Target,
  Clock,
} from 'lucide-react';
import Loading from '../components/Loading';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

const Analytics = () => {
  const { userProfile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [dateRange, setDateRange] = useState('month');
  const [selectedUser, setSelectedUser] = useState('all');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedUser]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users if admin
      if (isAdmin) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData.filter(u => u.role === 'member'));
      }

      // Calculate date range
      let startDate = new Date();
      if (dateRange === 'week') {
        startDate = subDays(new Date(), 7);
      } else if (dateRange === 'month') {
        startDate = startOfMonth(new Date());
      } else if (dateRange === 'year') {
        startDate = subDays(new Date(), 365);
      }

      // Fetch tasks
      let tasksQuery;
      if (isAdmin && selectedUser !== 'all') {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', selectedUser),
          where('date', '>=', startDate.toISOString()),
          orderBy('date', 'desc')
        );
      } else if (isAdmin) {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('date', '>=', startDate.toISOString()),
          orderBy('date', 'desc')
        );
      } else {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userProfile.uid),
          where('date', '>=', startDate.toISOString()),
          orderBy('date', 'desc')
        );
      }

      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const taskTypeData = Object.entries(
    tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const impactData = Object.entries(
    tasks.reduce((acc, task) => {
      acc[task.impact] = (acc[task.impact] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const statusData = Object.entries(
    tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Daily tasks trend
  const dailyTasksData = Object.entries(
    tasks.reduce((acc, task) => {
      const date = format(new Date(task.date), 'MMM dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  ).map(([date, tasks]) => ({ date, tasks })).slice(-14);

  // Hours by task type
  const hoursByTypeData = Object.entries(
    tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + parseFloat(task.timeSpent || 0);
      return acc;
    }, {})
  ).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) }));

  const totalHours = tasks.reduce((sum, task) => sum + parseFloat(task.timeSpent || 0), 0);
  const avgHoursPerTask = tasks.length > 0 ? (totalHours / tasks.length).toFixed(1) : 0;
  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100)
    : 0;

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Title', 'Type', 'Status', 'Impact', 'Time Spent', 'Description'];
    const rows = tasks.map(task => [
      format(new Date(task.date), 'yyyy-MM-dd HH:mm'),
      task.title,
      task.type,
      task.status,
      task.impact,
      task.timeSpent,
      task.description.replace(/,/g, ';'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dwts-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Analytics exported successfully!');
  };

  if (loading) {
    return <Loading message="Loading analytics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed performance metrics and trends
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="select-field"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* User Filter (Admin only) */}
          {isAdmin && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="select-field"
            >
              <option value="all">All Members</option>
              {users.map(user => (
                <option key={user.id} value={user.uid}>{user.name}</option>
              ))}
            </select>
          )}

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="btn-gradient flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Tasks"
          value={tasks.length}
          icon={Target}
          color="from-blue-400 to-cyan-500"
        />
        <SummaryCard
          title="Total Hours"
          value={`${totalHours.toFixed(1)}h`}
          icon={Clock}
          color="from-orange-400 to-amber-500"
        />
        <SummaryCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          color="from-green-400 to-emerald-500"
        />
        <SummaryCard
          title="Avg Hours/Task"
          value={`${avgHoursPerTask}h`}
          icon={Calendar}
          color="from-purple-400 to-pink-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Tasks Trend */}
        <ChartCard title="Daily Tasks Trend" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyTasksData}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="tasks" stroke="#1890ff" fillOpacity={1} fill="url(#colorTasks)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Task Type Distribution */}
        <ChartCard title="Task Type Distribution" icon={Filter}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={taskTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Hours by Task Type */}
        <ChartCard title="Hours by Task Type" icon={Clock}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hoursByTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#13c2c2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Impact & Status */}
        <div className="space-y-6">
          <ChartCard title="Impact Level" icon={Target}>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={impactData} layout="vertical">
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1890ff" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Task Status" icon={Target}>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#52c41a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color }) => (
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

const ChartCard = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 rounded-2xl"
  >
    <div className="flex items-center space-x-2 mb-4">
      {Icon && <Icon className="w-5 h-5 text-primary-500" />}
      <h3 className="font-semibold">{title}</h3>
    </div>
    {children}
  </motion.div>
);

export default Analytics;

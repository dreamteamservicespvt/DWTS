/**
 * TaskCalendar Component
 * Calendar view with drag-and-drop task scheduling
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';
import './TaskCalendar.css';

const localizer = momentLocalizer(moment);

export default function TaskCalendar({ clientFilter = null, memberFilter = null }) {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState({});
  const [users, setUsers] = useState({});
  const [view, setView] = useState('month');
  const [selectedTask, setSelectedTask] = useState(null);
  const { currentUser, userProfile } = useAuth();

  const isAdmin = userProfile?.role === 'admin';

  // Fetch tasks
  useEffect(() => {
    let q = collection(db, 'tasks');
    
    if (clientFilter) {
      q = query(q, where('clientId', '==', clientFilter));
    }
    
    if (memberFilter) {
      q = query(q, where('assignedTo', '==', memberFilter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskData);
    });

    return () => unsubscribe();
  }, [clientFilter, memberFilter]);

  // Fetch clients for color mapping
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const clientMap = {};
      snapshot.docs.forEach(doc => {
        clientMap[doc.id] = doc.data();
      });
      setClients(clientMap);
    });

    return () => unsubscribe();
  }, []);

  // Fetch users for display names
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userMap = {};
      snapshot.docs.forEach(doc => {
        userMap[doc.id] = doc.data();
      });
      setUsers(userMap);
    });

    return () => unsubscribe();
  }, []);

  // Transform tasks to calendar events
  const events = useMemo(() => {
    return tasks.map(task => {
      const startDate = task.startTime?.toDate ? task.startTime.toDate() : new Date(task.startTime);
      const endDate = task.endTime?.toDate ? task.endTime.toDate() : new Date(task.endTime);

      return {
        id: task.id,
        title: task.title,
        start: startDate,
        end: endDate,
        resource: task,
        allDay: false
      };
    });
  }, [tasks]);

  // Get color for client
  const getClientColor = (clientId) => {
    const colors = [
      '#0057FF', '#00C4B4', '#FFD700', '#FF6B6B', '#4ECDC4',
      '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'
    ];
    
    if (!clientId) return colors[0];
    
    const clientIds = Object.keys(clients);
    const index = clientIds.indexOf(clientId);
    return colors[index % colors.length];
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return '#10B981';
      case 'in-progress':
        return '#3B82F6';
      case 'submitted':
        return '#8B5CF6';
      case 'rework':
        return '#F59E0B';
      case 'pending':
      default:
        return '#6B7280';
    }
  };

  // Event style getter
  const eventStyleGetter = (event) => {
    const task = event.resource;
    const backgroundColor = getClientColor(task.clientId);
    const borderColor = getStatusColor(task.status);

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.875rem',
        padding: '2px 6px'
      }
    };
  };

  // Handle event drop (drag-and-drop)
  const handleEventDrop = async ({ event, start, end }) => {
    if (!isAdmin) {
      alert('Only admins can reschedule tasks');
      return;
    }

    try {
      const taskRef = doc(db, 'tasks', event.id);
      await updateDoc(taskRef, {
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        updatedAt: Timestamp.now()
      });

      // Log activity
      await logActivity({
        taskId: event.id,
        action: 'task_rescheduled',
        message: `Task rescheduled from ${event.start.toLocaleString()} to ${start.toLocaleString()}`,
        metadata: {
          oldStart: event.start.toISOString(),
          oldEnd: event.end.toISOString(),
          newStart: start.toISOString(),
          newEnd: end.toISOString()
        }
      });
    } catch (error) {
      console.error('Error rescheduling task:', error);
      alert('Failed to reschedule task');
    }
  };

  // Handle event resize
  const handleEventResize = async ({ event, start, end }) => {
    if (!isAdmin) return;

    try {
      const taskRef = doc(db, 'tasks', event.id);
      await updateDoc(taskRef, {
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        updatedAt: Timestamp.now()
      });

      await logActivity({
        taskId: event.id,
        action: 'task_duration_changed',
        message: `Task duration changed`,
        metadata: {
          newStart: start.toISOString(),
          newEnd: end.toISOString()
        }
      });
    } catch (error) {
      console.error('Error resizing task:', error);
    }
  };

  // Handle event select
  const handleSelectEvent = (event) => {
    setSelectedTask(event.resource);
  };

  // Handle slot select (create new task)
  const handleSelectSlot = ({ start, end }) => {
    if (!isAdmin) return;
    
    // Open task creation modal with pre-filled dates
    // This would trigger your TaskForm modal
    console.log('Create task from', start, 'to', end);
  };

  // Custom event wrapper for tooltip
  const EventComponent = ({ event }) => {
    const task = event.resource;
    const client = clients[task.clientId];
    const assignedUser = users[task.assignedTo];

    return (
      <div className="group relative">
        <span className="truncate">{event.title}</span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-3 min-w-[250px] border border-neutral-200 dark:border-neutral-700">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">{task.title}</h4>
            
            {client && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                📁 {client.name}
              </p>
            )}
            
            {assignedUser && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                👤 {assignedUser.name}
              </p>
            )}
            
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              ⏰ {moment(event.start).format('MMM D, h:mm A')} - {moment(event.end).format('h:mm A')}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                task.status === 'completed' || task.status === 'approved'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : task.status === 'in-progress'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
              }`}>
                {task.status}
              </span>
              
              {task.impact && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  task.impact === 'critical'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : task.impact === 'high'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                }`}>
                  {task.impact}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Calendar Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'month'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'week'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'day'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView('agenda')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'agenda'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Agenda
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">Pending</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 calendar-container"
        style={{ height: 'calc(100vh - 250px)' }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          onEventDrop={isAdmin ? handleEventDrop : undefined}
          onEventResize={isAdmin ? handleEventResize : undefined}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={isAdmin}
          resizable={isAdmin}
          draggableAccessor={() => isAdmin}
          components={{
            event: EventComponent
          }}
          popup
          step={30}
          timeslots={2}
          defaultDate={new Date()}
        />
      </motion.div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          client={clients[selectedTask.clientId]}
          assignedUser={users[selectedTask.assignedTo]}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

// Task Detail Modal Component
function TaskDetailModal({ task, client, assignedUser, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
              {client && <p className="text-white/90">📁 {client.name}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Description</h3>
                <p className="text-neutral-900 dark:text-white">{task.description}</p>
              </div>
            )}

            {assignedUser && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Assigned To</h3>
                <div className="flex items-center gap-2">
                  <img
                    src={assignedUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedUser.name)}&background=0057FF&color=fff`}
                    alt={assignedUser.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-neutral-900 dark:text-white">{assignedUser.name}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Start Time</h3>
                <p className="text-neutral-900 dark:text-white">
                  {moment(task.startTime?.toDate ? task.startTime.toDate() : task.startTime).format('MMM D, YYYY h:mm A')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">End Time</h3>
                <p className="text-neutral-900 dark:text-white">
                  {moment(task.endTime?.toDate ? task.endTime.toDate() : task.endTime).format('MMM D, YYYY h:mm A')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Status</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  task.status === 'completed' || task.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : task.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                }`}>
                  {task.status}
                </span>
              </div>
              {task.impact && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Impact</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    task.impact === 'critical'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : task.impact === 'high'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                  }`}>
                    {task.impact}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-800 px-6 py-4 flex justify-end border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

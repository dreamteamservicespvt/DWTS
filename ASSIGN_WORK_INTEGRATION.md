# 🔌 Quick Integration Guide - Assign Work Feature

## Step-by-Step Integration

### Step 1: Update Tasks Page

**File**: `src/pages/Tasks.jsx`

```jsx
import { useState } from 'react';
import AssignPanel from '../components/AssignPanel';
import ApprovalModal from '../components/ApprovalModal';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../context/AuthContext';

export default function Tasks() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showAssignPanel, setShowAssignPanel] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);

  const isAdminOrManager = userProfile?.role === 'admin' || userProfile?.role === 'manager';

  const refreshTasks = async () => {
    // Your existing fetch tasks logic
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      
      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={(task) => console.log('Edit', task)}
            onDelete={(task) => console.log('Delete', task)}
            
            {/* NEW: Assignment & Approval Props */}
            showAssignButton={isAdminOrManager}
            showApprovalButtons={isAdminOrManager}
            onAssign={(task) => setShowAssignPanel(task)}
            onApprove={(task) => setApprovalModal({ task, mode: 'approve' })}
            onRequestRework={(task) => setApprovalModal({ task, mode: 'rework' })}
          />
        ))}
      </div>

      {/* NEW: Assign Panel Modal */}
      {showAssignPanel && (
        <AssignPanel
          task={showAssignPanel}
          onClose={() => setShowAssignPanel(null)}
          onAssigned={() => {
            setShowAssignPanel(null);
            refreshTasks();
          }}
        />
      )}

      {/* NEW: Approval Modal */}
      {approvalModal && (
        <ApprovalModal
          task={approvalModal.task}
          mode={approvalModal.mode}
          onClose={() => setApprovalModal(null)}
          onSuccess={() => {
            setApprovalModal(null);
            refreshTasks();
          }}
        />
      )}
    </div>
  );
}
```

---

### Step 2: Update Dashboard for Team Members

**File**: `src/pages/Dashboard.jsx`

```jsx
import MemberTimeline from '../components/MemberTimeline';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Existing admin/manager content */}
      {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
        <>
          {/* Your existing KPI cards, charts, etc. */}
        </>
      )}

      {/* NEW: Member Timeline */}
      {userProfile?.role === 'member' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">
          <MemberTimeline selectedDate={selectedDate} />
        </div>
      )}
    </div>
  );
}
```

---

### Step 3: Initialize Reminder Service

**File**: `src/App.jsx`

```jsx
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { setupReminderService } from './lib/reminderService';

function App() {
  const { currentUser } = useAuth();

  // NEW: Initialize reminder service when user logs in
  useEffect(() => {
    if (currentUser) {
      setupReminderService();
    }
  }, [currentUser]);

  return (
    // Your existing app structure
  );
}

export default App;
```

---

### Step 4: Add Missing React Import to TaskCard

**File**: `src/components/TaskCard.jsx`

Add at the top:
```jsx
import React from 'react';
```

---

### Step 5: Update AdminTaskForm Import (If Not Using)

**File**: `src/pages/Tasks.jsx` or wherever you create tasks

```jsx
import AdminTaskForm from '../components/AdminTaskForm';

// In your component:
const [showTaskForm, setShowTaskForm] = useState(false);

// Button to open form:
<button onClick={() => setShowTaskForm(true)}>
  Create Task
</button>

// Modal:
{showTaskForm && (
  <AdminTaskForm
    onClose={() => setShowTaskForm(false)}
    onTaskSaved={(taskId) => {
      console.log('Task created:', taskId);
      refreshTasks();
    }}
  />
)}
```

---

## 🎯 Testing Checklist

### As Admin:
1. ✅ Create a task using AdminTaskForm
2. ✅ Assign task to team member using "Assign" button
3. ✅ Verify notification sent
4. ✅ Check for conflict warning when double-booking
5. ✅ Approve a submitted task → See confetti
6. ✅ Request rework with feedback

### As Team Member:
1. ✅ Login and view Dashboard
2. ✅ See assigned tasks in "Today's Timeline"
3. ✅ Click "Start Work" to change status
4. ✅ Upload deliverable using "Add Deliverable"
5. ✅ Verify task marked as "Submitted"
6. ✅ Receive approval notification

### Reminder Testing:
1. ✅ Create task starting in 1 hour → Check notification
2. ✅ Create task starting in 5 mins → Check notification
3. ✅ Wait until 8 AM next day → Check daily summary
4. ✅ Leave tasks incomplete → Check overdue notification

---

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot read property 'role' of undefined"
**Solution**: Add optional chaining:
```jsx
{userProfile?.role === 'admin' && <AdminPanel />}
```

### Issue 2: TaskCard not showing Assign button
**Solution**: Make sure you pass `showAssignButton={true}` prop

### Issue 3: Reminders not working
**Solution**: Check console for "✅ Reminder service initialized" message

### Issue 4: Confetti not showing
**Solution**: Make sure `react-confetti` is installed:
```bash
npm install react-confetti
```

### Issue 5: File upload fails
**Solution**: Check `.env` file has Cloudinary credentials:
```
VITE_CLOUDINARY_CLOUD_NAME=do46xxegj
VITE_CLOUDINARY_UPLOAD_PRESET=dwtsystem
```

---

## 📦 Required NPM Packages

All packages should already be installed from Phase 5. Verify:

```bash
npm list framer-motion react-hot-toast date-fns lucide-react react-confetti
```

If missing:
```bash
npm install framer-motion react-hot-toast date-fns lucide-react react-confetti
```

---

## 🚀 Deployment Checklist

Before deploying to production:

1. ✅ Test all workflows (assign, submit, approve)
2. ✅ Verify mobile responsiveness (320px width)
3. ✅ Test notifications on real devices
4. ✅ Check Firebase Firestore rules allow assignment updates
5. ✅ Set up Cloud Functions for production reminders (optional)
6. ✅ Add environment variables to hosting platform
7. ✅ Test with multiple users simultaneously

---

## 🔥 Firestore Security Rules

**File**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Tasks: Admins can write, members can update their assigned tasks
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      
      allow create, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
      
      allow update: if request.auth != null && (
        // Admin/Manager can update any task
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'] ||
        // Member can update if assigned to them
        (request.auth.uid in resource.data.assignedTo && 
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'deliverables', 'updatedAt', 'submittedAt']))
      );
    }
    
    // ... rest of your rules
  }
}
```

---

## 📊 Analytics Events (Optional)

Track assignment metrics:

```jsx
// In AssignPanel.jsx, after successful assignment:
analytics.logEvent('task_assigned', {
  task_id: task.id,
  assignee_count: formData.assignedTo.length,
  priority: formData.priority,
  duration_hours: durationHours,
});

// In ApprovalModal.jsx, after approval:
analytics.logEvent('task_approved', {
  task_id: task.id,
  approval_time_mins: timeDiff,
});
```

---

## 🎨 Customization Options

### Change Reminder Times:
**File**: `src/lib/reminderService.js`

```jsx
// Line ~30: Change 1-hour reminder to 2 hours:
const isTwoHoursBefore = timeDiff > 115 * 60 * 1000 && timeDiff <= 125 * 60 * 1000;

// Line ~110: Change daily summary time to 9 AM:
morning.setHours(9, 0, 0, 0);
```

### Change Priority Colors:
**File**: `src/components/AssignPanel.jsx`

```jsx
const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'Medium', label: 'Medium', color: 'bg-purple-100 text-purple-800' },
  { value: 'High', label: 'High', color: 'bg-pink-100 text-pink-800' },
];
```

---

## 💡 Pro Tips

1. **Use keyboard shortcuts**: Press `A` to open assign panel (add this in Tasks page)
2. **Bulk operations**: Select multiple tasks and assign to same person
3. **Templates**: Save common assignment patterns (e.g., "Morning Design Work")
4. **Filters**: Add "Assigned to me", "Unassigned", "Overdue" filters
5. **Calendar sync**: Export assignments to Google Calendar (future feature)

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase connection
3. Check Firestore rules
4. Review this guide's troubleshooting section
5. Check `ASSIGN_WORK_GUIDE.md` for detailed documentation

---

**Last Updated**: November 6, 2025
**Integration Time**: ~15 minutes
**Status**: ✅ Ready to Integrate

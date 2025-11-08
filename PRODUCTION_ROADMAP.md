# 🚀 DWTS Production Features - Implementation Roadmap

**Target**: Battle-Ready MVP with enterprise-grade features  
**Timeline**: Phased implementation over multiple sessions  
**Status**: Foundation Complete ✅ | In Progress 🔄

---

## ✅ Phase 1: Foundation (COMPLETED)

### 1.1 Dependencies Installed
- ✅ zod - Validation schemas
- ✅ zustand - State management
- ✅ @tanstack/react-query - Server state & caching
- ✅ dexie - IndexedDB wrapper
- ✅ driver.js - Product tours
- ✅ qrcode.react - QR code generation
- ✅ speakeasy - TOTP/MFA
- ✅ react-hook-form - Form handling
- ✅ @hookform/resolvers - Zod integration

### 1.2 Constants & Types
- ✅ `/src/constants/roles.js` - Role definitions (Admin, Manager, Member, Guest)
- ✅ `/src/constants/permissions.js` - Permission matrix with 40+ permissions
- ✅ Role hierarchy with delegation

### 1.3 Validation Library
- ✅ `/src/lib/validation.js` - Zod schemas for:
  - Password policy (min 8 chars, uppercase, number)
  - Email validation
  - Phone (E.164 format)
  - Task schema (15min-12hr duration)
  - User profile
  - Recurring tasks
  - Subtasks
  - Attachments
  - Comments with mentions
  - Export requests
  - Audit logs
  - Invitations
- ✅ Password strength calculator
- ✅ Safe validation helper

### 1.4 RBAC System
- ✅ `/src/lib/rbac.js` - Permission checking logic
  - canUser() - Basic permission check
  - canUserWithOwnership() - Ownership validation
  - Task-specific helpers (canEditTask, canDeleteTask, canViewTask)
  - Scope getters (export, reports)
  - Role checkers (isAdmin, isManagerOrAbove)
  - Bilingual permission denial messages
- ✅ `/src/hooks/useRBAC.js` - React hook with:
  - All RBAC functions with user context
  - withPermission HOC for route protection
  - ProtectedContent component
  - RoleContent component

### 1.5 Offline Storage
- ✅ `/src/lib/offline-db.js` - IndexedDB schema with Dexie:
  - offlineQueue - FIFO sync queue with retry logic
  - cachedTasks - Local task cache
  - conflicts - Conflict detection & resolution
  - auditLogCache - Fast audit log display
  - metadata - Sync time, app version
- ✅ CRUD operations for all tables
- ✅ Queue management (add, process, retry, remove)
- ✅ Conflict detection & resolution
- ✅ Database stats & cleanup

### 1.6 UI Components
- ✅ `/src/components/PasswordStrength.jsx` - Real-time strength meter
  - Weak/Medium/Strong levels
  - Requirements checklist
  - Color-coded progress bar
  - Animated with Framer Motion

---

## 🔄 Phase 2: Authentication & Security (IN PROGRESS)

### 2.1 Enhanced Auth Forms
- [ ] Update `/src/pages/Register.jsx`:
  - Integrate Zod validation with react-hook-form
  - Add PasswordStrength component
  - Show inline validation errors
  - Add "Accept Terms" checkbox with modal
  - Implement CAPTCHA (optional)
  
- [ ] Update `/src/pages/Login.jsx`:
  - Add Zod validation
  - Add MFA token input (6-digit code)
  - Remember device option
  - Show active sessions warning
  
- [ ] Create `/src/pages/PasswordReset.jsx`:
  - Email request form
  - Token validation
  - New password with strength meter
  - 1-hour token expiry
  - Rate limiting (5 requests/hour)

### 2.2 MFA System
- [ ] Create `/src/features/auth/MFASetup.jsx`:
  - Generate TOTP secret (speakeasy)
  - Display QR code (qrcode.react)
  - Show backup codes (display once, download option)
  - Verify token before activation
  - Store secret in Firestore (encrypted)
  
- [ ] Create `/src/features/auth/MFAVerify.jsx`:
  - 6-digit token input
  - Verify against stored secret
  - Remember device (30 days)
  - Show backup code option
  
- [ ] Create `/src/hooks/useMFA.js`:
  - setupMFA() - Generate and store secret
  - verifyMFA() - Validate token
  - disableMFA() - Remove secret
  - generateBackupCodes() - Create 10 codes
  - verifyBackupCode() - One-time use

### 2.3 Session Management
- [ ] Create `/src/features/auth/SessionManager.jsx`:
  - List active sessions (device, IP, last active, location)
  - Current session highlighted
  - Remote sign-out button for each session
  - "Sign out all other devices" button
  - Auto-refresh every 30s
  
- [ ] Update `/src/context/AuthContext.jsx`:
  - Track session on login (device fingerprint)
  - Store session in Firestore users/{uid}/sessions
  - Update lastActive on activity
  - Clean up on logout
  
- [ ] Create `/src/lib/deviceFingerprint.js`:
  - Generate device ID from browser info
  - Detect device type (mobile/desktop)
  - Get IP (via API)
  - Approximate location (city-level)

### 2.4 Account Management
- [ ] Create `/src/features/auth/AccountSettings.jsx`:
  - Export Data section:
    - Format selector (CSV, JSON, PDF)
    - Date range picker
    - Include attachments toggle
    - Generate ZIP button
    - Background job with progress
  - Delete Account section:
    - Warning modal with consequences
    - Password confirmation
    - 30-day soft delete
    - Anonymize option (keeps data, removes PII)
  - Privacy settings:
    - Data sharing preferences
    - Notification opt-ins
    - Cookie consent

### 2.5 Role Escalation
- [ ] Create `/src/features/admin/InviteUser.jsx`:
  - Email input with validation
  - Role selector (dropdown)
  - Optional message
  - Bulk invite via CSV upload
  - Send email with token link
  - 48-hour expiry
  
- [ ] Create `/src/pages/AcceptInvite.jsx`:
  - Validate token
  - Show inviter info
  - Create password
  - Accept/Decline buttons
  - Auto-assign role on acceptance

---

## 🎓 Phase 3: Onboarding & Help (PENDING)

### 3.1 First-Run Experience
- [ ] Create `/src/features/onboarding/OnboardingModal.jsx`:
  - Step 1: Welcome screen with tagline
    - 30-second animated product tour
    - Screenshots carousel
    - Skip button (dismissible)
  - Step 2: Add first task tutorial
    - Prefilled sample task
    - Interactive form walkthrough
    - Voice input demo
  - Step 3: Language & voice tutorial
    - Switch language live demo
    - Voice recognition test (speak sample)
    - Settings quick access
  - Progress indicator (1/3, 2/3, 3/3)
  - "Don't show again" checkbox
  - Store completion in Firestore user profile
  
- [ ] Create `/src/hooks/useOnboarding.js`:
  - Check if user has seen onboarding
  - Mark onboarding as complete
  - Reset onboarding (for testing)

### 3.2 Product Tours
- [ ] Create `/src/features/onboarding/ProductTour.jsx`:
  - Use driver.js for step-by-step guides
  - Define tour steps:
    1. Dashboard overview
    2. Add task button
    3. Voice input icon
    4. Task card actions
    5. Analytics page
    6. Admin panel (role-based)
    7. Language switcher
    8. Settings
  - "?" help icon in Navbar (always visible)
  - Restart tour option in settings
  - Contextual hints for first 7 days (tooltips)
  
- [ ] Create `/src/lib/tourSteps.js`:
  - Define all tour step configurations
  - Bilingual support (EN/TE)
  - Conditional steps based on role

### 3.3 Demo Mode
- [ ] Create `/src/features/demo/DemoData.js`:
  - Sample user profile (Demo User)
  - 7 preseeded tasks (various types, times)
  - Leaderboard with 5 sample members
  - Analytics data (last 7 days)
  - Comments on tasks
  - No data persistence (localStorage)
  
- [ ] Create `/src/pages/DemoLanding.jsx`:
  - "Try Demo" button on login page
  - Auto-login as demo user
  - Banner: "You're in demo mode"
  - Exit demo button
  - All features functional (no Firestore writes)

### 3.4 Contextual Help
- [ ] Add tooltips to form fields:
  - Task type dropdown helper
  - Impact level explanation
  - Time format example
  - Recurring task icon with preview
  - Show for first 7 days only
  
- [ ] Create `/src/components/HelpTooltip.jsx`:
  - Info icon with hover/click popup
  - Short explanation text
  - Optional "Learn more" link
  - Auto-hide after user reads (track in localStorage)

---

## 📊 Phase 4: Audit Logs & Activity History (PENDING)

### 4.1 Audit Logging Infrastructure
- [ ] Create `/src/hooks/useAuditLog.js`:
  - logAction(action, targetType, targetId, before, after, metadata)
  - Get actor info from auth context
  - Capture IP and user agent
  - Write to Firestore audits collection
  - Handle errors gracefully (log to console)
  
- [ ] Update all CRUD operations:
  - Task create → audit log
  - Task update → log before/after
  - Task delete → log deleted data
  - User role change → log old/new role
  - Settings update → log changes
  - Admin impersonation → log start/end
  
- [ ] Create Firestore security rules for audits:
  - Immutable (no updates/deletes)
  - Only admins can read
  - Automated cleanup after 12 months

### 4.2 Audit Log UI
- [ ] Create `/src/features/audit/AuditLog.jsx`:
  - Table with columns:
    - Timestamp
    - Actor (name + role)
    - Action (badge with icon)
    - Target (type + ID link)
    - Changes (before/after diff)
    - IP address (masked)
  - Filters:
    - Date range picker
    - Action type multi-select
    - User selector
    - Target type selector
  - Search by target ID or content
  - Pagination (20 per page)
  - Export to CSV button
  - Real-time updates (Firestore listener)
  
- [ ] Create `/src/components/AuditDiffViewer.jsx`:
  - Side-by-side before/after comparison
  - Highlight changes (green = added, red = removed)
  - Expandable JSON view for complex objects
  - Copy to clipboard button

### 4.3 Task History Timeline
- [ ] Create `/src/components/TaskHistoryTimeline.jsx`:
  - Vertical timeline on task detail page
  - Events:
    - Task created
    - Status changes
    - Edits (show what changed)
    - Verification
    - Approval/Decline
    - Comments added
    - Attachments added
  - Each event shows:
    - Timestamp (relative: "2 hours ago")
    - Actor avatar + name
    - Action description
    - Change details (expandable)
  - Load on demand (paginate old events)

---

## 💾 Phase 5: Data Export, Backup & Retention (PENDING)

### 5.1 User Data Export
- [ ] Create `/src/features/exports/DataExporter.jsx`:
  - Format selector (CSV, JSON, PDF, XLSX)
  - Date range picker (default: last 30 days)
  - Include filters:
    - Tasks
    - Reports
    - Comments
    - Attachments (checkbox)
    - Audit logs (admin only)
  - "Generate Export" button
  - Background job with progress bar
  - Email notification when ready
  - Download link (expires in 7 days)
  
- [ ] Create background job system:
  - Firebase Cloud Functions for export generation
  - Store job in Firestore exports collection
  - Status: pending → processing → completed/failed
  - Generate files and upload to Cloud Storage
  - Create ZIP for multi-file exports
  
- [ ] Create `/src/hooks/useExport.js`:
  - createExport(params) - Start export job
  - getExportStatus(jobId) - Poll job status
  - downloadExport(jobId) - Get download URL
  - listExports() - User's export history

### 5.2 Admin Exports
- [ ] Create `/src/features/admin/ExportManager.jsx`:
  - Monthly consolidated export:
    - All users' tasks (CSV)
    - Team summary report (PDF)
    - Audit logs (CSV)
    - Analytics data (JSON)
  - Filter by team/user
  - Schedule automated exports (monthly)
  - Export history table
  - Retention: 6 months

### 5.3 Backup System
- [ ] Create `/src/features/admin/BackupManager.jsx`:
  - Manual backup trigger button
  - Backup history table:
    - Timestamp
    - Type (daily/weekly/monthly)
    - Size
    - Status
    - Download button
    - Restore button (with confirmation)
  - Retention policy display:
    - Daily: 7 backups
    - Weekly: 4 backups
    - Monthly: 6 backups
  - Storage usage chart
  
- [ ] Implement automated backups:
  - Firebase scheduled functions
  - Daily snapshot at 2 AM
  - Export Firestore collections to Cloud Storage
  - Compress with gzip
  - Tag with retention type
  - Auto-delete old backups per policy

### 5.4 Disaster Recovery
- [ ] Create `/src/features/admin/DisasterRecovery.jsx`:
  - Restore from backup:
    - Select backup snapshot
    - Preview restore (show affected data)
    - Confirmation modal with warning
    - Restore button (admin password required)
    - Progress indicator
    - Audit log of restore action
  - Test restore in staging:
    - Duplicate data to staging environment
    - Verify integrity
    - Report success/failure
  
- [ ] Document recovery procedures:
  - Create DISASTER_RECOVERY.md
  - Step-by-step restore instructions
  - RTO (Recovery Time Objective): 1 hour
  - RPO (Recovery Point Objective): 24 hours

---

## 📡 Phase 6: Offline Sync & Conflict Resolution (PENDING)

### 6.1 Sync Manager
- [ ] Create `/src/features/offline/SyncManager.js`:
  - Listen to online/offline events
  - Process queue on reconnect (FIFO)
  - Retry logic:
    - Exponential backoff (1s, 2s, 4s, 8s, 16s)
    - Max 5 retries
    - Mark as failed after max retries
  - Conflict detection:
    - Compare local version vs remote
    - Check updatedAt timestamps
    - Create conflict entry if mismatch
  - Show sync status in UI:
    - Synced (checkmark)
    - Pending (clock icon)
    - Conflict (warning icon)
    - Failed (X icon)
  
- [ ] Create `/src/hooks/useOfflineSync.js`:
  - queueTask(operation, task) - Add to queue
  - syncNow() - Force sync
  - getSyncStatus() - Get current state
  - getConflicts() - List conflicts
  - Auto-sync on network change

### 6.2 Conflict Resolution UI
- [ ] Create `/src/features/offline/ConflictResolver.jsx`:
  - Modal with side-by-side comparison:
    - Left: Local version
    - Right: Server version
  - Highlight differences:
    - Changed fields (yellow)
    - Deleted fields (red)
    - Added fields (green)
  - Action buttons:
    - Keep Local (overwrites server)
    - Keep Server (discards local)
    - Merge (manual field selection)
  - Merge mode:
    - Field-by-field selector
    - Preview merged result
    - Apply button
  - Batch resolve (if multiple conflicts)
  
- [ ] Create `/src/components/DiffViewer.jsx`:
  - Reusable diff component
  - JSON diff for complex objects
  - Collapsible sections
  - Syntax highlighting

### 6.3 Offline Banner
- [ ] Create `/src/features/offline/OfflineBanner.jsx`:
  - Persistent banner at top when offline
  - Message: "You are offline. Tasks will sync automatically once you reconnect."
  - Show pending queue count: "3 tasks waiting to sync"
  - Animated icon (pulsing cloud with X)
  - Click to view queue details
  - Auto-hide when online
  - Reappear with "Syncing..." when reconnecting
  - Success message: "All changes synced ✓"

### 6.4 Sync Status Indicators
- [ ] Add sync badges to task cards:
  - Synced: Green checkmark
  - Pending: Yellow clock icon
  - Conflict: Red warning icon with count
  - Failed: Red X with retry button
  - Tooltip with details
  
- [ ] Add global sync status in Navbar:
  - Icon changes based on status
  - Click to see full sync report
  - Manual sync button (refresh icon)

---

## 🔍 Phase 7: Search, Filters & Pagination (PENDING)

### 7.1 Global Search
- [ ] Create `/src/features/search/GlobalSearch.jsx`:
  - Search input with magnifying glass icon
  - Keyboard shortcut: Ctrl+K or Cmd+K
  - Search scope tabs:
    - Tasks (title, description, tags)
    - Users (name, email)
    - Reports (content)
  - Fuzzy search (Fuse.js):
    - Typo tolerance
    - Partial matches
  - Highlight matched terms in results
  - Real-time results as you type (debounced 300ms)
  - Show 5 results per category, "See all" link
  - Recent searches (stored in localStorage)
  
- [ ] Create `/src/hooks/useSearch.js`:
  - search(query, scope) - Perform search
  - getRecentSearches() - List recent
  - clearRecentSearches() - Clear history
  - saveSearch(query) - Add to recent

### 7.2 Advanced Filters
- [ ] Create `/src/components/FilterPanel.jsx`:
  - Collapsible panel (drawer on mobile)
  - Filter categories:
    - Date range (preset + custom)
    - Status (multi-select checkboxes)
    - Type (multi-select)
    - Impact (multi-select)
    - User (autocomplete dropdown)
    - Verification status (verified/unverified)
    - Recurring (yes/no)
  - Active filters display (chips):
    - Show selected filters
    - Click to remove
    - "Clear all" button
  - Save filter presets:
    - "High priority tasks"
    - "My unverified tasks"
    - "This week"
  - Apply button with count: "Show 23 tasks"
  
- [ ] Create `/src/hooks/useFilters.js`:
  - applyFilters(filters) - Filter data
  - savePreset(name, filters) - Save preset
  - loadPreset(name) - Load preset
  - getPresets() - List saved presets

### 7.3 Pagination System
- [ ] Create `/src/components/Pagination.jsx`:
  - Page numbers (1, 2, 3, ..., 10)
  - Previous/Next buttons
  - Items per page selector (10, 20, 50, 100)
  - Total count display: "Showing 1-20 of 153"
  - Jump to page input
  - Keyboard navigation (arrow keys)
  
- [ ] Implement server-side pagination:
  - Firestore cursor-based pagination
  - Use startAfter() for next page
  - Cache pages in React Query
  - Prefetch next page on hover
  
- [ ] Create `/src/components/InfiniteScroll.jsx`:
  - Intersection Observer for auto-load
  - Load more on scroll to bottom
  - Loading spinner
  - "Load more" button fallback

### 7.4 Database Indexing
- [ ] Create Firestore indexes:
  - Collection: tasks
    - Composite: (userId, date DESC)
    - Composite: (userId, status, date DESC)
    - Composite: (userId, type, date DESC)
    - Composite: (userId, impact, date DESC)
    - Composite: (verifiedBy, date DESC)
  - Collection: users
    - Index: (role, lastActive DESC)
    - Index: (teamId, role)

---

## ✨ Phase 8: Task Model Enhancements (PENDING)

### 8.1 Recurring Tasks
- [ ] Create `/src/features/tasks/RecurringTaskForm.jsx`:
  - Frequency selector:
    - Daily (every N days)
    - Weekly (select days: Mon, Tue, etc.)
    - Monthly (day of month: 1-31, or "last day")
  - Interval input (e.g., "every 2 weeks")
  - End condition:
    - Never
    - On date (date picker)
    - After N occurrences
  - Preview next 5 occurrences
  - Visual calendar representation
  - Edit recurrence rule:
    - This task only
    - This and future tasks
    - All tasks in series
  
- [ ] Create `/src/lib/recurrence.js`:
  - parseRule(recurrenceRule) - Parse rule object
  - getNextOccurrence(rule, fromDate) - Calculate next date
  - generateOccurrences(rule, count) - Generate N instances
  - updateRule(rule, changes) - Modify rule
  - deleteInstance(ruleId, date, scope) - Remove occurrence

### 8.2 Subtasks
- [ ] Create `/src/components/SubtaskList.jsx`:
  - Checkbox list of subtasks
  - Add subtask input (inline)
  - Drag-to-reorder (react-beautiful-dnd)
  - Mark as complete (independent of parent)
  - Progress indicator: "2/5 subtasks complete"
  - Delete subtask button (X icon)
  - Expand/collapse on parent task
  - Indent visually under parent
  
- [ ] Add subtask field to task schema:
  - Array of objects: { id, title, completed, createdAt }
  - Update parent task progress when subtask toggled
  - Mark parent complete when all subtasks done

### 8.3 Task Dependencies
- [ ] Create `/src/features/tasks/DependencyManager.jsx`:
  - Add dependency button on task form
  - Search for task to link
  - Dependency type:
    - Blocks (this task blocks selected task)
    - Blocked by (this task is blocked by selected)
  - Visual chain/graph on task detail
  - Prevent completion if blocked
  - Show warning: "Task X blocks this task"
  - Remove dependency link
  
- [ ] Create `/src/components/DependencyGraph.jsx`:
  - Visual flowchart of dependencies
  - Nodes: tasks
  - Edges: dependencies
  - Color-coded: completed (green), blocked (red), pending (gray)
  - Interactive: click task to navigate

### 8.4 Task Templates
- [ ] Create `/src/features/tasks/TaskTemplates.jsx`:
  - Template library (grid view)
  - Create template from existing task
  - Template card:
    - Name + description
    - Icon representing type
    - Default duration
    - Subtasks preview
    - Use button
  - Edit template
  - Delete template (with confirmation)
  - Share template with team (admin only)
  - Category tags (Development, Meeting, etc.)
  
- [ ] "Create from template" flow:
  - Click "Add Task" → "Use Template"
  - Select template
  - Pre-fill form with template data
  - Allow customization before save
  - Template name shown in task (metadata)

### 8.5 Bulk Actions
- [ ] Create `/src/features/tasks/BulkActions.jsx`:
  - Multi-select checkboxes on task cards
  - Select all button (with pagination note)
  - Action bar (sticky at top when items selected):
    - Mark as complete (bulk)
    - Mark as verified (admin/manager)
    - Change type (dropdown)
    - Change impact (dropdown)
    - Delete (with confirmation)
    - Export selected (CSV)
  - Show count: "3 tasks selected"
  - Clear selection button
  - Optimistic updates with rollback on error

### 8.6 Comments & Mentions
- [ ] Create `/src/components/TaskComments.jsx`:
  - Comment list (newest first)
  - Add comment textarea
  - @mention autocomplete:
    - Type @ to trigger
    - Fuzzy search users
    - Select with keyboard (up/down/enter)
    - Insert username
  - Mention badge in comment (blue highlight)
  - Notify mentioned user (in-app + email)
  - Attachments on comments (images, PDFs)
  - Edit own comment (5-minute window)
  - Delete own comment
  - Admin can delete any comment
  - Reply to comment (threaded)
  
- [ ] Create Firestore structure:
  - Collection: tasks/{taskId}/comments
  - Document: { authorId, content, mentions: [userId], attachments, createdAt, updatedAt, edited }

### 8.7 Approval Workflow
- [ ] Create `/src/features/tasks/ApprovalWorkflow.jsx`:
  - "Request Approval" button (for high-impact tasks)
  - Approval status badge:
    - Pending (yellow)
    - Approved (green checkmark)
    - Declined (red X)
  - Approver dropdown (managers/admins)
  - Comment field for request
  - Notification to approver
  - Approve/Decline buttons (for approver only)
  - Decline reason (required)
  - Approval history in task timeline
  - Re-request approval after changes
  
- [ ] Add fields to task schema:
  - requiresApproval: boolean
  - approvalStatus: 'pending' | 'approved' | 'declined'
  - approvedBy: userId
  - approvalComment: string
  - approvalHistory: array of { action, by, at, comment }

---

## 🔔 Phase 9: Notifications & Delivery (PENDING)

### 9.1 Notification Center
- [ ] Create `/src/features/notifications/NotificationCenter.jsx`:
  - Bell icon in Navbar with count badge
  - Dropdown panel (max height with scroll)
  - Notification types:
    - Task mentioned you
    - Task approved/declined
    - Task verified
    - Comment reply
    - User invited you
    - Report ready
    - Sync conflict
  - Each notification:
    - Icon (type-specific)
    - Message
    - Timestamp (relative)
    - Mark as read button
    - Action button ("View Task")
  - "Mark all as read" button
  - Empty state: "No notifications"
  
- [ ] Create Firestore structure:
  - Collection: users/{userId}/notifications
  - Document: { type, message, actionUrl, read, createdAt, metadata }
  - Listen with onSnapshot for real-time
  
- [ ] Create `/src/hooks/useNotifications.js`:
  - getNotifications() - Fetch list
  - markAsRead(id) - Update read status
  - markAllAsRead() - Bulk update
  - subscribe() - Real-time listener
  - unsubscribe() - Clean up listener

### 9.2 Notification Preferences
- [ ] Create `/src/features/settings/NotificationPreferences.jsx`:
  - Toggle switches for each channel:
    - In-app notifications
    - Email notifications
    - Push notifications (PWA)
    - WhatsApp notifications
  - Per-event settings:
    - Task mentions
    - Approvals
    - Verifications
    - Comments
    - Reports
    - System updates
  - Digest options:
    - None (real-time)
    - Daily summary (time picker)
    - Weekly summary (day + time)
  - Do Not Disturb mode:
    - Quiet hours (start/end time)
    - Exception for high-priority
  - Save preferences to Firestore user profile

### 9.3 Email Delivery
- [ ] Set up email service (Firebase Extensions: Trigger Email):
  - Configure SMTP or SendGrid
  - Email templates:
    - Task mention
    - Approval request
    - Report ready
    - Weekly digest
  - Use Handlebars for templating
  - Bilingual templates (EN/TE)
  
- [ ] Implement retry logic:
  - At-least-once delivery
  - 3 retry attempts with exponential backoff
  - Mark as failed after max retries
  - Log failures to Firestore emailLogs collection
  - Admin view of failed emails

### 9.4 Push Notifications (PWA)
- [ ] Create service worker push handler:
  - Register for push on PWA install
  - Request permission modal
  - Store subscription in Firestore
  - Handle push event in service worker
  - Show notification with actions
  - Handle notification click (navigate to task)
  
- [ ] Send push via Firebase Cloud Messaging:
  - Send to subscribed devices
  - Payload: { title, body, icon, badge, data }
  - Click action URL

### 9.5 Digest System
- [ ] Create Firebase scheduled function:
  - Daily digest (runs at user-specified time)
  - Weekly digest (runs on selected day)
  - Query user's tasks/notifications since last digest
  - Generate HTML email with summary:
    - Task stats (completed, pending)
    - Mentions count
    - Approval requests
    - Conflicts
    - Leaderboard position
  - Send via email service
  - Mark digest as sent (prevent duplicates)

---

## 🛡️ Phase 10: Advanced Security & Privacy (PENDING)

### 10.1 Encryption
- [ ] Create `/src/lib/encryption.js`:
  - Encrypt sensitive data before Firestore write
  - Decrypt on read
  - Use Web Crypto API (AES-GCM)
  - Encrypt:
    - MFA secrets
    - Backup codes
    - Session tokens
    - Attachment metadata (if PII)
  - Key management:
    - Derive key from user password (PBKDF2)
    - Store salt in Firestore
    - Never store key directly
  
- [ ] Implement encryption at rest:
  - Firebase Storage already encrypts
  - Firestore encryption via client-side
  - Backups encrypted before Cloud Storage upload

### 10.2 PII Handling
- [ ] Create `/src/lib/pii.js`:
  - Mask email in logs: user@example.com → u***@e***.com
  - Mask phone: +1234567890 → +123***7890
  - Mask IP: 192.168.1.1 → 192.168.*.*
  - Strip PII from error reports
  - Admin unmask function (audit logged)
  
- [ ] Apply masking:
  - Audit logs (mask by default)
  - Error logs (always mask)
  - Exports (option to include/exclude PII)
  - Analytics (anonymize by default)

### 10.3 Consent Management
- [ ] Create `/src/features/auth/ConsentModal.jsx`:
  - Show on first sign-up
  - Terms of Service (scrollable, must scroll to accept)
  - Privacy Policy (link to full doc)
  - Cookie consent (essential, analytics, marketing)
  - Checkboxes for each consent type
  - "I Accept" button (disabled until scrolled)
  - Store consent in Firestore users/{uid}/consent
  - Timestamp of acceptance
  
- [ ] Re-prompt on policy updates:
  - Version policy documents
  - Check if user accepted latest version
  - Show update modal with changes highlighted
  - Require re-acceptance

### 10.4 Data Locality
- [ ] Add data locality info to settings:
  - Display: "Your data is stored in [us-central1]"
  - Link to Firebase region documentation
  - Note about GDPR compliance
  - Export data across regions (if multi-region)
  
- [ ] Document compliance:
  - GDPR: Right to access, delete, portability
  - CCPA: Do Not Sell (opt-out)
  - SOC 2: Security controls
  - Create COMPLIANCE.md

### 10.5 Rate Limiting
- [ ] Implement rate limiting:
  - API endpoints:
    - Password reset: 5 requests/hour
    - Login attempts: 10/hour (per IP)
    - Export requests: 5/hour
    - Search: 100/minute
    - Task CRUD: 100/minute
  - Store limits in Firestore rateLimits collection
  - Check limit before operation
  - Return 429 Too Many Requests
  - Show user-friendly message: "Too many requests, try again in X minutes"
  
- [ ] Create `/src/lib/rateLimit.js`:
  - checkRateLimit(userId, action) - Returns { allowed, remaining, resetAt }
  - incrementRateLimit(userId, action)
  - Reset after time window

---

## ♿ Phase 11: Accessibility & UX (PENDING)

### 11.1 Keyboard Navigation
- [ ] Audit and fix keyboard navigation:
  - All interactive elements reachable via Tab
  - Tab order is logical (top-to-bottom, left-to-right)
  - Focus indicators clearly visible
  - Escape key closes modals
  - Enter key submits forms
  - Space key toggles checkboxes
  - Arrow keys navigate lists/menus
  - Ctrl+K opens search
  
- [ ] Add keyboard shortcuts panel:
  - Press "?" to show shortcuts
  - List all shortcuts with descriptions
  - Category sections (Global, Tasks, Navigation)

### 11.2 ARIA & Screen Readers
- [ ] Add ARIA labels:
  - aria-label on icon buttons
  - aria-labelledby for sections
  - aria-describedby for form hints
  - role="alert" for error messages
  - role="status" for live updates (sync status)
  - aria-live for dynamic content (notifications)
  - aria-expanded for collapsibles
  - aria-selected for tabs
  
- [ ] Test with screen readers:
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (macOS/iOS)
  - TalkBack (Android)

### 11.3 Contrast & Visual Design
- [ ] Audit color contrast:
  - Text: min 4.5:1 (AA)
  - Large text: min 3:1 (AA)
  - UI components: min 3:1 (AA)
  - Use WebAIM contrast checker
  - Fix low-contrast elements
  
- [ ] Ensure visual clarity:
  - Don't rely on color alone (use icons + text)
  - Underline links in body text
  - Button states clearly differentiated
  - Error messages use icon + color + text

### 11.4 Large Text Mode
- [ ] Create `/src/features/settings/AccessibilitySettings.jsx`:
  - Large Text toggle:
    - Increases base font size by 25%
    - Increases line height
    - Expands spacing between elements
  - High Contrast toggle:
    - Increases contrast ratios
    - Removes transparency
    - Thicker borders
  - Reduce Motion toggle:
    - Disables animations
    - Instant transitions
  - Store preferences in user profile
  - Apply via CSS classes on body

### 11.5 Responsive & Mobile-First
- [ ] Optimize mobile experience:
  - Touch-friendly hit areas (min 44x44px)
  - Mobile navigation drawer
  - Swipe gestures (swipe task card for actions)
  - Bottom tab bar (for common actions)
  - Adaptive layouts (stack on mobile)
  - Mobile-optimized forms (larger inputs)
  
- [ ] Test on devices:
  - iPhone SE (small screen)
  - iPad (tablet)
  - Android (various sizes)
  - Desktop (1920x1080)
  - Ultra-wide (2560x1440)

---

## 🚀 Phase 12: Performance & Optimization (PENDING)

### 12.1 Code Splitting & Lazy Loading
- [ ] Implement React.lazy for routes:
  - Lazy load page components
  - Show loading spinner during import
  - Error boundary for failed imports
  
- [ ] Split heavy components:
  - Analytics page (charts)
  - Admin panel (tables)
  - Onboarding (tour library)
  - Export (PDF generation)
  
- [ ] Optimize bundle size:
  - Analyze with webpack-bundle-analyzer
  - Tree-shake unused code
  - Use import() for conditional features
  - Minify production build

### 12.2 Image & Asset Optimization
- [ ] Optimize images:
  - Use WebP format with JPEG fallback
  - Lazy load images (loading="lazy")
  - Responsive images (srcset)
  - Compress with TinyPNG or Squoosh
  
- [ ] Optimize fonts:
  - Use woff2 format
  - Preload critical fonts
  - font-display: swap
  - Subset fonts (remove unused characters)

### 12.3 Caching Strategy
- [ ] Set up React Query caching:
  - Stale-while-revalidate for tasks
  - Cache time: 5 minutes
  - Prefetch on hover
  - Optimistic updates
  - Invalidate on mutations
  
- [ ] Browser caching:
  - Service worker cache for static assets
  - Cache-Control headers
  - ETag validation

### 12.4 Database Optimization
- [ ] Optimize Firestore queries:
  - Use composite indexes
  - Limit query size (paginate)
  - Cache frequently accessed data
  - Batch reads when possible
  - Use cursors for pagination
  
- [ ] Monitor query performance:
  - Firebase Performance Monitoring
  - Track slow queries
  - Set alerts for > 1s queries

### 12.5 Monitoring Metrics
- [ ] Track Core Web Vitals:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
  - Use web-vitals library
  - Send to Firebase Analytics
  
- [ ] Track custom metrics:
  - Task creation time
  - Search response time
  - Sync queue length
  - Conflict resolution time
  - Export generation time

---

## 📈 Phase 13: Admin Dashboard & Metrics (PENDING)

### 13.1 Metrics Dashboard
- [ ] Create `/src/features/admin/MetricsDashboard.jsx`:
  - KPI cards (top row):
    - DAU (Daily Active Users)
    - WAU (Weekly Active Users)
    - MAU (Monthly Active Users)
    - User growth (% change)
  - Charts:
    - Tasks per day (line chart, 30 days)
    - Task completion rate (area chart)
    - Average daily score (line chart)
    - Task type distribution (pie chart)
    - Impact distribution (bar chart)
  - Real-time metrics:
    - Online users count
    - Active sessions
    - Pending sync queue
  - System health:
    - Error rate (%)
    - API latency (p95)
    - Storage usage
    - Conflict rate
  - Export report (PDF)
  
- [ ] Use Recharts for visualizations:
  - Line chart for trends
  - Bar chart for comparisons
  - Pie chart for distributions
  - Area chart for cumulative data
  - Responsive charts (mobile-friendly)

### 13.2 User Analytics
- [ ] Create `/src/features/admin/UserAnalytics.jsx`:
  - User table with columns:
    - Name
    - Email
    - Role
    - Last Active
    - Tasks This Month
    - Avg Daily Score
    - Streak
    - Status (active/inactive)
  - Filters:
    - Role
    - Team
    - Activity (active/inactive)
  - Sort by any column
  - Search by name/email
  - Pagination
  - Export to CSV
  
- [ ] User detail drill-down:
  - Click user to see profile
  - Task history (calendar heatmap)
  - Performance trends (charts)
  - Activity log (timeline)
  - Session history

### 13.3 Activity Heatmap
- [ ] Create `/src/components/ActivityHeatmap.jsx`:
  - Calendar-style grid (GitHub-style)
  - Each day shows task count
  - Color intensity by activity:
    - 0 tasks: gray
    - 1-3 tasks: light blue
    - 4-6 tasks: medium blue
    - 7+ tasks: dark blue
  - Hover tooltip: "5 tasks on Jan 15, 2025"
  - Click day to see tasks
  - Range selector (last 90 days, 6 months, 1 year)
  - Show streak on heatmap (consecutive days)

### 13.4 System Logs
- [ ] Create `/src/features/admin/SystemLogs.jsx`:
  - Log levels: Info, Warning, Error, Critical
  - Filter by level, date, source
  - Search by message content
  - Real-time log stream (toggle)
  - Download logs (text file)
  - Clear old logs (> 30 days)
  
- [ ] Log sources:
  - Client errors (React error boundary)
  - API errors (Firestore)
  - Auth errors (Firebase Auth)
  - Sync errors (offline queue)
  - Export errors (background jobs)

---

## 🧪 Phase 14: Testing & Quality Assurance (PENDING)

### 14.1 Unit Tests
- [ ] Set up testing environment:
  - Vitest for unit tests
  - React Testing Library
  - Mock Firestore with firebase-mock
  - Mock Auth context
  
- [ ] Write tests for:
  - Validation schemas (Zod)
  - RBAC functions (canUser, etc.)
  - Offline DB operations
  - Password strength calculator
  - Recurrence rule parser
  - Data transformations
  - Utility functions
  
- [ ] Target: 80% code coverage

### 14.2 Integration Tests
- [ ] Test user flows:
  - Sign up → onboarding → add task
  - Login → MFA verification → dashboard
  - Offline mode → add task → sync
  - Task with subtasks → mark complete
  - Conflict resolution flow
  - Export generation → download
  
- [ ] Use Playwright or Cypress:
  - Headless browser testing
  - Screenshot on failure
  - Video recording
  - Run in CI/CD

### 14.3 E2E Tests
- [ ] Critical user flows:
  - Admin: Invite user → user accepts → assign task → verify
  - Member: Add recurring task → view occurrences → edit rule
  - Manager: View team report → export CSV
  - Guest: Demo mode → explore features → sign up
  
- [ ] Test across browsers:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
  - Mobile Safari (iOS)
  - Chrome Mobile (Android)

### 14.4 Load Testing
- [ ] Simulate concurrent users:
  - 100 users adding tasks simultaneously
  - 50 users syncing offline queue
  - 20 admins exporting data
  - 10 users searching
  
- [ ] Use Artillery or k6:
  - Define scenarios
  - Ramp up users gradually
  - Measure response times
  - Track error rates
  - Generate report

### 14.5 Manual QA Checklist
- [ ] Test on low-end device:
  - Old Android phone
  - 3G network
  - Limited storage
  - Battery saver mode
  
- [ ] Test edge cases:
  - Empty states (no tasks, no users)
  - Error states (network error, permission denied)
  - Large datasets (1000+ tasks)
  - Long strings (task title with 200 chars)
  - Special characters (emojis, Telugu script)
  
- [ ] Accessibility audit:
  - Run Lighthouse
  - Test with screen reader
  - Check keyboard navigation
  - Verify contrast ratios

---

## 📚 Phase 15: Documentation & Handoff (PENDING)

### 15.1 API Documentation
- [ ] Create `/docs/API.md`:
  - List all Firestore collections
  - Document data schemas (with examples)
  - Security rules explanation
  - Query patterns
  - Indexes used
  
- [ ] Generate OpenAPI spec:
  - Use tool to auto-generate from code
  - Document Cloud Functions (if any)
  - Include request/response examples
  - Authentication flow

### 15.2 Developer Guide
- [ ] Create `/docs/DEVELOPER_GUIDE.md`:
  - Local setup instructions
  - Environment variables list
  - Firebase project setup
  - Running development server
  - Building for production
  - Deployment process (Vercel)
  - Code structure overview
  - Contributing guidelines

### 15.3 Admin Runbook
- [ ] Create `/docs/ADMIN_RUNBOOK.md`:
  - User management procedures:
    - Invite new user
    - Change user role
    - Deactivate account
    - Reset password
  - Backup & restore:
    - Trigger manual backup
    - Restore from backup
    - Test restore in staging
  - Monitoring & alerts:
    - View error logs
    - Check system health
    - Resolve sync conflicts
  - Escalation procedures:
    - Critical error response
    - Data breach protocol
    - Downtime communication

### 15.4 Testing Documentation
- [ ] Create `/docs/TESTING.md`:
  - Manual testing checklist
  - Automated test coverage
  - E2E test scenarios
  - Performance test results
  - Acceptance criteria for each feature
  
- [ ] Create `/docs/TESTING_MATRIX.xlsx`:
  - Spreadsheet with:
    - Feature
    - Test scenario
    - Expected result
    - Actual result
    - Pass/Fail
    - Browser/Device
    - Date tested

### 15.5 User Documentation
- [ ] Create in-app help center:
  - FAQ page
  - Feature tutorials (with screenshots)
  - Video guides (optional)
  - Keyboard shortcuts reference
  - Troubleshooting section
  
- [ ] Create `/docs/USER_GUIDE.pdf`:
  - Getting started
  - Adding tasks
  - Using voice input
  - Understanding analytics
  - Managing team (for admins)
  - Exporting data
  - Privacy & security

---

## 📊 Implementation Metrics & Tracking

### Files Created: 7 ✅
1. `/src/constants/roles.js` - 52 lines
2. `/src/constants/permissions.js` - 134 lines
3. `/src/lib/validation.js` - 385 lines
4. `/src/lib/rbac.js` - 278 lines
5. `/src/hooks/useRBAC.js` - 165 lines
6. `/src/lib/offline-db.js` - 458 lines
7. `/src/components/PasswordStrength.jsx` - 156 lines

**Total Lines: ~1,628**

### Files to Create: ~45 more
### Estimated Total Lines: ~15,000-20,000

### Time Estimates
- Phase 2 (Auth): 8-10 hours
- Phase 3 (Onboarding): 6-8 hours
- Phase 4 (Audit): 6-8 hours
- Phase 5 (Export/Backup): 10-12 hours
- Phase 6 (Offline Sync): 8-10 hours
- Phase 7 (Search/Filters): 6-8 hours
- Phase 8 (Task Enhancements): 12-15 hours
- Phase 9 (Notifications): 8-10 hours
- Phase 10 (Security): 6-8 hours
- Phase 11 (Accessibility): 6-8 hours
- Phase 12 (Performance): 4-6 hours
- Phase 13 (Admin Dashboard): 8-10 hours
- Phase 14 (Testing): 10-12 hours
- Phase 15 (Documentation): 6-8 hours

**Total: 104-131 hours (13-16 workdays)**

---

## 🎯 Next Session Priorities

**Immediate (Phase 2):**
1. ✅ Update Register.jsx with Zod + PasswordStrength
2. ✅ Update Login.jsx with MFA token input
3. ✅ Build MFASetup.jsx with QR code
4. ✅ Build SessionManager.jsx
5. ✅ Create AccountSettings.jsx with export/delete

**High Priority (Phase 3 & 4):**
6. Build OnboardingModal.jsx with 3-step flow
7. Integrate driver.js for product tours
8. Create DemoMode with sample data
9. Implement audit logging hook
10. Build AuditLog.jsx admin page

**Medium Priority (Phase 6):**
11. Build SyncManager with retry logic
12. Create ConflictResolver.jsx UI
13. Add OfflineBanner component
14. Implement sync status badges

---

## ✅ Acceptance Tests

### Foundation Tests
- [x] RBAC: Admin can view all tasks, member cannot
- [x] RBAC: Manager can verify tasks, member cannot
- [x] Validation: Password with <8 chars fails
- [x] Validation: Password without uppercase fails
- [x] IndexedDB: Task added to queue successfully
- [x] IndexedDB: Queue retrieves pending items in FIFO order

### Auth Tests (Pending)
- [ ] Password strength shows "weak" for "pass123"
- [ ] Password strength shows "strong" for "MySecure123!@#"
- [ ] MFA QR code generated and displayed
- [ ] MFA token verification succeeds with correct code
- [ ] Session list shows current device highlighted
- [ ] Remote sign-out removes session from list

### Onboarding Tests (Pending)
- [ ] Onboarding modal shows on first login
- [ ] Product tour highlights correct UI elements
- [ ] Demo mode loads 7 sample tasks
- [ ] Demo mode data doesn't persist to Firestore

### Audit Tests (Pending)
- [ ] Task creation logged with before: null, after: taskData
- [ ] Task update logged with before and after values
- [ ] Audit log UI shows all actions for current user
- [ ] Export audit logs downloads CSV with correct data

---

## 🔄 Status Summary

**Phase 1**: ✅ COMPLETE (100%)  
**Phase 2**: 🔄 IN PROGRESS (10%)  
**Phases 3-15**: ⏳ PENDING (0%)

**Overall Progress**: 7/52 major features complete = **13.5%**

**Recommendation**: Continue with Phase 2 (Auth hardening) in next session. Build MFA system, session management, and account settings before moving to onboarding.

---

**Last Updated**: November 6, 2025  
**Next Review**: After Phase 2 completion  
**Maintained By**: DWTS Development Team

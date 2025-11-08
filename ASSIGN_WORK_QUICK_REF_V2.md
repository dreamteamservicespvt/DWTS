# 📋 Create & Assign Work - Quick Reference

## 🎯 Quick Start

### For Admins:
1. **Admin Panel** → Click **"Create & Assign Work"**
2. Fill in title, select client/project (optional)
3. Add description, set priority (Low/Medium/High)
4. Pick team member(s) from list
5. Click **"Assign Work"**
6. ✅ Done! Member gets notification

### For Members:
1. **My Work** page → See all assigned work
2. Click **"Start"** → Status changes to "In Progress"
3. Click **"Upload Deliverable"** → Add files
4. Click **"Mark Submitted"** → Admin gets notification
5. ✅ Done! Wait for admin review

### For Admin Review:
1. **Admin Panel** → See "Pending Reviews" section
2. Click on submitted work
3. Preview files, add feedback
4. Click **"Approve"** or **"Request Rework"**
5. ✅ Done! Member gets notification

---

## 🗺️ Page Locations

| Feature | Admin | Member | Path |
|---------|-------|--------|------|
| Create Work Button | ✅ | ❌ | `/admin` |
| My Work Inbox | ❌ | ✅ | `/my-work` |
| Pending Reviews | ✅ | ❌ | `/admin` (top section) |
| Notifications | ✅ | ✅ | Bell icon (top right) |

---

## 🎨 Status Flow

```
Pending → In Progress → Submitted → Completed
                ↓
            Rework (if admin requests changes)
                ↓
         In Progress (resubmit)
```

---

## 🔔 Notification Types

| Type | Recipient | Trigger |
|------|-----------|---------|
| Work Assigned | Member | Admin assigns work |
| Work Submitted | Admin | Member submits deliverable |
| Work Approved | Member | Admin approves |
| Work Rework | Member | Admin requests changes |

---

## 📊 Key Fields

### Required:
- ✅ Work Title
- ✅ Assign To (at least 1 member)

### Optional but Recommended:
- Client & Project
- Description/Brief
- Task Type (Shooting/Editing/Design/Posting/Ad/Other)
- Date & Time
- Priority (Low/Medium/High)
- Attachments (reference files)
- Notify & Auto-Reminders toggles

---

## 🎯 Action Buttons

### Member Actions:
- **Start** - Begin working (Pending → In Progress)
- **Upload Deliverable** - Add files
- **Mark Submitted** - Send to admin for review
- **Update & Resubmit** - Fix and resubmit after rework request
- **Request Help** - Add comment/question
- **View Details** - See full work info

### Admin Actions:
- **Create & Assign Work** - New assignment
- **Review** - Open submission
- **Approve** - Mark as completed (🎉 confetti!)
- **Request Rework** - Send back with feedback

---

## 💡 Pro Tips

### For Admins:
- Check member's active task count before assigning (shown in selector)
- Use priority levels to help members prioritize
- Add detailed descriptions and reference files for clarity
- Enable auto-reminders for time-sensitive work
- Preview deliverables before approving

### For Members:
- Click "Start" as soon as you begin work
- Upload deliverables as you complete them (don't wait!)
- Add submission notes to explain your work
- Use comments to ask questions early
- Check "My Work" daily for new assignments

---

## 📱 Mobile Quick Actions

### Admin (Bottom Nav):
- Dashboard → Team → Analytics → Settings

### Member (Bottom Nav):
- Dashboard → **My Work** → Tasks → Analytics

### Tap **My Work** for:
- See all assigned work
- Filter by status
- Quick access to upload/submit

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Can't assign work | Make sure you're logged in as admin |
| Member not in list | Check if member role is set correctly |
| File upload fails | Check file size (<10MB) and internet connection |
| Can't submit work | Make sure you've uploaded at least 1 file |
| Notification not received | Check notification settings & verify email |

---

## 📞 Quick Support

- **Missing assigned work?** Check filters (All Status)
- **Can't upload files?** Try smaller files or different format
- **Need to reassign?** Admin can delete and create new
- **Questions?** Use the comment feature on work item

---

## 🎉 Celebrations

When work is approved, member sees:
- ✅ Confetti animation
- 🎉 Success toast: "Work approved — Great job!"
- Green "Completed" badge on work card

---

## 🔐 Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create Work | ✅ | ❌ |
| Assign Work | ✅ | ❌ |
| Start Work | ❌ | ✅ (their work) |
| Upload Files | ❌ | ✅ (their work) |
| Submit Work | ❌ | ✅ (their work) |
| Review Work | ✅ | ❌ |
| Approve/Rework | ✅ | ❌ |
| View Own Work | ✅ | ✅ |
| Add Comments | ✅ | ✅ |

---

## 📈 Stats Dashboard

### Admin Panel Shows:
- Total Members
- Active Work (In Progress count)
- **Pending Reviews** (needs your attention!)
- Total Tasks
- Completed Work

### My Work Shows:
- Total
- Pending
- In Progress
- Submitted
- Rework
- Completed

---

## ⏱️ Time-Based Features

### Auto-Reminders:
- **1 Day Before**: Reminder 24 hours before deadline
- **1 Hour Before**: Final reminder 60 minutes before

### Undo Window:
- **2 Minutes**: Can undo assignment with toast
- **After 2 Minutes**: Must manually delete/reassign

---

## 🎨 Priority Colors

- **Low** 📘 - Blue badge
- **Medium** 📙 - Yellow badge  
- **High** 📕 - Red badge

---

## 💬 Sample Microcopy

### Success:
- "Work assigned to Ethan — Notification sent."
- "Work started! Good luck! 💪"
- "Submitted to Srinu for review."
- "Work approved — Great job!"

### Errors:
- "Please select a team member to assign this work."
- "Upload failed. Try again or contact admin."
- "Please provide feedback for rework"

---

## 🔄 Activity Log

Every work item tracks:
- Who assigned it (with timestamp)
- When member started
- When member submitted
- Admin approval/rework decision
- All comments added

View in: **Work Details Modal** → Activity Log section

---

**💡 Remember**: This feature is designed to be **obvious and easy** - if you're confused, the UI probably needs improvement. Let us know!

---

*Quick Reference v1.0 | Last Updated: Nov 8, 2025*

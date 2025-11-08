/**
 * Zod Validation Schemas
 * 
 * Centralized validation for all data models.
 * Shared between client and server (when backend is implemented).
 * 
 * Business Rules Enforced:
 * - Password: min 8 chars, at least 1 uppercase, 1 number
 * - Email: standard RFC validation
 * - Phone: optional, E.164 format
 * - Task duration: min 15 minutes, max 12 hours
 * - Impact: standardized enum
 * - Dates: no future dates for task completion
 */

import { z } from 'zod';
import { ROLES } from '../constants/roles';

// ============= AUTH SCHEMAS =============

// Password policy: min 8 chars, uppercase, number
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .max(128, 'Password must be less than 128 characters');

// Email validation
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .toLowerCase()
  .max(255, 'Email must be less than 255 characters');

// Phone validation (E.164 format, optional)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  mfaToken: z.string().length(6, 'MFA token must be 6 digits').optional(),
});

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset confirmation
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// MFA setup
export const mfaSetupSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must be numeric'),
});

// ============= USER SCHEMAS =============

export const userRoleSchema = z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER, ROLES.GUEST]);

export const userProfileSchema = z.object({
  displayName: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  language: z.enum(['en', 'te']).default('en'),
  notificationPreferences: z.object({
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
    push: z.boolean().default(false),
    digest: z.enum(['none', 'daily', 'weekly']).default('none'),
  }).optional(),
  accessibility: z.object({
    largeText: z.boolean().default(false),
    highContrast: z.boolean().default(false),
  }).optional(),
});

// ============= TASK SCHEMAS =============

export const taskTypeSchema = z.enum([
  'Client Work',
  'Internal Meeting',
  'Development',
  'Research',
  'Documentation',
  'Bug Fix',
  'Testing',
  'Review',
  'Planning',
  'Other'
]);

export const taskImpactSchema = z.enum(['Low', 'Medium', 'High', 'Critical']);

export const taskStatusSchema = z.enum(['pending', 'in-progress', 'completed', 'blocked', 'cancelled']);

// Subtask schema
export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Subtask title is required').max(200),
  completed: z.boolean().default(false),
  createdAt: z.date().or(z.string()),
});

// Task dependency schema
export const taskDependencySchema = z.object({
  taskId: z.string(),
  type: z.enum(['blocks', 'blocked_by']),
});

// Attachment schema
export const attachmentSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File must be less than 10MB'),
  altText: z.string().optional(),
  uploadedAt: z.date().or(z.string()),
});

// Recurrence rule schema
export const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().min(1).max(365).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  endDate: z.date().or(z.string()).optional(),
  count: z.number().int().min(1).optional(), // Max occurrences
});

// Main task schema
export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  type: taskTypeSchema,
  impact: taskImpactSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  date: z.date().or(z.string()),
  status: taskStatusSchema.default('pending'),
  subtasks: z.array(subtaskSchema).optional(),
  dependencies: z.array(taskDependencySchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: recurrenceRuleSchema.optional(),
  templateId: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  approvedBy: z.string().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'declined']).optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.date().or(z.string()).optional(),
}).refine(data => {
  // Ensure end time is after start time
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  return endTotalMinutes > startTotalMinutes;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine(data => {
  // Ensure task duration is at least 15 minutes
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  return durationMinutes >= 15;
}, {
  message: 'Task must be at least 15 minutes',
  path: ['endTime'],
}).refine(data => {
  // Ensure task duration is max 12 hours
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  return durationMinutes <= 720; // 12 hours
}, {
  message: 'Task cannot exceed 12 hours',
  path: ['endTime'],
});

// Task template schema
export const taskTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional(),
  type: taskTypeSchema,
  impact: taskImpactSchema,
  defaultDuration: z.number().int().min(15).max(720), // minutes
  subtasks: z.array(z.object({
    title: z.string().min(1).max(200),
  })).optional(),
});

// Task comment schema
export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  mentions: z.array(z.string()).optional(), // User IDs
  attachments: z.array(attachmentSchema).optional(),
});

// ============= EXPORT & BACKUP SCHEMAS =============

export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'json', 'pdf', 'xlsx']),
  dateRange: z.object({
    start: z.date().or(z.string()),
    end: z.date().or(z.string()),
  }).optional(),
  includeAttachments: z.boolean().default(false),
  filters: z.object({
    status: z.array(taskStatusSchema).optional(),
    type: z.array(taskTypeSchema).optional(),
    impact: z.array(taskImpactSchema).optional(),
  }).optional(),
});

export const backupRequestSchema = z.object({
  retentionType: z.enum(['daily', 'weekly', 'monthly']),
  includeAuditLogs: z.boolean().default(true),
});

// ============= SEARCH & FILTER SCHEMAS =============

export const searchQuerySchema = z.object({
  query: z.string().max(200),
  filters: z.object({
    dateRange: z.object({
      start: z.date().or(z.string()),
      end: z.date().or(z.string()),
    }).optional(),
    status: z.array(taskStatusSchema).optional(),
    type: z.array(taskTypeSchema).optional(),
    impact: z.array(taskImpactSchema).optional(),
    userId: z.string().optional(),
    verified: z.boolean().optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(['date', 'createdAt', 'updatedAt', 'impact', 'status']),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }).optional(),
});

// ============= AUDIT LOG SCHEMA =============

export const auditActionSchema = z.enum([
  'user.created',
  'user.updated',
  'user.deleted',
  'user.role_changed',
  'user.impersonated',
  'task.created',
  'task.updated',
  'task.deleted',
  'task.verified',
  'task.approved',
  'task.declined',
  'report.exported',
  'backup.created',
  'settings.updated',
]);

export const auditLogSchema = z.object({
  actorId: z.string(),
  actorRole: userRoleSchema,
  action: auditActionSchema,
  targetType: z.enum(['user', 'task', 'report', 'backup', 'settings']),
  targetId: z.string(),
  before: z.any().optional(),
  after: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date().or(z.string()),
});

// ============= INVITATION SCHEMA =============

export const invitationSchema = z.object({
  email: emailSchema,
  role: userRoleSchema,
  expiresIn: z.number().int().min(1).max(168).default(48), // hours, default 48h
  message: z.string().max(500).optional(),
});

export const bulkInvitationSchema = z.object({
  invitations: z.array(invitationSchema).min(1).max(100, 'Cannot invite more than 100 users at once'),
});

// ============= HELPER FUNCTIONS =============

// Safe parse with error formatting
export const safeValidate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }
  return {
    success: true,
    data: result.data,
  };
};

// Password strength calculator
export const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return {
    score: strength,
    level: strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong',
  };
};

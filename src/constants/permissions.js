/**
 * RBAC Permission Matrix
 * 
 * Defines granular permissions for each role.
 * Format: PERMISSION_NAME: [roles that have this permission]
 * 
 * Usage: canUser(userRole, PERMISSIONS.VIEW_ALL_TASKS)
 */

import { ROLES } from './roles';

export const PERMISSIONS = {
  // Task permissions
  VIEW_OWN_TASKS: 'view_own_tasks',
  VIEW_TEAM_TASKS: 'view_team_tasks',
  VIEW_ALL_TASKS: 'view_all_tasks',
  CREATE_TASK: 'create_task',
  EDIT_OWN_TASK: 'edit_own_task',
  EDIT_TEAM_TASK: 'edit_team_task',
  EDIT_ANY_TASK: 'edit_any_task',
  DELETE_OWN_TASK: 'delete_own_task',
  DELETE_TEAM_TASK: 'delete_team_task',
  DELETE_ANY_TASK: 'delete_any_task',
  VERIFY_TASK: 'verify_task',
  BULK_TASK_ACTIONS: 'bulk_task_actions',
  
  // Report permissions
  VIEW_OWN_REPORTS: 'view_own_reports',
  VIEW_TEAM_REPORTS: 'view_team_reports',
  VIEW_ALL_REPORTS: 'view_all_reports',
  EXPORT_OWN_DATA: 'export_own_data',
  EXPORT_TEAM_DATA: 'export_team_data',
  EXPORT_ALL_DATA: 'export_all_data',
  
  // User management
  VIEW_USER_LIST: 'view_user_list',
  INVITE_USERS: 'invite_users',
  EDIT_USER_ROLES: 'edit_user_roles',
  DELETE_USERS: 'delete_users',
  IMPERSONATE_USER: 'impersonate_user',
  VIEW_USER_SESSIONS: 'view_user_sessions',
  
  // Admin features
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_BACKUPS: 'manage_backups',
  VIEW_METRICS: 'view_metrics',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  
  // Template & recurring
  CREATE_TEMPLATE: 'create_template',
  CREATE_RECURRING_TASK: 'create_recurring_task',
  
  // Comments & collaboration
  COMMENT_ON_TASK: 'comment_on_task',
  MENTION_USERS: 'mention_users',
  
  // Approvals
  REQUEST_APPROVAL: 'request_approval',
  APPROVE_TASKS: 'approve_tasks',
};

// Permission matrix mapping
export const PERMISSION_MATRIX = {
  // Tasks
  [PERMISSIONS.VIEW_OWN_TASKS]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER, ROLES.GUEST],
  [PERMISSIONS.VIEW_TEAM_TASKS]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.VIEW_ALL_TASKS]: [ROLES.ADMIN],
  [PERMISSIONS.CREATE_TASK]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.EDIT_OWN_TASK]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.EDIT_TEAM_TASK]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.EDIT_ANY_TASK]: [ROLES.ADMIN],
  [PERMISSIONS.DELETE_OWN_TASK]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.DELETE_TEAM_TASK]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.DELETE_ANY_TASK]: [ROLES.ADMIN],
  [PERMISSIONS.VERIFY_TASK]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.BULK_TASK_ACTIONS]: [ROLES.ADMIN, ROLES.MANAGER],
  
  // Reports
  [PERMISSIONS.VIEW_OWN_REPORTS]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.VIEW_TEAM_REPORTS]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.VIEW_ALL_REPORTS]: [ROLES.ADMIN],
  [PERMISSIONS.EXPORT_OWN_DATA]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.EXPORT_TEAM_DATA]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.EXPORT_ALL_DATA]: [ROLES.ADMIN],
  
  // Users
  [PERMISSIONS.VIEW_USER_LIST]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.INVITE_USERS]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.EDIT_USER_ROLES]: [ROLES.ADMIN],
  [PERMISSIONS.DELETE_USERS]: [ROLES.ADMIN],
  [PERMISSIONS.IMPERSONATE_USER]: [ROLES.ADMIN],
  [PERMISSIONS.VIEW_USER_SESSIONS]: [ROLES.ADMIN],
  
  // Admin
  [PERMISSIONS.VIEW_AUDIT_LOGS]: [ROLES.ADMIN],
  [PERMISSIONS.MANAGE_BACKUPS]: [ROLES.ADMIN],
  [PERMISSIONS.VIEW_METRICS]: [ROLES.ADMIN, ROLES.MANAGER],
  [PERMISSIONS.MANAGE_SYSTEM_SETTINGS]: [ROLES.ADMIN],
  
  // Templates & recurring
  [PERMISSIONS.CREATE_TEMPLATE]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.CREATE_RECURRING_TASK]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  
  // Collaboration
  [PERMISSIONS.COMMENT_ON_TASK]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.MENTION_USERS]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  
  // Approvals
  [PERMISSIONS.REQUEST_APPROVAL]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.MEMBER],
  [PERMISSIONS.APPROVE_TASKS]: [ROLES.ADMIN, ROLES.MANAGER],
};

// Convenience function to check if role has permission
export const roleHasPermission = (role, permission) => {
  const allowedRoles = PERMISSION_MATRIX[permission];
  return allowedRoles?.includes(role) || false;
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
  return Object.entries(PERMISSION_MATRIX)
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
};

// Check multiple permissions (OR logic)
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => roleHasPermission(role, permission));
};

// Check multiple permissions (AND logic)
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => roleHasPermission(role, permission));
};

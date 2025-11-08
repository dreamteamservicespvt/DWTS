/**
 * RBAC (Role-Based Access Control) Library
 * 
 * Core permission checking logic for the application.
 * Uses the permission matrix from constants/permissions.js
 * 
 * Architecture:
 * - All permission checks go through this module
 * - Supports user ownership checks (e.g., "can edit own task")
 * - Integrates with audit logging
 * - Provides React hook for components
 * 
 * Usage:
 * ```js
 * import { canUser, canUserWithOwnership } from '@/lib/rbac';
 * 
 * if (canUser(user.role, PERMISSIONS.VIEW_ALL_TASKS)) {
 *   // show all tasks
 * }
 * 
 * if (canUserWithOwnership(user.role, PERMISSIONS.EDIT_OWN_TASK, task.userId, user.id)) {
 *   // show edit button
 * }
 * ```
 */

import { roleHasPermission, PERMISSIONS } from '../constants/permissions';
import { ROLES } from '../constants/roles';

/**
 * Check if a user role has a specific permission
 * @param {string} userRole - User's role (admin, manager, member, guest)
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const canUser = (userRole, permission) => {
  if (!userRole || !permission) {
    console.warn('RBAC: Missing userRole or permission', { userRole, permission });
    return false;
  }
  return roleHasPermission(userRole, permission);
};

/**
 * Check permission with ownership validation
 * Used for "own" permissions like EDIT_OWN_TASK
 * 
 * Business Rule: User can perform action if they have permission AND own the resource
 * OR if they have the elevated "any" permission
 * 
 * @param {string} userRole - User's role
 * @param {string} ownPermission - Permission for own resources (e.g., EDIT_OWN_TASK)
 * @param {string} anyPermission - Permission for any resources (e.g., EDIT_ANY_TASK)
 * @param {string} resourceOwnerId - ID of resource owner
 * @param {string} userId - Current user's ID
 * @returns {boolean}
 */
export const canUserWithOwnership = (
  userRole,
  ownPermission,
  anyPermission,
  resourceOwnerId,
  userId
) => {
  // Check if user has "any" permission (admin-level)
  if (anyPermission && canUser(userRole, anyPermission)) {
    return true;
  }
  
  // Check if user owns resource and has "own" permission
  if (ownPermission && resourceOwnerId === userId) {
    return canUser(userRole, ownPermission);
  }
  
  return false;
};

/**
 * Check if user can edit a specific task
 * Business Rule: Can edit if (own task AND has EDIT_OWN_TASK) OR has EDIT_ANY_TASK
 */
export const canEditTask = (userRole, taskOwnerId, userId) => {
  return canUserWithOwnership(
    userRole,
    PERMISSIONS.EDIT_OWN_TASK,
    PERMISSIONS.EDIT_ANY_TASK,
    taskOwnerId,
    userId
  );
};

/**
 * Check if user can delete a specific task
 * Business Rule: Can delete if (own task AND has DELETE_OWN_TASK) OR has DELETE_ANY_TASK
 */
export const canDeleteTask = (userRole, taskOwnerId, userId) => {
  return canUserWithOwnership(
    userRole,
    PERMISSIONS.DELETE_OWN_TASK,
    PERMISSIONS.DELETE_ANY_TASK,
    taskOwnerId,
    userId
  );
};

/**
 * Check if user can view a specific task
 * Business Rule:
 * - Admin: can view all
 * - Manager: can view team tasks
 * - Member: can view own tasks
 * - Guest: can view public tasks only (in demo mode)
 */
export const canViewTask = (userRole, taskOwnerId, userId, isPublic = false) => {
  // Admin can view all
  if (canUser(userRole, PERMISSIONS.VIEW_ALL_TASKS)) {
    return true;
  }
  
  // Manager can view team tasks (assume team check is done elsewhere)
  if (canUser(userRole, PERMISSIONS.VIEW_TEAM_TASKS)) {
    return true; // Team membership check should be done by caller
  }
  
  // Member can view own tasks
  if (taskOwnerId === userId && canUser(userRole, PERMISSIONS.VIEW_OWN_TASKS)) {
    return true;
  }
  
  // Guest can view public tasks
  if (userRole === ROLES.GUEST && isPublic) {
    return true;
  }
  
  return false;
};

/**
 * Check if user can verify tasks
 * Business Rule: Only Admin and Manager can verify tasks
 */
export const canVerifyTasks = (userRole) => {
  return canUser(userRole, PERMISSIONS.VERIFY_TASK);
};

/**
 * Check if user can approve tasks
 * Business Rule: Only Admin and Manager can approve tasks
 */
export const canApproveTasks = (userRole) => {
  return canUser(userRole, PERMISSIONS.APPROVE_TASKS);
};

/**
 * Check if user can impersonate others
 * Business Rule: Only Admin can impersonate
 */
export const canImpersonate = (userRole) => {
  return canUser(userRole, PERMISSIONS.IMPERSONATE_USER);
};

/**
 * Check if user can manage system settings
 * Business Rule: Only Admin
 */
export const canManageSettings = (userRole) => {
  return canUser(userRole, PERMISSIONS.MANAGE_SYSTEM_SETTINGS);
};

/**
 * Check if user can view audit logs
 * Business Rule: Only Admin
 */
export const canViewAuditLogs = (userRole) => {
  return canUser(userRole, PERMISSIONS.VIEW_AUDIT_LOGS);
};

/**
 * Check if user can export data
 * Returns export scope: 'own' | 'team' | 'all' | null
 */
export const getExportScope = (userRole) => {
  if (canUser(userRole, PERMISSIONS.EXPORT_ALL_DATA)) {
    return 'all';
  }
  if (canUser(userRole, PERMISSIONS.EXPORT_TEAM_DATA)) {
    return 'team';
  }
  if (canUser(userRole, PERMISSIONS.EXPORT_OWN_DATA)) {
    return 'own';
  }
  return null;
};

/**
 * Check if user can view reports
 * Returns view scope: 'own' | 'team' | 'all' | null
 */
export const getReportViewScope = (userRole) => {
  if (canUser(userRole, PERMISSIONS.VIEW_ALL_REPORTS)) {
    return 'all';
  }
  if (canUser(userRole, PERMISSIONS.VIEW_TEAM_REPORTS)) {
    return 'team';
  }
  if (canUser(userRole, PERMISSIONS.VIEW_OWN_REPORTS)) {
    return 'own';
  }
  return null;
};

/**
 * Get allowed actions for a task based on user role and ownership
 * Returns object with boolean flags for each action
 */
export const getTaskActions = (userRole, taskOwnerId, userId) => {
  return {
    canView: canViewTask(userRole, taskOwnerId, userId),
    canEdit: canEditTask(userRole, taskOwnerId, userId),
    canDelete: canDeleteTask(userRole, taskOwnerId, userId),
    canVerify: canVerifyTasks(userRole),
    canApprove: canApproveTasks(userRole),
    canComment: canUser(userRole, PERMISSIONS.COMMENT_ON_TASK),
    canMention: canUser(userRole, PERMISSIONS.MENTION_USERS),
  };
};

/**
 * Check if user is admin
 * Convenience function for quick admin checks
 */
export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

/**
 * Check if user is manager or above
 */
export const isManagerOrAbove = (userRole) => {
  return userRole === ROLES.ADMIN || userRole === ROLES.MANAGER;
};

/**
 * Check if user is member or above (not guest)
 */
export const isMemberOrAbove = (userRole) => {
  return userRole === ROLES.ADMIN || userRole === ROLES.MANAGER || userRole === ROLES.MEMBER;
};

/**
 * Get user-friendly permission denial message
 */
export const getPermissionDeniedMessage = (permission, language = 'en') => {
  const messages = {
    en: {
      [PERMISSIONS.VIEW_ALL_TASKS]: 'You do not have permission to view all tasks',
      [PERMISSIONS.EDIT_ANY_TASK]: 'You do not have permission to edit this task',
      [PERMISSIONS.DELETE_ANY_TASK]: 'You do not have permission to delete this task',
      [PERMISSIONS.VERIFY_TASK]: 'Only managers and admins can verify tasks',
      [PERMISSIONS.IMPERSONATE_USER]: 'Only admins can impersonate users',
      [PERMISSIONS.VIEW_AUDIT_LOGS]: 'Only admins can view audit logs',
      [PERMISSIONS.MANAGE_BACKUPS]: 'Only admins can manage backups',
      default: 'You do not have permission to perform this action',
    },
    te: {
      [PERMISSIONS.VIEW_ALL_TASKS]: 'మీకు అన్ని పనులను చూసే అనుమతి లేదు',
      [PERMISSIONS.EDIT_ANY_TASK]: 'ఈ పనిని సవరించే అనుమతి మీకు లేదు',
      [PERMISSIONS.DELETE_ANY_TASK]: 'ఈ పనిని తొలగించే అనుమతి మీకు లేదు',
      [PERMISSIONS.VERIFY_TASK]: 'మేనేజర్లు మరియు అడ్మిన్లు మాత్రమే పనులను ధృవీకరించగలరు',
      [PERMISSIONS.IMPERSONATE_USER]: 'అడ్మిన్లు మాత్రమే వినియోగదారులను నటించగలరు',
      [PERMISSIONS.VIEW_AUDIT_LOGS]: 'అడ్మిన్లు మాత్రమే ఆడిట్ లాగ్‌లను చూడగలరు',
      [PERMISSIONS.MANAGE_BACKUPS]: 'అడ్మిన్లు మాత్రమే బ్యాకప్‌లను నిర్వహించగలరు',
      default: 'ఈ చర్యను నిర్వహించే అనుమతి మీకు లేదు',
    },
  };
  
  const langMessages = messages[language] || messages.en;
  return langMessages[permission] || langMessages.default;
};

export default {
  canUser,
  canUserWithOwnership,
  canEditTask,
  canDeleteTask,
  canViewTask,
  canVerifyTasks,
  canApproveTasks,
  canImpersonate,
  canManageSettings,
  canViewAuditLogs,
  getExportScope,
  getReportViewScope,
  getTaskActions,
  isAdmin,
  isManagerOrAbove,
  isMemberOrAbove,
  getPermissionDeniedMessage,
};

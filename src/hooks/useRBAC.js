/**
 * useRBAC Hook
 * 
 * React hook for permission checking in components.
 * Provides convenient functions to check permissions based on current user.
 * 
 * Usage:
 * ```jsx
 * const { canUser, canEditTask, getTaskActions, isAdmin } = useRBAC();
 * 
 * if (canUser(PERMISSIONS.VIEW_ALL_TASKS)) {
 *   return <AllTasksView />;
 * }
 * 
 * const actions = getTaskActions(task.userId);
 * {actions.canEdit && <EditButton />}
 * ```
 */

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as rbac from '../lib/rbac';
import { PERMISSIONS } from '../constants/permissions';

export const useRBAC = () => {
  const { user } = useAuth();
  
  // Memoize RBAC functions with current user context
  const rbacFunctions = useMemo(() => {
    if (!user) {
      // Return functions that always return false when no user
      return {
        canUser: () => false,
        canEditTask: () => false,
        canDeleteTask: () => false,
        canViewTask: () => false,
        canVerifyTasks: () => false,
        canApproveTasks: () => false,
        canImpersonate: () => false,
        canManageSettings: () => false,
        canViewAuditLogs: () => false,
        getExportScope: () => null,
        getReportViewScope: () => null,
        getTaskActions: () => ({
          canView: false,
          canEdit: false,
          canDelete: false,
          canVerify: false,
          canApprove: false,
          canComment: false,
          canMention: false,
        }),
        isAdmin: false,
        isManagerOrAbove: false,
        isMemberOrAbove: false,
        getPermissionDeniedMessage: (permission) => rbac.getPermissionDeniedMessage(permission, user?.language || 'en'),
      };
    }
    
    const userRole = user.role || 'member';
    const userId = user.uid;
    
    return {
      // Permission check with current user's role
      canUser: (permission) => rbac.canUser(userRole, permission),
      
      // Task-specific permissions with ownership
      canEditTask: (taskOwnerId) => rbac.canEditTask(userRole, taskOwnerId, userId),
      canDeleteTask: (taskOwnerId) => rbac.canDeleteTask(userRole, taskOwnerId, userId),
      canViewTask: (taskOwnerId, isPublic = false) => rbac.canViewTask(userRole, taskOwnerId, userId, isPublic),
      
      // General permissions
      canVerifyTasks: () => rbac.canVerifyTasks(userRole),
      canApproveTasks: () => rbac.canApproveTasks(userRole),
      canImpersonate: () => rbac.canImpersonate(userRole),
      canManageSettings: () => rbac.canManageSettings(userRole),
      canViewAuditLogs: () => rbac.canViewAuditLogs(userRole),
      
      // Scope getters
      getExportScope: () => rbac.getExportScope(userRole),
      getReportViewScope: () => rbac.getReportViewScope(userRole),
      
      // Get all actions for a task
      getTaskActions: (taskOwnerId) => rbac.getTaskActions(userRole, taskOwnerId, userId),
      
      // Role checks
      isAdmin: rbac.isAdmin(userRole),
      isManagerOrAbove: rbac.isManagerOrAbove(userRole),
      isMemberOrAbove: rbac.isMemberOrAbove(userRole),
      
      // Messages
      getPermissionDeniedMessage: (permission) => rbac.getPermissionDeniedMessage(permission, user.language || 'en'),
    };
  }, [user]);
  
  return {
    ...rbacFunctions,
    user,
    userRole: user?.role || 'guest',
    userId: user?.uid,
  };
};

/**
 * Higher-order component to protect routes
 * Usage:
 * ```jsx
 * export default withPermission(AdminPanel, PERMISSIONS.VIEW_ALL_TASKS);
 * ```
 */
export const withPermission = (Component, permission, fallback = null) => {
  return (props) => {
    const { canUser } = useRBAC();
    
    if (!canUser(permission)) {
      return fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

/**
 * Component to conditionally render children based on permission
 * Usage:
 * ```jsx
 * <ProtectedContent permission={PERMISSIONS.VIEW_ALL_TASKS}>
 *   <AdminDashboard />
 * </ProtectedContent>
 * ```
 */
export const ProtectedContent = ({ permission, children, fallback = null }) => {
  const { canUser } = useRBAC();
  
  if (!canUser(permission)) {
    return fallback;
  }
  
  return children;
};

/**
 * Component to show content only to specific roles
 * Usage:
 * ```jsx
 * <RoleContent roles={[ROLES.ADMIN, ROLES.MANAGER]}>
 *   <AdminButton />
 * </RoleContent>
 * ```
 */
export const RoleContent = ({ roles, children, fallback = null }) => {
  const { userRole } = useRBAC();
  
  if (!roles.includes(userRole)) {
    return fallback;
  }
  
  return children;
};

export default useRBAC;

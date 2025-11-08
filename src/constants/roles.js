/**
 * RBAC Role Definitions
 * 
 * Defines four user roles with explicit capability hierarchies:
 * - Admin: Full system access, can impersonate, manage users, view all data
 * - Manager: Team oversight, can view team reports, verify tasks, bulk actions
 * - Member: Standard user, can manage own tasks, view own reports
 * - Guest: Read-only access, can view public dashboards (demo mode)
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  GUEST: 'guest',
};

export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.MEMBER]: 2,
  [ROLES.GUEST]: 1,
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.MEMBER]: 'Member',
  [ROLES.GUEST]: 'Guest',
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full system access with user management and impersonation',
  [ROLES.MANAGER]: 'Team oversight with task verification and reporting',
  [ROLES.MEMBER]: 'Standard user with personal task management',
  [ROLES.GUEST]: 'Read-only access to public dashboards',
};

// Helper function to check if role has sufficient permissions
export const hasRolePermission = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Get all roles below a certain level (for delegation)
export const getRolesBelowLevel = (role) => {
  const level = ROLE_HIERARCHY[role];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, levelValue]) => levelValue < level)
    .map(([roleName]) => roleName);
};

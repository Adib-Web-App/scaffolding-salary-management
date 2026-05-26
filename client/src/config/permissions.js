export const ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  VIEWER: 'VIEWER',
};

export const PERMISSIONS = {
  'projects:read': [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.VIEWER],
  'projects:write': [ROLES.ADMIN],
  'work-entries:read': [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.VIEWER],
  'work-entries:write': [ROLES.ADMIN, ROLES.SUPERVISOR],
  'work-entries:export': [ROLES.ADMIN, ROLES.SUPERVISOR],
  'advances:read': [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.VIEWER],
  'advances:write': [ROLES.ADMIN],
  'attendance:read': [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.VIEWER],
  'attendance:write': [ROLES.ADMIN],
  'summary:read': [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.VIEWER],
  'performance:read': [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.VIEWER],
  'payroll:read': [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.VIEWER],
  'payroll:export': [ROLES.ADMIN],
  'export:reports': [ROLES.ADMIN],
  'users:read': [ROLES.ADMIN],
  'users:write': [ROLES.ADMIN],
};

export function can(role, permission) {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  const allowed = PERMISSIONS[permission];
  return Array.isArray(allowed) && allowed.includes(role);
}

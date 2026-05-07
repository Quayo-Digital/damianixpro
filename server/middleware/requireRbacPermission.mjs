import { getPermissionSetForRole } from '../rbac/matrix.mjs';

/**
 * Factory: Express middleware that returns 403 unless the user's `user_roles.role`
 * grants the permission (see `config/rbac-permission-matrix.json`).
 *
 * Chain: `requireSupabaseJwt` → `createAttachUserRole(supabaseAdmin)` → `createRequireRbacPermission('x.y')`.
 *
 * @param {string} permission
 */
export function createRequireRbacPermission(permission) {
  return function requireRbacPermission(req, res, next) {
    const set = getPermissionSetForRole(req.userRole);
    if (!set.has(permission)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        required_permission: permission,
        role: req.userRole,
      });
    }
    next();
  };
}

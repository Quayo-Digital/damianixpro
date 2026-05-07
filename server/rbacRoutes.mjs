import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';
import { requireSupabaseJwt } from './middleware/supabaseJwt.mjs';
import { createAttachUserRole } from './middleware/attachUserRole.mjs';
import { createRequireRbacPermission } from './middleware/requireRbacPermission.mjs';
import { getPermissionSetForRole } from './rbac/matrix.mjs';

/**
 * RBAC introspection + sample permission-guarded routes (Supabase JWT + matrix).
 * Mount with `app.use(createRbacRouter())`.
 */
export function createRbacRouter() {
  const router = express.Router();
  const attachUserRole = createAttachUserRole(supabaseAdmin);

  /** Who am I + effective permissions (for debugging clients; gate in production if needed). */
  router.get('/api/rbac/me', requireSupabaseJwt, attachUserRole, (req, res) => {
    const permissions = [...getPermissionSetForRole(req.userRole)];
    res.json({
      user_id: req.auth.sub,
      email: req.auth.email,
      role: req.userRole,
      permissions,
    });
  });

  /** Example: accounting module surface — requires `accounting.read` in the matrix. */
  router.get(
    '/api/rbac/demo/accounting',
    requireSupabaseJwt,
    attachUserRole,
    createRequireRbacPermission('accounting.read'),
    (_req, res) => {
      res.json({ ok: true, message: 'accounting.read granted' });
    }
  );

  return router;
}

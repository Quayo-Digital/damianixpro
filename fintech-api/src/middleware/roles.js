import { AppError } from '../utils/AppError.js';

/** @typedef {import('./auth.js').AuthContext} AuthContext */

/**
 * @param {AuthContext | undefined} auth
 * @returns {boolean}
 */
export function isAdmin(auth) {
  return Boolean(auth?.roles?.includes('admin'));
}

/**
 * Require an authenticated user (`requireAuth` must run first).
 * `admin` always satisfies the check.
 *
 * @param {...import('./auth.js').AppRole} allowed
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...allowed) {
  const allow = new Set(allowed);
  return (req, _res, next) => {
    const auth = /** @type {AuthContext | undefined} */ (req.auth);
    if (!auth?.sub) {
      return next(new AppError('Unauthorized', 401, 'unauthorized'));
    }

    if (isAdmin(auth)) {
      return next();
    }

    const roles = auth.roles ?? [];
    const ok = roles.some((r) => allow.has(r));
    if (!ok) {
      return next(
        new AppError('Insufficient permissions for this resource', 403, 'forbidden_role', {
          required: [...allow],
          roles,
        })
      );
    }

    return next();
  };
}

/**
 * Strictly require `admin` (no tenant/landlord override).
 * @returns {import('express').RequestHandler}
 */
export function requireAdmin() {
  return (req, _res, next) => {
    const auth = /** @type {AuthContext | undefined} */ (req.auth);
    if (!auth?.sub) {
      return next(new AppError('Unauthorized', 401, 'unauthorized'));
    }
    if (!isAdmin(auth)) {
      return next(new AppError('Admin only', 403, 'forbidden_admin'));
    }
    return next();
  };
}

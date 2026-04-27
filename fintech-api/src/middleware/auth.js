import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/** @typedef {'tenant'|'landlord'|'admin'} AppRole */

/**
 * Normalize JWT role claim(s) into a sorted unique list.
 * Accepts `role` (string) and/or `roles` (string[]).
 * Unknown strings are dropped.
 *
 * @param {import('jsonwebtoken').JwtPayload} payload
 * @returns {AppRole[]}
 */
export function rolesFromJwtPayload(payload) {
  /** @type {Set<AppRole>} */
  const set = new Set();

  const push = (/** @type {unknown} */ v) => {
    if (typeof v !== 'string') return;
    const s = v.trim().toLowerCase();
    if (s === 'tenant' || s === 'landlord' || s === 'admin') {
      set.add(s);
    }
  };

  if (Array.isArray(payload.roles)) {
    for (const r of payload.roles) push(r);
  }
  push(payload.role);

  return [...set].sort();
}

/**
 * Verified caller context attached to `req.auth`.
 * @typedef {{ sub: string, roles: AppRole[], iat?: number, exp?: number }} AuthContext
 */

/**
 * Requires `Authorization: Bearer <jwt>` (HS256).
 * Sets `req.auth` with `sub` and `roles` (from `role` / `roles` claims).
 *
 * Issuer is always enforced. Audience is enforced when `JWT_AUDIENCE` is set.
 * `AUTH_DEV_BYPASS=true` (non-production only) skips verification and grants all roles.
 */
export function requireAuth(req, _res, next) {
  if (env.authDevBypass) {
    /** @type {AuthContext} */
    req.auth = {
      sub: (env.authDevUserId || 'dev-bypass').trim() || 'dev-bypass',
      roles: ['admin', 'landlord', 'tenant'],
    };
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, 'unauthorized'));
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next(new AppError('Unauthorized', 401, 'unauthorized'));
  }

  try {
    /** @type {import('jsonwebtoken').JwtPayload} */
    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256'],
      issuer: env.jwtIssuer,
      ...(env.jwtAudience ? { audience: env.jwtAudience } : {}),
      clockTolerance: env.jwtClockToleranceSec,
    });

    if (typeof payload === 'string' || !payload.sub) {
      return next(new AppError('Invalid token', 401, 'invalid_token'));
    }

    const roles = rolesFromJwtPayload(payload);

    /** @type {AuthContext} */
    req.auth = {
      sub: String(payload.sub),
      roles,
      ...(typeof payload.iat === 'number' ? { iat: payload.iat } : {}),
      ...(typeof payload.exp === 'number' ? { exp: payload.exp } : {}),
    };

    return next();
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    if (name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'token_expired'));
    }
    if (name === 'JsonWebTokenError' || name === 'NotBeforeError') {
      return next(new AppError('Invalid token', 401, 'invalid_token'));
    }
    return next(new AppError('Invalid token', 401, 'invalid_token'));
  }
}

/**
 * Optional auth: sets `req.auth` when Bearer token is present and valid.
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  if (env.authDevBypass) {
    /** @type {AuthContext} */
    req.auth = {
      sub: (env.authDevUserId || 'dev-bypass').trim() || 'dev-bypass',
      roles: ['admin', 'landlord', 'tenant'],
    };
    return next();
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next();
  }

  try {
    /** @type {import('jsonwebtoken').JwtPayload} */
    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256'],
      issuer: env.jwtIssuer,
      ...(env.jwtAudience ? { audience: env.jwtAudience } : {}),
      clockTolerance: env.jwtClockToleranceSec,
    });

    if (typeof payload !== 'string' && payload.sub) {
      /** @type {AuthContext} */
      req.auth = {
        sub: String(payload.sub),
        roles: rolesFromJwtPayload(payload),
        ...(typeof payload.iat === 'number' ? { iat: payload.iat } : {}),
        ...(typeof payload.exp === 'number' ? { exp: payload.exp } : {}),
      };
    }
  } catch {
    /* invalid optional token — ignore */
  }

  next();
}

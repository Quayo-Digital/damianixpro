import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Central error handler — never leak stack traces in production.
 */
 
export function errorHandler(err, req, res, _next) {
  const status = err instanceof AppError ? err.statusCode : err.statusCode || 500;
  const code = err instanceof AppError ? err.code : 'internal_error';
  const message =
    status >= 500 && env.isProd ? 'Internal server error' : err.message || 'Unexpected error';

  const body = {
    error: {
      message,
      code: status >= 500 && env.isProd ? 'internal_error' : code,
      requestId: req.id,
    },
  };

  if (!env.isProd && err instanceof AppError && err.details) {
    body.error.details = err.details;
  }

  if (!env.isProd && err.stack) {
    body.error.stack = err.stack.split('\n').slice(0, 12);
  }

  if (status >= 500) console.error('[error]', req.id, err);

  res.status(status).json(body);
}

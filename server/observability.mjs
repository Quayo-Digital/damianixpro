import crypto from 'crypto';

function toJsonSafe(meta) {
  if (!meta || typeof meta !== 'object') return {};
  try {
    return JSON.parse(JSON.stringify(meta));
  } catch {
    return { meta_unserializable: true };
  }
}

function log(level, message, meta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...toJsonSafe(meta),
  };
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(message, meta) {
    log('info', message, meta);
  },
  warn(message, meta) {
    log('warn', message, meta);
  },
  error(message, meta) {
    log('error', message, meta);
  },
};

export function requestContextMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const requestId =
    (typeof incoming === 'string' && incoming.trim()) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export function apiError(res, status, code, message, details, requestId) {
  return res.status(status).json({
    error: {
      code,
      message,
      request_id: requestId || null,
      ...(details ? { details } : {}),
    },
  });
}

export function notFoundHandler(req, res) {
  return apiError(res, 404, 'NOT_FOUND', 'Route not found', null, req.requestId);
}

export function errorHandler(err, req, res, _next) {
  logger.error('unhandled_error', {
    request_id: req.requestId,
    route: req.originalUrl,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
  });
  return apiError(res, 500, 'INTERNAL_ERROR', 'Internal server error', null, req.requestId);
}

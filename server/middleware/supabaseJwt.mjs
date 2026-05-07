import jwt from 'jsonwebtoken';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/**
 * Verifies Supabase-issued JWT (same secret as GoTrue). Sets `req.auth = { sub, email }`.
 */
export function requireSupabaseJwt(req, res, next) {
  const secret = (process.env.SUPABASE_JWT_SECRET || '').trim();
  if (!secret) {
    return res.status(500).json({ error: 'SUPABASE_JWT_SECRET is not configured' });
  }
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' });
  }
  if (token.length > 8192) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const verifyOptions = {
      algorithms: ['HS256'],
      clockTolerance: 10,
    };
    const issuer = (process.env.SUPABASE_JWT_ISSUER || '').trim();
    const audience = (process.env.SUPABASE_JWT_AUDIENCE || '').trim();
    if (issuer) verifyOptions.issuer = issuer;
    if (audience) verifyOptions.audience = audience;
    const payload = jwt.verify(token, secret, verifyOptions);
    const sub = payload.sub;
    if (!sub) {
      return res.status(401).json({ error: 'Invalid token: missing sub' });
    }
    if (!UUID_RE.test(String(sub))) {
      return res.status(401).json({ error: 'Invalid token: malformed subject' });
    }
    req.auth = { sub: String(sub), email: payload.email ? String(payload.email) : null };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

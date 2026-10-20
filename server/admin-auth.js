import { createHash, timingSafeEqual } from 'node:crypto';

const digest = (value) => createHash('sha256').update(value).digest();

// Credentials remain server-side. The browser keeps Authorization in memory
// only; public deployments must terminate HTTPS at the ingress.
export function createAdminAuth({
  username = process.env.ADMIN_USERNAME,
  password = process.env.ADMIN_PASSWORD,
  now = Date.now,
} = {}) {
  const failures = new Map();
  return (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!username || !password || password.length < 20) {
      return res.status(503).json({ message: 'Admin access is not configured.' });
    }
    const ip = req.ip;
    const time = now();
    const attempt = failures.get(ip);
    if (attempt && attempt.until > time && attempt.count >= 10) {
      res.set('Retry-After', String(Math.ceil((attempt.until - time) / 1000)));
      return res.status(429).json({ message: 'Too many failed sign-in attempts. Try again shortly.' });
    }
    const header = req.get('authorization') || '';
    let valid = false;
    if (header.startsWith('Basic ') && header.length < 4096) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator >= 0) {
        const userMatches = timingSafeEqual(digest(decoded.slice(0, separator)), digest(username));
        const passwordMatches = timingSafeEqual(digest(decoded.slice(separator + 1)), digest(password));
        valid = userMatches && passwordMatches;
      }
    }
    if (!valid) {
      // Bound memory even when requests come from many addresses.
      if (failures.size >= 5000 && !failures.has(ip)) {
        failures.delete(failures.keys().next().value);
      }
      failures.set(ip, attempt && attempt.until > time
        ? { ...attempt, count: attempt.count + 1 }
        : { count: 1, until: time + 60_000 });
      return res.status(401).json({ message: 'Admin sign-in required.' });
    }
    failures.delete(ip);
    next();
  };
}

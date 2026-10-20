import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';

export const GAME_LIMIT = 3;
export const LEASE_SECONDS = 90;
export const MAX_SESSION_SECONDS = 15 * 60;
const embedUrl = 'https://itch.io/embed-upload/14036346?color=111621';
const digest = token => createHash('sha256').update(token).digest('hex');
const validToken = token => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);

export async function initGameSessions(pool) {
  // Exactly three durable slots; no visitor data or ever-growing session log.
  await pool.query(`CREATE TABLE IF NOT EXISTS portfolio_game_slots (
    slot SMALLINT PRIMARY KEY CHECK (slot BETWEEN 1 AND 3),
    token_hash CHAR(64), started_at TIMESTAMPTZ, expires_at TIMESTAMPTZ
  )`);
  await pool.query(`INSERT INTO portfolio_game_slots (slot) VALUES (1), (2), (3)
    ON CONFLICT (slot) DO NOTHING`);
}

export function createGameStore(pool) {
  return {
    async acquire() {
      const token = randomBytes(32).toString('hex');
      const { rows } = await pool.query(`WITH available AS (
        SELECT slot FROM portfolio_game_slots
        WHERE expires_at IS NULL OR expires_at <= clock_timestamp()
        ORDER BY slot FOR UPDATE SKIP LOCKED LIMIT 1
      ) UPDATE portfolio_game_slots SET token_hash = $1, started_at = clock_timestamp(),
          expires_at = clock_timestamp() + INTERVAL '90 seconds'
        FROM available WHERE portfolio_game_slots.slot = available.slot RETURNING portfolio_game_slots.slot`, [digest(token)]);
      return rows.length ? { token, expiresIn: LEASE_SECONDS, maxDuration: MAX_SESSION_SECONDS, embedUrl } : null;
    },
    async heartbeat(token) {
      const { rows } = await pool.query(`UPDATE portfolio_game_slots
        SET expires_at = LEAST(clock_timestamp() + INTERVAL '90 seconds', started_at + INTERVAL '15 minutes')
        WHERE token_hash = $1 AND expires_at > clock_timestamp()
          AND started_at + INTERVAL '15 minutes' > clock_timestamp()
        RETURNING EXTRACT(EPOCH FROM (expires_at - clock_timestamp())) AS remaining`, [digest(token)]);
      return rows.length ? { expiresIn: Math.max(0, Number(rows[0].remaining)) } : null;
    },
    async release(token) {
      await pool.query(`UPDATE portfolio_game_slots SET token_hash = NULL, started_at = NULL, expires_at = NULL
        WHERE token_hash = $1`, [digest(token)]);
    },
  };
}

export function createGameRouter(store, { allowedOrigins = [] } = {}) {
  const router = Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    // No cookies/auth ambiently grant a slot. Reject cross-site browser writes too.
    const origin = req.get('origin');
    if (origin) {
      let sameHost = false;
      try { sameHost = new URL(origin).host === req.get('host'); } catch { /* Invalid origin. */ }
      if (!sameHost && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Use the player on this portfolio.' });
    }
    next();
  });
  router.post('/', async (_req, res) => {
    try {
      const session = await store.acquire();
      if (!session) return res.status(429).set('Retry-After', '20').json({ error: 'All three play windows are in use. Please try again shortly.' });
      res.status(201).json(session);
    } catch { res.status(503).json({ error: 'The player is temporarily unavailable. Please try again.' }); }
  });
  router.post('/heartbeat', async (req, res) => {
    if (!validToken(req.body?.token)) return res.status(400).json({ error: 'Invalid play session.' });
    try {
      const session = await store.heartbeat(req.body.token);
      if (!session) return res.status(410).json({ error: 'Your play session ended. Start again to request a free window.' });
      res.json(session);
    } catch { res.status(503).json({ error: 'Connection lost. Please reopen the player.' }); }
  });
  router.post('/release', async (req, res) => {
    if (!validToken(req.body?.token)) return res.status(400).json({ error: 'Invalid play session.' });
    try { await store.release(req.body.token); res.sendStatus(204); }
    catch { res.status(503).json({ error: 'The session will expire automatically.' }); }
  });
  return router;
}

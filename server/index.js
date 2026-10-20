import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import pool, { initDatabase } from './db.js';
import { createAdminAuth } from './admin-auth.js';
import jobsRouter from './routes/jobs.js';
import { createGameRouter, createGameStore, initGameSessions } from './game-sessions.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5001);

app.disable('x-powered-by');
// Enable only behind the trusted frontend proxy, never for direct public API access.
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
if (allowedOrigins.length) app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/game/sessions', createGameRouter(createGameStore(pool), { allowedOrigins }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Portfolio API is running.' });
});

app.get('/api/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

const requireAdmin = createAdminAuth();
app.get('/api/admin/session', requireAdmin, (_req, res) => res.json({ ok: true }));
app.use('/api/jobs', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  return requireAdmin(req, res, next);
}, jobsRouter);

async function startServer() {
  try {
    await initDatabase();
    await initGameSessions(pool);
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Portfolio API listening on http://0.0.0.0:${port}`);
    });
    let stopping = false;
    const shutdown = () => {
      if (stopping) return;
      stopping = true;
      server.close(() => pool.end().then(() => process.exit(0)));
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start portfolio API:', error);
    process.exit(1);
  }
}

startServer();

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { initDatabase } from './db.js';
import jobsRouter from './routes/jobs.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5001);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Portfolio API is running.' });
});

app.use('/api/jobs', jobsRouter);

async function startServer() {
  try {
    await initDatabase();
    app.listen(port, '0.0.0.0', () => {
      console.log(`Portfolio API listening on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start portfolio API:', error);
    process.exit(1);
  }
}

startServer();

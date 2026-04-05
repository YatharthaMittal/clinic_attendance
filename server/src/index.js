import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './db/pool.js';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { patientsRouter } from './routes/patients.js';
import { attendanceRouter } from './routes/attendance.js';
import { paymentsRouter } from './routes/payments.js';
import { reportsRouter } from './routes/reports.js';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: 'database_unavailable' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/patients', requireAuth, patientsRouter);
app.use('/api/attendance', requireAuth, attendanceRouter);
app.use('/api/payments', requireAuth, paymentsRouter);
app.use('/api/reports', requireAuth, reportsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

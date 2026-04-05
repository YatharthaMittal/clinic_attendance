import { Router } from 'express';
import { pool } from '../db/pool.js';

export const attendanceRouter = Router();

function mapRow(row) {
  return {
    id: row.id,
    patient_id: row.patient_id,
    date:
      row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date).slice(0, 10),
    present: row.present,
    name: row.name,
    injury: row.injury,
  };
}

attendanceRouter.get('/', async (req, res) => {
  const date = req.query.date;
  if (date) {
    const { rows } = await pool.query(
      `SELECT a.*, p.name, p.injury
       FROM attendance a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.date = $1::date
       ORDER BY p.name`,
      [date]
    );
    return res.json(rows.map(mapRow));
  }
  const { rows } = await pool.query(
    `SELECT a.*, p.name, p.injury
     FROM attendance a
     JOIN patients p ON p.id = a.patient_id
     ORDER BY a.date DESC, p.name`
  );
  res.json(rows.map(mapRow));
});

/** Upsert one patient present for a day; does not remove other rows. */
attendanceRouter.post('/mark-present', async (req, res) => {
  const { patient_id, date } = req.body || {};
  const day = date || new Date().toISOString().slice(0, 10);
  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: pr } = await client.query(
      'SELECT * FROM patients WHERE id = $1',
      [patient_id]
    );
    const patient = pr[0];
    if (!patient) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (patient.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Patient is not active' });
    }

    const { rows: prevRow } = await client.query(
      `SELECT present FROM attendance WHERE patient_id = $1 AND date = $2::date`,
      [patient_id, day]
    );
    const wasPresent = prevRow[0]?.present === true;

    await client.query(
      `INSERT INTO attendance (patient_id, date, present)
       VALUES ($1, $2::date, true)
       ON CONFLICT (patient_id, date) DO UPDATE SET present = true`,
      [patient_id, day]
    );

    if (!wasPresent) {
      await client.query(`UPDATE patients SET last_visit = NOW() WHERE id = $1`, [
        patient_id,
      ]);
      if (patient.payment_mode === 'advance') {
        await client.query(
          `UPDATE patients SET sessions_used = LEAST(sessions_total, sessions_used + 1)
           WHERE id = $1`,
          [patient_id]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

/**
 * Replace all attendance for a date, then apply last_visit / sessions_used only for
 * patients who newly become present (not on every re-save).
 */
attendanceRouter.post('/', async (req, res) => {
  const { date, entries } = req.body || {};
  if (!date || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'date and entries[] required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: beforeRows } = await client.query(
      `SELECT patient_id, present FROM attendance WHERE date = $1::date`,
      [date]
    );
    const before = new Map(beforeRows.map((r) => [r.patient_id, r.present]));

    await client.query(`DELETE FROM attendance WHERE date = $1::date`, [date]);

    for (const e of entries) {
      const pid = e.patient_id;
      const present = Boolean(e.present);
      if (!pid) continue;
      await client.query(
        `INSERT INTO attendance (patient_id, date, present) VALUES ($1, $2::date, $3)`,
        [pid, date, present]
      );
    }

    const newlyPresent = entries.filter((e) => {
      if (!e.patient_id || !e.present) return false;
      const prev = before.get(e.patient_id);
      return prev !== true;
    });

    for (const e of newlyPresent) {
      const pid = e.patient_id;
      await client.query(`UPDATE patients SET last_visit = NOW() WHERE id = $1`, [pid]);
      await client.query(
        `UPDATE patients SET sessions_used = LEAST(sessions_total, sessions_used + 1)
         WHERE id = $1 AND payment_mode = 'advance'`,
        [pid]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

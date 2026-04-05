import { Router } from 'express';
import { pool } from '../db/pool.js';

export const paymentsRouter = Router();

function mapPayment(row) {
  return {
    id: row.id,
    patient_id: row.patient_id,
    amount: Number(row.amount),
    payment_type: row.payment_type,
    sessions: Number(row.sessions),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    patient_name: row.patient_name,
  };
}

paymentsRouter.get('/', async (req, res) => {
  const patientId = req.query.patient_id;
  const params = [];
  let where = '';
  if (patientId) {
    where = 'WHERE p.patient_id = $1';
    params.push(patientId);
  }
  const { rows } = await pool.query(
    `SELECT p.*, pt.name AS patient_name
     FROM payments p
     JOIN patients pt ON pt.id = p.patient_id
     ${where}
     ORDER BY p.created_at DESC`,
    params
  );
  res.json(rows.map(mapPayment));
});

paymentsRouter.post('/', async (req, res) => {
  const { patient_id, amount, payment_type, sessions } = req.body || {};
  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id required' });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'valid amount required' });
  }
  if (!['advance', 'monthly', 'per_session'].includes(payment_type)) {
    return res.status(400).json({ error: 'invalid payment_type' });
  }
  const addSessions = Number(sessions);
  const sess =
    Number.isFinite(addSessions) && addSessions >= 1 ? Math.floor(addSessions) : 1;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: pr } = await client.query('SELECT id FROM patients WHERE id = $1', [
      patient_id,
    ]);
    if (!pr[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient not found' });
    }

    const { rows } = await client.query(
      `INSERT INTO payments (patient_id, amount, payment_type, sessions)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [patient_id, amt, payment_type, sess]
    );

    if (
      payment_type === 'advance' &&
      sessions !== undefined &&
      sessions !== '' &&
      Number.isFinite(Number(sessions)) &&
      Number(sessions) > 0
    ) {
      await client.query(
        `UPDATE patients SET sessions_total = sessions_total + $1 WHERE id = $2`,
        [Math.floor(Number(sessions)), patient_id]
      );
    }

    await client.query('COMMIT');
    const pay = rows[0];
    res.status(201).json({
      id: pay.id,
      patient_id: pay.patient_id,
      amount: Number(pay.amount),
      payment_type: pay.payment_type,
      sessions: Number(pay.sessions),
      created_at: pay.created_at.toISOString(),
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

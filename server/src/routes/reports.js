import { Router } from 'express';
import { pool } from '../db/pool.js';

export const reportsRouter = Router();

reportsRouter.get('/summary', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const [
    todayPresent,
    monthlyVisits,
    totalRevenue,
    monthlyRevenue,
    activeCount,
    lowCount,
    modeRows,
    lowPatients,
    recentPayments,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS c FROM attendance WHERE date = $1::date AND present = true`,
      [today]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS c FROM attendance
       WHERE present = true
       AND date >= date_trunc('month', CURRENT_DATE)::date
       AND date < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date`
    ),
    pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric AS s FROM payments`),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS s FROM payments
       WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
       AND created_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'`
    ),
    pool.query(`SELECT COUNT(*)::int AS c FROM patients WHERE status = 'active'`),
    pool.query(
      `SELECT COUNT(*)::int AS c FROM patients
       WHERE payment_mode = 'advance' AND (sessions_total - sessions_used) <= 2`
    ),
    pool.query(
      `SELECT payment_mode, COUNT(*)::int AS c FROM patients GROUP BY payment_mode`
    ),
    pool.query(
      `SELECT id, name, phone, injury, payment_mode, sessions_total, sessions_used, status,
              last_visit, created_at, prescription, photo
       FROM patients
       WHERE payment_mode = 'advance' AND (sessions_total - sessions_used) <= 2
       ORDER BY (sessions_total - sessions_used), name
       LIMIT 50`
    ),
    pool.query(
      `SELECT pay.id, pay.patient_id, pay.amount, pay.payment_type, pay.sessions, pay.created_at, pt.name AS patient_name
       FROM payments pay
       JOIN patients pt ON pt.id = pay.patient_id
       ORDER BY pay.created_at DESC
       LIMIT 5`
    ),
  ]);

  const breakdown = { per_session: 0, monthly: 0, advance: 0 };
  const totalPatients = await pool.query(`SELECT COUNT(*)::int AS c FROM patients`);
  const tp = totalPatients.rows[0].c;
  for (const r of modeRows.rows) {
    if (breakdown[r.payment_mode] !== undefined) {
      breakdown[r.payment_mode] = r.c;
    }
  }

  const mapPatient = (row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    injury: row.injury,
    payment_mode: row.payment_mode,
    sessions_total: Number(row.sessions_total),
    sessions_used: Number(row.sessions_used),
    status: row.status,
    last_visit: row.last_visit?.toISOString?.() ?? row.last_visit,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    prescription: row.prescription,
    photo: row.photo,
  });

  res.json({
    today,
    todayPresent: todayPresent.rows[0].c,
    monthlyVisits: monthlyVisits.rows[0].c,
    totalRevenue: Number(totalRevenue.rows[0].s),
    monthlyRevenue: Number(monthlyRevenue.rows[0].s),
    activePatients: activeCount.rows[0].c,
    lowSessionCount: lowCount.rows[0].c,
    patientTotal: tp,
    paymentModeBreakdown: breakdown,
    lowSessionPatients: lowPatients.rows.map(mapPatient),
    recentPayments: recentPayments.rows.map((row) => ({
      id: row.id,
      patient_id: row.patient_id,
      amount: Number(row.amount),
      payment_type: row.payment_type,
      sessions: Number(row.sessions),
      created_at: row.created_at.toISOString(),
      patient_name: row.patient_name,
    })),
  });
});

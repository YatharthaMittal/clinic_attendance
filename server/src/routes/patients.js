import { Router } from 'express';
import { pool } from '../db/pool.js';

export const patientsRouter = Router();

function mapPatient(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    photo: row.photo,
    injury: row.injury,
    prescription: row.prescription,
    payment_mode: row.payment_mode,
    sessions_total: Number(row.sessions_total),
    sessions_used: Number(row.sessions_used),
    status: row.status,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    last_visit: row.last_visit?.toISOString?.() ?? row.last_visit,
  };
}

patientsRouter.get('/', async (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const filter = req.query.filter ? String(req.query.filter) : 'all';

  const conditions = [];
  const params = [];
  let i = 1;

  if (search) {
    conditions.push(
      `(p.name ILIKE $${i} OR p.injury ILIKE $${i} OR p.phone ILIKE $${i})`
    );
    params.push(`%${search}%`);
    i++;
  }
  if (filter === 'active') {
    conditions.push(`p.status = 'active'`);
  } else if (filter === 'inactive') {
    conditions.push(`p.status = 'inactive'`);
  } else if (filter === 'low') {
    conditions.push(
      `p.payment_mode = 'advance' AND (p.sessions_total - p.sessions_used) <= 2`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT p.* FROM patients p ${where} ORDER BY p.created_at DESC`,
    params
  );
  res.json(rows.map(mapPatient));
});

patientsRouter.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM patients WHERE id = $1', [
    req.params.id,
  ]);
  const p = rows[0];
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  res.json(mapPatient(p));
});

patientsRouter.post('/', async (req, res) => {
  const body = req.body || {};
  const {
    name,
    phone,
    injury,
    prescription = '',
    payment_mode,
    sessions_total,
    photo = null,
  } = body;

  if (!name?.trim() || !phone?.trim() || !injury?.trim() || !payment_mode) {
    return res.status(400).json({ error: 'name, phone, injury, payment_mode required' });
  }
  if (!/^\d{10}$/.test(String(phone).trim())) {
    return res.status(400).json({ error: 'phone must be 10 digits' });
  }
  if (!['per_session', 'monthly', 'advance'].includes(payment_mode)) {
    return res.status(400).json({ error: 'invalid payment_mode' });
  }
  let st = 0;
  if (payment_mode === 'advance') {
    st = Number(sessions_total);
    if (!Number.isFinite(st) || st <= 0) {
      return res.status(400).json({ error: 'sessions_total required for advance' });
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO patients (
      name, phone, photo, injury, prescription, payment_mode, sessions_total, sessions_used, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'active')
    RETURNING *`,
    [
      name.trim(),
      phone.trim(),
      photo || null,
      injury.trim(),
      String(prescription || ''),
      payment_mode,
      st,
    ]
  );
  res.status(201).json(mapPatient(rows[0]));
});

patientsRouter.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  const existing = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Patient not found' });
  const cur = existing.rows[0];

  const name = body.name !== undefined ? String(body.name).trim() : cur.name;
  const phone = body.phone !== undefined ? String(body.phone).trim() : cur.phone;
  const injury = body.injury !== undefined ? String(body.injury).trim() : cur.injury;
  const prescription =
    body.prescription !== undefined ? String(body.prescription) : cur.prescription;
  const payment_mode = body.payment_mode ?? cur.payment_mode;
  const status = body.status ?? cur.status;
  let sessions_total =
    body.sessions_total !== undefined
      ? Number(body.sessions_total)
      : Number(cur.sessions_total);
  const photo = body.photo !== undefined ? body.photo : cur.photo;

  if (!name || !phone || !injury) {
    return res.status(400).json({ error: 'name, phone, injury cannot be empty' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'phone must be 10 digits' });
  }
  if (!['per_session', 'monthly', 'advance'].includes(payment_mode)) {
    return res.status(400).json({ error: 'invalid payment_mode' });
  }
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  if (payment_mode === 'advance' && (!Number.isFinite(sessions_total) || sessions_total < 0)) {
    return res.status(400).json({ error: 'invalid sessions_total' });
  }
  if (payment_mode !== 'advance') {
    sessions_total = Number(cur.sessions_total);
  }

  const { rows } = await pool.query(
    `UPDATE patients SET
      name = $1, phone = $2, photo = $3, injury = $4, prescription = $5,
      payment_mode = $6, sessions_total = $7, status = $8
    WHERE id = $9
    RETURNING *`,
    [name, phone, photo, injury, prescription, payment_mode, sessions_total, status, id]
  );
  res.json(mapPatient(rows[0]));
});

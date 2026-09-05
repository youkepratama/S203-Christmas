import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, CATEGORIES } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { logActivity } from '../utils/log.js';

const router = Router();

router.get('/users', requireAuth, requireRole('Admin'), (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, active, created_at FROM users ORDER BY name').all();
  res.json({ users });
});

router.post('/users', requireAuth, requireRole('Admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  const validRoles = ['Admin', 'Supervisor', 'Dorm Parent', 'Academic Advisor', 'School Management'];
  if (!name || !email || !password || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Nama, email, kata sandi, dan peran yang valid wajib diisi.' });
  }
  try {
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email.trim().toLowerCase(), bcrypt.hashSync(password, 8), role);
    logActivity(req.user.name, 'Tambah akun pengguna', email);
    res.status(201).json({ user: db.prepare('SELECT id, name, email, role, active FROM users WHERE id = ?').get(info.lastInsertRowid) });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Email sudah terdaftar.' });
    throw err;
  }
});

router.put('/users/:id', requireAuth, requireRole('Admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  const { name, role, active } = req.body;
  db.prepare('UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?').run(
    name ?? user.name,
    role ?? user.role,
    active === undefined ? user.active : active ? 1 : 0,
    req.params.id
  );
  logActivity(req.user.name, 'Ubah akun pengguna', user.email);
  res.json({ user: db.prepare('SELECT id, name, email, role, active FROM users WHERE id = ?').get(req.params.id) });
});

router.post('/users/:id/reset-password', requireAuth, requireRole('Admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Kata sandi baru minimal enam karakter.' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 8), req.params.id);
  logActivity(req.user.name, 'Atur ulang kata sandi', user.email);
  res.json({ ok: true });
});

router.get('/lists', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const lists = {};
  for (const r of rows) lists[r.key] = JSON.parse(r.value);
  res.json({ lists, categories: CATEGORIES });
});

router.put('/lists/:key', requireAuth, requireRole('Admin'), (req, res) => {
  const allowedKeys = ['sessions', 'dormitories', 'buildings', 'class_groups', 'academic_years'];
  if (!allowedKeys.includes(req.params.key)) return res.status(400).json({ error: 'Daftar pilihan tidak dikenali.' });
  const { values } = req.body;
  if (!Array.isArray(values)) return res.status(400).json({ error: 'Nilai daftar harus berupa larik.' });
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
    req.params.key,
    JSON.stringify(values)
  );
  logActivity(req.user.name, 'Ubah daftar pilihan', req.params.key);
  res.json({ key: req.params.key, values });
});

router.get('/activity-log', requireAuth, requireRole('Admin'), (req, res) => {
  const logs = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 200').all();
  res.json({ logs });
});

export default router;

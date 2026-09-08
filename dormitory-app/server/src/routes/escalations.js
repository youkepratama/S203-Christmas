import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { logActivity } from '../utils/log.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const { status_tindak_lanjut, nis } = req.query;
  let sql = `SELECT e.*, s.nama_siswa, s.class_group, s.dormitory FROM escalations e JOIN students s ON s.nis = e.nis WHERE 1=1`;
  const params = [];
  if (status_tindak_lanjut) {
    sql += ' AND e.status_tindak_lanjut = ?';
    params.push(status_tindak_lanjut);
  }
  if (nis) {
    sql += ' AND e.nis = ?';
    params.push(nis);
  }
  sql += ' ORDER BY e.tanggal_kirim DESC';
  res.json({ escalations: db.prepare(sql).all(...params) });
});

router.get('/pending-count', requireAuth, (req, res) => {
  const count = db
    .prepare(`SELECT COUNT(*) AS c FROM escalations WHERE status_tindak_lanjut != 'Selesai'`)
    .get().c;
  res.json({ count });
});

router.post('/', requireAuth, requireRole('Admin', 'Supervisor', 'Dorm Parent'), (req, res) => {
  const { nis, tingkat_urgensi, catatan } = req.body;
  if (!nis || !tingkat_urgensi || !catatan) {
    return res.status(400).json({ error: 'Siswa, tingkat urgensi, dan catatan wajib diisi.' });
  }
  if (!['Ringan', 'Sedang', 'Berat'].includes(tingkat_urgensi)) {
    return res.status(400).json({ error: 'Tingkat urgensi tidak valid.' });
  }
  if (catatan.trim().length < 20) {
    return res.status(400).json({ error: 'Kotak catatan wajib diisi minimal dua puluh karakter.' });
  }
  const student = db.prepare('SELECT nis FROM students WHERE nis = ?').get(nis);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan.' });

  const info = db
    .prepare(`INSERT INTO escalations (nis, tingkat_urgensi, catatan, pengirim) VALUES (?, ?, ?, ?)`)
    .run(nis, tingkat_urgensi, catatan.trim(), req.user.name);
  logActivity(req.user.name, 'Report Student to School', `NIS ${nis} - urgensi ${tingkat_urgensi}`);
  // Admin notification: recorded as an activity log entry + surfaced via pending-count on Dashboard.
  // (Actual email delivery requires SMTP configuration - see Settings > Notifikasi.)
  res.status(201).json({ escalation: db.prepare('SELECT * FROM escalations WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/:id', requireAuth, requireRole('Admin', 'School Management'), (req, res) => {
  const escalation = db.prepare('SELECT * FROM escalations WHERE id = ?').get(req.params.id);
  if (!escalation) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  const { status_tindak_lanjut, catatan_tindak_lanjut } = req.body;
  if (!['Baru', 'Sedang Ditindaklanjuti', 'Selesai'].includes(status_tindak_lanjut)) {
    return res.status(400).json({ error: 'Status tindak lanjut tidak valid.' });
  }
  db.prepare('UPDATE escalations SET status_tindak_lanjut = ?, catatan_tindak_lanjut = ? WHERE id = ?').run(
    status_tindak_lanjut,
    catatan_tindak_lanjut || escalation.catatan_tindak_lanjut,
    req.params.id
  );
  logActivity(req.user.name, 'Perbarui status Report Student to School', `ID ${req.params.id} -> ${status_tindak_lanjut}`);
  res.json({ escalation: db.prepare('SELECT * FROM escalations WHERE id = ?').get(req.params.id) });
});

export default router;

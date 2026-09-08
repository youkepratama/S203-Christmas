import { Router } from 'express';
import dayjs from 'dayjs';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { CATEGORIES } from '../db.js';
import { logActivity } from '../utils/log.js';

const router = Router();

const TSP_SUBS = CATEGORIES.find((c) => c.kode === 'TSP').subKategori.map((s) => s.kode);

function validateReportInput(body) {
  const { nis, tanggal, sesi, kategori, sub_kategori, catatan } = body;
  if (!nis || !tanggal || !sesi || !kategori) return 'Siswa, tanggal, sesi, dan kategori wajib diisi.';
  if (!['SK', 'IZ', 'TSP'].includes(kategori)) return 'Kategori tidak valid.';
  if (kategori === 'TSP') {
    if (!sub_kategori || !TSP_SUBS.includes(sub_kategori)) return 'Sub-kategori wajib dipilih untuk Tidak Sesuai Prosedur.';
    if (!catatan || catatan.trim().length === 0) return 'Catatan wajib diisi untuk kategori Tidak Sesuai Prosedur.';
  }
  const student = db.prepare("SELECT nis FROM students WHERE nis = ? AND status = 'Aktif'").get(nis);
  if (!student) return 'Siswa tidak ditemukan atau tidak aktif.';
  return null;
}

router.get('/', requireAuth, (req, res) => {
  const { tanggal, from, to, sesi, nis, dormitory, specific_building, class_group, academic_advisor, kategori } = req.query;
  let sql = `
    SELECT r.*, s.nama_siswa, s.class_group, s.dormitory, s.specific_building, s.room, s.academic_advisor, s.supervisor
    FROM reports r JOIN students s ON s.nis = r.nis
    WHERE r.status != 'Dibatalkan'`;
  const params = [];
  if (tanggal) {
    sql += ' AND r.tanggal = ?';
    params.push(tanggal);
  }
  if (from && to) {
    sql += ' AND r.tanggal BETWEEN ? AND ?';
    params.push(from, to);
  }
  if (sesi) {
    sql += ' AND r.sesi = ?';
    params.push(sesi);
  }
  if (nis) {
    sql += ' AND r.nis = ?';
    params.push(nis);
  }
  if (dormitory) {
    sql += ' AND s.dormitory = ?';
    params.push(dormitory);
  }
  if (specific_building) {
    sql += ' AND s.specific_building = ?';
    params.push(specific_building);
  }
  if (class_group) {
    sql += ' AND s.class_group = ?';
    params.push(class_group);
  }
  if (academic_advisor) {
    sql += ' AND s.academic_advisor = ?';
    params.push(academic_advisor);
  }
  if (kategori) {
    sql += ' AND r.kategori = ?';
    params.push(kategori);
  }
  if (req.user.role === 'Supervisor') {
    sql += ' AND s.supervisor = ?';
    params.push(req.user.name);
  } else if (req.user.role === 'Dorm Parent') {
    sql += ' AND s.dorm_parents = ?';
    params.push(req.user.name);
  } else if (req.user.role === 'Academic Advisor') {
    sql += ' AND s.academic_advisor = ?';
    params.push(req.user.name);
  }
  sql += ' ORDER BY r.tanggal DESC, r.waktu_input DESC';
  res.json({ reports: db.prepare(sql).all(...params) });
});

router.get('/status-supervisor', requireAuth, (req, res) => {
  const tanggal = req.query.tanggal || dayjs().format('YYYY-MM-DD');
  const supervisors = db
    .prepare("SELECT DISTINCT supervisor FROM students WHERE status = 'Aktif' AND supervisor IS NOT NULL")
    .all()
    .map((r) => r.supervisor);
  const filled = new Set(
    db
      .prepare(
        `SELECT DISTINCT s.supervisor FROM reports r JOIN students s ON s.nis = r.nis
         WHERE r.tanggal = ? AND r.status != 'Dibatalkan'`
      )
      .all(tanggal)
      .map((r) => r.supervisor)
  );
  res.json({
    tanggal,
    status: supervisors.map((sup) => ({ supervisor: sup, sudah_mengisi: filled.has(sup) })),
  });
});

router.post('/', requireAuth, requireRole('Admin', 'Supervisor', 'Dorm Parent'), (req, res) => {
  const err = validateReportInput(req.body);
  if (err) return res.status(400).json({ error: err });
  const { nis, tanggal, sesi, kategori, sub_kategori, catatan } = req.body;
  const existing = db.prepare("SELECT id FROM reports WHERE nis=? AND tanggal=? AND sesi=? AND status!='Dibatalkan'").get(nis, tanggal, sesi);
  if (existing) {
    return res.status(409).json({ error: 'Siswa ini sudah memiliki laporan pada tanggal dan sesi yang sama.' });
  }
  const info = db
    .prepare(
      `INSERT INTO reports (nis, tanggal, sesi, kategori, sub_kategori, catatan, pelapor)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(nis, tanggal, sesi, kategori, kategori === 'TSP' ? sub_kategori : null, catatan || null, req.user.name);
  logActivity(req.user.name, 'Buat laporan kehadiran', `NIS ${nis} - ${tanggal} ${sesi}`);
  res.status(201).json({ report: db.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid) });
});

router.post('/bulk', requireAuth, requireRole('Admin', 'Supervisor', 'Dorm Parent'), (req, res) => {
  const { room, specific_building, tanggal, sesi, kategori, sub_kategori, catatan } = req.body;
  if (!room && !specific_building) {
    return res.status(400).json({ error: 'Pilih satu kamar atau satu gedung untuk pengisian massal.' });
  }
  let students;
  if (room) {
    students = db.prepare("SELECT nis FROM students WHERE room = ? AND status = 'Aktif'").all(room);
  } else {
    students = db.prepare("SELECT nis FROM students WHERE specific_building = ? AND status = 'Aktif'").all(specific_building);
  }
  const results = { created: 0, skipped: [] };
  for (const { nis } of students) {
    const validation = validateReportInput({ nis, tanggal, sesi, kategori, sub_kategori, catatan });
    if (validation) {
      results.skipped.push({ nis, reason: validation });
      continue;
    }
    const existing = db.prepare("SELECT id FROM reports WHERE nis=? AND tanggal=? AND sesi=? AND status!='Dibatalkan'").get(nis, tanggal, sesi);
    if (existing) {
      results.skipped.push({ nis, reason: 'Sudah ada laporan pada tanggal dan sesi ini.' });
      continue;
    }
    db.prepare(
      `INSERT INTO reports (nis, tanggal, sesi, kategori, sub_kategori, catatan, pelapor) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(nis, tanggal, sesi, kategori, kategori === 'TSP' ? sub_kategori : null, catatan || null, req.user.name);
    results.created += 1;
  }
  logActivity(req.user.name, 'Pengisian massal laporan', `${results.created} laporan dibuat`);
  res.json(results);
});

router.put('/:id', requireAuth, (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  const isOwner = report.pelapor === req.user.name;
  const withinWindow = dayjs().diff(dayjs(report.waktu_input), 'hour') < 24;
  if (req.user.role !== 'Admin' && !(isOwner && withinWindow)) {
    return res.status(403).json({ error: 'Laporan hanya dapat diubah oleh pembuatnya dalam 24 jam pertama.' });
  }
  const { kategori, sub_kategori, catatan } = req.body;
  const err = validateReportInput({ nis: report.nis, tanggal: report.tanggal, sesi: report.sesi, kategori, sub_kategori, catatan });
  if (err) return res.status(400).json({ error: err });
  db.prepare(
    `UPDATE reports SET kategori=?, sub_kategori=?, catatan=?, status='Direvisi' WHERE id=?`
  ).run(kategori, kategori === 'TSP' ? sub_kategori : null, catatan || null, req.params.id);
  logActivity(req.user.name, 'Ubah laporan kehadiran', `ID ${req.params.id}`);
  res.json({ report: db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id) });
});

router.delete('/:id', requireAuth, (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  const isOwner = report.pelapor === req.user.name;
  const withinWindow = dayjs().diff(dayjs(report.waktu_input), 'hour') < 24;
  if (req.user.role !== 'Admin' && !(isOwner && withinWindow)) {
    return res.status(403).json({ error: 'Laporan hanya dapat dibatalkan oleh pembuatnya dalam 24 jam pertama.' });
  }
  db.prepare("UPDATE reports SET status = 'Dibatalkan' WHERE id = ?").run(req.params.id);
  logActivity(req.user.name, 'Batalkan laporan kehadiran', `ID ${req.params.id}`);
  res.json({ ok: true });
});

export default router;

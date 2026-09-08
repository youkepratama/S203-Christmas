import { Router } from 'express';
import multer from 'multer';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { parseStudentWorkbook, buildStudentTemplate, STUDENT_TEMPLATE_COLUMNS } from '../utils/excel.js';
import { logActivity } from '../utils/log.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function studentReportCounts(nis) {
  const rows = db
    .prepare(
      `SELECT kategori, COUNT(*) AS total FROM reports
       WHERE nis = ? AND status != 'Dibatalkan' GROUP BY kategori`
    )
    .all(nis);
  const counts = { SK: 0, IZ: 0, TSP: 0 };
  for (const r of rows) counts[r.kategori] = r.total;
  return counts;
}

router.get('/', requireAuth, (req, res) => {
  const { q, dormitory, class_group, academic_advisor, specific_building } = req.query;
  let sql = "SELECT * FROM students WHERE status = 'Aktif'";
  const params = [];
  if (q) {
    sql += ' AND (nama_siswa LIKE ? OR nis LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (dormitory) {
    sql += ' AND dormitory = ?';
    params.push(dormitory);
  }
  if (class_group) {
    sql += ' AND class_group = ?';
    params.push(class_group);
  }
  if (academic_advisor) {
    sql += ' AND academic_advisor = ?';
    params.push(academic_advisor);
  }
  if (specific_building) {
    sql += ' AND specific_building = ?';
    params.push(specific_building);
  }
  // Non-admin/school-management roles are scoped to students in their care.
  if (req.user.role === 'Supervisor') {
    sql += ' AND supervisor = ?';
    params.push(req.user.name);
  } else if (req.user.role === 'Dorm Parent') {
    sql += ' AND dorm_parents = ?';
    params.push(req.user.name);
  } else if (req.user.role === 'Academic Advisor') {
    sql += ' AND academic_advisor = ?';
    params.push(req.user.name);
  }
  sql += ' ORDER BY nama_siswa ASC';
  const students = db.prepare(sql).all(...params);
  res.json({ students });
});

router.get('/template', requireAuth, requireRole('Admin'), asyncHandler(async (req, res) => {
  const buffer = await buildStudentTemplate();
  res.setHeader('Content-Disposition', 'attachment; filename="UPHC_Template_Import_Siswa.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}));

router.get('/:nis', requireAuth, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE nis = ?').get(req.params.nis);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
  const reports = db
    .prepare('SELECT * FROM reports WHERE nis = ? ORDER BY tanggal DESC, waktu_input DESC')
    .all(req.params.nis);
  const escalations = db
    .prepare('SELECT * FROM escalations WHERE nis = ? ORDER BY tanggal_kirim DESC')
    .all(req.params.nis);
  res.json({ student, reports, counts: studentReportCounts(req.params.nis), escalations });
});

router.post(
  '/import',
  requireAuth,
  requireRole('Admin'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Berkas Excel tidak ditemukan.' });
    let rows;
    try {
      rows = await parseStudentWorkbook(req.file.buffer);
    } catch (err) {
      return res.status(400).json({ error: 'Berkas tidak dapat dibaca. Pastikan format Excel (.xlsx) valid.' });
    }
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Berkas Excel kosong.' });
    }

    const accepted = [];
    const rejected = [];
    const seenNis = new Set();
    const existing = new Set(db.prepare('SELECT nis FROM students').all().map((r) => r.nis));

    rows.forEach((row, idx) => {
      const rowNo = idx + 2; // header is row 1
      const missing = STUDENT_TEMPLATE_COLUMNS.filter((c) => c !== 'nis' && !row[c]);
      if (!row.nis) {
        rejected.push({ row: rowNo, nis: row.nis, reason: 'Kolom nis kosong.' });
        return;
      }
      if (seenNis.has(row.nis)) {
        rejected.push({ row: rowNo, nis: row.nis, reason: 'Nis ganda pada berkas yang diunggah.' });
        return;
      }
      if (missing.length > 0) {
        rejected.push({ row: rowNo, nis: row.nis, reason: `Kolom wajib kosong: ${missing.join(', ')}.` });
        return;
      }
      seenNis.add(row.nis);
      accepted.push(row);
    });

    const upsert = db.prepare(`
      INSERT INTO students (nis, nama_siswa, gender, email_siswa, class_group, academic_advisor, academic_year,
        dormitory, specific_building, dorm_parents, room, bed, supervisor, updated_at)
      VALUES (@nis, @nama_siswa, @gender, @email_siswa, @class_group, @academic_advisor, @academic_year,
        @dormitory, @specific_building, @dorm_parents, @room, @bed, @supervisor, datetime('now'))
      ON CONFLICT(nis) DO UPDATE SET
        nama_siswa=excluded.nama_siswa, gender=excluded.gender, email_siswa=excluded.email_siswa,
        class_group=excluded.class_group, academic_advisor=excluded.academic_advisor, academic_year=excluded.academic_year,
        dormitory=excluded.dormitory, specific_building=excluded.specific_building, dorm_parents=excluded.dorm_parents,
        room=excluded.room, bed=excluded.bed, supervisor=excluded.supervisor, status='Aktif', updated_at=datetime('now')
    `);

    let createdCount = 0;
    let updatedCount = 0;
    const runAll = db.transaction((list) => {
      for (const row of list) {
        if (existing.has(row.nis)) updatedCount += 1;
        else createdCount += 1;
        upsert.run(row);
      }
    });
    runAll(accepted);

    logActivity(req.user.name, 'Impor data siswa', `${accepted.length} diterima, ${rejected.length} ditolak`);

    res.json({
      total: rows.length,
      created: createdCount,
      updated: updatedCount,
      rejectedCount: rejected.length,
      rejected,
    });
  })
);

router.put('/:nis', requireAuth, requireRole('Admin'), (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE nis = ?').get(req.params.nis);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
  const fields = STUDENT_TEMPLATE_COLUMNS.filter((c) => c !== 'nis');
  const updates = {};
  for (const f of fields) updates[f] = req.body[f] ?? student[f];
  db.prepare(
    `UPDATE students SET nama_siswa=@nama_siswa, gender=@gender, email_siswa=@email_siswa,
     class_group=@class_group, academic_advisor=@academic_advisor, academic_year=@academic_year,
     dormitory=@dormitory, specific_building=@specific_building, dorm_parents=@dorm_parents,
     room=@room, bed=@bed, supervisor=@supervisor, updated_at=datetime('now') WHERE nis=@nis`
  ).run({ ...updates, nis: req.params.nis });
  logActivity(req.user.name, 'Ubah data siswa', req.params.nis);
  res.json({ student: db.prepare('SELECT * FROM students WHERE nis = ?').get(req.params.nis) });
});

router.delete('/:nis', requireAuth, requireRole('Admin'), (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE nis = ?').get(req.params.nis);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
  db.prepare("UPDATE students SET status = 'Nonaktif', updated_at = datetime('now') WHERE nis = ?").run(req.params.nis);
  logActivity(req.user.name, 'Nonaktifkan siswa', req.params.nis);
  res.json({ ok: true });
});

export default router;

import { Router } from 'express';
import dayjs from 'dayjs';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

function studentFilterClause(query, alias = 's') {
  const clauses = [];
  const params = [];
  for (const [key, col] of [
    ['dormitory', `${alias}.dormitory`],
    ['specific_building', `${alias}.specific_building`],
    ['class_group', `${alias}.class_group`],
    ['academic_advisor', `${alias}.academic_advisor`],
  ]) {
    if (query[key]) {
      clauses.push(`${col} = ?`);
      params.push(query[key]);
    }
  }
  return { clause: clauses.length ? ` AND ${clauses.join(' AND ')}` : '', params };
}

router.get('/daily', requireAuth, (req, res) => {
  const tanggal = req.query.tanggal || dayjs().format('YYYY-MM-DD');
  const { clause: studentFilter, params: filterParams } = studentFilterClause(req.query);

  const activeStudents = db
    .prepare(`SELECT COUNT(*) AS c FROM students WHERE status = 'Aktif'${studentFilter}`)
    .get(...filterParams).c;
  const byCategory = db
    .prepare(
      `SELECT r.kategori, COUNT(*) AS total FROM reports r JOIN students s ON s.nis = r.nis
       WHERE r.tanggal = ? AND r.status != 'Dibatalkan'${studentFilter} GROUP BY r.kategori`
    )
    .all(tanggal, ...filterParams);
  const counts = { SK: 0, IZ: 0, TSP: 0 };
  for (const r of byCategory) counts[r.kategori] = r.total;
  const reportedCount = db
    .prepare(
      `SELECT COUNT(DISTINCT r.nis) AS c FROM reports r JOIN students s ON s.nis = r.nis
       WHERE r.tanggal = ? AND r.status != 'Dibatalkan'${studentFilter}`
    )
    .get(tanggal, ...filterParams).c;
  const hadir = Math.max(activeStudents - reportedCount, 0);

  const list = db
    .prepare(
      `SELECT r.id, r.tanggal, r.sesi, r.kategori, r.sub_kategori, r.catatan, r.pelapor, s.nama_siswa, s.nis
       FROM reports r JOIN students s ON s.nis = r.nis
       WHERE r.tanggal = ? AND r.status != 'Dibatalkan'${studentFilter} ORDER BY r.waktu_input DESC`
    )
    .all(tanggal, ...filterParams);

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
    summary: { hadir, sakit: counts.SK, izin: counts.IZ, tidak_sesuai_prosedur: counts.TSP },
    reportedList: list,
    supervisorStatus: supervisors.map((sup) => ({ supervisor: sup, sudah_mengisi: filled.has(sup) })),
  });
});

router.get('/weekly', requireAuth, (req, res) => {
  const end = req.query.end ? dayjs(req.query.end) : dayjs();
  const start = end.subtract(6, 'day');
  const rows = db
    .prepare(
      `SELECT tanggal, kategori, COUNT(*) AS total FROM reports
       WHERE tanggal BETWEEN ? AND ? AND status != 'Dibatalkan'
       GROUP BY tanggal, kategori`
    )
    .all(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = start.add(i, 'day').format('YYYY-MM-DD');
    days.push({ tanggal: d, SK: 0, IZ: 0, TSP: 0 });
  }
  for (const r of rows) {
    const day = days.find((d) => d.tanggal === r.tanggal);
    if (day) day[r.kategori] = r.total;
  }

  const topStudents = db
    .prepare(
      `SELECT s.nis, s.nama_siswa, COUNT(*) AS total FROM reports r JOIN students s ON s.nis = r.nis
       WHERE r.tanggal BETWEEN ? AND ? AND r.status != 'Dibatalkan'
       GROUP BY r.nis ORDER BY total DESC LIMIT 10`
    )
    .all(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));

  const byBuilding = db
    .prepare(
      `SELECT s.dormitory, s.specific_building, COUNT(*) AS total FROM reports r JOIN students s ON s.nis = r.nis
       WHERE r.tanggal BETWEEN ? AND ? AND r.status != 'Dibatalkan'
       GROUP BY s.dormitory, s.specific_building ORDER BY total DESC`
    )
    .all(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));

  res.json({ start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD'), days, topStudents, byBuilding });
});

router.get('/filters', requireAuth, (req, res) => {
  const distinct = (col) =>
    db
      .prepare(`SELECT DISTINCT ${col} AS v FROM students WHERE ${col} IS NOT NULL AND ${col} != '' ORDER BY ${col}`)
      .all()
      .map((r) => r.v);
  res.json({
    dormitory: distinct('dormitory'),
    specific_building: distinct('specific_building'),
    class_group: distinct('class_group'),
    academic_advisor: distinct('academic_advisor'),
    supervisor: distinct('supervisor'),
    room: distinct('room'),
  });
});

export default router;

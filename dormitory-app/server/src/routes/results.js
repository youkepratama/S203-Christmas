import { Router } from 'express';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { buildWorkbookFromSheets } from '../utils/excel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

dayjs.extend(isoWeek);

const router = Router();

function recapForRange(from, to, filters = {}) {
  let sql = `
    SELECT s.nis, s.nama_siswa, s.class_group, s.dormitory, s.specific_building, s.academic_advisor,
           r.kategori, r.sub_kategori
    FROM reports r JOIN students s ON s.nis = r.nis
    WHERE r.tanggal BETWEEN ? AND ? AND r.status != 'Dibatalkan'`;
  const params = [from, to];
  if (filters.dormitory) {
    sql += ' AND s.dormitory = ?';
    params.push(filters.dormitory);
  }
  if (filters.specific_building) {
    sql += ' AND s.specific_building = ?';
    params.push(filters.specific_building);
  }
  if (filters.class_group) {
    sql += ' AND s.class_group = ?';
    params.push(filters.class_group);
  }
  if (filters.academic_advisor) {
    sql += ' AND s.academic_advisor = ?';
    params.push(filters.academic_advisor);
  }
  if (filters.kategori) {
    sql += ' AND r.kategori = ?';
    params.push(filters.kategori);
  }
  const rows = db.prepare(sql).all(...params);

  const byStudent = new Map();
  for (const row of rows) {
    if (!byStudent.has(row.nis)) {
      byStudent.set(row.nis, {
        nis: row.nis,
        nama_siswa: row.nama_siswa,
        class_group: row.class_group,
        dormitory: row.dormitory,
        specific_building: row.specific_building,
        SK: 0,
        IZ: 0,
        TSP: 0,
        subKategori: {},
        total: 0,
      });
    }
    const entry = byStudent.get(row.nis);
    entry[row.kategori] += 1;
    entry.total += 1;
    if (row.sub_kategori) entry.subKategori[row.sub_kategori] = (entry.subKategori[row.sub_kategori] || 0) + 1;
  }
  const students = Array.from(byStudent.values()).sort((a, b) => b.total - a.total);
  const byBuildingMap = {};
  for (const s of students) {
    const key = `${s.dormitory} / ${s.specific_building}`;
    if (!byBuildingMap[key]) byBuildingMap[key] = { key, SK: 0, IZ: 0, TSP: 0, total: 0 };
    byBuildingMap[key].SK += s.SK;
    byBuildingMap[key].IZ += s.IZ;
    byBuildingMap[key].TSP += s.TSP;
    byBuildingMap[key].total += s.total;
  }
  return { rows, students, byBuilding: Object.values(byBuildingMap) };
}

router.get('/recap', requireAuth, (req, res) => {
  const { from, to, dormitory, specific_building, class_group, academic_advisor, kategori } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Rentang tanggal (from, to) wajib diisi.' });
  const { students, byBuilding } = recapForRange(from, to, { dormitory, specific_building, class_group, academic_advisor, kategori });
  res.json({ from, to, students, byBuilding });
});

router.get('/student/:nis', requireAuth, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Rentang tanggal (from, to) wajib diisi.' });
  const student = db.prepare('SELECT * FROM students WHERE nis = ?').get(req.params.nis);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
  const reports = db
    .prepare(
      `SELECT * FROM reports WHERE nis = ? AND tanggal BETWEEN ? AND ? AND status != 'Dibatalkan' ORDER BY tanggal DESC`
    )
    .all(req.params.nis, from, to);
  const counts = { SK: 0, IZ: 0, TSP: 0 };
  const subKategori = {};
  for (const r of reports) {
    counts[r.kategori] += 1;
    if (r.sub_kategori) subKategori[r.sub_kategori] = (subKategori[r.sub_kategori] || 0) + 1;
  }
  res.json({ student, counts, subKategori, reports });
});

router.get('/download/:period', requireAuth, asyncHandler(async (req, res) => {
  const { period } = req.params;
  const filters = {
    dormitory: req.query.dormitory,
    specific_building: req.query.specific_building,
    class_group: req.query.class_group,
    academic_advisor: req.query.academic_advisor,
    kategori: req.query.kategori,
  };

  let from, to, filename;
  const anchor = req.query.tanggal ? dayjs(req.query.tanggal) : dayjs();

  if (period === 'harian') {
    from = to = anchor.format('YYYY-MM-DD');
    filename = `UPHC_Dormitory_Report_Harian_${from}`;
  } else if (period === 'mingguan') {
    from = anchor.startOf('isoWeek').format('YYYY-MM-DD');
    to = anchor.endOf('isoWeek').format('YYYY-MM-DD');
    filename = `UPHC_Dormitory_Report_Mingguan_${anchor.isoWeekYear()}-W${String(anchor.isoWeek()).padStart(2, '0')}`;
  } else if (period === 'bulanan') {
    from = anchor.startOf('month').format('YYYY-MM-DD');
    to = anchor.endOf('month').format('YYYY-MM-DD');
    filename = `UPHC_Dormitory_Report_Bulanan_${anchor.format('YYYY-MM')}`;
  } else {
    return res.status(400).json({ error: 'Periode tidak valid. Gunakan harian, mingguan, atau bulanan.' });
  }

  let detailQuery = `SELECT r.tanggal, r.sesi, r.kategori, r.sub_kategori, r.catatan, r.pelapor,
      s.nama_siswa, s.nis, s.class_group, s.dormitory, s.specific_building, s.room
      FROM reports r JOIN students s ON s.nis = r.nis
      WHERE r.tanggal BETWEEN ? AND ? AND r.status != 'Dibatalkan'`;
  const params = [from, to];
  for (const [key, col] of [
    ['dormitory', 's.dormitory'],
    ['specific_building', 's.specific_building'],
    ['class_group', 's.class_group'],
    ['academic_advisor', 's.academic_advisor'],
    ['kategori', 'r.kategori'],
  ]) {
    if (filters[key]) {
      detailQuery += ` AND ${col} = ?`;
      params.push(filters[key]);
    }
  }
  detailQuery += ' ORDER BY r.tanggal ASC';
  const detail = db.prepare(detailQuery).all(...params);
  const detailSheetRows = detail.map((r) => ({
    Tanggal: r.tanggal,
    Sesi: r.sesi,
    'Nama Siswa': r.nama_siswa,
    NIS: r.nis,
    'Class Group': r.class_group,
    Dormitory: r.dormitory,
    'Specific Building': r.specific_building,
    Room: r.room,
    Kategori: r.kategori,
    'Sub-Kategori': r.sub_kategori || '',
    Catatan: r.catatan || '',
    Pelapor: r.pelapor,
  }));

  const { students, byBuilding } = recapForRange(from, to, filters);
  const recapSheetRows = students.map((s) => ({
    'Nama Siswa': s.nama_siswa,
    NIS: s.nis,
    'Class Group': s.class_group,
    Dormitory: s.dormitory,
    'Jumlah Sakit': s.SK,
    'Jumlah Izin': s.IZ,
    'Jumlah Tidak Sesuai Prosedur': s.TSP,
    'Total Laporan': s.total,
  }));

  const sheets = [{ name: 'Rincian Laporan', rows: detailSheetRows }];
  if (period === 'harian') {
    sheets.unshift({ name: 'Laporan Harian', rows: detailSheetRows });
  } else {
    sheets.push({ name: 'Rekap Per Siswa', rows: recapSheetRows });
  }
  if (period === 'bulanan') {
    const buildingRows = byBuilding.map((b) => ({
      Gedung: b.key,
      'Jumlah Sakit': b.SK,
      'Jumlah Izin': b.IZ,
      'Jumlah Tidak Sesuai Prosedur': b.TSP,
      Total: b.total,
    }));
    sheets.push({ name: 'Rekap Per Gedung', rows: buildingRows });
    const subRows = students
      .filter((s) => Object.keys(s.subKategori).length > 0)
      .map((s) => ({ 'Nama Siswa': s.nama_siswa, NIS: s.nis, ...s.subKategori }));
    sheets.push({ name: 'Rekap Per Sub-Kategori', rows: subRows });
  }

  const buffer = await buildWorkbookFromSheets(sheets);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}));

export default router;

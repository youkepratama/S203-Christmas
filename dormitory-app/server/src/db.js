import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'dormitory.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin','Supervisor','Dorm Parent','Academic Advisor','School Management')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  nis TEXT PRIMARY KEY,
  nama_siswa TEXT NOT NULL,
  gender TEXT,
  email_siswa TEXT,
  class_group TEXT,
  academic_advisor TEXT,
  academic_year TEXT,
  dormitory TEXT,
  specific_building TEXT,
  dorm_parents TEXT,
  room TEXT,
  bed TEXT,
  supervisor TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nis TEXT NOT NULL REFERENCES students(nis),
  tanggal TEXT NOT NULL,
  sesi TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('SK','IZ','TSP')),
  sub_kategori TEXT,
  catatan TEXT,
  pelapor TEXT NOT NULL,
  waktu_input TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif','Direvisi','Dibatalkan')),
  UNIQUE(nis, tanggal, sesi)
);

CREATE TABLE IF NOT EXISTS escalations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nis TEXT NOT NULL REFERENCES students(nis),
  tingkat_urgensi TEXT NOT NULL CHECK (tingkat_urgensi IN ('Ringan','Sedang','Berat')),
  catatan TEXT NOT NULL,
  pengirim TEXT NOT NULL,
  tanggal_kirim TEXT NOT NULL DEFAULT (datetime('now')),
  status_tindak_lanjut TEXT NOT NULL DEFAULT 'Baru' CHECK (status_tindak_lanjut IN ('Baru','Sedang Ditindaklanjuti','Selesai')),
  catatan_tindak_lanjut TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const insert = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    const seedUsers = [
      ['Admin Asrama', 'admin@uphcollege.sch.id', 'admin123', 'Admin'],
      ['Bapak Andre', 'andre.supervisor@uphcollege.sch.id', 'super123', 'Supervisor'],
      ['Ibu Sarah', 'sarah.dormparent@uphcollege.sch.id', 'dorm123', 'Dorm Parent'],
      ['Youke P. S. F. Dachi', 'youke.advisor@uphcollege.sch.id', 'advisor123', 'Academic Advisor'],
      ['Pimpinan Sekolah', 'school@uphcollege.sch.id', 'school123', 'School Management'],
    ];
    for (const [name, email, pw, role] of seedUsers) {
      insert.run(name, email, bcrypt.hashSync(pw, 8), role);
    }
  }

  const studentCount = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;
  if (studentCount === 0) {
    const insert = db.prepare(`INSERT INTO students
      (nis, nama_siswa, gender, email_siswa, class_group, academic_advisor, academic_year,
       dormitory, specific_building, dorm_parents, room, bed, supervisor)
      VALUES (@nis, @nama_siswa, @gender, @email_siswa, @class_group, @academic_advisor, @academic_year,
       @dormitory, @specific_building, @dorm_parents, @room, @bed, @supervisor)`);
    const sample = [
      { nis: '2024001', nama_siswa: 'Angelina Wijaya', gender: 'Perempuan', email_siswa: 'angelina@student.uphcollege.sch.id', class_group: '11-B', academic_advisor: 'Youke P. S. F. Dachi', academic_year: '2026/2027', dormitory: 'Dormitory Putri', specific_building: 'Building B', dorm_parents: 'Ibu Sarah', room: 'B-201', bed: 'Bed 2', supervisor: 'Bapak Andre' },
      { nis: '2024002', nama_siswa: 'Kevin Tanoto', gender: 'Laki-laki', email_siswa: 'kevin@student.uphcollege.sch.id', class_group: '10-A', academic_advisor: 'Youke P. S. F. Dachi', academic_year: '2026/2027', dormitory: 'Dormitory Putra', specific_building: 'Building A', dorm_parents: 'Bapak Rudi', room: 'A-101', bed: 'Bed 1', supervisor: 'Bapak Andre' },
      { nis: '2024003', nama_siswa: 'Michelle Halim', gender: 'Perempuan', email_siswa: 'michelle@student.uphcollege.sch.id', class_group: '12-C', academic_advisor: 'Rina Susanti', academic_year: '2026/2027', dormitory: 'Dormitory Putri', specific_building: 'Building B', dorm_parents: 'Ibu Sarah', room: 'B-202', bed: 'Bed 1', supervisor: 'Bapak Andre' },
    ];
    for (const s of sample) insert.run(s);
  }

  const settingDefaults = {
    sessions: JSON.stringify(['Pagi', 'Siang', 'Sore', 'Malam']),
    dormitories: JSON.stringify(['Dormitory Putra', 'Dormitory Putri']),
    buildings: JSON.stringify(['Building A', 'Building B']),
    class_groups: JSON.stringify(['10-A', '11-B', '12-C']),
    academic_years: JSON.stringify(['2025/2026', '2026/2027']),
  };
  const getSetting = db.prepare('SELECT key FROM settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(settingDefaults)) {
    if (!getSetting.get(key)) insertSetting.run(key, value);
  }
}

seedIfEmpty();

export const CATEGORIES = [
  { kode: 'SK', kategori: 'Sakit', label: 'Sakit (Sick)', color: '#2B746A' },
  { kode: 'IZ', kategori: 'Izin', label: 'Izin (Permitted absence)', color: '#BD8C00' },
  {
    kode: 'TSP',
    kategori: 'Tidak Sesuai Prosedur',
    label: 'Tidak Sesuai Prosedur (Procedural violation)',
    color: '#FFBF00',
    subKategori: [
      { kode: 'TSP-1', label: 'Terlambat bangun (Oversleeping)' },
      { kode: 'TSP-2', label: 'Indikasi malas (Indication of reluctance)' },
      { kode: 'TSP-3', label: 'Tidak pergi berobat (Not seeking treatment)' },
      { kode: 'TSP-4', label: 'Tidak izin academic advisor (No advisor permission)' },
    ],
  },
];

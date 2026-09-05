# UPH College Dormitory — Student Progress and Report

Aplikasi web pencatatan, pemantauan, dan pelaporan kehadiran serta perkembangan
siswa asrama UPH College, dibangun berdasarkan dokumen
`UPH_College_Dormitory_Spesifikasi_Data_dan_Fitur.docx` (Draf 1.0, 5 September 2026).

Proyek ini berdiri sendiri di dalam folder `dormitory-app/` dan tidak mengubah
aplikasi lain yang ada di repositori ini.

## Struktur

```
dormitory-app/
  server/   Express API + SQLite (better-sqlite3)
  client/   React + Vite + TypeScript + Tailwind CSS
```

## Menjalankan secara lokal

1. Backend (port 4000):
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Database SQLite dibuat otomatis di `server/data/dormitory.db` beserta akun
   dan data contoh (lihat bagian Akun Demo).

2. Frontend (port 5173, dengan proxy `/api` ke backend):
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Buka `http://localhost:5173`.

## Akun demo

| Peran | Email | Kata Sandi |
|---|---|---|
| Admin | admin@uphcollege.sch.id | admin123 |
| Supervisor | andre.supervisor@uphcollege.sch.id | super123 |
| Dorm Parent | sarah.dormparent@uphcollege.sch.id | dorm123 |
| Academic Advisor | youke.advisor@uphcollege.sch.id | advisor123 |
| School Management | school@uphcollege.sch.id | school123 |

Ganti kata sandi ini sebelum digunakan pada lingkungan produksi (menu
Settings > Akun Pengguna, khusus Admin).

## Fitur utama (sesuai dokumen spesifikasi)

- **Dashboard**: ringkasan harian (hadir/sakit/izin/tidak sesuai prosedur),
  status pengisian per supervisor, grafik tren mingguan, 10 siswa dengan
  laporan terbanyak, rekap per gedung, notifikasi laporan sekolah yang
  belum ditindaklanjuti, dan filter (tanggal, dormitory, gedung, class
  group, academic advisor).
- **Student Profile**: daftar siswa dengan pencarian & filter, halaman
  profil (Data Sekolah, Data Asrama, Riwayat Laporan Supervisor, tombol
  **Report Student to School**), dan **fitur impor data siswa dari berkas
  Excel** (khusus Admin) — lihat bagian di bawah.
- **Report**: pencatatan kehadiran per siswa atau pengisian massal per
  kamar/gedung, dengan validasi kategori/sub-kategori, satu laporan per
  siswa per tanggal+sesi, dan batas ubah 24 jam oleh pembuat laporan.
- **Result**: rekap per siswa dan per gedung, dengan unduhan Excel harian,
  mingguan, dan bulanan mengikuti pola nama berkas pada dokumen
  (`UPHC_Dormitory_Report_<Periode>_<Tanggal/Minggu/Bulan>.xlsx`).
- **Settings** (khusus Admin): manajemen akun pengguna, daftar pilihan
  (sesi, dormitory, gedung, class group, academic year), dan catatan
  aktivitas sistem.

### Fitur unggah Excel data siswa

Menu **Student Profile → Impor Data Siswa (Excel)** (Admin) menerima berkas
`.xlsx` dengan kolom persis seperti pada dokumen spesifikasi (Bagian V):

```
nama_siswa | gender | email_siswa | nis | class_group | academic_advisor |
academic_year | dormitory | specific_building | dorm_parents | room | bed | supervisor
```

- Tombol **Unduh Template Excel** menyediakan berkas contoh dengan kolom
  `nis` sudah diformat sebagai teks agar angka nol di depan tidak hilang.
- Baris dengan `nis` kosong atau ganda (baik ganda di dalam berkas maupun
  duplikat kolom wajib lain yang kosong) ditolak dan ditampilkan lengkap
  dengan nomor baris dan alasan penolakan.
- `nis` yang sudah ada akan diperbarui (upsert); `nis` baru akan ditambahkan
  sebagai siswa aktif.

## Peran dan hak akses

Diterapkan sebagai middleware role-based di backend (`requireRole`) dan
pembatasan tampilan di frontend, sesuai Bagian II dokumen: Admin (akses
penuh), Supervisor (laporan miliknya & siswa binaannya), Dorm Parent
(siswa di gedungnya), Academic Advisor (siswa perwaliannya, hanya lihat),
School Management (Dashboard, Result, tindak lanjut Report Student to
School).

## Catatan implementasi & keterbatasan

- Logo resmi UPH College (Bagian VIII) belum tersedia sebagai berkas aset;
  digunakan lambang placeholder dengan tema warna yang sama (hijau/emas)
  di `client/src/components/Logo.tsx` dan `client/public/favicon.svg`.
  Ganti dengan berkas PNG/SVG resmi saat tersedia.
- Notifikasi surat elektronik untuk Report Student to School (Bagian
  III.B) dicatat pada Catatan Aktivitas dan badge notifikasi Dashboard;
  pengiriman email sungguhan memerlukan konfigurasi SMTP yang belum
  disertakan (lihat Bagian X — butir konfirmasi pada dokumen).
- Sejumlah nilai pada Bagian X (Hal yang Perlu Dikonfirmasi) — nama sesi,
  daftar resmi dormitory/gedung/kamar/bed, ambang batas peringatan
  otomatis, akses siswa/orang tua, kebijakan retensi data, dan lampiran
  foto pada laporan sakit — diberi nilai default yang dapat diubah pada
  menu Settings > Daftar Pilihan, menunggu keputusan resmi.
- Pengujian dilakukan melalui pemeriksaan tipe (`tsc`), build produksi
  (`vite build`), dan pengujian API langsung (login, impor Excel, validasi
  laporan, unduhan Excel, kontrol akses per peran) di lingkungan CLI ini
  yang tidak memiliki browser interaktif untuk verifikasi visual.

export type Role = 'Admin' | 'Supervisor' | 'Dorm Parent' | 'Academic Advisor' | 'School Management';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active?: number;
}

export interface Student {
  nis: string;
  nama_siswa: string;
  gender: string;
  email_siswa: string;
  class_group: string;
  academic_advisor: string;
  academic_year: string;
  dormitory: string;
  specific_building: string;
  dorm_parents: string;
  room: string;
  bed: string;
  supervisor: string;
  status: string;
}

export type Kategori = 'SK' | 'IZ' | 'TSP';

export interface Report {
  id: number;
  nis: string;
  tanggal: string;
  sesi: string;
  kategori: Kategori;
  sub_kategori: string | null;
  catatan: string | null;
  pelapor: string;
  waktu_input: string;
  status: 'Aktif' | 'Direvisi' | 'Dibatalkan';
  nama_siswa?: string;
  class_group?: string;
  dormitory?: string;
  specific_building?: string;
  room?: string;
}

export type Urgensi = 'Ringan' | 'Sedang' | 'Berat';
export type StatusTindakLanjut = 'Baru' | 'Sedang Ditindaklanjuti' | 'Selesai';

export interface Escalation {
  id: number;
  nis: string;
  tingkat_urgensi: Urgensi;
  catatan: string;
  pengirim: string;
  tanggal_kirim: string;
  status_tindak_lanjut: StatusTindakLanjut;
  catatan_tindak_lanjut: string | null;
  nama_siswa?: string;
  class_group?: string;
  dormitory?: string;
}

export interface CategoryDef {
  kode: string;
  kategori: string;
  label: string;
  color: string;
  subKategori?: { kode: string; label: string }[];
}

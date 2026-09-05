import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, apiErrorMessage } from '../lib/api';
import { Student } from '../types';

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  rejectedCount: number;
  rejected: { row: number; nis: string; reason: string }[];
}

export default function StudentList() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState('');
  const [dormitory, setDormitory] = useState('');
  const [filters, setFilters] = useState<{ dormitory: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'Admin';

  async function loadStudents() {
    setLoading(true);
    try {
      const { data } = await api.get('/students', { params: { q: q || undefined, dormitory: dormitory || undefined } });
      setStudents(data.students);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/dashboard/filters').then(({ data }) => setFilters(data));
  }, []);

  useEffect(() => {
    const t = setTimeout(loadStudents, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, dormitory]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError('');
    setImportResult(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post<ImportResult>('/students/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(data);
      await loadStudents();
    } catch (err) {
      setImportError(apiErrorMessage(err, 'Gagal mengimpor berkas Excel.'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function downloadTemplate() {
    const { data } = await api.get('/students/template', { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UPHC_Template_Import_Siswa.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold text-uph-green">Student Profile</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-outline text-sm" onClick={downloadTemplate}>
              Unduh Template Excel
            </button>
            <label className="btn-primary text-sm cursor-pointer">
              {importing ? 'Mengunggah…' : 'Impor Data Siswa (Excel)'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                disabled={importing}
              />
            </label>
          </div>
        )}
      </div>

      {importError && <p className="card p-3 text-sm text-red-600 border-red-200">{importError}</p>}
      {importResult && (
        <div className="card p-4 text-sm space-y-2">
          <p>
            Total baris: <b>{importResult.total}</b> · Ditambahkan: <b>{importResult.created}</b> · Diperbarui:{' '}
            <b>{importResult.updated}</b> · Ditolak: <b className="text-red-600">{importResult.rejectedCount}</b>
          </p>
          {importResult.rejected.length > 0 && (
            <div className="overflow-x-auto max-h-48">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Baris</th>
                    <th>NIS</th>
                    <th>Alasan Ditolak</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.rejected.map((r, i) => (
                    <tr key={i}>
                      <td>{r.row}</td>
                      <td>{r.nis || '(kosong)'}</td>
                      <td>{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium block mb-1">Cari</label>
          <input
            className="input-field"
            placeholder="Nama siswa atau NIS"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Dormitory</label>
          <select className="input-field" value={dormitory} onChange={(e) => setDormitory(e.target.value)}>
            <option value="">Semua</option>
            {(filters?.dormitory ?? []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nama Siswa</th>
              <th>NIS</th>
              <th>Class Group</th>
              <th>Dormitory</th>
              <th>Room</th>
              <th>Supervisor</th>
            </tr>
          </thead>
          <tbody>
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  Tidak ada data siswa.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.nis}>
                <td>
                  <Link to={`/student-profile/${s.nis}`} className="text-uph-navy underline font-medium">
                    {s.nama_siswa}
                  </Link>
                </td>
                <td>{s.nis}</td>
                <td>{s.class_group}</td>
                <td>{s.dormitory}</td>
                <td>{s.room}</td>
                <td>{s.supervisor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

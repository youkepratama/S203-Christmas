import { FormEvent, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api, apiErrorMessage } from '../lib/api';
import { CategoryDef, Report, Student } from '../types';
import { CATEGORY_LABELS, categoryBadgeClass } from '../lib/categories';
import { useAuth } from '../context/AuthContext';

export default function ReportPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [nis, setNis] = useState('');
  const [room, setRoom] = useState('');
  const [specificBuilding, setSpecificBuilding] = useState('');
  const [tanggal, setTanggal] = useState(dayjs().format('YYYY-MM-DD'));
  const [sesi, setSesi] = useState('');
  const [kategori, setKategori] = useState('');
  const [subKategori, setSubKategori] = useState('');
  const [catatan, setCatatan] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bulkSkipped, setBulkSkipped] = useState<{ nis: string; reason: string }[]>([]);

  const selectedCategory = categories.find((c) => c.kode === kategori);
  const isTSP = kategori === 'TSP';

  async function loadReports() {
    const { data } = await api.get('/reports', { params: { tanggal } });
    setReports(data.reports);
  }

  useEffect(() => {
    api.get('/students').then(({ data }) => setStudents(data.students));
    api.get('/settings/lists').then(({ data }) => {
      setCategories(data.categories);
      setSessions(data.lists.sessions ?? []);
    });
    api.get('/dashboard/filters').then(({ data }) => {
      setRooms(data.room ?? []);
      setBuildings(data.specific_building ?? []);
    });
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal]);

  function resetForm() {
    setCatatan('');
    setKategori('');
    setSubKategori('');
  }

  async function submitSingle(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await api.post('/reports', { nis, tanggal, sesi, kategori, sub_kategori: subKategori || undefined, catatan });
      setMessage('Laporan berhasil disimpan.');
      resetForm();
      setNis('');
      await loadReports();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menyimpan laporan.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBulk(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBulkSkipped([]);
    setSubmitting(true);
    try {
      const { data } = await api.post('/reports/bulk', {
        room: room || undefined,
        specific_building: room ? undefined : specificBuilding || undefined,
        tanggal,
        sesi,
        kategori,
        sub_kategori: subKategori || undefined,
        catatan,
      });
      setMessage(`${data.created} laporan berhasil dibuat.`);
      setBulkSkipped(data.skipped);
      resetForm();
      await loadReports();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menyimpan laporan massal.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelReport(id: number) {
    if (!confirm('Batalkan laporan ini?')) return;
    try {
      await api.delete(`/reports/${id}`);
      await loadReports();
    } catch (err) {
      alert(apiErrorMessage(err, 'Gagal membatalkan laporan.'));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold text-uph-green">Report — Pencatatan Kehadiran</h1>

      <div className="flex gap-2">
        <button
          className={mode === 'single' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setMode('single')}
        >
          Satu Siswa
        </button>
        <button className={mode === 'bulk' ? 'btn-primary' : 'btn-outline'} onClick={() => setMode('bulk')}>
          Pengisian Massal (Kamar/Gedung)
        </button>
      </div>

      <form onSubmit={mode === 'single' ? submitSingle : submitBulk} className="card p-4 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          {mode === 'single' ? (
            <div>
              <label className="text-sm font-medium block mb-1">Siswa</label>
              <select className="input-field" value={nis} onChange={(e) => setNis(e.target.value)} required>
                <option value="">Pilih siswa</option>
                {students.map((s) => (
                  <option key={s.nis} value={s.nis}>
                    {s.nama_siswa} — {s.nis}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium block mb-1">Kamar</label>
                <select className="input-field" value={room} onChange={(e) => { setRoom(e.target.value); setSpecificBuilding(''); }}>
                  <option value="">Pilih kamar</option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">atau Gedung</label>
                <select
                  className="input-field"
                  value={specificBuilding}
                  onChange={(e) => { setSpecificBuilding(e.target.value); setRoom(''); }}
                >
                  <option value="">Pilih gedung</option>
                  {buildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium block mb-1">Tanggal</label>
            <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Sesi</label>
            <select className="input-field" value={sesi} onChange={(e) => setSesi(e.target.value)} required>
              <option value="">Pilih sesi</option>
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Kategori</label>
            <select
              className="input-field"
              value={kategori}
              onChange={(e) => { setKategori(e.target.value); setSubKategori(''); }}
              required
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.kode} value={c.kode}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {isTSP && (
            <div>
              <label className="text-sm font-medium block mb-1">Sub-Kategori</label>
              <select className="input-field" value={subKategori} onChange={(e) => setSubKategori(e.target.value)} required>
                <option value="">Pilih sub-kategori</option>
                {selectedCategory?.subKategori?.map((s) => (
                  <option key={s.kode} value={s.kode}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">
            Catatan {isTSP && <span className="text-red-500">(wajib)</span>}
          </label>
          <textarea className="input-field" rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} required={isTSP} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-uph-green text-sm">{message}</p>}
        {bulkSkipped.length > 0 && (
          <div className="text-xs text-uph-gold">
            Dilewati: {bulkSkipped.map((s) => `${s.nis} (${s.reason})`).join('; ')}
          </div>
        )}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Menyimpan…' : 'Simpan Laporan'}
        </button>
      </form>

      <section className="card p-4">
        <h3 className="font-heading font-semibold text-uph-green mb-2">Laporan pada {tanggal}</h3>
        <div className="overflow-x-auto max-h-96">
          <table className="table-base">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>NIS</th>
                <th>Sesi</th>
                <th>Kategori</th>
                <th>Catatan</th>
                <th>Pelapor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-400">
                    Belum ada laporan.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.nama_siswa}</td>
                  <td>{r.nis}</td>
                  <td>{r.sesi}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-xs" style={categoryBadgeClass(r.kategori)}>
                      {CATEGORY_LABELS[r.kategori] ?? r.kategori}
                    </span>
                  </td>
                  <td className="max-w-xs truncate" title={r.catatan ?? ''}>
                    {r.catatan ?? '-'}
                  </td>
                  <td>{r.pelapor}</td>
                  <td>
                    {(user?.role === 'Admin' || user?.name === r.pelapor) && (
                      <button onClick={() => cancelReport(r.id)} className="text-red-500 text-xs underline">
                        Batalkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

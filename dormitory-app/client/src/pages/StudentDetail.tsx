import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api';
import { Student, Report, Escalation, Urgensi } from '../types';
import { CATEGORY_LABELS, categoryBadgeClass } from '../lib/categories';
import { useAuth } from '../context/AuthContext';

interface DetailResponse {
  student: Student;
  reports: Report[];
  counts: { SK: number; IZ: number; TSP: number };
  escalations: Escalation[];
}

const STATUS_COLORS: Record<string, string> = {
  Baru: '#FFBF00',
  'Sedang Ditindaklanjuti': '#BD8C00',
  Selesai: '#00504C',
};

export default function StudentDetail() {
  const { nis } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState('');
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [urgensi, setUrgensi] = useState<Urgensi>('Ringan');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const canEscalate = user && ['Admin', 'Supervisor', 'Dorm Parent'].includes(user.role);

  async function load() {
    try {
      const { data } = await api.get<DetailResponse>(`/students/${nis}`);
      setData(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat profil siswa.'));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nis]);

  async function submitEscalation(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    if (catatan.trim().length < 20) {
      setSubmitError('Kotak catatan wajib diisi minimal dua puluh karakter.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/escalations', { nis, tingkat_urgensi: urgensi, catatan });
      setSubmitSuccess('Laporan Report Student to School berhasil dikirim ke admin dan pihak sekolah.');
      setCatatan('');
      setShowEscalationForm(false);
      await load();
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Gagal mengirim laporan.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <p className="card p-4 text-red-600">{error}</p>;
  if (!data) return <p>Memuat…</p>;

  const { student, reports, counts, escalations } = data;

  return (
    <div className="space-y-4">
      <Link to="/student-profile" className="text-sm text-uph-navy underline">
        ← Kembali ke Student Profile
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold text-uph-green">{student.nama_siswa}</h1>
        {canEscalate && (
          <button className="btn-amber" onClick={() => setShowEscalationForm((v) => !v)}>
            Report Student to School
          </button>
        )}
      </div>

      {submitSuccess && <p className="card p-3 text-sm text-uph-green border-uph-green-light">{submitSuccess}</p>}

      {showEscalationForm && (
        <form onSubmit={submitEscalation} className="card p-4 space-y-3">
          <h3 className="font-heading font-semibold text-uph-green">Kirim Report Student to School</h3>
          <div>
            <label className="text-sm font-medium block mb-1">Tingkat Urgensi</label>
            <select className="input-field" value={urgensi} onChange={(e) => setUrgensi(e.target.value as Urgensi)}>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Catatan (minimal 20 karakter)</label>
            <textarea
              className="input-field"
              rows={4}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">{catatan.trim().length} karakter</p>
          </div>
          {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Mengirim…' : 'Kirim Laporan'}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <section className="card p-4">
          <h3 className="font-heading font-semibold text-uph-green mb-2">Data Sekolah</h3>
          <dl className="text-sm grid grid-cols-2 gap-y-1">
            <dt className="text-gray-500">Nama Siswa</dt>
            <dd>{student.nama_siswa}</dd>
            <dt className="text-gray-500">Gender</dt>
            <dd>{student.gender}</dd>
            <dt className="text-gray-500">Email Siswa</dt>
            <dd>{student.email_siswa}</dd>
            <dt className="text-gray-500">NIS</dt>
            <dd>{student.nis}</dd>
            <dt className="text-gray-500">Class Group</dt>
            <dd>{student.class_group}</dd>
            <dt className="text-gray-500">Academic Advisor</dt>
            <dd>{student.academic_advisor}</dd>
            <dt className="text-gray-500">Academic Year</dt>
            <dd>{student.academic_year}</dd>
          </dl>
        </section>
        <section className="card p-4">
          <h3 className="font-heading font-semibold text-uph-green mb-2">Data Asrama</h3>
          <dl className="text-sm grid grid-cols-2 gap-y-1">
            <dt className="text-gray-500">Dormitory</dt>
            <dd>{student.dormitory}</dd>
            <dt className="text-gray-500">Specific Building</dt>
            <dd>{student.specific_building}</dd>
            <dt className="text-gray-500">Dorm Parents</dt>
            <dd>{student.dorm_parents}</dd>
            <dt className="text-gray-500">Room</dt>
            <dd>{student.room}</dd>
            <dt className="text-gray-500">Bed</dt>
            <dd>{student.bed}</dd>
            <dt className="text-gray-500">Supervisor</dt>
            <dd>{student.supervisor}</dd>
          </dl>
        </section>
      </div>

      <section className="card p-4">
        <h3 className="font-heading font-semibold text-uph-green mb-2">
          Riwayat Laporan Supervisor <span className="text-xs font-normal text-gray-400">(Sakit {counts.SK} · Izin {counts.IZ} · Tidak Sesuai Prosedur {counts.TSP})</span>
        </h3>
        <div className="overflow-x-auto max-h-80">
          <table className="table-base">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Sesi</th>
                <th>Kategori</th>
                <th>Sub-Kategori</th>
                <th>Catatan</th>
                <th>Pelapor</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">
                    Belum ada laporan.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.tanggal}</td>
                  <td>{r.sesi}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-xs" style={categoryBadgeClass(r.kategori)}>
                      {CATEGORY_LABELS[r.kategori] ?? r.kategori}
                    </span>
                  </td>
                  <td>{r.sub_kategori ?? '-'}</td>
                  <td className="max-w-xs truncate" title={r.catatan ?? ''}>
                    {r.catatan ?? '-'}
                  </td>
                  <td>{r.pelapor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {escalations.length > 0 && (
        <section className="card p-4">
          <h3 className="font-heading font-semibold text-uph-green mb-2">Riwayat Report Student to School</h3>
          <ul className="space-y-2 text-sm">
            {escalations.map((e) => (
              <li key={e.id} className="border-b border-uph-green-pale pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{e.tingkat_urgensi} — {e.pengirim}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs text-white"
                    style={{ backgroundColor: STATUS_COLORS[e.status_tindak_lanjut] }}
                  >
                    {e.status_tindak_lanjut}
                  </span>
                </div>
                <p className="text-gray-600">{e.catatan}</p>
                {e.catatan_tindak_lanjut && (
                  <p className="text-gray-500 italic mt-1">Tindak lanjut: {e.catatan_tindak_lanjut}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

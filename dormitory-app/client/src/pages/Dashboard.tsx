import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import { CATEGORY_LABELS, categoryBadgeClass } from '../lib/categories';

interface DailyData {
  tanggal: string;
  summary: { hadir: number; sakit: number; izin: number; tidak_sesuai_prosedur: number };
  reportedList: {
    id: number;
    nama_siswa: string;
    nis: string;
    sesi: string;
    kategori: string;
    pelapor: string;
  }[];
  supervisorStatus: { supervisor: string; sudah_mengisi: boolean }[];
}

interface WeeklyData {
  start: string;
  end: string;
  days: { tanggal: string; SK: number; IZ: number; TSP: number }[];
  topStudents: { nis: string; nama_siswa: string; total: number }[];
  byBuilding: { dormitory: string; specific_building: string; total: number }[];
}

interface Filters {
  dormitory: string[];
  specific_building: string[];
  class_group: string[];
  academic_advisor: string[];
}

export default function Dashboard() {
  const [tanggal, setTanggal] = useState(dayjs().format('YYYY-MM-DD'));
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [pendingEscalations, setPendingEscalations] = useState(0);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [filterSelection, setFilterSelection] = useState({
    dormitory: '',
    specific_building: '',
    class_group: '',
    academic_advisor: '',
  });

  useEffect(() => {
    api.get('/dashboard/filters').then(({ data }) => setFilters(data));
    api.get('/escalations/pending-count').then(({ data }) => setPendingEscalations(data.count));
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filterSelection).filter(([, v]) => v));
    api.get('/dashboard/daily', { params: { tanggal, ...params } }).then(({ data }) => setDaily(data));
  }, [tanggal, filterSelection]);

  useEffect(() => {
    api.get('/dashboard/weekly', { params: { end: tanggal } }).then(({ data }) => setWeekly(data));
  }, [tanggal]);

  const filteredReported = daily?.reportedList ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold text-uph-green">Dashboard</h1>
        {pendingEscalations > 0 && (
          <Link
            to="/student-profile"
            className="bg-uph-amber text-uph-navy text-sm font-semibold rounded-card px-4 py-2 shadow-sm"
          >
            🔔 {pendingEscalations} laporan Report Student to School belum ditindaklanjuti
          </Link>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium block mb-1">Tanggal</label>
          <input
            type="date"
            className="input-field"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </div>
        {filters &&
          (['dormitory', 'specific_building', 'class_group', 'academic_advisor'] as const).map((key) => (
            <div key={key}>
              <label className="text-xs font-medium block mb-1 capitalize">{key.replace('_', ' ')}</label>
              <select
                className="input-field"
                value={filterSelection[key]}
                onChange={(e) => setFilterSelection((f) => ({ ...f, [key]: e.target.value }))}
              >
                <option value="">Semua</option>
                {filters[key].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          ))}
      </div>

      <section>
        <h2 className="font-heading font-semibold text-uph-green mb-2">Daily Record — {tanggal}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Hadir" value={daily?.summary.hadir ?? 0} color="#00504C" />
          <SummaryCard label="Sakit" value={daily?.summary.sakit ?? 0} color="#2B746A" />
          <SummaryCard label="Izin" value={daily?.summary.izin ?? 0} color="#BD8C00" />
          <SummaryCard label="Tidak Sesuai Prosedur" value={daily?.summary.tidak_sesuai_prosedur ?? 0} color="#FFBF00" dark />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="card p-4">
          <h3 className="font-heading font-semibold text-uph-green mb-2">Siswa Dilaporkan Hari Ini</h3>
          <div className="overflow-x-auto max-h-72">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIS</th>
                  <th>Sesi</th>
                  <th>Kategori</th>
                  <th>Pelapor</th>
                </tr>
              </thead>
              <tbody>
                {filteredReported.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-400">
                      Belum ada laporan pada tanggal ini.
                    </td>
                  </tr>
                )}
                {filteredReported.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nama_siswa}</td>
                    <td>{r.nis}</td>
                    <td>{r.sesi}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs" style={categoryBadgeClass(r.kategori)}>
                        {CATEGORY_LABELS[r.kategori] ?? r.kategori}
                      </span>
                    </td>
                    <td>{r.pelapor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-4">
          <h3 className="font-heading font-semibold text-uph-green mb-2">Status Pengisian Supervisor</h3>
          <ul className="space-y-1 max-h-72 overflow-y-auto text-sm">
            {(daily?.supervisorStatus ?? []).map((s) => (
              <li key={s.supervisor} className="flex justify-between border-b border-uph-green-pale py-1">
                <span>{s.supervisor}</span>
                <span className={s.sudah_mengisi ? 'text-uph-green font-semibold' : 'text-uph-gold font-semibold'}>
                  {s.sudah_mengisi ? 'Sudah mengisi' : 'Belum mengisi'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-4">
        <h3 className="font-heading font-semibold text-uph-green mb-2">
          Weekly Record — {weekly?.start} s.d. {weekly?.end}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly?.days ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAF3F0" />
              <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="SK" name="Sakit" stroke="#2B746A" strokeWidth={2} />
              <Line type="monotone" dataKey="IZ" name="Izin" stroke="#BD8C00" strokeWidth={2} />
              <Line type="monotone" dataKey="TSP" name="Tidak Sesuai Prosedur" stroke="#FFBF00" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="card p-4">
          <h3 className="font-heading font-semibold text-uph-green mb-2">10 Siswa Terbanyak Dilaporkan (Minggu Ini)</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {(weekly?.topStudents ?? []).map((s) => (
              <li key={s.nis} className="flex justify-between">
                <span>{s.nama_siswa}</span>
                <span className="font-semibold">{s.total}</span>
              </li>
            ))}
            {weekly && weekly.topStudents.length === 0 && <p className="text-gray-400">Belum ada data.</p>}
          </ol>
        </section>
        <section className="card p-4">
          <h3 className="font-heading font-semibold text-uph-green mb-2">Rekap per Gedung & Dormitory</h3>
          <ul className="text-sm space-y-1">
            {(weekly?.byBuilding ?? []).map((b) => (
              <li key={`${b.dormitory}-${b.specific_building}`} className="flex justify-between">
                <span>
                  {b.dormitory} / {b.specific_building}
                </span>
                <span className="font-semibold">{b.total}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, dark }: { label: string; value: number; color: string; dark?: boolean }) {
  return (
    <div className="card p-4" style={{ borderTop: `4px solid ${color}` }}>
      <p className="text-xs text-uph-grey">{label}</p>
      <p className="text-2xl font-bold" style={{ color: dark ? '#333333' : color }}>
        {value}
      </p>
    </div>
  );
}

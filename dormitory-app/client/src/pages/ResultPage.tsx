import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../lib/api';

interface StudentRecap {
  nis: string;
  nama_siswa: string;
  class_group: string;
  dormitory: string;
  SK: number;
  IZ: number;
  TSP: number;
  total: number;
}

interface Filters {
  dormitory: string[];
  specific_building: string[];
  class_group: string[];
  academic_advisor: string[];
}

export default function ResultPage() {
  const [from, setFrom] = useState(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [filters, setFilters] = useState<Filters | null>(null);
  const [selection, setSelection] = useState({
    dormitory: '',
    specific_building: '',
    class_group: '',
    academic_advisor: '',
    kategori: '',
  });
  const [students, setStudents] = useState<StudentRecap[]>([]);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    api.get('/dashboard/filters').then(({ data }) => setFilters(data));
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(selection).filter(([, v]) => v));
    api.get('/results/recap', { params: { from, to, ...params } }).then(({ data }) => setStudents(data.students));
  }, [from, to, selection]);

  async function download(period: 'harian' | 'mingguan' | 'bulanan') {
    setDownloading(period);
    try {
      const params = Object.fromEntries(Object.entries(selection).filter(([, v]) => v));
      const { data, headers } = await api.get(`/results/download/${period}`, {
        params: { tanggal: to, ...params },
        responseType: 'blob',
      });
      const disposition = headers['content-disposition'] as string | undefined;
      const match = disposition?.match(/filename="(.+)"/);
      const filename = match?.[1] ?? `UPHC_Dormitory_Report_${period}.xlsx`;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading('');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold text-uph-green">Result — Rekapitulasi Laporan</h1>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium block mb-1">Dari Tanggal</label>
          <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Sampai Tanggal</label>
          <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {filters &&
          (['dormitory', 'specific_building', 'class_group', 'academic_advisor'] as const).map((key) => (
            <div key={key}>
              <label className="text-xs font-medium block mb-1 capitalize">{key.replace('_', ' ')}</label>
              <select
                className="input-field"
                value={selection[key]}
                onChange={(e) => setSelection((s) => ({ ...s, [key]: e.target.value }))}
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
        <div>
          <label className="text-xs font-medium block mb-1">Kategori</label>
          <select
            className="input-field"
            value={selection.kategori}
            onChange={(e) => setSelection((s) => ({ ...s, kategori: e.target.value }))}
          >
            <option value="">Semua</option>
            <option value="SK">Sakit</option>
            <option value="IZ">Izin</option>
            <option value="TSP">Tidak Sesuai Prosedur</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={!!downloading} onClick={() => download('harian')}>
          {downloading === 'harian' ? 'Menyiapkan…' : 'Unduh Excel Harian'}
        </button>
        <button className="btn-primary" disabled={!!downloading} onClick={() => download('mingguan')}>
          {downloading === 'mingguan' ? 'Menyiapkan…' : 'Unduh Excel Mingguan'}
        </button>
        <button className="btn-primary" disabled={!!downloading} onClick={() => download('bulanan')}>
          {downloading === 'bulanan' ? 'Menyiapkan…' : 'Unduh Excel Bulanan'}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nama Siswa</th>
              <th>NIS</th>
              <th>Class Group</th>
              <th>Dormitory</th>
              <th>Sakit</th>
              <th>Izin</th>
              <th>Tidak Sesuai Prosedur</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">
                  Tidak ada laporan pada rentang ini.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.nis}>
                <td>{s.nama_siswa}</td>
                <td>{s.nis}</td>
                <td>{s.class_group}</td>
                <td>{s.dormitory}</td>
                <td>{s.SK}</td>
                <td>{s.IZ}</td>
                <td>{s.TSP}</td>
                <td className="font-semibold">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

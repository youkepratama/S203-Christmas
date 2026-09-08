import { FormEvent, useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../lib/api';
import { Role, User } from '../types';

type Tab = 'users' | 'lists' | 'log';

const ROLES: Role[] = ['Admin', 'Supervisor', 'Dorm Parent', 'Academic Advisor', 'School Management'];
const LIST_KEYS = ['sessions', 'dormitories', 'buildings', 'class_groups', 'academic_years'] as const;
const LIST_LABELS: Record<(typeof LIST_KEYS)[number], string> = {
  sessions: 'Sesi Harian',
  dormitories: 'Dormitory',
  buildings: 'Specific Building',
  class_groups: 'Class Group',
  academic_years: 'Academic Year',
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('users');

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold text-uph-green">Settings</h1>
      <div className="flex gap-2">
        {(
          [
            ['users', 'Akun Pengguna'],
            ['lists', 'Daftar Pilihan'],
            ['log', 'Catatan Aktivitas'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button key={key} className={tab === key ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'lists' && <ListsTab />}
      {tab === 'log' && <LogTab />}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Supervisor');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data } = await api.get('/settings/users');
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function addUser(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/settings/users', { name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menambah akun.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(u: User) {
    await api.put(`/settings/users/${u.id}`, { active: u.active ? 0 : 1 });
    await load();
  }

  async function resetPassword(u: User) {
    const password = prompt(`Kata sandi baru untuk ${u.name} (minimal 6 karakter):`);
    if (!password) return;
    try {
      await api.post(`/settings/users/${u.id}/reset-password`, { password });
      alert('Kata sandi berhasil diperbarui.');
    } catch (err) {
      alert(apiErrorMessage(err, 'Gagal mengatur ulang kata sandi.'));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addUser} className="card p-4 grid md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-xs font-medium block mb-1">Nama</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Email</label>
          <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Kata Sandi</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Peran</label>
          <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          Tambah Akun
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Peran</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.active ? 'Aktif' : 'Nonaktif'}</td>
                <td className="space-x-2">
                  <button className="text-uph-navy text-xs underline" onClick={() => toggleActive(u)}>
                    {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button className="text-uph-gold text-xs underline" onClick={() => resetPassword(u)}>
                    Atur Ulang Kata Sandi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListsTab() {
  const [lists, setLists] = useState<Record<string, string[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get('/settings/lists');
    setLists(data.lists);
    const d: Record<string, string> = {};
    for (const k of LIST_KEYS) d[k] = (data.lists[k] ?? []).join(', ');
    setDrafts(d);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(key: string) {
    const values = drafts[key]
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    await api.put(`/settings/lists/${key}`, { values });
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
    await load();
  }

  return (
    <div className="space-y-4">
      {LIST_KEYS.map((key) => (
        <div key={key} className="card p-4">
          <label className="text-sm font-medium block mb-1">{LIST_LABELS[key]} (pisahkan dengan koma)</label>
          <div className="flex gap-2">
            <input
              className="input-field"
              value={drafts[key] ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
            />
            <button className="btn-outline" onClick={() => save(key)}>
              Simpan
            </button>
          </div>
          {saved === key && <p className="text-uph-green text-xs mt-1">Tersimpan.</p>}
        </div>
      ))}
      <p className="text-xs text-gray-400">
        Manajemen data induk siswa (impor Excel, ubah, nonaktifkan) tersedia pada menu Student Profile.
      </p>
    </div>
  );
}

function LogTab() {
  const [logs, setLogs] = useState<{ id: number; actor: string; action: string; detail: string; created_at: string }[]>(
    []
  );

  useEffect(() => {
    api.get('/settings/activity-log').then(({ data }) => setLogs(data.logs));
  }, []);

  return (
    <div className="card overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Aktor</th>
            <th>Aktivitas</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-400">
                Belum ada catatan aktivitas.
              </td>
            </tr>
          )}
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.created_at}</td>
              <td>{l.actor}</td>
              <td>{l.action}</td>
              <td>{l.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

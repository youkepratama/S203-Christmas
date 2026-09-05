import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@uphcollege.sch.id', password: 'admin123' },
  { role: 'Supervisor', email: 'andre.supervisor@uphcollege.sch.id', password: 'super123' },
  { role: 'Dorm Parent', email: 'sarah.dormparent@uphcollege.sch.id', password: 'dorm123' },
  { role: 'Academic Advisor', email: 'youke.advisor@uphcollege.sch.id', password: 'advisor123' },
  { role: 'School Management', email: 'school@uphcollege.sch.id', password: 'school123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-uph-green-pale px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo className="h-16 w-16 mb-2" />
          <h1 className="font-heading font-bold text-uph-green text-lg text-center">UPH College Dormitory</h1>
          <p className="text-xs text-uph-grey text-center">Student Progress and Report</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              className="input-field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@uphcollege.sch.id"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Kata Sandi</label>
            <input
              type="password"
              required
              className="input-field mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>
        <details className="mt-6 text-xs text-uph-grey">
          <summary className="cursor-pointer text-uph-green-light font-medium">Akun demo untuk uji coba</summary>
          <ul className="mt-2 space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  className="underline text-uph-navy"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                  }}
                >
                  {a.role}
                </button>{' '}
                — {a.email} / {a.password}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

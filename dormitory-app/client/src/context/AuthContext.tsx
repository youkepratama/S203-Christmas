import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, apiErrorMessage } from '../lib/api';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('uph_user');
    const token = localStorage.getItem('uph_token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('uph_token', data.token);
      localStorage.setItem('uph_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Gagal masuk. Periksa email dan kata sandi.'));
    }
  }

  function logout() {
    localStorage.removeItem('uph_token');
    localStorage.removeItem('uph_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

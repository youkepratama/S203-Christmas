import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { api } from '../lib/api';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⌂', roles: null },
  { to: '/student-profile', label: 'Student Profile', icon: '\u{1F393}', roles: null },
  { to: '/report', label: 'Report', icon: '\u{1F4DD}', roles: ['Admin', 'Supervisor', 'Dorm Parent'] },
  { to: '/result', label: 'Result', icon: '\u{1F4CA}', roles: null },
  { to: '/settings', label: 'Settings', icon: '⚙', roles: ['Admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api
      .get('/escalations/pending-count')
      .then(({ data }) => setPendingCount(data.count))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="bg-uph-green text-white md:w-60 flex-shrink-0 flex md:flex-col">
        <NavLink to="/" className="flex items-center gap-2 px-4 py-4 border-b border-uph-green-light/40">
          <Logo className="h-8 w-8" />
          <div className="leading-tight">
            <p className="font-heading font-bold text-sm">UPH College</p>
            <p className="text-[11px] text-uph-green-pale">Dormitory Report</p>
          </div>
        </NavLink>
        <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role ?? '')).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                  isActive ? 'bg-uph-green-light font-semibold' : 'hover:bg-uph-green-light/60'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
              {item.to === '/student-profile' && pendingCount > 0 && (
                <span className="ml-auto bg-uph-amber text-uph-navy text-[10px] font-bold rounded-full px-2 py-0.5">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block px-4 py-4 border-t border-uph-green-light/40 text-xs">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-uph-green-pale">{user?.role}</p>
          <button onClick={() => { logout(); navigate('/login'); }} className="mt-2 underline text-uph-amber">
            Keluar
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex justify-between items-center bg-white px-4 py-2 border-b border-uph-green-pale">
          <span className="text-sm font-semibold text-uph-green">{user?.name} — {user?.role}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-xs text-uph-gold underline">
            Keluar
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-uph-green-pale/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

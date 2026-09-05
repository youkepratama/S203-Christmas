import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentDetail from './pages/StudentDetail';
import ReportPage from './pages/ReportPage';
import ResultPage from './pages/ResultPage';
import SettingsPage from './pages/SettingsPage';
import { RequireAuth, RequireRole } from './components/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/student-profile" element={<StudentList />} />
        <Route path="/student-profile/:nis" element={<StudentDetail />} />
        <Route
          path="/report"
          element={
            <RequireRole roles={['Admin', 'Supervisor', 'Dorm Parent']}>
              <ReportPage />
            </RequireRole>
          }
        />
        <Route path="/result" element={<ResultPage />} />
        <Route
          path="/settings"
          element={
            <RequireRole roles={['Admin']}>
              <SettingsPage />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}

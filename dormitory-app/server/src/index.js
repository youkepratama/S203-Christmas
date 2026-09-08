import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import reportRoutes from './routes/reports.js';
import escalationRoutes from './routes/escalations.js';
import dashboardRoutes from './routes/dashboard.js';
import resultRoutes from './routes/results.js';
import settingsRoutes from './routes/settings.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`UPH College Dormitory API berjalan di http://localhost:${PORT}`);
});

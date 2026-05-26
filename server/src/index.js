import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDialect } from './db/database.js';
import { verifyToken } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import workEntryRoutes from './routes/workEntryRoutes.js';
import advanceRoutes from './routes/advanceRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

const corsOrigins = CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'COREBUILD CONSTRUCTION Salary Management API is running',
    database: getDialect(),
  });
});

app.use('/api/auth', authRoutes);

app.use('/api', verifyToken);

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/work-entries', workEntryRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/payroll', payrollRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

async function start() {
  try {
    const dialect = await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (${dialect})`);
      if (corsOrigins.length) {
        console.log(`CORS allowed: ${corsOrigins.join(', ')}`);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

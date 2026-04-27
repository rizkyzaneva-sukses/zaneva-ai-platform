import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app: Express = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const prisma = new PrismaClient();

// Middleware
// Di production (monolith) CORS tidak diperlukan karena frontend & backend
// berjalan di origin yang sama. Di development, izinkan Vite dev server.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : allowedOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
import authRoutes from './routes/auth';
import brandRoutes from './routes/brands';
import contentRoutes from './routes/contents';
import taskRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import uploadRoutes from './routes/upload';
import analyticsRoutes from './routes/analytics';

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);

// -------------------------------------------------------
// Monolith: Serve static frontend (production build)
// Di production, frontend di-build ke ./frontend-dist dan
// Express menjadi satu-satunya server yang berjalan.
// Di development, frontend dijalankan terpisah via Vite.
// -------------------------------------------------------
const frontendDist = path.join(__dirname, '../frontend-dist');
if (fs.existsSync(frontendDist)) {
  // Serve aset statis (JS, CSS, images)
  app.use(express.static(frontendDist, { maxAge: '1d' }));
  // SPA fallback – semua non-API route kembalikan index.html
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`📦 Serving frontend from: ${frontendDist}`);
} else {
  // Dev mode: frontend berjalan di Vite dev server (port 5173)
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found', hint: 'Run frontend separately with: cd frontend && npm run dev' });
  });
  console.log('⚡ Dev mode: Frontend served by Vite on http://localhost:5173');
}

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Zaneva AI Platform Backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

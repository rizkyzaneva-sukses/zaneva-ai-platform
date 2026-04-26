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
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
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

// Serve static frontend (production)
const frontendDist = path.join(__dirname, '../frontend-dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback - semua non-API route serve index.html
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // 404 handler (dev mode)
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });
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

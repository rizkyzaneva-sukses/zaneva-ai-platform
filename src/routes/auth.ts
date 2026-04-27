import { Router, Request, Response } from 'express';
import { login, getMe, registerOwner } from '../controllers/auth.controller';
import { verifyAuth, requireRole } from '../middlewares/auth';
import { UserRole } from '../types';
import { prisma } from '../server';
import bcrypt from 'bcryptjs';

const router = Router();

router.post('/login', login);
router.get('/me', verifyAuth, getMe);

// Owner-only routes
router.post('/register', verifyAuth, requireRole('OWNER'), registerOwner);

// List semua user (OWNER only)
router.get('/users', verifyAuth, requireRole('OWNER'), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        brandAccess: {
          include: { brand: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Hapus user (OWNER only, tidak bisa hapus diri sendiri)
router.delete('/users/:id', verifyAuth, requireRole('OWNER'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// One-time setup: create first Owner account (only works if no users exist)
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return res.status(403).json({ error: 'Setup already done. Use /register with owner token.' });
    }
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, name required' });
    }
    const hashedPassword = bcrypt.hashSync(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash: hashedPassword, name, role: 'OWNER' },
    });
    res.status(201).json({ message: 'Owner account created!', email: user.email, role: user.role });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Setup failed' });
  }
});

export default router;

import { Router } from 'express';
import { login, getMe, registerOwner } from '../controllers/auth.controller';
import { verifyAuth, requireRole } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.post('/login', login);
router.get('/me', verifyAuth, getMe);

// Owner-only routes
router.post('/register', verifyAuth, requireRole('OWNER'), registerOwner);

export default router;

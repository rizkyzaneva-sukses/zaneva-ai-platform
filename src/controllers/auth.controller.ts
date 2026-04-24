import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { signToken } from '../utils/jwt';
import { LoginRequest, LoginResponse } from '../types';
import { AuthRequest } from '../middlewares/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        brandAccess: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get accessible brand IDs
    const brandIds = user.role === 'OWNER' 
      ? await prisma.brand.findMany({
          where: { createdById: user.id },
          select: { id: true }
        }).then(brands => brands.map(b => b.id))
      : user.brandAccess.map(access => access.brand.id);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      brandIds
    });

    const response: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const registerOwner = async (req: AuthRequest, res: Response) => {
  // Owner-only endpoint to create first owner or PIC users
  if (req.user!.role !== 'OWNER') {
    return res.status(403).json({ error: 'Owner only' });
  }

  try {
    const { email, password, name, role = 'PIC_BRAND' } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role
      }
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
};

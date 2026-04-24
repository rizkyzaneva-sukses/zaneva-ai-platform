import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth';

export const getAllBrands = async (req: AuthRequest, res: Response) => {
  try {
    const where = req.user!.role === 'OWNER' 
      ? { createdById: req.user!.id }
      : { id: { in: req.user!.brandIds } };

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: { select: { contents: true, tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

export const getBrand = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { contents: true, tasks: true, products: true, creators: true } }
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Check access
    if (req.user!.role !== 'OWNER' && !req.user!.brandIds.includes(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
};

export const createBrand = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, logoUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        description,
        logoUrl,
        createdById: req.user!.id
      }
    });

    res.status(201).json(brand);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Brand name already exists' });
    }
    res.status(500).json({ error: 'Failed to create brand' });
  }
};

export const updateBrand = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, logoUrl } = req.body;

    const brand = await prisma.brand.update({
      where: { id },
      data: { name, description, logoUrl }
    });

    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update brand' });
  }
};

export const deleteBrand = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.brand.delete({ where: { id } });
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
};

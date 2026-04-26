import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth';

// Helper: Convert BigInt fields to Number for JSON serialization
const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
};

export const getContents = async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, platform, page = '1', limit = '20', creatorRelation, sort = 'reach', sortDir = 'desc', startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (platform) where.platform = platform;
    
    // Date range filter
    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) where.publishedAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.publishedAt.lte = end;
      }
    }

    if (creatorRelation) {
      where.creators = {
        some: {
          relation: creatorRelation
        }
      };
    }

    // Filter by accessible brands
    if (req.user!.role !== 'OWNER') {
      where.brandId = { in: req.user!.brandIds };
    }

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true } },
          metrics: { orderBy: { metricDate: 'desc' }, take: 1 },
          _count: { select: { products: true, creators: true } }
        },
        orderBy: sort === 'publishedAt' ? { publishedAt: sortDir as any } : undefined,
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.content.count({ where })
    ]);

    // Apply manual sorting by metric if needed
    if (sort !== 'publishedAt') {
      contents.sort((a, b) => {
        const metricA = a.metrics[0];
        const metricB = b.metrics[0];
        if (!metricA && !metricB) return 0;
        if (!metricA) return 1;
        if (!metricB) return -1;
        
        const valA = Number((metricA as any)[sort as string] || 0);
        const valB = Number((metricB as any)[sort as string] || 0);
        
        return sortDir === 'desc' ? valB - valA : valA - valB;
      });
    }

    res.json(serializeBigInt({
      data: contents,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }));
  } catch (error) {
    console.error('Get contents error:', error);
    res.status(500).json({ error: 'Failed to fetch contents' });
  }
};

export const getContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        brand: true,
        metrics: { orderBy: { metricDate: 'desc' } },
        products: { include: { product: true } },
        creators: { include: { creator: true } },
        hashtags: { include: { hashtag: true } }
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.content.delete({ where: { id } });
    res.json({ message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete content' });
  }
};

export const getContentStats = async (req: AuthRequest, res: Response) => {
  try {
    const { brandId } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (req.user!.role !== 'OWNER') {
      where.brandId = { in: req.user!.brandIds };
    }

    const [totalContents, platforms, types] = await Promise.all([
      prisma.content.count({ where }),
      prisma.content.groupBy({
        by: ['platform'],
        where,
        _count: { id: true }
      }),
      prisma.content.groupBy({
        by: ['contentType'],
        where,
        _count: { id: true }
      })
    ]);

    res.json({
      totalContents,
      byPlatform: platforms.map(p => ({ platform: p.platform, count: p._count.id })),
      byType: types.map(t => ({ type: t.contentType, count: t._count.id }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content stats' });
  }
};

import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth';

export const getCreatorLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = (req as any).accessibleBrandId || req.query.brandId;
    if (!brandId) return res.status(400).json({ error: 'brandId required' });

    const creators = await prisma.creator.findMany({
      where: { brandId: String(brandId) },
      include: {
        contentCreators: {
          include: {
            content: {
              include: { metrics: true }
            }
          }
        }
      }
    });

    const leaderboard = creators.map(c => {
      let totalReach = 0n;
      let totalEngagement = 0n;
      let contentCount = c.contentCreators.length;

      c.contentCreators.forEach(cc => {
        const latestMetric = cc.content.metrics[cc.content.metrics.length - 1];
        if (latestMetric) {
          totalReach += latestMetric.reach || 0n;
          totalEngagement += (latestMetric.likes || 0n) + (latestMetric.comments || 0n) + (latestMetric.shares || 0n) + (latestMetric.saves || 0n);
        }
      });

      return {
        id: c.id,
        handle: c.handle,
        name: c.name,
        category: c.category,
        contentCount,
        totalReach: totalReach.toString(),
        totalEngagement: totalEngagement.toString(),
        avgEngagement: contentCount > 0 ? (Number(totalEngagement) / contentCount).toFixed(0) : 0
      };
    }).sort((a, b) => Number(b.totalReach) - Number(a.totalReach));

    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch creator leaderboard' });
  }
};

export const getProductPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = (req as any).accessibleBrandId || req.query.brandId;
    if (!brandId) return res.status(400).json({ error: 'brandId required' });

    const products = await prisma.product.findMany({
      where: { brandId: String(brandId) },
      include: {
        contentProducts: {
          include: {
            content: {
              include: { metrics: true }
            }
          }
        }
      }
    });

    const performance = products.map(p => {
      let totalReach = 0n;
      let totalViews = 0n;
      let contentCount = p.contentProducts.length;

      p.contentProducts.forEach(cp => {
        const latestMetric = cp.content.metrics[cp.content.metrics.length - 1];
        if (latestMetric) {
          totalReach += latestMetric.reach || 0n;
          totalViews += latestMetric.views || 0n;
        }
      });

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        contentCount,
        totalReach: totalReach.toString(),
        totalViews: totalViews.toString()
      };
    }).sort((a, b) => Number(b.totalViews) - Number(a.totalViews));

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product performance' });
  }
};

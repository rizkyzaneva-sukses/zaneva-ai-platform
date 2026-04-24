import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth';
import { AIService } from '../services/ai.service';

export const runAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, analysisType, contentIds, startDate, endDate, draftCaption, visualDesc, message } = req.body;

    if (!brandId || !analysisType) {
      return res.status(400).json({ error: 'brandId and analysisType are required' });
    }

    // Set brand context
    (req as any).accessibleBrandId = brandId;

    const result = await AIService.analyze(req, {
      analysisType,
      contentIds,
      startDate,
      endDate,
      draftCaption,
      visualDesc,
      message
    });

    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
};

export const getAnalyses = async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, analysisType } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (analysisType) where.analysisType = analysisType;

    if (req.user!.role !== 'OWNER') {
      where.brandId = { in: req.user!.brandIds };
    }

    const analyses = await prisma.aIAnalysis.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
};

export const getAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await prisma.aIAnalysis.findUnique({
      where: { id },
      include: {
        brand: true,
        user: { select: { id: true, name: true } },
        content: true,
        relatedTasks: true
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
};

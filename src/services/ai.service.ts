import { prisma } from '../server';
import { AIConfig } from '@prisma/client';
import { AIAnalysisInput, AIAnalysisOutput, AuthRequest } from '../types';
import { BaseAIProvider } from './ai/providers/base';
import { GeminiProvider } from './ai/providers/gemini';
import { OpenAIProvider } from './ai/providers/openai';
// import { BlackboxProvider } from './ai/providers/blackbox';

export class AIService {
  static async getActiveProvider(brandId: string): Promise<BaseAIProvider | null> {
    const config = await prisma.aIConfig.findFirst({
      where: {
        brandId,
        isActive: true
      }
    });

    if (!config) return null;

    switch (config.provider) {
      case 'GEMINI':
        return new GeminiProvider(config.apiKey, config.model);
      case 'OPENAI':
        return new OpenAIProvider(config.apiKey, config.model);
      // case 'BLACKBOX_AI':
      //   return new BlackboxProvider(config.apiKey, config.model);
      default:
        return null;
    }
  }

  static async analyze(
    req: AuthRequest, 
    input: AIAnalysisInput
  ): Promise<AIAnalysisOutput> {
    const brandId = (req as any).accessibleBrandId;
    const provider = await this.getActiveProvider(brandId);

    if (!provider) {
      throw new Error('No active AI provider configured for this brand');
    }

    // Save analysis record first
    const analysis = await prisma.aIAnalysis.create({
      data: {
        brandId,
        userId: req.user!.id,
        analysisType: input.analysisType,
        title: this.generateAnalysisTitle(input),
        inputPayload: input as any,
        providerUsed: provider.getProviderName(),
        modelUsed: provider.getModel()
      }
    });

    try {
      const result = await provider.generateStructured(
        this.buildAnalysisPrompt(input),
        {
          narrative: 'string',
          reasoning: 'string',
          actionableTasks: 'array'
        },
        { analysisId: analysis.id }
      );

      // Update analysis with result
      await prisma.aIAnalysis.update({
        where: { id: analysis.id },
        data: {
          outputPayload: result as any,
          summaryText: result.narrative
        }
      });

      return result as AIAnalysisOutput;
    } catch (error) {
      await prisma.aIAnalysis.update({
        where: { id: analysis.id },
        data: { summaryText: `Error: ${error}` }
      });
      throw error;
    }
  }

  private static generateAnalysisTitle(input: AIAnalysisInput): string {
    switch (input.analysisType) {
      case 'CONTENT_RANKING':
        return 'Analisis Performa Konten';
      case 'WEEKLY_REPORT':
        return 'Laporan Mingguan';
      case 'PRE_POST_PREDICTION':
        return 'Prediksi Viral Pre-Post';
      case 'CAPTION_OPTIMIZE':
        return 'Optimasi Caption';
      case 'HASHTAG_ANALYSIS':
        return 'Analisis Hashtag';
      default:
        return 'Analisis AI';
    }
  }

  private static buildAnalysisPrompt(input: AIAnalysisInput): string {
    // Specific prompt building based on analysis type
    const basePrompt = `Lakukan analisis mendalam untuk ${input.analysisType}...`;
    return basePrompt;
  }
}

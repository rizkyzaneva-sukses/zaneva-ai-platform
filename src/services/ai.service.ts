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

    if (config) {
      switch (config.provider) {
        case 'GEMINI':
          return new GeminiProvider(config.apiKey, config.model);
        case 'OPENAI':
          return new OpenAIProvider(config.apiKey, config.model);
      }
    }

    // Fallback to env variables if no config found
    if (process.env.GEMINI_API_KEY) {
      return new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    }
    if (process.env.OPENAI_API_KEY) {
      return new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o');
    }

    return null;
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
      let promptData = '';
      if (input.contentIds && input.contentIds.length > 0) {
        const contents = await prisma.content.findMany({
          where: { id: { in: input.contentIds }, brandId },
          include: { metrics: true }
        });
        promptData = JSON.stringify(contents, null, 2);
      }

      let result;
      if (input.analysisType === 'AI_CHAT') {
        const prompt = `User Message: ${input.message}\nContext Data: ${promptData}`;
        const rawResponse = await provider.generateText(prompt);
        result = {
          narrative: rawResponse,
          reasoning: 'AI Chat interaction',
          actionableTasks: []
        };
      } else {
        const prompt = this.buildAnalysisPrompt(input, promptData);
        result = await provider.generateStructured(
          prompt,
          {
            narrative: 'string',
            reasoning: 'string',
            actionableTasks: 'array'
          },
          { analysisId: analysis.id }
        );
      }

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

  private static buildAnalysisPrompt(input: AIAnalysisInput, dataContext: string = ''): string {
    let basePrompt = '';
    switch (input.analysisType) {
      case 'CONTENT_RANKING':
        basePrompt = `Analisis data performa konten berikut dan berikan insight (Kenapa konten tertentu sukses/gagal, tren apa yang terlihat). Data: ${dataContext}`;
        break;
      case 'PRE_POST_PREDICTION':
        basePrompt = `Berdasarkan draft caption berikut: "${input.draftCaption}" dan deskripsi visual: "${input.visualDesc}", berikan prediksi potensi viral (skor 1-100), alasan, dan 3 actionable tasks untuk memperbaikinya sebelum posting.`;
        break;
      case 'CAPTION_OPTIMIZE':
        basePrompt = `Optimasi draft caption berikut agar lebih menarik (hook yang lebih kuat, CTA yang jelas). Draft: "${input.draftCaption}". Berikan narasi alasan perubahan dan actionable tasks.`;
        break;
      case 'WEEKLY_REPORT':
        basePrompt = `Buatkan laporan naratif performa mingguan berdasarkan data berikut: ${dataContext}`;
        break;
      default:
        basePrompt = `Lakukan analisis mendalam untuk ${input.analysisType}... Data: ${dataContext}`;
    }
    
    return basePrompt + `\nOutput harus berupa JSON dengan struktur { narrative: string, reasoning: string, actionableTasks: string[] }`;
  }
}

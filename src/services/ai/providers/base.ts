import { AIProvider, AIAnalysisInput } from '../../../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract getProviderName(): string;
  abstract getModel(): string;

  async generateText(prompt: string, context?: any): Promise<string> {
    const fullPrompt = this.buildPrompt(prompt, context);
    return this._generateText(fullPrompt);
  }

  async generateStructured(prompt: string, schema: any, context?: any): Promise<any> {
    const fullPrompt = this.buildStructuredPrompt(prompt, schema, context);
    // For structured output, we'll use text generation and parse
    const response = await this._generateText(fullPrompt);
    return this.parseStructuredResponse(response, schema);
  }

  protected buildPrompt(prompt: string, context?: any): string {
    let fullPrompt = `Kamu adalah AI Content Intelligence Analyst untuk brand fashion hijab Zaneva.

Konteks Bisnis: Zaneva adalah brand fashion hijab aktif dengan produk seperti Catalina, Kyra, Davira, Mirae, Sandrine, Maiza, Narsha. Analisis konten Instagram Reels/Carousel dan TikTok.

Jawab dalam Bahasa Indonesia yang profesional dan actionable.

${prompt}`;

    if (context) {
      fullPrompt += `\n\nKonteks Data:\n${JSON.stringify(context, null, 2)}`;
    }

    fullPrompt += `\n\nOutput WAJIB berisi:
1. Insight narrative yang jelas
2. Data-driven reasoning (bandingkan dengan rata-rata historis)
3. Minimal 3 actionable tasks konkret dengan priority`;

    return fullPrompt;
  }

  protected buildStructuredPrompt(prompt: string, schema: any, context?: any): string {
    return this.buildPrompt(prompt, context) + `\n\nFormat JSON sesuai schema: ${JSON.stringify(schema, null, 2)}`;
  }

  protected parseStructuredResponse(response: string, schema: any): any {
    try {
      // Simple JSON extraction - improve with regex or libraries in production
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { error: 'Failed to parse structured response', raw: response };
    } catch {
      return { error: 'JSON parse failed', raw: response };
    }
  }

  protected abstract _generateText(prompt: string): Promise<string>;
}

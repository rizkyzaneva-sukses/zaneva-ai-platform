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

Jawab dalam Bahasa Indonesia yang profesional, ramah, dan sangat actionable. 
Tugas utama kamu adalah memberikan ADVICE, SUGGESTION, dan MASUKAN STRATEGI kepada tim, bukan sekadar mendeskripsikan data. Berikan ide konten baru, saran perbaikan caption, dan taktik marketing yang kreatif.

${prompt}`;

    if (context) {
      fullPrompt += `\n\nKonteks Data:\n${JSON.stringify(context, null, 2)}`;
    }

    fullPrompt += `\n\nOutput WAJIB berisi:
1. Insight narrative yang jelas (Apa yang terjadi dan mengapa?)
2. Data-driven reasoning & Advice (Saran perbaikan, ide kreatif, dan taktik ke depan)
3. Minimal 3 actionable tasks konkret dengan priority (Masukan konkrit untuk tim)`;

    return fullPrompt;
  }

  protected buildStructuredPrompt(prompt: string, schema: any, context?: any): string {
    return this.buildPrompt(prompt, context) + `

PENTING: Balas HANYA dengan raw JSON, tanpa penjelasan tambahan, tanpa markdown, tanpa \`\`\`json wrapper.
Format JSON yang diharapkan:
${JSON.stringify(schema, null, 2)}`;
  }

  protected parseStructuredResponse(response: string, schema: any): any {
    try {
      // 1. Coba strip markdown code block (```json ... ``` atau ``` ... ```)
      let cleaned = response.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      }

      // 2. Coba parse langsung
      try {
        return JSON.parse(cleaned);
      } catch {
        // 3. Fallback: cari blok JSON pertama dengan regex
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // 4. Jika semua gagal, kembalikan narrative mentah agar UI tetap bisa tampil
      return {
        narrative: response,
        reasoning: 'AI memberikan respons teks (tidak terstruktur).',
        actionableTasks: []
      };
    } catch {
      return {
        narrative: response || 'Terjadi kesalahan saat memproses respons AI.',
        reasoning: 'Gagal memparse JSON dari AI.',
        actionableTasks: []
      };
    }
  }

  protected abstract _generateText(prompt: string): Promise<string>;
}

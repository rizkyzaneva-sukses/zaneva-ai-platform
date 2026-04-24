import { BaseAIProvider } from './base';

export class OpenAIProvider extends BaseAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  getProviderName(): string {
    return 'OPENAI';
  }

  getModel(): string {
    return this.model;
  }

  protected async _generateText(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'Kamu adalah AI Content Intelligence Analyst.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

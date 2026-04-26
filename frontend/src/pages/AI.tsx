import React, { useState } from 'react';
import { aiAPI, brandsAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function AI() {
  const [analysisType, setAnalysisType] = useState('PRE_POST_PREDICTION');
  const [draftCaption, setDraftCaption] = useState('');
  const [visualDesc, setVisualDesc] = useState('');
  const [message, setMessage] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    brandsAPI.getAll().then((res) => {
      setBrands(res.data);
      if (res.data.length > 0) setBrandId(res.data[0].id);
    });
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await aiAPI.analyze({
        brandId,
        analysisType,
        draftCaption,
        visualDesc,
        message
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      alert('Analisis gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Analysis</h1>
        <p className="text-muted-foreground mt-2">Dapatkan insight dan rekomendasi dari Zaneva AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="glass-card p-6 border-border rounded-xl space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Pilih Brand</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Pilih Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Tipe Analisis</label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="PRE_POST_PREDICTION">Prediksi Viral (Draft Content)</option>
              <option value="CAPTION_OPTIMIZE">Optimasi Caption</option>
              <option value="AI_CHAT">AI Chat (Tanya Data)</option>
            </select>
          </div>

          {analysisType === 'PRE_POST_PREDICTION' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Draft Caption</label>
                <textarea
                  value={draftCaption}
                  onChange={(e) => setDraftCaption(e.target.value)}
                  className="w-full h-32 bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tulis draft caption di sini..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Deskripsi Visual (Video/Gambar)</label>
                <textarea
                  value={visualDesc}
                  onChange={(e) => setVisualDesc(e.target.value)}
                  className="w-full h-24 bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ceritakan visualnya, misal: Model memakai gamis Catalina merah di taman..."
                />
              </div>
            </>
          )}

          {analysisType === 'CAPTION_OPTIMIZE' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Draft Caption</label>
              <textarea
                value={draftCaption}
                onChange={(e) => setDraftCaption(e.target.value)}
                className="w-full h-40 bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tulis caption yang mau dioptimasi AI..."
              />
            </div>
          )}

          {analysisType === 'AI_CHAT' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Pesan</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-40 bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tanyakan apapun ke AI tentang konten Zaneva..."
              />
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !brandId}
            className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 rounded-lg text-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-foreground" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Minta AI Analisis'
            )}
          </button>
        </div>

        {/* Output */}
        <div className="glass-card p-6 border-border rounded-xl space-y-4 max-h-[800px] overflow-y-auto">
          <h2 className="text-xl font-bold text-foreground">Hasil AI</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-foreground/40 space-y-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <p>Belum ada analisis. Silakan jalankan AI.</p>
            </div>
          ) : (
            <div className="space-y-6 text-foreground/90">
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Insight Narrative</h3>
                <div className="p-4 bg-card rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                  {result.narrative}
                </div>
              </div>

              {result.reasoning && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Reasoning</h3>
                  <div className="p-4 bg-card rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                    {result.reasoning}
                  </div>
                </div>
              )}

              {result.actionableTasks && result.actionableTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Actionable Tasks</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {result.actionableTasks.map((task: string, i: number) => (
                      <li key={i} className="pl-2">{task}</li>
                    ))}
                  </ul>
                  <button className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-medium rounded hover:bg-blue-500/30 transition">
                    + Generate Kanban Tasks
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

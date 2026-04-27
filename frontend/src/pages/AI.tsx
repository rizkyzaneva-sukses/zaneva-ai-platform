import React, { useState } from 'react';
import { aiAPI, brandsAPI, tasksAPI } from '@/lib/api';
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

  const handleGenerateTasks = async () => {
    if (!result?.actionableTasks || result.actionableTasks.length === 0) return;
    
    try {
      setLoading(true);
      for (const taskDesc of result.actionableTasks) {
        await tasksAPI.create({
          brandId,
          title: 'AI Insight Action',
          description: taskDesc,
          priority: 'HIGH'
        });
      }
      alert('Berhasil! Tasks telah ditambahkan ke Kanban Board.');
    } catch (err) {
      console.error(err);
      alert('Gagal membuat tasks.');
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

      {/* Info note */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <span className="text-blue-400 text-lg shrink-0">ℹ️</span>
        <p className="text-sm text-blue-300/80">
          Fitur ini menggunakan integrasi Google Gemini Pro. Pastikan <strong className="text-blue-200">GEMINI_API_KEY</strong> sudah disetup dengan benar di backend server. AI akan menganalisa seluruh data konten yang sudah kamu upload di platform ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="glass-card p-6 border-border rounded-xl space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Pilih Brand</label>
            <select
              title="Pilih Brand"
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
              title="Pilih Tipe Analisis"
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
              {/* Narrative */}
              {result.narrative && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Insight Narrative</h3>
                  <div className="p-4 bg-card rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                    {String(result.narrative)}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {result.reasoning && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Reasoning</h3>
                  <div className="p-4 bg-card rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                    {String(result.reasoning)}
                  </div>
                </div>
              )}

              {/* Actionable Tasks — handle string[] atau object[] */}
              {Array.isArray(result.actionableTasks) && result.actionableTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Actionable Tasks & Suggestions</h3>
                  <ul className="space-y-3 text-sm">
                    {result.actionableTasks.map((task: any, i: number) => {
                      // Handle object format: {title, description, priority}
                      if (task && typeof task === 'object') {
                        return (
                          <li key={i} className="p-3 bg-card rounded-lg border border-border">
                            <div className="flex items-start gap-2">
                              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                                task.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                task.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>{task.priority || 'MEDIUM'}</span>
                              <div>
                                {task.title && <p className="font-medium text-foreground">{task.title}</p>}
                                {task.description && <p className="text-muted-foreground mt-0.5">{task.description}</p>}
                                {!task.title && !task.description && <p>{JSON.stringify(task)}</p>}
                              </div>
                            </div>
                          </li>
                        );
                      }
                      // Handle string format
                      return <li key={i} className="pl-2 list-disc list-inside">{String(task)}</li>;
                    })}
                  </ul>
                  <button
                    onClick={handleGenerateTasks}
                    disabled={loading}
                    className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-medium rounded hover:bg-blue-500/30 transition disabled:opacity-50"
                  >
                    + Generate Kanban Tasks
                  </button>
                </div>
              )}

              {/* Fallback jika actionableTasks bukan array */}
              {result.actionableTasks && !Array.isArray(result.actionableTasks) && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Actionable Tasks & Suggestions</h3>
                  <div className="p-4 bg-card rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                    {String(result.actionableTasks)}
                  </div>
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  Oops, AI gagal memformat jawaban. Error: {String(result.error)}
                </div>
              )}

              {/* Raw fallback jika tidak ada field yang dikenal */}
              {!result.narrative && !result.reasoning && !result.actionableTasks && !result.error && (
                <div className="p-4 bg-card rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

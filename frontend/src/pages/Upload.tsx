import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, brandsAPI, contentsAPI, aiAPI, tasksAPI } from '@/lib/api';
import * as XLSX from 'xlsx';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [brandId, setBrandId] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [brands, setBrands] = useState<any[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [clearResult, setClearResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [contentCount, setContentCount] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // AI auto-analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModal, setAiModal] = useState<any>(null);
  const [toast, setToast] = useState<string>('');

  const STANDARD_FIELDS = [
    { key: 'nativePostId', label: 'Post ID' },
    { key: 'permalink', label: 'Permalink/URL' },
    { key: 'caption', label: 'Caption/Deskripsi' },
    { key: 'publishedAt', label: 'Tanggal Publish' },
    { key: 'views', label: 'Views/Tayangan' },
    { key: 'likes', label: 'Likes/Suka' },
    { key: 'comments', label: 'Comments/Komentar' },
    { key: 'shares', label: 'Shares/Dibagikan' },
    { key: 'saves', label: 'Saves/Disimpan' },
    { key: 'product', label: '📦 Produk (misal: Adrea Black + Goldie)' },
    { key: 'username', label: '👤 Username/Creator' },
  ];

  React.useEffect(() => {
    brandsAPI.getAll().then(r => setBrands(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  // Fetch content count when brandId changes
  React.useEffect(() => {
    if (!brandId) { setContentCount(null); return; }
    contentsAPI.getAll({ brandId, limit: 1 })
      .then(r => {
        const total = r.data?.total ?? r.data?.length ?? null;
        setContentCount(total);
      })
      .catch(() => setContentCount(null));
  }, [brandId]);

  React.useEffect(() => {
    if (file && platform === 'TIKTOK') {
      const reader = new FileReader();
      reader.onload = (e) => {
        let hdrs: string[] = [];
        if (file.name.endsWith('.csv')) {
          const text = e.target?.result as string;
          const firstLine = text.split('\n')[0];
          hdrs = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        } else if (file.name.endsWith('.xlsx')) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonData.length > 0) {
            hdrs = (jsonData[0] as any[]).map(h => String(h || '').trim());
          }
        }
        setHeaders(hdrs);
        const initMap: Record<string, string> = {};
        hdrs.forEach(h => {
          const lh = h.toLowerCase();
          if (lh.includes('id') || lh.includes('post')) initMap['nativePostId'] = h;
          if (lh.includes('url') || lh.includes('link')) initMap['permalink'] = h;
          if (lh.includes('title') || lh.includes('caption') || lh.includes('desc')) initMap['caption'] = h;
          if (lh.includes('time') || lh.includes('date') || lh.includes('waktu')) initMap['publishedAt'] = h;
          if (lh.includes('view') || lh.includes('tayan')) initMap['views'] = h;
          if (lh.includes('like') || lh.includes('suka')) initMap['likes'] = h;
          if (lh.includes('comment') || lh.includes('komen')) initMap['comments'] = h;
          if (lh.includes('share') || lh.includes('bagi')) initMap['shares'] = h;
          if (lh.includes('favorites') || lh.includes('save') || lh.includes('simpan')) initMap['saves'] = h;
          if (lh.includes('username') || lh.includes('creator') || lh.includes('user')) initMap['username'] = h;
          if (lh.includes('product') || lh.includes('produk')) initMap['product'] = h;
        });
        setMapping(initMap);
      };
      if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file.slice(0, 4096));
      }
    } else {
      setHeaders([]);
      setMapping({});
    }
  }, [file, platform]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }, []);

  const downloadAnalysisCSV = (analysis: any, taskList: string[]) => {
    const rows = [
      ['Zaneva AI Analysis Report'],
      ['Tanggal', new Date().toLocaleString('id-ID')],
      ['Brand', selectedBrand?.name || brandId],
      [],
      ['=== INSIGHT NARRATIVE ==='],
      [analysis.narrative || ''],
      [],
      ['=== REASONING ==='],
      [analysis.reasoning || ''],
      [],
      ['=== ACTIONABLE TASKS ==='],
      ...taskList.map((t, i) => [`${i + 1}.`, t]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `zaneva-ai-analysis-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !brandId) return;
    setLoading(true); setError(''); setResult(null); setClearResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('brandId', brandId);
      fd.append('platform', platform);
      if (platform === 'TIKTOK') fd.append('mapping', JSON.stringify(mapping));
      const { data } = await uploadAPI.uploadFile(fd);
      setResult(data);
      const r = await contentsAPI.getAll({ brandId, limit: 1 });
      setContentCount(r.data?.total ?? r.data?.length ?? null);

      // === AUTO AI ANALYSIS ===
      setAiLoading(true);
      try {
        const aiResult = await aiAPI.analyze({ brandId, analysisType: 'CONTENT_RANKING' });
        // Normalize tasks
        const rawTasks: any[] = Array.isArray(aiResult.actionableTasks) ? aiResult.actionableTasks : [];
        const taskStrings: string[] = rawTasks.map((t: any) =>
          typeof t === 'string' ? t : (t.description || t.title || JSON.stringify(t))
        );
        // Auto-create tasks in Kanban
        let createdCount = 0;
        for (const taskStr of taskStrings) {
          try {
            await tasksAPI.create({
              brandId,
              title: typeof rawTasks[taskStrings.indexOf(taskStr)] === 'object'
                ? (rawTasks[taskStrings.indexOf(taskStr)].title || 'AI Insight')
                : 'AI Insight Action',
              description: taskStr,
              priority: typeof rawTasks[taskStrings.indexOf(taskStr)] === 'object'
                ? (rawTasks[taskStrings.indexOf(taskStr)].priority || 'MEDIUM')
                : 'MEDIUM',
              status: 'TODO',
            });
            createdCount++;
          } catch {}
        }
        setAiModal({ ...aiResult, taskStrings, createdCount });
        showToast(`✅ ${createdCount} task AI berhasil ditambahkan ke Kanban!`);
      } catch {
        showToast('⚠️ Upload berhasil, tapi AI analysis gagal.');
      } finally {
        setAiLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload gagal');
    } finally { setLoading(false); }
  };

  const handleClear = async () => {
    if (!brandId) return;
    setClearing(true); setError(''); setResult(null); setClearResult(null);
    try {
      const { data } = await uploadAPI.clearData(brandId);
      setClearResult(data);
      setContentCount(0);
      setShowClearConfirm(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menghapus data');
      setShowClearConfirm(false);
    } finally { setClearing(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) setFile(f);
  };

  const selectedBrand = brands.find(b => b.id === brandId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Notification (Opsi C) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-purple-500/30 shadow-xl shadow-purple-500/10 animate-slide-up text-sm font-medium text-foreground max-w-sm">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="ml-2 text-muted-foreground hover:text-foreground" title="Tutup notifikasi">✕</button>
        </div>
      )}

      {/* AI Loading Overlay */}
      {aiLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-card p-8 max-w-sm w-full mx-4 text-center space-y-4 border border-purple-500/30 shadow-2xl shadow-purple-500/20">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Zaneva AI Menganalisis...</h3>
              <p className="text-sm text-muted-foreground mt-1">Sedang membaca data yang baru diupload dan membuat rekomendasi untuk tim kamu.</p>
            </div>
              <div className="flex gap-1.5 justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0s]"/>
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.15s]"/>
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.3s]"/>
              </div>
          </div>
        </div>
      )}

      {/* AI Result Modal (Opsi A) */}
      {aiModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto border border-purple-500/30 shadow-2xl shadow-purple-500/20 space-y-5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Analisis AI Selesai!</h2>
                  <p className="text-xs text-muted-foreground">{aiModal.createdCount} task otomatis ditambahkan ke Kanban</p>
                </div>
              </div>
              <button onClick={() => setAiModal(null)} title="Tutup modal" className="p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all">✕</button>
            </div>

            {/* Upload Summary */}
            {result && (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10"><p className="text-xl font-bold text-emerald-400">{result.imported}</p><p className="text-xs text-muted-foreground">Imported</p></div>
                <div className="p-3 rounded-xl bg-amber-500/10"><p className="text-xl font-bold text-amber-400">{result.skipped}</p><p className="text-xs text-muted-foreground">Skipped</p></div>
                <div className="p-3 rounded-xl bg-purple-500/10"><p className="text-xl font-bold text-purple-400">{aiModal.createdCount}</p><p className="text-xs text-muted-foreground">Tasks Dibuat</p></div>
              </div>
            )}

            {/* Narrative */}
            {aiModal.narrative && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-purple-400">💡 Insight AI</h3>
                <div className="p-4 bg-card rounded-xl text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(aiModal.narrative)}</div>
              </div>
            )}

            {/* Tasks */}
            {aiModal.taskStrings?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-400">📋 Tasks yang Ditambahkan ke Kanban</h3>
                <ul className="space-y-2">
                  {aiModal.taskStrings.map((t: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 p-3 bg-card rounded-xl text-sm">
                      <span className="text-purple-400 font-bold shrink-0">{i+1}.</span>
                      <span className="text-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => downloadAnalysisCSV(aiModal, aiModal.taskStrings || [])}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-card transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Download CSV
              </button>
              <button
                onClick={() => { setAiModal(null); navigate('/tasks'); }}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Lihat Kanban
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold">Upload CSV / XLSX</h1>
        <p className="text-muted-foreground text-sm">Import data konten dari file CSV atau XLSX Instagram/TikTok.</p>
      </div>

      {/* Info: Data disimpan di mana */}
      <div className="glass-card p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl flex gap-3">
        <span className="text-blue-400 text-lg mt-0.5">ℹ️</span>
        <div className="text-sm text-blue-300/80">
          <p className="font-semibold text-blue-300 mb-1">Data diupload disimpan di database sebagai <span className="text-purple-400">Konten</span>.</p>
          <p>Setelah upload, lihat hasilnya di menu <strong>Contents</strong> di sidebar kiri. Setiap baris CSV/XLSX menjadi 1 konten beserta metrik-nya.</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Brand</label>
            <select title="Pilih Brand" value={brandId} onChange={e => { setBrandId(e.target.value); setShowClearConfirm(false); setClearResult(null); }} required className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
              <option value="">Pilih Brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Platform</label>
            <select title="Pilih Platform" value={platform} onChange={e => setPlatform(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
            </select>
          </div>
        </div>

        {/* Data Status Bar */}
        {brandId && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${contentCount && contentCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-sm text-muted-foreground">
                Data tersimpan untuk <span className="text-foreground font-medium">{selectedBrand?.name}</span>:{' '}
                {contentCount === null
                  ? <span className="text-muted-foreground">Loading...</span>
                  : <span className={`font-bold ${contentCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{contentCount} konten</span>
                }
              </span>
            </div>
            {contentCount !== null && contentCount > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-medium flex items-center gap-1.5"
              >
                🗑️ Clear Data
              </button>
            )}
          </div>
        )}

        {/* Confirm Clear Dialog */}
        {showClearConfirm && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3 animate-slide-up">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-400">Hapus Semua Data?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ini akan menghapus <strong className="text-red-300">{contentCount} konten</strong> beserta semua metrik, hashtag, produk, dan creator yang terkait untuk brand <strong className="text-foreground">{selectedBrand?.name}</strong>. Tindakan ini <strong className="text-red-400">tidak bisa dibatalkan</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm font-semibold disabled:opacity-50"
              >
                {clearing ? '🔄 Menghapus...' : '🗑️ Ya, Hapus Semua'}
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-all text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-white/20'}`}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <input id="csv-input" type="file" accept=".csv,.xlsx" title="Upload file CSV atau XLSX" aria-label="Upload file CSV atau XLSX" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          <svg className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {file ? (
            <p className="text-sm font-medium text-purple-400">{file.name} <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span></p>
          ) : (
            <p className="text-sm text-muted-foreground">Drop file CSV atau XLSX di sini atau klik untuk memilih</p>
          )}
        </div>

        {platform === 'TIKTOK' && headers.length > 0 && (
          <div className="p-4 bg-card border border-border rounded-xl space-y-4">
            <h3 className="font-semibold text-foreground">Mapping Kolom TikTok CSV</h3>
            <p className="text-xs text-muted-foreground mb-4">Pilih kolom CSV yang sesuai dengan data sistem.</p>
            <div className="grid grid-cols-2 gap-3">
              {STANDARD_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col space-y-1">
                  <label className="text-xs text-foreground/80">{field.label}</label>
                  <select
                    title={`Mapping kolom untuk ${field.label}`}
                    value={mapping[field.key] || ''}
                    onChange={e => setMapping({...mapping, [field.key]: e.target.value})}
                    className="w-full text-xs px-2 py-1.5 rounded-lg bg-muted border border-border focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="">-- Abaikan --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={loading || !file || !brandId} className="w-full py-3 rounded-xl gradient-primary text-foreground font-semibold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20">
          {loading ? '⏳ Mengupload...' : '⬆️ Upload & Import'}
        </button>
      </form>

      {error && <div className="glass-card p-4 border-red-500/30 bg-red-500/5 text-red-400 text-sm animate-slide-up">❌ {error}</div>}

      {clearResult && (
        <div className="glass-card p-6 animate-slide-up space-y-3 border border-red-500/20">
          <h3 className="font-semibold text-red-400">🗑️ Data Berhasil Dihapus!</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-red-500/10">
              <p className="text-2xl font-bold text-red-400">{clearResult.deleted?.contents ?? 0}</p>
              <p className="text-xs text-muted-foreground">Konten</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <p className="text-2xl font-bold text-red-400">{clearResult.deleted?.metrics ?? 0}</p>
              <p className="text-xs text-muted-foreground">Metrik</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <p className="text-2xl font-bold text-red-400">{(clearResult.deleted?.contentHashtags ?? 0) + (clearResult.deleted?.contentProducts ?? 0) + (clearResult.deleted?.contentCreators ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Relasi Lainnya</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Semua data konten untuk brand ini telah dihapus dari database.</p>
        </div>
      )}

      {result && (
        <div className="glass-card p-6 animate-slide-up space-y-3">
          <h3 className="font-semibold text-emerald-400">✓ Import Berhasil!</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-emerald-500/10"><p className="text-2xl font-bold text-emerald-400">{result.imported}</p><p className="text-xs text-muted-foreground">Imported</p></div>
            <div className="p-3 rounded-xl bg-amber-500/10"><p className="text-2xl font-bold text-amber-400">{result.skipped}</p><p className="text-xs text-muted-foreground">Skipped</p></div>
            <div className="p-3 rounded-xl bg-blue-500/10"><p className="text-2xl font-bold text-blue-400">{result.total}</p><p className="text-xs text-muted-foreground">Total Rows</p></div>
          </div>
          <p className="text-xs text-muted-foreground">👉 Lihat data di menu <strong className="text-purple-400">Contents</strong> di sidebar.</p>
        </div>
      )}
    </div>
  );
}

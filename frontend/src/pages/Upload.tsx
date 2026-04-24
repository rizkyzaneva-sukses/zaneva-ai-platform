import React, { useState } from 'react';
import { uploadAPI, brandsAPI } from '@/lib/api';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [brandId, setBrandId] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  React.useEffect(() => {
    brandsAPI.getAll().then(r => setBrands(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !brandId) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('brandId', brandId);
      fd.append('platform', platform);
      const { data } = await uploadAPI.csv(fd);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload gagal');
    } finally { setLoading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) setFile(f);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Upload CSV</h1>
        <p className="text-muted-foreground text-sm">Import data konten dari file CSV Instagram/TikTok.</p>
      </div>

      <form onSubmit={handleUpload} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Brand</label>
            <select value={brandId} onChange={e => setBrandId(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
              <option value="">Pilih Brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
            </select>
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20'}`}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          <svg className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {file ? (
            <p className="text-sm font-medium text-purple-400">{file.name} <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span></p>
          ) : (
            <p className="text-sm text-muted-foreground">Drop file CSV di sini atau klik untuk memilih</p>
          )}
        </div>

        <button type="submit" disabled={loading || !file || !brandId} className="w-full py-3 rounded-xl gradient-primary text-white font-semibold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20">
          {loading ? 'Mengupload...' : 'Upload & Import'}
        </button>
      </form>

      {error && <div className="glass-card p-4 border-red-500/30 bg-red-500/5 text-red-400 text-sm animate-slide-up">{error}</div>}

      {result && (
        <div className="glass-card p-6 animate-slide-up space-y-3">
          <h3 className="font-semibold text-emerald-400">✓ Import Berhasil!</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-emerald-500/10"><p className="text-2xl font-bold text-emerald-400">{result.imported}</p><p className="text-xs text-muted-foreground">Imported</p></div>
            <div className="p-3 rounded-xl bg-amber-500/10"><p className="text-2xl font-bold text-amber-400">{result.skipped}</p><p className="text-xs text-muted-foreground">Skipped</p></div>
            <div className="p-3 rounded-xl bg-blue-500/10"><p className="text-2xl font-bold text-blue-400">{result.total}</p><p className="text-xs text-muted-foreground">Total Rows</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

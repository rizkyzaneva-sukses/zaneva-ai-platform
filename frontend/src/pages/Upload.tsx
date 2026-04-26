import React, { useState } from 'react';
import { uploadAPI, brandsAPI } from '@/lib/api';
import * as XLSX from 'xlsx';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [brandId, setBrandId] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const STANDARD_FIELDS = [
    { key: 'nativePostId', label: 'Post ID' },
    { key: 'permalink', label: 'Permalink/URL' },
    { key: 'caption', label: 'Caption/Deskripsi' },
    { key: 'publishedAt', label: 'Tanggal Publish' },
    { key: 'views', label: 'Views/Tayangan' },
    { key: 'likes', label: 'Likes/Suka' },
    { key: 'comments', label: 'Comments/Komentar' },
    { key: 'shares', label: 'Shares/Dibagikan' },
    { key: 'saves', label: 'Saves/Disimpan' }
  ];

  React.useEffect(() => {
    brandsAPI.getAll().then(r => setBrands(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

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
        
        // Auto-guess mapping
        const initMap: Record<string, string> = {};
        hdrs.forEach(h => {
          const lh = h.toLowerCase();
          if (lh.includes('id') || lh.includes('post')) initMap['nativePostId'] = h;
          if (lh.includes('url') || lh.includes('link')) initMap['permalink'] = h;
          if (lh.includes('caption') || lh.includes('desc')) initMap['caption'] = h;
          if (lh.includes('date') || lh.includes('waktu')) initMap['publishedAt'] = h;
          if (lh.includes('view') || lh.includes('tayan')) initMap['views'] = h;
          if (lh.includes('like') || lh.includes('suka')) initMap['likes'] = h;
          if (lh.includes('comment') || lh.includes('komen')) initMap['comments'] = h;
          if (lh.includes('share') || lh.includes('bagi')) initMap['shares'] = h;
          if (lh.includes('save') || lh.includes('simpan')) initMap['saves'] = h;
        });
        setMapping(initMap);
      };
      // Gunakan readAsText untuk CSV, readAsArrayBuffer untuk XLSX
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !brandId) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('brandId', brandId);
      fd.append('platform', platform);
      if (platform === 'TIKTOK') {
        fd.append('mapping', JSON.stringify(mapping));
      }
      const { data } = await uploadAPI.uploadFile(fd);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload gagal');
    } finally { setLoading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) setFile(f);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Upload CSV / XLSX</h1>
        <p className="text-muted-foreground text-sm">Import data konten dari file CSV atau XLSX Instagram/TikTok.</p>
      </div>

      <form onSubmit={handleUpload} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Brand</label>
            <select value={brandId} onChange={e => setBrandId(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
              <option value="">Pilih Brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
            </select>
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-white/20'}`}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <input id="csv-input" type="file" accept=".csv,.xlsx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
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

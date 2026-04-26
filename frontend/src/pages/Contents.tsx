import React, { useState, useEffect } from 'react';
import { contentsAPI, brandsAPI } from '@/lib/api';

export default function Contents() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<any[]>([]);
  const [platform, setPlatform] = useState('');
  const [sort, setSort] = useState('reach');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    brandsAPI.getAll().then(r => setBrands(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [brandId, platform, sort, startDate, endDate]);
  useEffect(() => { loadContents(); }, [page, brandId, platform, sort, startDate, endDate]);

  const loadContents = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20, sort, sortDir: 'desc' };
      if (brandId) params.brandId = brandId;
      if (platform) params.platform = platform;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await contentsAPI.getAll(params);
      setContents(data.data || []);
      setTotal(data.total ?? data.pagination?.total ?? 0);
    } catch (e) {
      setContents([]);
    } finally { setLoading(false); }
  };

  const formatNum = (n: any) => {
    const num = Number(n || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Konten</h1>
          <p className="text-muted-foreground text-sm">{total} konten terdaftar</p>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={brandId}
            onChange={e => setBrandId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
          >
            <option value="">Semua Brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
          >
            <option value="">Semua Platform</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
          >
            <option value="reach">Sort: Reach</option>
            <option value="views">Sort: Views</option>
            <option value="likes">Sort: Likes</option>
            <option value="publishedAt">Sort: Tanggal</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <span className="text-sm text-muted-foreground font-medium">📅 Tanggal:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            title="Dari Tanggal"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            title="Sampai Tanggal"
          />
          {(brandId || platform || sort !== 'reach' || startDate || endDate) && (
            <button
              onClick={() => {
                setBrandId('');
                setPlatform('');
                setSort('reach');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
            >
              ✕ Reset Filter
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Platform</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tipe</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Caption</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Views</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Likes</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Comments</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Reach</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center">
                  <svg className="animate-spin h-6 w-6 text-purple-500 mx-auto" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </td></tr>
              ) : contents.map((c) => {
                const m = c.metrics?.[0] || {};
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-card transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${c.platform === 'INSTAGRAM' ? 'bg-pink-500/10 text-pink-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {c.platform}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{c.contentType}</td>
                    <td className="p-4 max-w-[200px] truncate text-muted-foreground text-xs" title={c.caption}>{c.caption || '-'}</td>
                    <td className="p-4 text-right font-medium">{formatNum(m.views)}</td>
                    <td className="p-4 text-right">{formatNum(m.likes)}</td>
                    <td className="p-4 text-right">{formatNum(m.comments)}</td>
                    <td className="p-4 text-right text-purple-400 font-medium">{formatNum(m.reach)}</td>
                    <td className="p-4 text-muted-foreground text-xs">{c.publishedAt ? new Date(c.publishedAt).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                );
              })}
              {!loading && contents.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Belum ada konten. Upload CSV untuk mengimpor data.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted/50 disabled:opacity-30 transition-all text-sm">← Prev</button>
          <span className="px-4 py-2 text-sm text-muted-foreground">Hal {page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={contents.length < 20} className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted/50 disabled:opacity-30 transition-all text-sm">Next →</button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { contentsAPI } from '@/lib/api';

export default function Contents() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadContents(); }, [page]);

  const loadContents = async () => {
    setLoading(true);
    try {
      const { data } = await contentsAPI.getAll({ page, limit: 20 });
      setContents(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  const formatNum = (n: any) => {
    const num = Number(n || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) return <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Konten</h1>
        <p className="text-muted-foreground text-sm">{total} konten terdaftar</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 font-medium text-muted-foreground">Platform</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tipe</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Caption</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Views</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Likes</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Comments</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Shares</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((c, i) => {
                const m = c.metrics?.[0] || {};
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${c.platform === 'INSTAGRAM' ? 'bg-pink-500/10 text-pink-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{c.platform}</span></td>
                    <td className="p-4 text-muted-foreground">{c.contentType}</td>
                    <td className="p-4 max-w-[200px] truncate text-muted-foreground">{c.caption || '-'}</td>
                    <td className="p-4 text-right font-medium">{formatNum(m.views)}</td>
                    <td className="p-4 text-right">{formatNum(m.likes)}</td>
                    <td className="p-4 text-right">{formatNum(m.comments)}</td>
                    <td className="p-4 text-right">{formatNum(m.shares)}</td>
                    <td className="p-4 text-muted-foreground">{c.publishedAt ? new Date(c.publishedAt).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                );
              })}
              {contents.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Belum ada konten. Upload CSV untuk mengimpor data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all text-sm">← Prev</button>
          <span className="px-4 py-2 text-sm text-muted-foreground">Hal {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={contents.length < 20} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all text-sm">Next →</button>
        </div>
      )}
    </div>
  );
}

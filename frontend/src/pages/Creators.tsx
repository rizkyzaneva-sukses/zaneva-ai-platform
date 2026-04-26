import React, { useState, useEffect } from 'react';
import { analyticsAPI, brandsAPI } from '@/lib/api';

export default function Creators() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    brandsAPI.getAll().then((res) => {
      setBrands(res.data);
      if (res.data.length > 0) setBrandId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (brandId) {
      setLoading(true);
      analyticsAPI.getCreatorLeaderboard({ brandId })
        .then(setCreators)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [brandId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Creator Leaderboard</h1>
          <p className="text-muted-foreground mt-2">Peringkat performa UGC dan Affiliate.</p>
        </div>
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="bg-muted border border-border rounded-lg px-4 py-2 text-foreground"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {creators.slice(0, 3).map((creator, index) => (
          <div key={creator.id} className={`glass-card p-6 rounded-xl border relative overflow-hidden ${index === 0 ? 'border-yellow-500/30' : index === 1 ? 'border-gray-400/30' : 'border-amber-700/30'}`}>
            <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 ${index === 0 ? 'bg-yellow-500/20' : index === 1 ? 'bg-gray-400/20' : 'bg-amber-700/20'}`}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : index === 1 ? 'bg-gray-400/10 border-gray-400/50 text-gray-300' : 'bg-amber-700/10 border-amber-700/50 text-amber-600'}`}>
                #{index + 1}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">@{creator.handle}</h3>
                <p className="text-sm text-muted-foreground">{creator.category}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Reach</p>
                <p className="font-mono text-foreground text-lg">{Number(creator.totalReach).toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Engagement</p>
                <p className="font-mono text-primary text-lg">{Number(creator.avgEngagement).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-card">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4 text-center">Kategori</th>
                <th className="px-6 py-4 text-center">Jumlah Post</th>
                <th className="px-6 py-4 text-right">Total Reach</th>
                <th className="px-6 py-4 text-right">Avg Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-foreground/50">Loading...</td></tr>
              ) : creators.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-foreground/50">Tidak ada data creator</td></tr>
              ) : (
                creators.slice(3).map((c, i) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors text-foreground/90">
                    <td className="px-6 py-4 text-muted-foreground font-mono">#{i + 4}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">@{c.handle}</div>
                      <div className="text-xs text-muted-foreground">{c.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-muted/50 px-2 py-1 rounded-md text-xs">{c.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center">{c.contentCount}</td>
                    <td className="px-6 py-4 text-right font-mono">{Number(c.totalReach).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right font-mono text-primary">{Number(c.avgEngagement).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

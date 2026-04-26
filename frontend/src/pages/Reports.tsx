import React, { useState, useEffect } from 'react';
import { contentsAPI, brandsAPI } from '@/lib/api';

export default function Reports() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<any[]>([]);
  const [creatorRelation, setCreatorRelation] = useState(''); // '' = All, BRAND_OWNED = Brand Organic, UGC = UGC/Affiliate
  const [sortBy, setSortBy] = useState('reach'); // reach, views, likes

  useEffect(() => {
    brandsAPI.getAll().then((res) => {
      setBrands(res.data);
      if (res.data.length > 0) setBrandId(res.data[0].id);
    });
  }, []);

  const fetchReport = () => {
    if (!brandId) return;
    setLoading(true);
    const params: any = { brandId, limit: 50, sort: sortBy, sortDir: 'desc' };
    if (creatorRelation) params.creatorRelation = creatorRelation;

    contentsAPI.getAll(params)
      .then(res => setContents(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [brandId, creatorRelation, sortBy]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Advanced Reporting</h1>
          <p className="text-muted-foreground mt-2">Generate PDF report dan ranking konten berdasar filter spesifik.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Export to PDF / Print
        </button>
      </div>

      <div className="glass-card p-4 rounded-xl border border-border flex flex-wrap gap-4 print:hidden">
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="bg-muted border border-border rounded-lg px-4 py-2 text-foreground text-sm"
        >
          <option value="">Pilih Brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={creatorRelation}
          onChange={(e) => setCreatorRelation(e.target.value)}
          className="bg-muted border border-border rounded-lg px-4 py-2 text-foreground text-sm"
        >
          <option value="">Semua Konten (All)</option>
          <option value="BRAND_OWNED">Brand Organic (@zanevahijab)</option>
          <option value="UGC">UGC / Affiliate</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-muted border border-border rounded-lg px-4 py-2 text-foreground text-sm"
        >
          <option value="reach">Sort by Reach</option>
          <option value="views">Sort by Views</option>
          <option value="likes">Sort by Likes</option>
          <option value="publishedAt">Sort by Date</option>
        </select>
      </div>

      <div className="bg-white text-black p-8 rounded-xl print:shadow-none shadow-xl print:p-0 min-h-[800px]">
        <div className="border-b-2 border-gray-200 pb-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">ZANEVA AI PLATFORM</h2>
          <p className="text-gray-500">
            Performance Report - {brandId ? brands.find(b => b.id === brandId)?.name : 'All Brands'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Generated on: {new Date().toLocaleString('id-ID')} | Filter: {creatorRelation === 'BRAND_OWNED' ? 'Brand Organic' : creatorRelation === 'UGC' ? 'UGC / Affiliate' : 'All Types'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3 w-1/3">Konten</th>
                <th className="px-4 py-3 text-center">Tipe</th>
                <th className="px-4 py-3 text-right">Reach</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Loading data...</td></tr>
              ) : contents.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8">Tidak ada data untuk filter ini.</td></tr>
              ) : (
                contents.map((c, i) => {
                  const m = c.metrics?.[0] || {};
                  const eng = Number(m.likes || 0) + Number(m.comments || 0) + Number(m.shares || 0) + Number(m.saves || 0);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-400">#{i + 1}</td>
                      <td className="px-4 py-3">
                        <a href={c.permalink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline line-clamp-2" title={c.caption}>
                          {c.caption ? c.caption.substring(0, 80) + '...' : c.nativePostId}
                        </a>
                        <div className="text-xs text-gray-400 mt-1">{new Date(c.publishedAt).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">{c.platform}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-800">{Number(m.reach || 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">{Number(m.views || 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right font-mono text-purple-600">{eng.toLocaleString('id-ID')}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white, .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}

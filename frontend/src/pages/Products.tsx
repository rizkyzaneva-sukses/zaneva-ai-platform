import React, { useState, useEffect } from 'react';
import { analyticsAPI, brandsAPI } from '@/lib/api';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
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
      analyticsAPI.getProductPerformance({ brandId })
        .then(setProducts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [brandId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Product Intelligence</h1>
          <p className="text-muted-foreground mt-2">Pantau performa konten berdasarkan produk yang disebutkan.</p>
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

      {/* Info note */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <span className="text-blue-400 text-lg shrink-0">ℹ️</span>
        <p className="text-sm text-blue-300/80">
          Data performa produk diambil dari CSV yang diupload. Pastikan ada kolom <strong className="text-blue-200">Produk</strong> atau <strong className="text-blue-200">Product</strong> di CSV (jika ada lebih dari 1 produk, pisahkan dengan koma atau tanda tambah <code>+</code>, misal: <em>Adrea Black + Goldie Black</em>). App otomatis akan memisahkan menjadi 2 produk.
        </p>
      </div>

      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-card">
              <tr>
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4 text-center">Jumlah Konten</th>
                <th className="px-6 py-4 text-right">Total Reach</th>
                <th className="px-6 py-4 text-right">Total Views</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-foreground/50">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-foreground/50">Tidak ada data produk</td></tr>
              ) : (
                products.map((p, i) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors text-foreground/90">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-border">
                        {i + 1}
                      </div>
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-muted/50 px-2 py-1 rounded-md">{p.contentCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{Number(p.totalReach).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right font-mono text-primary">{Number(p.totalViews).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center">
                      {p.contentCount === 0 ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">Underperforming</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">Active</span>
                      )}
                    </td>
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

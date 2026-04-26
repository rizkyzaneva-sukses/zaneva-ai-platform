import React, { useState, useEffect } from 'react';
import { brandsAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function Brands() {
  const user = useAuthStore((s) => s.user);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBrands(); }, []);

  const loadBrands = async () => {
    try {
      const { data } = await brandsAPI.getAll();
      setBrands(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await brandsAPI.create(form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      loadBrands();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus brand ini?')) return;
    try { await brandsAPI.delete(id); loadBrands(); } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand</h1>
          <p className="text-muted-foreground text-sm">Kelola brand yang terdaftar di platform.</p>
        </div>
        {user?.role === 'OWNER' && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl gradient-primary text-foreground text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
            {showForm ? 'Batal' : '+ Tambah Brand'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4 animate-slide-up">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama Brand" required className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all" />
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsi (opsional)" className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all" />
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl gradient-primary text-foreground font-medium disabled:opacity-50 transition-all">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map((brand, i) => (
          <div key={brand.id} className="glass-card p-6 hover:border-purple-500/30 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              {user?.role === 'OWNER' && (
                <button onClick={() => handleDelete(brand.id)} className="text-red-400 hover:text-red-300 text-sm transition-colors">Hapus</button>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-1">{brand.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{brand.description || 'Tidak ada deskripsi'}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{brand._count?.contents || 0} konten</span>
              <span>{brand._count?.tasks || 0} task</span>
            </div>
          </div>
        ))}
        {brands.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">Belum ada brand. Tambahkan brand pertama Anda.</div>
        )}
      </div>
    </div>
  );
}

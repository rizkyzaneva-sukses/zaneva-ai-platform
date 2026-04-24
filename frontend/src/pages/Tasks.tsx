import React, { useState, useEffect } from 'react';
import { tasksAPI, brandsAPI } from '@/lib/api';

const STATUS_COLS = [
  { key: 'TODO', label: 'To Do', color: 'border-blue-500/50', dot: 'bg-blue-500' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/50', dot: 'bg-amber-500' },
  { key: 'DONE', label: 'Done', color: 'border-emerald-500/50', dot: 'bg-emerald-500' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ brandId: '', title: '', description: '', priority: 'MEDIUM' });

  useEffect(() => {
    Promise.all([
      tasksAPI.getAll().then(r => setTasks(Array.isArray(r.data) ? r.data : [])),
      brandsAPI.getAll().then(r => setBrands(Array.isArray(r.data) ? r.data : []))
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const { data } = await tasksAPI.create(form); setTasks([data, ...tasks]); setShowForm(false); setForm({ brandId: '', title: '', description: '', priority: 'MEDIUM' }); } catch {}
  };

  const moveTask = async (id: string, status: string) => {
    try { await tasksAPI.update(id, { status }); setTasks(tasks.map(t => t.id === id ? { ...t, status } : t)); } catch {}
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Hapus task ini?')) return;
    try { await tasksAPI.delete(id); setTasks(tasks.filter(t => t.id !== id)); } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm">Kanban board untuk manajemen task.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
          {showForm ? 'Batal' : '+ Tambah Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4 animate-slide-up">
          <select value={form.brandId} onChange={e => setForm({...form, brandId: e.target.value})} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
            <option value="">Pilih Brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Judul Task" required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:outline-none" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsi" required rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:outline-none resize-none" />
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <button type="submit" className="px-6 py-2 rounded-xl gradient-primary text-white font-medium transition-all">Simpan</button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {STATUS_COLS.map(col => (
          <div key={col.key} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <span className="text-xs text-muted-foreground ml-auto">{tasks.filter(t => t.status === col.key).length}</span>
            </div>
            <div className={`kanban-column space-y-3 p-3 rounded-xl border ${col.color} bg-white/[0.02]`}>
              {tasks.filter(t => t.status === col.key).map(task => (
                <div key={task.id} className="glass-card p-4 space-y-2 hover:border-purple-500/30 transition-all">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' : task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>{task.priority}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-1 pt-1">
                    {col.key !== 'TODO' && <button onClick={() => moveTask(task.id, col.key === 'DONE' ? 'IN_PROGRESS' : 'TODO')} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all">← Kembali</button>}
                    {col.key !== 'DONE' && <button onClick={() => moveTask(task.id, col.key === 'TODO' ? 'IN_PROGRESS' : 'DONE')} className="text-[10px] px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all">Lanjut →</button>}
                    <button onClick={() => deleteTask(task.id)} className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all ml-auto">Hapus</button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === col.key).length === 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-8">Kosong</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

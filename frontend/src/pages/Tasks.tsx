import React, { useState, useEffect } from 'react';
import { tasksAPI, brandsAPI } from '@/lib/api';

const STATUS_COLS = [
  { key: 'TODO', label: 'To Do', color: 'border-blue-500/50', dot: 'bg-blue-500' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/50', dot: 'bg-amber-500' },
  { key: 'DONE', label: 'Done', color: 'border-emerald-500/50', dot: 'bg-emerald-500' },
];

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-400',
  MEDIUM: 'bg-amber-500/10 text-amber-400',
  LOW: 'bg-blue-500/10 text-blue-400',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [form, setForm] = useState({ brandId: '', title: '', description: '', priority: 'MEDIUM' });

  useEffect(() => {
    Promise.all([
      tasksAPI.getAll().then(r => setTasks(Array.isArray(r.data) ? r.data : [])),
      brandsAPI.getAll().then(r => setBrands(Array.isArray(r.data) ? r.data : []))
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await tasksAPI.create(form);
      setTasks([data, ...tasks]);
      setShowForm(false);
      setForm({ brandId: '', title: '', description: '', priority: 'MEDIUM' });
    } catch {}
  };

  const moveTask = async (id: string, status: string) => {
    try {
      await tasksAPI.update(id, { status });
      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
      if (selectedTask?.id === id) setSelectedTask((prev: any) => ({ ...prev, status }));
    } catch {}
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Hapus task ini?')) return;
    try {
      await tasksAPI.delete(id);
      setTasks(tasks.filter(t => t.id !== id));
      if (selectedTask?.id === id) setSelectedTask(null);
    } catch {}
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg border border-purple-500/20 shadow-2xl shadow-purple-500/10 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[selectedTask.priority] || PRIORITY_STYLE.MEDIUM}`}>
                    {selectedTask.priority}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                    {STATUS_COLS.find(c => c.key === selectedTask.status)?.label || selectedTask.status}
                  </span>
                </div>
                <h2 className="font-bold text-lg leading-snug">{selectedTask.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                title="Tutup detail task"
                className="shrink-0 p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all"
              >✕</button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deskripsi</h3>
              <div className="p-4 bg-card rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 max-h-64 overflow-y-auto">
                {selectedTask.description || <span className="text-muted-foreground italic">Tidak ada deskripsi.</span>}
              </div>
            </div>

            {/* Brand */}
            {selectedTask.brand && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
                Brand: <span className="text-foreground font-medium">{selectedTask.brand.name}</span>
              </div>
            )}

            {/* Created at */}
            <p className="text-xs text-muted-foreground">
              Dibuat: {new Date(selectedTask.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              {selectedTask.status !== 'TODO' && (
                <button
                  onClick={() => moveTask(selectedTask.id, selectedTask.status === 'DONE' ? 'IN_PROGRESS' : 'TODO')}
                  className="flex-1 py-2 rounded-xl border border-border text-sm hover:bg-card transition-all"
                >← Kembali</button>
              )}
              {selectedTask.status !== 'DONE' && (
                <button
                  onClick={() => moveTask(selectedTask.id, selectedTask.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                  className="flex-1 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm hover:bg-purple-500/20 transition-all"
                >Lanjut →</button>
              )}
              <button
                onClick={() => deleteTask(selectedTask.id)}
                className="py-2 px-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-all"
              >Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm">Kanban board untuk manajemen task.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl gradient-primary text-foreground text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
        >
          {showForm ? 'Batal' : '+ Tambah Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4 animate-slide-up">
          <select title="Pilih Brand" value={form.brandId} onChange={e => setForm({...form, brandId: e.target.value})} required className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
            <option value="">Pilih Brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Judul Task" required className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsi" required rows={3} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none resize-none" />
          <select title="Pilih Prioritas" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <button type="submit" className="px-6 py-2 rounded-xl gradient-primary text-foreground font-medium transition-all">Simpan</button>
        </form>
      )}

      {/* Kanban Board */}
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
                <div
                  key={task.id}
                  className="glass-card p-4 space-y-2 hover:border-purple-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.MEDIUM}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-1 pt-1" onClick={e => e.stopPropagation()}>
                    {col.key !== 'TODO' && (
                      <button onClick={() => moveTask(task.id, col.key === 'DONE' ? 'IN_PROGRESS' : 'TODO')} className="text-[10px] px-2 py-1 rounded-lg bg-card hover:bg-muted/50 transition-all">← Kembali</button>
                    )}
                    {col.key !== 'DONE' && (
                      <button onClick={() => moveTask(task.id, col.key === 'TODO' ? 'IN_PROGRESS' : 'DONE')} className="text-[10px] px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all">Lanjut →</button>
                    )}
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

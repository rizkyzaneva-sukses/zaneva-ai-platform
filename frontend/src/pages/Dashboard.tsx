import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { brandsAPI, contentsAPI, tasksAPI } from '@/lib/api';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ totalBrands: 0, totalContents: 0, totalTasks: 0, done: 0, inProgress: 0, todo: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, c, t] = await Promise.all([
          brandsAPI.getAll().catch(() => ({ data: [] })),
          contentsAPI.getStats().catch(() => ({ data: { totalContents: 0 } })),
          tasksAPI.getAll().catch(() => ({ data: [] })),
        ]);
        const tasks = Array.isArray(t.data) ? t.data : [];
        setStats({
          totalBrands: Array.isArray(b.data) ? b.data.length : 0,
          totalContents: c.data?.totalContents || 0,
          totalTasks: tasks.length,
          done: tasks.filter((x: any) => x.status === 'DONE').length,
          inProgress: tasks.filter((x: any) => x.status === 'IN_PROGRESS').length,
          todo: tasks.filter((x: any) => x.status === 'TODO').length,
        });
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><svg className="animate-spin h-10 w-10 text-purple-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  const cards = [
    { label: 'Total Brand', value: stats.totalBrands, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-500/10' },
    { label: 'Total Konten', value: stats.totalContents, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/10' },
    { label: 'Total Task', value: stats.totalTasks, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10' },
    { label: 'Task Selesai', value: stats.done, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">{greeting}, <span className="gradient-text">{user?.name}</span> 👋</h1>
        <p className="text-muted-foreground mt-1">Ringkasan platform Zaneva AI hari ini.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <div key={c.label} className="glass-card p-6 hover:border-purple-500/30 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${c.color} mb-4`} />
            <p className="text-3xl font-bold mb-1">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Progress Task</h2>
        {[{ l: 'To Do', v: stats.todo, c: 'bg-blue-500' }, { l: 'In Progress', v: stats.inProgress, c: 'bg-amber-500' }, { l: 'Done', v: stats.done, c: 'bg-emerald-500' }].map(x => (
          <div key={x.l} className="mb-3">
            <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{x.l}</span><span className="font-medium">{x.v}</span></div>
            <div className="h-2 rounded-full bg-card overflow-hidden"><div className={`h-full rounded-full ${x.c} transition-all duration-1000`} style={{ width: stats.totalTasks > 0 ? `${(x.v / stats.totalTasks) * 100}%` : '0%' }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

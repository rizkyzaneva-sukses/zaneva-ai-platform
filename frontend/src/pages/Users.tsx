import React, { useState, useEffect } from 'react';
import { authAPI, brandsAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Navigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  brandAccess?: { brand: { id: string; name: string } }[];
}

interface Brand {
  id: string;
  name: string;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  PIC_BRAND: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
};

const Spinner = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
);

export default function Users() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'PIC_BRAND' });

  // Guard: only OWNER
  if (currentUser?.role !== 'OWNER') return <Navigate to="/" replace />;

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, brandsRes] = await Promise.all([
        authAPI.getUsers(),
        brandsAPI.getAll(),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
    } catch {
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.register(form);
      setSuccess(`Akun "${form.name}" berhasil dibuat!`);
      setForm({ name: '', email: '', password: '', role: 'PIC_BRAND' });
      setShowForm(false);
      loadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal membuat akun.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      setError('Tidak bisa menghapus akun sendiri.');
      return;
    }
    if (!confirm(`Hapus akun "${user.name}" (${user.email})?`)) return;
    try {
      await authAPI.deleteUser(user.id);
      setSuccess(`Akun "${user.name}" dihapus.`);
      loadAll();
    } catch {
      setError('Gagal menghapus akun.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen User</h1>
          <p className="text-muted-foreground text-sm">Kelola akun tim yang dapat mengakses platform.</p>
        </div>
        <button
          id="btn-tambah-user"
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="px-4 py-2 rounded-xl gradient-primary text-foreground text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
        >
          {showForm ? 'Batal' : '+ Tambah User'}
        </button>
      </div>

      {/* Alert */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">✕</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-slide-up">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-300">✕</button>
        </div>
      )}

      {/* Form Tambah User */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4 animate-slide-up">
          <h2 className="font-semibold text-lg">Buat Akun Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nama Lengkap</label>
              <input
                id="input-nama-user"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="contoh: Siti Rahayu"
                required
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <input
                id="input-email-user"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@zaneva.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Password</label>
              <input
                id="input-password-user"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Role</label>
              <select
                id="select-role-user"
                title="Pilih role untuk user baru"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all"
              >
                <option value="PIC_BRAND">PIC Brand (terbatas per brand)</option>
                <option value="OWNER">Owner (akses penuh)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              id="btn-simpan-user"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl gradient-primary text-foreground font-medium disabled:opacity-50 transition-all hover:opacity-90"
            >
              {saving ? 'Menyimpan...' : 'Buat Akun'}
            </button>
            <p className="text-xs text-muted-foreground">
              {form.role === 'PIC_BRAND' ? '⚠️ Assign brand ke user ini setelah dibuat via Brand settings.' : '👑 Owner dapat mengakses semua brand.'}
            </p>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total User', value: users.length, color: 'text-purple-400' },
          { label: 'Owner', value: users.filter(u => u.role === 'OWNER').length, color: 'text-yellow-400' },
          { label: 'PIC Brand', value: users.filter(u => u.role === 'PIC_BRAND').length, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* User List */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Daftar User ({users.length})</h2>
        </div>
        {users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Belum ada user selain kamu.</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user, i) => (
              <div key={user.id} className="px-6 py-4 flex items-center gap-4 hover:bg-card/50 transition-all animate-slide-up">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-purple-500/20">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">{user.name}</p>
                    {user.id === currentUser?.id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Kamu</span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] || 'bg-gray-500/20 text-gray-400'}`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  {user.brandAccess && user.brandAccess.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.brandAccess.map(ba => (
                        <span key={ba.brand.id} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {ba.brand.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Date */}
                <p className="text-xs text-muted-foreground shrink-0 hidden md:block">
                  {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {/* Actions */}
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(user)}
                    className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    title={`Hapus ${user.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="glass-card p-5 border border-yellow-500/20 bg-yellow-500/5">
        <h3 className="font-semibold text-yellow-400 text-sm mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cara Assign Brand ke PIC
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Setelah membuat akun PIC Brand, pergi ke halaman <strong className="text-foreground">Brands</strong> → pilih brand → klik <strong className="text-foreground">"Kelola Akses"</strong> untuk menambahkan user ke brand tersebut. PIC hanya bisa melihat data brand yang di-assign.
        </p>
      </div>
    </div>
  );
}

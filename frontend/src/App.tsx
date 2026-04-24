import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Brands from '@/pages/Brands'
import Contents from '@/pages/Contents'
import Tasks from '@/pages/Tasks'
import Upload from '@/pages/Upload'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/stores/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
      <Route path="/contents" element={<ProtectedRoute><Contents /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

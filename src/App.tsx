import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { I18nProvider } from '@/lib/i18n'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { MenuPage } from '@/pages/MenuPage'
import { PhotosPage } from '@/pages/PhotosPage'
import { ExportPage } from '@/pages/ExportPage'

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-serif text-[#C9A961] mb-2">Auguste</h1>
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <AppLayout />
}

function PublicHome() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-serif text-[#C9A961] mb-2">Auguste</h1>
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si déjà connecté, aller directement au profil
  if (user) {
    return <Navigate to="/profil" replace />
  }

  return <LandingPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoutes />}>
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/photos" element={<PhotosPage />} />
              <Route path="/export" element={<ExportPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}

// src/App.jsx  — Ana Router
// Directives 2 & 4: ProtectedRoute auth guard + ScrollToTop on every route change
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect }        from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider }  from './context/SettingsContext'
import Navbar        from './components/Navbar'

// Sayfalar
import Dashboard      from './Dashboard'
import Login          from './pages/Login'
import Takip          from './pages/Takip'
import PartnerNetwork from './pages/PartnerNetwork'
import ProfilePage    from './pages/ProfilePage'
import Vitrin         from './pages/Vitrin'

// ─── DIRECTIVE 4: ScrollToTop ────────────────────────────────────────────────
// Forces window.scrollTo(0,0) on every route change so users always see the top.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// ─── DIRECTIVE 2: ProtectedRoute ─────────────────────────────────────────────
// Restricts access to admin-only routes.
// Checks: 1) user is authenticated  2) user is admin (email or rol field).
// Otherwise redirects to /giris.
function ProtectedRoute({ children }) {
  const { kullanici, yukleniyor } = useAuth()

  // While the token is being verified, show nothing (avoids flash of login page)
  if (yukleniyor) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1120', color: '#6a7fa8', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        Doğrulanıyor...
      </div>
    )
  }

  // Not logged in at all → redirect
  if (!kullanici) return <Navigate to="/giris" replace />

  // Logged in but NOT admin → redirect
  const isAdmin = kullanici.email === 'patron@loop.com' || kullanici.rol === 'admin'
  if (!isAdmin) return <Navigate to="/" replace />

  return children
}

// ─── PublicLayout ─────────────────────────────────────────────────────────────
// Renders the shared Navbar above every public-facing page.
// Dashboard and Takip are full-screen experiences — they handle their own headers.
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 72 }}>{children}</div>
    </>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Vitrin landing page — "/" */}
            <Route path="/"      element={<PublicLayout><Vitrin /></PublicLayout>} />

            {/* Full-screen — own header, no shared Navbar */}
            {/* DIRECTIVE 2: Dashboard is admin-only, now at /dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/takip" element={<Takip />} />

            {/* Public pages — share the top Navbar with auth-aware Profile button */}
            <Route path="/giris"      element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/partnerler" element={<PublicLayout><PartnerNetwork /></PublicLayout>} />
            <Route path="/profil"     element={<PublicLayout><ProfilePage /></PublicLayout>} />

            {/* Redirects */}
            <Route path="/odeme" element={<Navigate to="/partnerler" replace />} />
            <Route path="*"      element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  )
}
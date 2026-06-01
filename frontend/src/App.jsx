// src/App.jsx  — Ana Router
// Directives 2 & 4: ProtectedRoute auth guard + ScrollToTop on every route change
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect }        from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider, useSettings }  from './context/SettingsContext'
import Navbar        from './components/Navbar'

// Sayfalar
import Dashboard      from './Dashboard'
import Takip          from './pages/Takip'
import PartnerNetwork from './pages/PartnerNetwork'
import ProfilePage    from './pages/ProfilePage'

const VITRIN_HOMEPAGE = 'https://lojistikweb-vitrin.vercel.app/'
const VITRIN_LOGIN = 'https://lojistikweb-vitrin.vercel.app/#giris'

// ─── DIRECTIVE 4: ScrollToTop ────────────────────────────────────────────────
// Forces window.scrollTo(0,0) on every route change so users always see the top.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    const onPageShow = () => window.scrollTo(0, 0)
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// ─── DIRECTIVE 2: ProtectedRoute ─────────────────────────────────────────────
// Restricts access to admin-only routes.
// Checks: 1) user is authenticated  2) user is admin (email or rol field).
// Otherwise redirects to the Vitrin homepage login modal.
function ProtectedRoute({ children }) {
  const { kullanici, yukleniyor } = useAuth()
  const { language } = useSettings()

  // While the token is being verified, show nothing (avoids flash of login page)
  if (yukleniyor) {
    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1120', color: '#6a7fa8', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        {language === 'en' ? 'Verifying...' : 'Doğrulanıyor...'}
      </div>
    )
  }

  // Not logged in at all → redirect
  if (!kullanici) return <ExternalRedirect to={VITRIN_LOGIN} message="Redirecting to LOOP sign in..." />

  // Logged in but NOT admin → redirect
  const isAdmin =
    (kullanici.email || '').toLowerCase() === 'admin@loop.com' ||
    (kullanici.rol || '').toLowerCase() === 'admin'
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

function ExternalHomepageRedirect() {
  return <ExternalRedirect to={VITRIN_HOMEPAGE} message="Redirecting to LOOP homepage..." />
}

function ExternalRedirect({ to, message }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060c1a', color: '#e8f0ff', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
      {message}
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* The only homepage lives on the standalone Vitrin deployment. */}
            <Route path="/"      element={<ExternalHomepageRedirect />} />

            {/* Full-screen — own header, no shared Navbar */}
            {/* DIRECTIVE 2: Dashboard is admin-only, now at /dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/takip" element={<Takip />} />

            {/* Public pages — share the top Navbar with auth-aware Profile button */}
            <Route path="/giris"      element={<ExternalRedirect to={VITRIN_LOGIN} message="Redirecting to LOOP sign in..." />} />
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

// src/App.jsx  — Ana Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }     from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import Navbar        from './components/Navbar'

// Sayfalar
import Dashboard      from './Dashboard'
import Login          from './pages/Login'
import Takip          from './pages/Takip'
import PartnerNetwork from './pages/PartnerNetwork'
import ProfilePage    from './pages/ProfilePage'

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
          <Routes>
            {/* Full-screen — own header, no shared Navbar */}
            <Route path="/"      element={<Dashboard />} />
            <Route path="/takip" element={<Takip />} />

            {/* Public pages — share the top Navbar with auth-aware Profile button */}
            <Route path="/giris"      element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/partnerler" element={<PublicLayout><PartnerNetwork /></PublicLayout>} />
            <Route path="/profil"     element={<ProfilePage />} />

            {/* Redirects */}
            <Route path="/odeme" element={<Navigate to="/partnerler" replace />} />
            <Route path="*"      element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  )
}
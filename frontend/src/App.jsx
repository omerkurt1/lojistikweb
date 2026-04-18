// src/App.jsx  — Ana Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }     from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'

// Sayfalar
import Dashboard      from './Dashboard'
import Login          from './pages/Login'
import Takip          from './pages/Takip'
import PartnerNetwork from './pages/PartnerNetwork'
import ProfilePage    from './pages/ProfilePage'

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Ana dashboard */}
            <Route path="/"            element={<Dashboard />} />

            {/* Kullanıcı sayfaları */}
            <Route path="/giris"       element={<Login />} />
            <Route path="/takip"       element={<Takip />} />
            <Route path="/partnerler"  element={<PartnerNetwork />} />
            <Route path="/profil"      element={<ProfilePage />} />

            {/* Eski ödeme URL'si → partner sayfasına yönlendir */}
            <Route path="/odeme"       element={<Navigate to="/partnerler" replace />} />

            {/* Bilinmeyen path → ana sayfa */}
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  )
}
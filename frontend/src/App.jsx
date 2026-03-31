// src/App.jsx  — Ana Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Sayfalar
import Dashboard from './Dashboard'
import Login     from './pages/Login'
import Takip     from './pages/Takip'
import Odeme     from './pages/Odeme'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ana dashboard */}
          <Route path="/"       element={<Dashboard />} />

          {/* Kullanıcı sayfaları */}
          <Route path="/giris"  element={<Login />} />
          <Route path="/takip"  element={<Takip />} />
          <Route path="/odeme"  element={<Odeme />} />

          {/* Bilinmeyen path → ana sayfa */}
          <Route path="*"       element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
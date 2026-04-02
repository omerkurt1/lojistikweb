// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API = 'https://lojistikweb-backend.onrender.com/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  // Sayfa yüklenince token'dan kullanıcıyı geri yükle
  useEffect(() => {
    const token = localStorage.getItem('loop_token')
    if (!token) { setYukleniyor(false); return }
    fetch(`${API}/auth/ben`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.kullanici) setKullanici(d.kullanici) })
      .catch(() => localStorage.removeItem('loop_token'))
      .finally(() => setYukleniyor(false))
  }, [])

  const kayit = useCallback(async ({ isim, email, sifre }) => {
    let res
    try {
      res = await fetch(`${API}/auth/kayit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isim, email, sifre })
      })
    } catch {
      throw new Error('Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.')
    }
    let veri
    try { veri = await res.json() } catch {
      throw new Error('Sunucu geçersiz yanıt döndürdü. Lütfen daha sonra tekrar deneyin.')
    }
    if (!res.ok) throw new Error(veri.hata || 'Kayıt başarısız.')
    localStorage.setItem('loop_token', veri.token)
    setKullanici(veri.kullanici)
    return veri
  }, [])

  const giris = useCallback(async ({ email, sifre }) => {
    let res
    try {
      res = await fetch(`${API}/auth/giris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sifre })
      })
    } catch {
      throw new Error('Sunucuya ulaşılamıyor. İnternet bağlantınızı veya sunucu durumunu kontrol edin.')
    }
    let veri
    try { veri = await res.json() } catch {
      throw new Error('Sunucu henüz hazır değil, lütfen 30 saniye bekleyip tekrar deneyin. (Render soğuk başlatma)')
    }
    if (!res.ok) throw new Error(veri.hata || 'Giriş başarısız.')
    localStorage.setItem('loop_token', veri.token)
    setKullanici(veri.kullanici)
    return veri
  }, [])

  const cikis = useCallback(() => {
    localStorage.removeItem('loop_token')
    setKullanici(null)
  }, [])

  const token = localStorage.getItem('loop_token')

  return (
    <AuthContext.Provider value={{ kullanici, token, yukleniyor, kayit, giris, cikis }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.')
  return ctx
}
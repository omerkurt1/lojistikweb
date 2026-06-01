// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_URL, apiFetch, clearAuthTokens, getAccessToken, setAuthTokens } from '../config/api'

const AuthContext = createContext(null)

function normalizeUser(user) {
  if (!user) return null
  const fullName = user.full_name || user.isim || user.email || ''
  return {
    ...user,
    isim: fullName,
    email: user.email,
    rol: user.role || user.rol,
    sirket: user.company_name,
    aktif: user.is_active,
  }
}

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  // Sayfa yüklenince token'dan kullanıcıyı geri yükle
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('loop_token')
    if (tokenFromUrl) {
      localStorage.setItem('loop_token', tokenFromUrl)
      window.dispatchEvent(new Event('loop-auth-changed'))
      params.delete('loop_token')
      const newSearch = params.toString()
      const cleanUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', cleanUrl)
    }

    const token = getAccessToken()
    if (!token) { setYukleniyor(false); return }
    apiFetch('/auth/me')
      .then(d => setKullanici(normalizeUser(d)))
      .catch(() => clearAuthTokens())
      .finally(() => setYukleniyor(false))
  }, [])

  const kayit = useCallback(async ({ isim, email, sifre }) => {
    let res
    try {
      res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: sifre,
          full_name: isim,
          phone_number: '0000000000',
          role: 'customer',
        })
      })
    } catch {
      throw new Error('Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.')
    }
    let veri
    try { veri = await res.json() } catch {
      throw new Error('Sunucu geçersiz yanıt döndürdü. Lütfen daha sonra tekrar deneyin.')
    }
    if (!res.ok) throw new Error(veri.detail || veri.hata || 'Kayıt başarısız.')
    const loginData = await loginWithPassword(email, sifre)
    setAuthTokens({ accessToken: loginData.access_token, refreshToken: loginData.refresh_token })
    const user = normalizeUser(await apiFetch('/auth/me'))
    setKullanici(user)
    window.dispatchEvent(new Event('loop-auth-changed'))
    return { token: loginData.access_token, kullanici: user }
  }, [])

  const giris = useCallback(async ({ email, sifre }) => {
    try {
      const veri = await loginWithPassword(email, sifre)
      setAuthTokens({ accessToken: veri.access_token, refreshToken: veri.refresh_token })
      const kullanici = normalizeUser(await apiFetch('/auth/me'))
      setKullanici(kullanici)
      window.dispatchEvent(new Event('loop-auth-changed'))
      return { token: veri.access_token, refreshToken: veri.refresh_token, kullanici }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch')) throw err
      throw new Error('Sunucuya ulaşılamıyor. İnternet bağlantınızı veya sunucu durumunu kontrol edin.')
    }
  }, [])

  const cikis = useCallback(() => {
    clearAuthTokens()
    setKullanici(null)
  }, [])

  const token = getAccessToken()

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

async function loginWithPassword(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  })

  let data
  try { data = await res.json() } catch {
    throw new Error('Sunucu henüz hazır değil, lütfen 30 saniye bekleyip tekrar deneyin.')
  }
  if (!res.ok) throw new Error(data.detail || data.hata || 'Giriş başarısız.')
  return data
}

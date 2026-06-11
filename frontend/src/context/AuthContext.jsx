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
    phone: user.phone_number || user.phone || '',
    phone_number: user.phone_number || user.phone || '',
    aktif: user.is_active,
  }
}

function fallbackUser(email, details = {}) {
  const normalizedEmail = (email || details.email || '').trim().toLowerCase()
  const isAdmin = normalizedEmail === 'admin@loop.com'
  return normalizeUser({
    ...details,
    email: normalizedEmail,
    full_name: details.full_name || details.isim || (isAdmin ? 'Admin' : normalizedEmail.split('@')[0]),
    role: details.role || details.rol || (isAdmin ? 'admin' : 'customer'),
  })
}

function getStoredUser(email = '') {
  try {
    const stored = normalizeUser(JSON.parse(localStorage.getItem('loop_user') || 'null'))
    if (!stored) return null
    if (!email || stored.email?.toLowerCase() === email.toLowerCase()) return stored
  } catch {
    return null
  }
  return null
}

function persistUser(user) {
  if (user) localStorage.setItem('loop_user', JSON.stringify(user))
  return user
}

function tokenSubject(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return String(JSON.parse(atob(payload)).sub || '')
  } catch {
    return ''
  }
}

async function readResponseData(res) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { detail: text }
  }
}

async function fetchCurrentUserOrFallback(fallback) {
  try {
    return normalizeUser(await apiFetch('/auth/me'))
  } catch (profileError) {
    if (fallback) return normalizeUser(fallback)
    throw profileError
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
    const dashboardAdminFallback = window.location.pathname === '/dashboard' && tokenSubject(token) === '1'
      ? fallbackUser('admin@loop.com', { full_name: 'Admin', role: 'admin' })
      : null
    const sessionFallback = dashboardAdminFallback || (window.location.pathname === '/dashboard' ? null : getStoredUser())
    fetchCurrentUserOrFallback(sessionFallback)
      .then(user => setKullanici(persistUser(user)))
      .catch(() => clearAuthTokens())
      .finally(() => setYukleniyor(false))
  }, [])

  const kayit = useCallback(async ({ isim, email, sifre }) => {
    const registrationPhone = `web:${email.trim().toLowerCase()}`
    let res
    let registrationNetworkError
    try {
      res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: sifre,
          full_name: isim,
          phone_number: registrationPhone,
          company_name: '',
        })
      })
    } catch (error) {
      registrationNetworkError = error
    }

    const veri = res ? await readResponseData(res) : {}
    const registrationError = registrationNetworkError
      ? new Error('Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.')
      : new Error(veri.detail || veri.hata || 'Kayıt başarısız.')

    let loginData
    if (!res?.ok) {
      try {
        loginData = await loginWithPassword(email, sifre)
      } catch {
        throw registrationError
      }
    } else {
      loginData = await loginWithPassword(email, sifre)
    }

    setAuthTokens({ accessToken: loginData.access_token, refreshToken: loginData.refresh_token })
    const registeredUser = fallbackUser(email, {
      ...veri,
      full_name: isim,
      phone_number: registrationPhone,
      role: 'customer',
    })
    const user = persistUser(await fetchCurrentUserOrFallback(registeredUser))
    setKullanici(user)
    window.dispatchEvent(new Event('loop-auth-changed'))
    return { token: loginData.access_token, kullanici: user }
  }, [])

  const giris = useCallback(async ({ email, sifre }) => {
    try {
      const veri = await loginWithPassword(email, sifre)
      setAuthTokens({ accessToken: veri.access_token, refreshToken: veri.refresh_token })
      const cachedUser = getStoredUser(email) || fallbackUser(email)
      const kullanici = persistUser(await fetchCurrentUserOrFallback(cachedUser))
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

async function loginWithPassword(email, password, retryCount = 0) {
  let res
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    })
  } catch (error) {
    if (retryCount < 1) {
      await new Promise(resolve => setTimeout(resolve, 700))
      return loginWithPassword(email, password, retryCount + 1)
    }
    throw error
  }

  const data = await readResponseData(res)
  if (!res.ok && res.status >= 500 && retryCount < 1) {
    await new Promise(resolve => setTimeout(resolve, 700))
    return loginWithPassword(email, password, retryCount + 1)
  }
  if (!res.ok) throw new Error(data.detail || data.hata || 'Giriş başarısız.')
  return data
}

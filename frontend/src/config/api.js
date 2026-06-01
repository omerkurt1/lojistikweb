export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'https://loop-ieee.onrender.com'
export const API_URL = import.meta.env.VITE_API_URL || `${API_ORIGIN}/api`
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ORIGIN

export function getAccessToken() {
  return localStorage.getItem('loop_token') || localStorage.getItem('loop_access_token') || ''
}

export function getRefreshToken() {
  return localStorage.getItem('loop_refresh_token') || ''
}

export function setAuthTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem('loop_token', accessToken)
    localStorage.setItem('loop_access_token', accessToken)
  }
  if (refreshToken) localStorage.setItem('loop_refresh_token', refreshToken)
  window.dispatchEvent(new Event('loop-auth-changed'))
}

export function clearAuthTokens() {
  localStorage.removeItem('loop_token')
  localStorage.removeItem('loop_access_token')
  localStorage.removeItem('loop_refresh_token')
  localStorage.removeItem('loop_user')
  window.dispatchEvent(new Event('loop-auth-changed'))
}

export function authHeaders(extra = {}) {
  const token = getAccessToken()
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`
  const headers = authHeaders(options.headers || {})
  const res = await fetch(url, { ...options, headers })
  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    const detail = data?.detail
    const message = Array.isArray(detail)
      ? detail.map(item => item.msg).join(', ')
      : detail || data?.message || data?.hata || data?.error || `Request failed (${res.status})`
    throw new Error(message)
  }

  return data
}

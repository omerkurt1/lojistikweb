// src/components/Navbar.jsx
// Auth-aware top navigation bar — mounted via PublicLayout in App.jsx
// DIRECTIVE 3: Partner Network relocated to primary nav with consistent styling.
// All labels use t() translations from SettingsContext.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

const FF  = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFD = "'Bebas Neue', sans-serif"
const NAVY = '#060c1a'
const ACCENT_PRIMARY = '#2F6F73'
const ACCENT_SECONDARY = '#4B8A8F'
const ACCENT_SOFT = 'rgba(47, 111, 115, 0.14)'
const ACCENT_BORDER = 'rgba(47, 111, 115, 0.42)'
const ACCENT_SHADOW = 'rgba(47, 111, 115, 0.28)'
const ACCENT_TEXT_ON_SOLID = '#F6FBFC'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function Navbar() {
  const { kullanici } = useAuth()
  const { isDark, t } = useSettings()
  const navigate      = useNavigate()
  const { pathname }  = useLocation()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [menuOpen, setMenuOpen] = useState(false)

  const partnerPageOnlyLogo = pathname === '/partnerler'

  useEffect(() => {
    const onResize = () => {
      const nextMobile = window.innerWidth < 768
      setIsMobile(nextMobile)
      if (!nextMobile) setMenuOpen(false)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Standard link color — consistent across ALL nav items (Directive 3: no unique Partner styling)
  const linkColor = isDark ? '#6a7fa8' : '#5a6a8a'

  // Navigation items — Partner Network alongside Features, Operations, Why Us
  const navLinks = [
    { href: '#features',   label: t('features')   || (isDark ? 'Features' : 'Features'),   scroll: true },
    { href: '#operations', label: t('operations')  || 'Operations',   scroll: true },
    { href: '/partnerler', label: t('partnerNet'), scroll: false },
    { href: '#why-us',     label: t('whyUs')       || (isDark ? 'Why Us' : 'Why Us'),       scroll: true },
  ]

  if (partnerPageOnlyLogo) {
    return (
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        padding: isMobile ? '0 18px' : '0 32px',
        background: isDark ? 'rgba(6,12,26,0.92)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        fontFamily: FF,
        boxSizing: 'border-box',
      }}>
        <Link to="/" style={{ fontFamily: FFD, fontSize: 30, letterSpacing: 1, color: isDark ? '#e8f0ff' : '#0a1628', textDecoration: 'none', lineHeight: 1 }}>
          LOOP<span style={{ color: ACCENT_PRIMARY }}>.</span>
        </Link>
      </nav>
    )
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 16px' : '0 48px',
      background: isDark ? 'rgba(6,12,26,0.92)' : 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      fontFamily: FF,
      boxSizing: 'border-box',
    }}>

      {/* ── LEFT: Logo + links ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Link to="/" style={{ fontFamily: FFD, fontSize: 30, letterSpacing: 1, color: isDark ? '#e8f0ff' : '#0a1628', textDecoration: 'none', lineHeight: 1 }}>
          LOOP<span style={{ color: ACCENT_PRIMARY }}>.</span>
        </Link>
        <ul style={{ display: isMobile ? 'none' : 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
          {navLinks.map(item => (
            <li key={item.href}>
              {item.scroll ? (
                <a
                  href={item.href}
                  style={{ color: linkColor, textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  style={{ color: linkColor, textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ── RIGHT: Auth-aware CTA ── */}
      <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 10 }}>

        {kullanici ? (
          /* ══ LOGGED IN: Avatar pill linking to /profil ══ */
          <Link
            to="/profil"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '7px 14px 7px 7px', borderRadius: 40,
              background: ACCENT_SOFT,
              border: `1.5px solid ${ACCENT_BORDER}`,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT_PRIMARY}, ${ACCENT_SECONDARY})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: ACCENT_TEXT_ON_SOLID,
              boxShadow: `0 0 8px ${ACCENT_SHADOW}`,
            }}>
              {initials(kullanici.isim)}
            </div>
            {/* Name + CTA text */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#e8f0ff' : '#0a1628', lineHeight: 1.2 }}>
                {kullanici.isim}
              </div>
              <div style={{ fontSize: 11, color: ACCENT_PRIMARY, fontWeight: 600, marginTop: 1 }}>
                {t('profile')} &rarr;
              </div>
            </div>
          </Link>
        ) : (
          /* ══ LOGGED OUT: Login ══ */
          <>
            <Link
              to="/giris"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8,
                background: 'transparent',
                border: `1px solid ${ACCENT_BORDER}`,
                color: ACCENT_PRIMARY, fontFamily: FF, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.05em', textDecoration: 'none',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT_PRIMARY, boxShadow: `0 0 6px ${ACCENT_SHADOW}`, flexShrink: 0 }} />
              {t('login')}
            </Link>
          </>
        )}

        <button
          onClick={() => navigate('/partnerler')}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: kullanici ? '8px 16px' : '9px 22px',
            borderRadius: 8,
            background: `linear-gradient(135deg, ${ACCENT_PRIMARY} 0%, ${ACCENT_SECONDARY} 100%)`,
            border: 'none', color: ACCENT_TEXT_ON_SOLID, fontFamily: FF,
            fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
            cursor: 'pointer', boxShadow: `0 4px 16px ${ACCENT_SHADOW}`,
            whiteSpace: 'nowrap',
          }}
        >
          {t('getStarted')}
        </button>
      </div>

      {isMobile && (
        <>
          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              border: isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(10,22,40,0.12)',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(10,22,40,0.03)',
              color: isDark ? '#e8f0ff' : '#0a1628',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <span style={{ width: 18, height: 2, borderRadius: 2, background: 'currentColor' }} />
            <span style={{ width: 18, height: 2, borderRadius: 2, background: 'currentColor' }} />
            <span style={{ width: 18, height: 2, borderRadius: 2, background: 'currentColor' }} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'fixed',
                top: 72,
                left: 0,
                right: 0,
                zIndex: 9998,
                padding: '12px 16px 16px',
                background: isDark ? 'rgba(6,12,26,0.98)' : 'rgba(255,255,255,0.98)',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: isDark ? '0 18px 32px rgba(0,0,0,0.32)' : '0 18px 32px rgba(10,22,40,0.10)',
                fontFamily: FF,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {navLinks.map(item => (
                  item.scroll ? (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        color: isDark ? '#e8f0ff' : '#0a1628',
                        textDecoration: 'none',
                        fontSize: 15,
                        fontWeight: 700,
                        padding: '12px 10px',
                        borderRadius: 8,
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        color: isDark ? '#e8f0ff' : '#0a1628',
                        textDecoration: 'none',
                        fontSize: 15,
                        fontWeight: 700,
                        padding: '12px 10px',
                        borderRadius: 8,
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                ))}

                <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,22,40,0.08)', margin: '4px 0' }} />

                {kullanici ? (
                  <Link
                    to="/profil"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 10px',
                      borderRadius: 8,
                      background: ACCENT_SOFT,
                      border: `1px solid ${ACCENT_BORDER}`,
                      textDecoration: 'none',
                      color: isDark ? '#e8f0ff' : '#0a1628',
                      fontWeight: 800,
                    }}
                  >
                    <span style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${ACCENT_PRIMARY}, ${ACCENT_SECONDARY})`,
                      color: ACCENT_TEXT_ON_SOLID,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 900,
                    }}>
                      {initials(kullanici.isim)}
                    </span>
                    {t('profile')}
                  </Link>
                ) : (
                  <Link
                    to="/giris"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 8,
                      border: `1px solid ${ACCENT_BORDER}`,
                      color: ACCENT_PRIMARY,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {t('login')}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/partnerler')
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 12px',
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${ACCENT_PRIMARY} 0%, ${ACCENT_SECONDARY} 100%)`,
                    border: 'none',
                    color: ACCENT_TEXT_ON_SOLID,
                    fontFamily: FF,
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  {t('getStarted')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  )
}

// src/components/Navbar.jsx
// Auth-aware top navigation bar — mounted via PublicLayout in App.jsx
// NO modal state. NO hidden CSS. Explicit conditional rendering.
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

const FF  = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFD = "'Bebas Neue', sans-serif"
const NAVY = '#060c1a'
const CYAN = '#00d4ff'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function Navbar() {
  const { kullanici } = useAuth()
  const { isDark }    = useSettings()
  const navigate      = useNavigate()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px',
      background: isDark ? 'rgba(6,12,26,0.92)' : 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      fontFamily: FF,
      boxSizing: 'border-box',
    }}>

      {/* ── LEFT: Logo + links ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Link to="/" style={{ fontFamily: FFD, fontSize: 30, letterSpacing: 1, color: isDark ? '#e8f0ff' : '#0a1628', textDecoration: 'none', lineHeight: 1 }}>
          LOOP<span style={{ color: CYAN }}>.</span>
        </Link>
        <ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
          {[
            { href: '/partnerler', label: 'Partner Ağı' },
            { href: '/takip',      label: 'Kargo Takip'  },
            { href: '/giris',      label: 'Operasyon'    },
          ].map(item => (
            <li key={item.href}>
              <Link
                to={item.href}
                style={{ color: isDark ? '#6a7fa8' : '#5a6a8a', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ── RIGHT: Auth-aware CTA ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {kullanici ? (
          /* ══ LOGGED IN: Avatar pill linking to /profil ══ */
          <Link
            to="/profil"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '7px 16px 7px 7px', borderRadius: 40,
              background: isDark ? 'rgba(0,212,255,0.08)' : 'rgba(0,212,255,0.06)',
              border: `1.5px solid ${CYAN}40`,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${CYAN}, #0062ff)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: NAVY,
              boxShadow: `0 0 12px ${CYAN}50`,
            }}>
              {initials(kullanici.isim)}
            </div>
            {/* Name + CTA text */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#e8f0ff' : '#0a1628', lineHeight: 1.2 }}>
                {kullanici.isim}
              </div>
              <div style={{ fontSize: 11, color: CYAN, fontWeight: 600, marginTop: 1 }}>
                Profilim &rarr;
              </div>
            </div>
          </Link>
        ) : (
          /* ══ LOGGED OUT: Login + Get Started ══ */
          <>
            <Link
              to="/giris"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8,
                background: 'transparent',
                border: `1px solid ${CYAN}40`,
                color: CYAN, fontFamily: FF, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.05em', textDecoration: 'none',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, boxShadow: `0 0 6px ${CYAN}`, flexShrink: 0 }} />
              MÜŞTERİ GİRİŞİ
            </Link>

            <button
              onClick={() => navigate('/partnerler')}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '9px 22px', borderRadius: 8,
                background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
                border: 'none', color: NAVY, fontFamily: FF,
                fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
                cursor: 'pointer', boxShadow: `0 4px 16px ${CYAN}40`,
              }}
            >
              HEMEN BAŞLA
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

// src/components/Navbar.jsx
// Public landing page navbar — auth-aware, no modal state whatsoever
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FF  = "'Plus Jakarta Sans', sans-serif"
const FFD = "'Bebas Neue', sans-serif"
const NAVY = '#060c1a'
const CYAN = '#00d4ff'

// ─── Helper ───────────────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function Navbar() {
  const { kullanici } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={navStyle}>
        {/* Left: Logo + links */}
        <div style={navSolStyle}>
          <Link to="/" style={logoStyle}>
            LOOP<span style={{ color: CYAN }}>.</span>
          </Link>
          <ul style={navLinksStyle}>
            <li><a href="#ozellikler" style={linkStyle}>Özellikler</a></li>
            <li><a href="#operasyon"  style={linkStyle}>Operasyon</a></li>
            <li><a href="#partnerler" style={linkStyle}>Partner Ağı</a></li>
            <li><a href="#iletisim"   style={linkStyle}>İletişim</a></li>
          </ul>
        </div>

        {/* Right: Auth-aware CTA */}
        <div style={navSagStyle}>
          {kullanici ? (
            /* ── LOGGED IN: Avatar pill → /profil ── */
            <Link to="/profil" style={avatarPillStyle} title="Profilim">
              <div style={avatarCircleStyle}>
                {initials(kullanici.isim)}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e8f0ff', lineHeight: 1.2 }}>
                  {kullanici.isim}
                </div>
                <div style={{ fontSize: 10, color: CYAN, letterSpacing: '0.04em' }}>
                  Profilim →
                </div>
              </div>
            </Link>
          ) : (
            /* ── LOGGED OUT: Login + Get Started ── */
            <>
              <Link to="/giris" style={girisBtnStyle}>
                <div style={girisDotStyle} />
                MÜŞTERİ GİRİŞİ
              </Link>
              <button
                onClick={() => navigate('/partnerler')}
                style={getStartedBtnStyle}
              >
                HEMEN BAŞLA
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ══════════════ HERO SECTION ══════════════ */}
      <section style={heroStyle} id="hero">
        <div style={orb1Style} />
        <div style={orb2Style} />

        <div style={heroBadgeStyle}>
          <div style={badgeDotStyle} />
          YENİ NESİL LOJİSTİK YÖNETİMİ
        </div>

        <h1 style={heroTitleStyle}>
          OPERASYONLARI{' '}
          <span style={heroTitleLine2Style}>OTOPİLOTA ALIN</span>
        </h1>

        <p style={heroSubStyle}>
          Saha operasyonlarınızı kör uçuştan kurtarın. Maliyetleri kısın, kurye takibi ile SLA oranlarınızı zirveye taşıyın.
        </p>

        <div style={heroCtaRowStyle}>
          {kullanici ? (
            <Link to="/" style={btnPrimaryStyle}>
              Dashboard'a Git
            </Link>
          ) : (
            <Link to="/giris" style={btnPrimaryStyle}>
              Sisteme Giriş Yapın
            </Link>
          )}
          <button style={btnSecondaryStyle}>
            Platform Demosu İste
          </button>
        </div>
      </section>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const navStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 48px', height: 72,
  background: 'rgba(6, 12, 26, 0.88)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  fontFamily: FF,
}

const navSolStyle = { display: 'flex', alignItems: 'center', gap: 40 }

const logoStyle = {
  fontFamily: FFD, fontSize: 32, letterSpacing: 1,
  color: '#e8f0ff', textDecoration: 'none',
}

const navLinksStyle = { display: 'flex', gap: 36, listStyle: 'none', margin: 0, padding: 0 }
const linkStyle = {
  color: '#6a7fa8', textDecoration: 'none', fontSize: 14, fontWeight: 500,
  transition: 'color 0.2s',
}

const navSagStyle = { display: 'flex', alignItems: 'center', gap: 14 }

/* ── Logged-in avatar pill ── */
const avatarPillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  padding: '6px 14px 6px 6px', borderRadius: 40,
  background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
  textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
}

const avatarCircleStyle = {
  width: 32, height: 32, borderRadius: '50%',
  background: `linear-gradient(135deg, ${CYAN}, #0062ff)`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 13, fontWeight: 900, color: NAVY, flexShrink: 0,
  boxShadow: `0 0 12px rgba(0,212,255,0.3)`,
}

/* ── Logged-out buttons ── */
const girisBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 16px', borderRadius: 8,
  background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)',
  color: CYAN, fontFamily: FF, fontSize: 12, fontWeight: 700,
  letterSpacing: '0.05em', textDecoration: 'none',
  transition: 'all 0.2s', cursor: 'pointer',
}

const girisDotStyle = {
  width: 6, height: 6, borderRadius: '50%',
  background: CYAN, boxShadow: `0 0 8px ${CYAN}`,
}

const getStartedBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '9px 24px', borderRadius: 8,
  background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
  border: 'none', color: NAVY, fontFamily: FF, fontSize: 13, fontWeight: 800,
  letterSpacing: '0.05em', textDecoration: 'none',
  boxShadow: `0 4px 16px rgba(0,212,255,0.25)`, cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.2s',
}

/* ── Hero ── */
const heroStyle = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
  padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
  background: NAVY, color: '#e8f0ff', fontFamily: FF,
}

const orb1Style = {
  position: 'absolute', width: 500, height: 500, borderRadius: '50%',
  background: 'rgba(0,212,255,0.07)', filter: 'blur(80px)',
  top: -100, left: -100, pointerEvents: 'none',
}

const orb2Style = {
  position: 'absolute', width: 400, height: 400, borderRadius: '50%',
  background: 'rgba(0,212,255,0.04)', filter: 'blur(80px)',
  bottom: -80, right: -80, pointerEvents: 'none',
}

const heroBadgeStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
  color: CYAN, padding: '6px 16px', borderRadius: 40,
  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  marginBottom: 32, zIndex: 10,
}

const badgeDotStyle = {
  width: 6, height: 6, background: CYAN,
  borderRadius: '50%', boxShadow: `0 0 6px ${CYAN}`,
}

const heroTitleStyle = {
  fontFamily: FFD, fontSize: 'clamp(64px, 10vw, 120px)',
  lineHeight: 0.95, letterSpacing: 2, zIndex: 10, margin: 0,
}

const heroTitleLine2Style = {
  color: CYAN, display: 'block',
  WebkitTextStroke: '1px rgba(0,212,255,0.4)',
  textShadow: '0 0 60px rgba(0,212,255,0.3)',
}

const heroSubStyle = {
  maxWidth: 560, color: '#6a7fa8', fontSize: 18,
  lineHeight: 1.7, margin: '28px auto 0', zIndex: 10,
}

const heroCtaRowStyle = {
  display: 'flex', gap: 16, alignItems: 'center',
  marginTop: 40, zIndex: 10,
}

const btnPrimaryStyle = {
  background: CYAN, color: NAVY, border: 'none',
  padding: '16px 36px', borderRadius: 10,
  fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'inline-block',
  transition: 'transform 0.15s, box-shadow 0.2s', cursor: 'pointer',
  boxShadow: `0 6px 24px rgba(0,212,255,0.3)`,
}

const btnSecondaryStyle = {
  background: 'transparent', color: '#e8f0ff',
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '16px 36px', borderRadius: 10, fontSize: 16, fontWeight: 600,
  cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s',
}

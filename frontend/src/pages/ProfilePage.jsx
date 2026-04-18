// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FF = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFD = "'Bebas Neue', sans-serif"
const CYAN = '#00d4ff'
const NAVY = '#060c1a'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const SVG_User     = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const SVG_Mail     = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
const SVG_Shield   = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const SVG_LogOut   = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
const SVG_Back     = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const SVG_Activity = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const SVG_Settings = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>

// ─── Helper: initials from name ────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { kullanici, cikis, dark, toggleTheme } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profil')

  const isAdmin = kullanici?.email === 'patron@loop.com' || kullanici?.rol === 'admin'

  // Redirect to login if not authenticated
  if (!kullanici) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={notAuthCardStyle}>
          <div style={{ color: CYAN, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{SVG_Shield}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: dark ? '#e8f0ff' : '#0a1628', marginBottom: 8 }}>Giriş Gerekli</div>
          <div style={{ fontSize: 13, color: '#6a7fa8', marginBottom: 24 }}>Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</div>
          <Link to="/giris" style={ctaBtnStyle}>Giriş Yap</Link>
        </div>
      </div>
    )
  }

  const t = dark ? darkTokens : lightTokens

  const handleCikis = () => {
    cikis()
    navigate('/')
  }

  return (
    <div style={{ ...pageStyle, background: t.bg, color: t.text, fontFamily: FF }}>
      {/* ── Top Navbar ── */}
      <nav style={{ ...navStyle, background: t.navBg, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ ...backBtnStyle, color: t.textMuted, background: t.cardBg, border: `1px solid ${t.border}` }}>
            {SVG_Back} Geri
          </button>
          <Link to="/" style={{ fontFamily: FFD, fontSize: 24, color: t.text, textDecoration: 'none', letterSpacing: 1 }}>
            LOOP<span style={{ color: CYAN }}>.</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} title="Tema Değiştir" style={{ ...themeToggleStyle, background: dark ? 'rgba(0,212,255,0.15)' : '#e2e8f0', border: `1px solid ${t.border}` }}>
            <div style={{ ...themeKnobStyle, left: dark ? 18 : 2, background: dark ? CYAN : '#94a3b8' }} />
          </button>
          <button onClick={handleCikis} style={{ ...logoutBtnStyle, color: '#ff4757', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}>
            {SVG_LogOut} Çıkış Yap
          </button>
        </div>
      </nav>

      {/* ── Page Body ── */}
      <div style={bodyStyle}>

        {/* ── LEFT: Avatar Card ── */}
        <aside style={{ ...avatarCardStyle, background: t.cardBg, border: `1px solid ${t.border}` }}>
          {/* Avatar */}
          <div style={avatarRingStyle}>
            <div style={avatarStyle}>
              {initials(kullanici.isim)}
            </div>
          </div>

          {/* Name & Email */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.text }}>{kullanici.isim}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, color: t.textMuted, fontSize: 13 }}>
              {SVG_Mail}
              {kullanici.email}
            </div>
            {isAdmin && (
              <div style={adminBadgeStyle}>
                {SVG_Shield} ADMIN
              </div>
            )}
          </div>

          <div style={{ width: '100%', height: 1, background: t.border, margin: '24px 0' }} />

          {/* Nav Links */}
          {[
            { key: 'profil',    label: 'Profil Bilgileri', icon: SVG_User },
            { key: 'aktivite', label: 'Aktivite',          icon: SVG_Activity },
            ...(isAdmin ? [{ key: 'admin', label: 'Admin Paneli', icon: SVG_Settings }] : []),
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                ...sideTabStyle,
                background: activeTab === item.key ? `${CYAN}15` : 'transparent',
                borderLeft: `3px solid ${activeTab === item.key ? CYAN : 'transparent'}`,
                color: activeTab === item.key ? CYAN : t.textMuted,
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            <button onClick={handleCikis} style={{ ...fullLogoutBtnStyle, border: `1px solid rgba(255,71,87,0.25)` }}>
              {SVG_LogOut} Oturumu Kapat
            </button>
          </div>
        </aside>

        {/* ── RIGHT: Main Content Area ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* ── TAB: Profil ── */}
          {activeTab === 'profil' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ ...sectionCardStyle, background: t.cardBg, border: `1px solid ${t.border}` }}>
                <div style={sectionTitleStyle}>Hesap Bilgileri</div>
                <div style={fieldGridStyle}>
                  {[
                    { label: 'Ad Soyad',     value: kullanici.isim  },
                    { label: 'E-Posta',      value: kullanici.email },
                    { label: 'Rol',          value: isAdmin ? 'Sistem Yöneticisi' : 'Operatör' },
                    { label: 'Hesap Durumu', value: 'Aktif' },
                  ].map(f => (
                    <div key={f.label} style={{ ...fieldStyle, background: t.inputBg, border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session / Token info */}
              <div style={{ ...sectionCardStyle, background: t.cardBg, border: `1px solid ${t.border}` }}>
                <div style={sectionTitleStyle}>Oturum Güvenliği</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Oturum Durumu', value: 'Aktif & Kimliği Doğrulandı', color: '#2ed573' },
                    { label: 'Token Türü',    value: 'JWT Bearer',                 color: CYAN },
                    { label: 'Platform',      value: 'LOOP Command Center v2',     color: t.text },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                      <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── TAB: Aktivite ── */}
          {activeTab === 'aktivite' && (
            <div style={{ ...sectionCardStyle, background: t.cardBg, border: `1px solid ${t.border}` }}>
              <div style={sectionTitleStyle}>Son Aktiviteler</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Dashboard erişimi',         time: 'Az önce',  dot: '#2ed573' },
                  { label: 'Partner Network görüntülendi',time: '12 dk önce', dot: CYAN },
                  { label: 'Rota optimizasyonu tetiklendi', time: '1 saat önce', dot: '#ff9f1c' },
                  { label: 'Anomali incelendi — A1',    time: 'Bugün 14:22', dot: '#ff4757' },
                  { label: 'Sistem girişi',             time: 'Bugün',    dot: '#2ed573' },
                ].map((act, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.dot, flexShrink: 0, boxShadow: `0 0 6px ${act.dot}` }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: t.text }}>{act.label}</span>
                    <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Admin (only visible to admin) ── */}
          {activeTab === 'admin' && isAdmin && (
            <div style={{ ...sectionCardStyle, background: t.cardBg, border: `1px solid ${t.border}` }}>
              <div style={sectionTitleStyle}>Yönetici Paneli</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Toplam Kullanıcı',  value: '—',  color: CYAN },
                  { label: 'Aktif Oturum',      value: '1',  color: '#2ed573' },
                  { label: 'Partner Sayısı',    value: '6',  color: '#ff9f1c' },
                  { label: 'API Çağrısı / gün', value: '—',  color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <Link to="/" style={{ ...ctaBtnStyle, display: 'inline-flex', textDecoration: 'none' }}>
                God Mode Dashboard'a Dön
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Theme Tokens ──────────────────────────────────────────────────────────────
const darkTokens = {
  bg: '#0b1120', navBg: 'rgba(11,17,32,0.95)', text: '#e8f0ff',
  textMuted: '#6a7fa8', cardBg: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)', inputBg: 'rgba(255,255,255,0.05)',
}
const lightTokens = {
  bg: '#f0f4ff', navBg: 'rgba(255,255,255,0.97)', text: '#0a1628',
  textMuted: '#5a6a8a', cardBg: '#ffffff',
  border: '#e8ecf8', inputBg: '#f5f7ff',
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100vh', fontFamily: FF,
}

const navStyle = {
  position: 'sticky', top: 0, zIndex: 100,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 40px', height: 64,
  backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
}

const bodyStyle = {
  display: 'flex', gap: 24, padding: '40px',
  maxWidth: 1100, margin: '0 auto',
  alignItems: 'flex-start',
}

const avatarCardStyle = {
  width: 280, flexShrink: 0, borderRadius: 20,
  padding: '32px 24px', display: 'flex', flexDirection: 'column',
  alignItems: 'center',
}

const avatarRingStyle = {
  width: 88, height: 88, borderRadius: '50%',
  background: `linear-gradient(135deg, ${CYAN}, #0062ff)`,
  padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: `0 0 24px rgba(0,212,255,0.3)`,
}

const avatarStyle = {
  width: '100%', height: '100%', borderRadius: '50%',
  background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 28, fontWeight: 900, color: CYAN, letterSpacing: -1,
}

const adminBadgeStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
  background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
  color: CYAN, padding: '4px 12px', borderRadius: 40,
  fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
}

const sideTabStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', borderRadius: 8, marginBottom: 4,
  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  fontFamily: FF, textAlign: 'left', transition: 'all 0.2s',
}

const fullLogoutBtnStyle = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px 0', borderRadius: 10, background: 'rgba(255,71,87,0.06)',
  color: '#ff4757', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
}

const sectionCardStyle = {
  borderRadius: 16, padding: '24px 28px',
}

const sectionTitleStyle = {
  fontSize: 15, fontWeight: 800, marginBottom: 18,
  letterSpacing: '-0.01em',
}

const fieldGridStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
}

const fieldStyle = {
  borderRadius: 10, padding: '12px 14px',
}

const backBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8,
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF,
}

const logoutBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8,
  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
  letterSpacing: '0.02em',
}

const themeToggleStyle = {
  width: 36, height: 20, borderRadius: 12, padding: 0, cursor: 'pointer',
  position: 'relative', transition: 'background 0.3s',
}

const themeKnobStyle = {
  width: 16, height: 16, borderRadius: '50%',
  position: 'absolute', top: 2,
  transition: 'left 0.3s, background 0.3s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
}

const ctaBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, padding: '12px 28px', borderRadius: 10,
  background: `linear-gradient(135deg, ${CYAN}, #0062ff)`,
  color: NAVY, fontSize: 13, fontWeight: 800,
  border: 'none', cursor: 'pointer', boxShadow: `0 6px 20px rgba(0,212,255,0.3)`,
}

const notAuthCardStyle = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20, padding: '48px 40px', textAlign: 'center',
  fontFamily: FF, maxWidth: 360,
}

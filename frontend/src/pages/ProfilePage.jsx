// src/pages/ProfilePage.jsx
// LOOP Account Settings — DIRECTIVE 1
// Glassmorphic dark-navy design ported from the HTML/Tailwind template.
// Dark Mode toggle + Language selector wired directly to SettingsContext.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

const FF   = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFH  = "'Space Grotesk','Inter',sans-serif"
const CYAN = '#2F6F73'
const ACCENT_SECONDARY = '#4B8A8F'
const ACCENT_SHADOW = 'rgba(47, 111, 115, 0.28)'
const ACCENT_TEXT_ON_SOLID = '#F6FBFC'
const VITRIN_LOGIN_URL = 'https://lojistikweb-vitrin.vercel.app/#giris'
const NAVY = '#060c1a'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ICO = {
  person:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  tune:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="12" y2="12"/><line x1="18" x2="22" y1="16" y2="16"/></svg>,
  activity: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  shield:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logout:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  support:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  dark:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  lang:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  edit:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  biz:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  badge:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/></svg>,
  notif:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  help:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  check:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

// ─── Theme Token Maps ───────────────────────────────────────────────────────
function tk(isDark) {
  if (isDark) return {
    pageBg:    '#0d1515',
    surfaceLo: '#151d1e',
    surface:   '#0d1515',
    surfaceHi: '#232b2c',
    surfaceC:  '#192122',
    text:      '#dce4e4',
    textMuted: '#b9cacb',
    textDim:   '#849495',
    border:    'rgba(255,255,255,0.06)',
    borderV:   '#3a494b',
    accent:    '#2F6F73',
    accentDim: 'rgba(47,111,115,0.14)',
    accentBg:  'rgba(47,111,115,0.08)',
    teal:      '#2dd4bf',
    tealBg:    'rgba(45,212,191,0.10)',
    tealBorder:'rgba(45,212,191,0.20)',
    danger:    '#ff4757',
    success:   '#2ed573',
    warn:      '#ff9f1c',
    purple:    '#a78bfa',
    navBg:     'rgba(15,23,42,0.60)',
    sidebarBg: 'rgba(15,23,42,0.40)',
    glassBg:   'rgba(30,41,59,0.40)',
    glassBorder: 'rgba(255,255,255,0.05)',
    glassGlow: '0 0 10px rgba(47,111,115,0.22)',
    inputBg:   '#0d1515',
  }
  return {
    pageBg:    '#f0f4ff',
    surfaceLo: '#f8faff',
    surface:   '#ffffff',
    surfaceHi: '#e8ecf8',
    surfaceC:  '#f5f7ff',
    text:      '#0a1628',
    textMuted: '#5a6a8a',
    textDim:   '#8a9abc',
    border:    'rgba(0,0,0,0.08)',
    borderV:   '#e8ecf8',
    accent:    '#2F6F73',
    accentDim: 'rgba(47,111,115,0.10)',
    accentBg:  'rgba(47,111,115,0.06)',
    teal:      '#0d9488',
    tealBg:    'rgba(13,148,136,0.08)',
    tealBorder:'rgba(13,148,136,0.20)',
    danger:    '#dc3545',
    success:   '#27ae60',
    warn:      '#e67e22',
    purple:    '#7c3aed',
    navBg:     'rgba(255,255,255,0.96)',
    sidebarBg: 'rgba(248,250,255,0.95)',
    glassBg:   'rgba(255,255,255,0.80)',
    glassBorder: 'rgba(0,0,0,0.06)',
    glassGlow: '0 0 10px rgba(47,111,115,0.16)',
    inputBg:   '#ffffff',
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { kullanici, cikis }              = useAuth()
  const { isDark, theme, setTheme, language, setLanguage, t } = useSettings()
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast] = useState('')

  const c       = tk(isDark)
  const isAdmin = (kullanici?.email || '').toLowerCase() === 'admin@loop.com' || (kullanici?.rol || '').toLowerCase() === 'admin'

  // ── Form state — initialized from auth ──
  const [form, setForm] = useState({
    firstName: kullanici?.isim?.split(' ')[0] || '',
    lastName:  kullanici?.isim?.split(' ').slice(1).join(' ') || '',
    email:     kullanici?.email || '',
    phone:     kullanici?.phone_number || kullanici?.phone || '',
  })
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Not authenticated gate ──
  if (!kullanici) {
    return (
      <div style={{ minHeight: '100vh', background: c.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FF }}>
        <div style={{ borderRadius: 20, padding: '48px 40px', textAlign: 'center', maxWidth: 360, background: c.surfaceC, border: `1px solid ${c.borderV}` }}>
          <div style={{ color: c.accent, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{ICO.shield}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 8 }}>{t('signInRequired')}</div>
          <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>{t('signInMsg')}</div>
          <a href={VITRIN_LOGIN_URL} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: `linear-gradient(135deg, ${CYAN}, ${ACCENT_SECONDARY})`, color: ACCENT_TEXT_ON_SOLID, fontSize: 13, fontWeight: 800, border: 'none', textDecoration: 'none', boxShadow: `0 6px 20px ${ACCENT_SHADOW}` }}>{t('signIn')}</a>
        </div>
      </div>
    )
  }

  const handleCikis = () => { cikis(); window.location.href = VITRIN_LOGIN_URL }

  // ── Sidebar Tabs ──
  const sidebarTabs = [
    { key: 'general',    label: t('profileInfo'),  icon: ICO.person   },
    { key: 'prefs',      label: t('settings'),     icon: ICO.tune     },
    { key: 'activity',   label: t('activity'),     icon: ICO.activity },
    ...(isAdmin ? [{ key: 'admin', label: t('adminPanel'), icon: ICO.shield }] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: c.pageBg, color: c.text, fontFamily: FF, overflow: 'hidden' }}>

      {/* ═══ Toast ═══ */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 10, background: `${c.success}20`, border: `1px solid ${c.success}40`, color: c.success, fontSize: 13, fontWeight: 700, fontFamily: FF, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'fadeSlideIn 0.3s ease' }}>
          {ICO.check} {toast}
        </div>
      )}

      {/* ═══ TOP NAV BAR ═══ */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: 64,
        background: c.navBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${c.border}`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: c.accent, fontFamily: FFH, textDecoration: 'none' }}>LOOP</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button style={iconBtnStyle(c)} title="Notifications">{ICO.notif}</button>
          <button style={iconBtnStyle(c)} title="Help">{ICO.help}</button>
          <button style={iconBtnStyle(c)} title="Settings">{ICO.settings}</button>
          {/* Avatar */}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${c.accent}, ${ACCENT_SECONDARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', cursor: 'pointer', border: `2px solid ${c.borderV}` }}>
            {initials(kullanici.isim)}
          </div>
        </div>
      </nav>

      {/* ═══ BODY: Sidebar + Main ═══ */}
      <div style={{ display: 'flex', height: '100vh', paddingTop: 64 }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          position: 'fixed', left: 0, top: 64, bottom: 0,
          width: 260, padding: '24px 0',
          background: c.sidebarBg, backdropFilter: 'blur(12px)',
          borderRight: `1px solid ${c.border}`,
          display: 'flex', flexDirection: 'column',
          fontFamily: FFH, zIndex: 40,
        }}>
          {/* Workspace header */}
          <div style={{ padding: '0 20px 20px', borderBottom: `1px solid ${c.border}`, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 6, background: c.surfaceC, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${c.borderV}`, color: c.accent }}>{ICO.biz}</div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text, margin: 0, fontFamily: FFH }}>LOOP Operations</h2>
                <p style={{ fontSize: 12, color: c.textMuted, margin: 0 }}>Command Center v2.4</p>
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sidebarTabs.map(tab => {
              const active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8,
                  background: active ? c.accentDim : 'transparent',
                  borderRight: active ? `2px solid ${c.accent}` : '2px solid transparent',
                  border: 'none', borderLeft: 'none', borderTop: 'none', borderBottom: 'none',
                  ...(active ? { borderRight: `2px solid ${c.accent}` } : {}),
                  color: active ? c.accent : c.textDim,
                  fontSize: 14, fontWeight: 500, fontFamily: FFH, cursor: 'pointer',
                  transition: 'all 0.15s', textAlign: 'left', width: '100%',
                }}>
                  {tab.icon} <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Bottom links */}
          <div style={{ padding: '16px 12px 0', borderTop: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'transparent', border: 'none', color: c.textDim, fontSize: 14, fontWeight: 500, fontFamily: FFH, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              {ICO.support} <span>{language === 'tr' ? 'Destek' : 'Support'}</span>
            </button>
            <button onClick={handleCikis} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'transparent', border: 'none', color: c.textDim, fontSize: 14, fontWeight: 500, fontFamily: FFH, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              {ICO.logout} <span>{t('logout')}</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, marginLeft: 260, overflowY: 'auto', padding: 24, background: c.pageBg }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

            {/* ── Page Header ── */}
            <header style={{ marginBottom: 8 }}>
              <h1 style={{ fontSize: 42, fontWeight: 700, color: c.text, fontFamily: FFH, letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
                {language === 'tr' ? 'Hesap Ayarları' : 'Account Settings'}
              </h1>
              <p style={{ fontSize: 16, color: c.textMuted, marginTop: 8, lineHeight: 1.6 }}>
                {language === 'tr' ? 'Profil, tercih ve güvenlik ayarlarınızı yönetin.' : 'Manage your profile, preferences, and security configurations.'}
              </p>
            </header>

            {/* ═══ USER IDENTITY CARD ═══ */}
            <section style={{ background: c.glassBg, backdropFilter: 'blur(12px)', border: `1px solid ${c.glassBorder}`, borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden' }}>
              {/* Left accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: `linear-gradient(180deg, ${c.accent}, ${c.teal})` }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative', zIndex: 1 }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 96, height: 96, borderRadius: '50%', border: `2px solid ${c.accent}`, padding: 4, background: c.surfaceC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(135deg, ${c.accent}, ${ACCENT_SECONDARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff' }}>
                      {initials(kullanici.isim)}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: '50%', background: c.surfaceC, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${c.borderV}`, color: c.textMuted, cursor: 'pointer' }}>
                    {ICO.edit}
                  </div>
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 28, fontWeight: 600, color: c.text, fontFamily: FFH, margin: 0, lineHeight: 1.2 }}>{kullanici.isim}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.textMuted, fontSize: 14, fontFamily: FFH }}>
                      {ICO.biz} <span>{kullanici?.sirket || kullanici?.company_name || (language === 'tr' ? 'Şirket bilgisi eklenmedi' : 'No company added')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.textMuted, fontSize: 14, fontFamily: FFH }}>
                      {ICO.badge} <span>{isAdmin ? (language === 'tr' ? 'Sistem Yöneticisi' : 'System Administrator') : (language === 'tr' ? 'Operatör' : 'Operations Manager')}</span>
                    </div>
                  </div>
                </div>
                {/* Active Status */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, background: c.tealBg, border: `1px solid ${c.tealBorder}`, color: c.teal, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', flexShrink: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.teal, boxShadow: c.glassGlow }} />
                  {language === 'tr' ? 'Aktif Durum' : 'Active Status'}
                </span>
              </div>
            </section>

            {/* ═══ GENERAL INFO TAB ═══ */}
            {activeTab === 'general' && (<>
              {/* Personal Information Form */}
              <section style={cardStyle(c)}>
                <h3 style={sectionHeadStyle(c)}>{language === 'tr' ? 'Kişisel Bilgiler' : 'Personal Information'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    { key: 'firstName', label: language === 'tr' ? 'Ad' : 'First Name', type: 'text' },
                    { key: 'lastName',  label: language === 'tr' ? 'Soyad' : 'Last Name', type: 'text' },
                    { key: 'email',     label: language === 'tr' ? 'E-Posta Adresi' : 'Email Address', type: 'email' },
                    { key: 'phone',     label: language === 'tr' ? 'Telefon' : 'Phone Number', type: 'tel' },
                  ].map(f => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={labelStyle(c)}>{f.label}</label>
                      <input
                        type={f.type}
                        value={form[f.key]}
                        onChange={e => upd(f.key, e.target.value)}
                        style={inputStyle(c)}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
                  <button onClick={() => showToast(language === 'tr' ? 'Değişiklikler kaydedildi' : 'Changes saved successfully')} style={saveBtnStyle(c)}>
                    {language === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
                  </button>
                </div>
              </section>

              {/* Session Security */}
              <section style={cardStyle(c)}>
                <h3 style={sectionHeadStyle(c)}>{t('sessionSec')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: t('sessionStatus'), value: t('activeVerified'),   color: c.success },
                    { label: t('tokenType'),     value: 'JWT Bearer',          color: c.accent  },
                    { label: t('platform'),      value: 'LOOP Command Center v2', color: c.text },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 8, background: c.pageBg, border: `1px solid ${c.borderV}` }}>
                      <span style={{ fontSize: 13, color: c.textMuted, fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>)}

            {/* ═══ PREFERENCES TAB ═══ */}
            {activeTab === 'prefs' && (
              <section style={cardStyle(c)}>
                <h3 style={sectionHeadStyle(c)}>{language === 'tr' ? 'Arayüz Tercihleri' : 'Interface Preferences'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Dark Mode Toggle */}
                  <div style={prefRowStyle(c)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ color: c.textMuted }}>{ICO.dark}</span>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 500, color: c.text, margin: 0, lineHeight: 1.6 }}>{t('darkMode')}</h4>
                        <p style={{ fontSize: 14, color: c.textMuted, margin: 0, lineHeight: 1.5 }}>
                          {language === 'tr' ? 'Düşük ışık ortamları için koyu tema.' : 'Enable dark operations theme for low-light environments.'}
                        </p>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isDark}
                        onChange={() => setTheme(isDark ? 'light' : 'dark')}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                      <div style={{
                        width: 44, height: 24, borderRadius: 12,
                        background: isDark ? c.accent : c.surfaceHi,
                        border: `1px solid ${c.borderV}`,
                        position: 'relative', transition: 'background 0.3s',
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#fff', border: '1px solid #ccc',
                          position: 'absolute', top: 1, left: isDark ? 22 : 1,
                          transition: 'left 0.3s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Language Selector */}
                  <div style={prefRowStyle(c)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ color: c.textMuted }}>{ICO.lang}</span>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 500, color: c.text, margin: 0, lineHeight: 1.6 }}>{t('language')}</h4>
                        <p style={{ fontSize: 14, color: c.textMuted, margin: 0, lineHeight: 1.5 }}>
                          {language === 'tr' ? 'Birincil dashboard dilini seçin.' : 'Select your primary dashboard language.'}
                        </p>
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        style={{
                          appearance: 'none', MozAppearance: 'none', WebkitAppearance: 'none',
                          background: c.surfaceC, border: `1px solid ${c.borderV}`, color: c.text,
                          fontSize: 14, fontFamily: FF, borderRadius: 6,
                          padding: '8px 36px 8px 14px',
                          cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="en">English (US)</option>
                        <option value="tr">Türkçe</option>
                      </select>
                      <div style={{ pointerEvents: 'none', position: 'absolute', inset: '0 0 0 auto', display: 'flex', alignItems: 'center', paddingRight: 10, color: c.textMuted }}>
                        ▾
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ═══ ACTIVITY TAB ═══ */}
            {activeTab === 'activity' && (
              <section style={cardStyle(c)}>
                <h3 style={sectionHeadStyle(c)}>{t('recentActivity')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: language === 'tr' ? 'Dashboard erişimi'              : 'Dashboard accessed',         time: language === 'tr' ? 'Az önce'    : 'Just now',    dot: c.success },
                    { label: language === 'tr' ? 'Partner Network görüntülendi'   : 'Partner Network viewed',     time: language === 'tr' ? '12 dk önce' : '12 min ago',  dot: c.accent  },
                    { label: language === 'tr' ? 'Rota optimizasyonu tetiklendi'  : 'Route optimization triggered', time: language === 'tr' ? '1 saat önce': '1 hour ago', dot: c.warn    },
                    { label: language === 'tr' ? 'Anomali incelendi — A1'         : 'Anomaly inspected — A1',     time: language === 'tr' ? 'Bugün 14:22': 'Today 14:22', dot: c.danger  },
                    { label: language === 'tr' ? 'Sistem girişi'                  : 'System login',               time: language === 'tr' ? 'Bugün'      : 'Today',       dot: c.success },
                  ].map((act, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: c.pageBg, border: `1px solid ${c.borderV}` }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.dot, flexShrink: 0, boxShadow: `0 0 6px ${act.dot}` }} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: c.text }}>{act.label}</span>
                      <span style={{ fontSize: 12, color: c.textDim, flexShrink: 0 }}>{act.time}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ ADMIN TAB ═══ */}
            {activeTab === 'admin' && isAdmin && (
              <section style={cardStyle(c)}>
                <h3 style={sectionHeadStyle(c)}>{t('adminPanel')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  {[
                    { label: language === 'tr' ? 'Toplam Kullanıcı' : 'Total Users',    value: '—', color: c.accent },
                    { label: language === 'tr' ? 'Aktif Oturum'     : 'Active Sessions', value: '1', color: c.success },
                    { label: language === 'tr' ? 'Partner Sayısı'   : 'Partners',        value: '6', color: c.warn },
                    { label: language === 'tr' ? 'API Çağrısı / gün': 'API Calls / day', value: '—', color: c.purple },
                  ].map(s => (
                    <div key={s.label} style={{ background: c.pageBg, border: `1px solid ${c.borderV}`, borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: `linear-gradient(135deg, ${CYAN}, ${ACCENT_SECONDARY})`, color: ACCENT_TEXT_ON_SOLID, fontSize: 13, fontWeight: 800, border: 'none', textDecoration: 'none', boxShadow: `0 6px 20px ${ACCENT_SHADOW}` }}>
                  {t('goToDashboard')}
                </Link>
              </section>
            )}

          </div>
        </main>
      </div>

      {/* ═══ INLINE KEYFRAMES ═══ */}
      <style>{`
        @keyframes fadeSlideIn {
          from { transform: translateX(30px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Shared Style Helpers ───────────────────────────────────────────────────
function iconBtnStyle(c) {
  return { background: 'none', border: 'none', color: c.textDim, cursor: 'pointer', padding: 4, display: 'flex', transition: 'color 0.2s' }
}

function cardStyle(c) {
  return { background: c.surfaceLo, borderRadius: 12, border: `1px solid ${c.borderV}`, padding: 24 }
}

function sectionHeadStyle(c) {
  return { fontSize: 20, fontWeight: 500, color: c.text, marginTop: 0, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${c.borderV}`, fontFamily: "'Space Grotesk','Inter',sans-serif" }
}

function labelStyle(c) {
  return { fontSize: 12, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }
}

function inputStyle(c) {
  return { width: '100%', background: c.inputBg, border: `1px solid ${c.borderV}`, borderRadius: 4, padding: '10px 14px', color: c.text, fontSize: 16, fontFamily: "'Manrope','Inter',sans-serif", outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }
}

function saveBtnStyle(c) {
  return { background: c.surfaceC, border: `1px solid ${c.accent}`, color: c.accent, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 24px', borderRadius: 4, cursor: 'pointer', fontFamily: "'Manrope','Inter',sans-serif", transition: 'all 0.2s' }
}

function prefRowStyle(c) {
  return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 8, background: c.pageBg, border: `1px solid ${c.borderV}`, transition: 'background 0.2s' }
}

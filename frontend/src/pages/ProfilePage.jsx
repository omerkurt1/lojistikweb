// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

const FF   = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFD  = "'Bebas Neue', sans-serif"
const CYAN = '#00d4ff'
const NAVY = '#060c1a'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const SVG_User     = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const SVG_Mail     = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
const SVG_Shield   = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const SVG_LogOut   = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
const SVG_Back     = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const SVG_Activity = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const SVG_Settings = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
const SVG_Sliders  = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="6" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="4" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="8" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="12" y2="12"/><line x1="17" x2="23" y1="16" y2="16"/></svg>
const SVG_Moon     = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
const SVG_Sun      = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
const SVG_Globe    = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
const SVG_Check    = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

// ─── Helper: initials from name ────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

// ─── Theme token maps ──────────────────────────────────────────────────────────
const darkTokens = {
  bg: '#0b1120', navBg: 'rgba(11,17,32,0.97)', text: '#e8f0ff',
  textMuted: '#6a7fa8', cardBg: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)', inputBg: 'rgba(255,255,255,0.05)',
  segBg: 'rgba(255,255,255,0.04)', segActive: 'rgba(0,212,255,0.12)',
}
const lightTokens = {
  bg: '#f0f4ff', navBg: 'rgba(255,255,255,0.97)', text: '#0a1628',
  textMuted: '#5a6a8a', cardBg: '#ffffff',
  border: '#e8ecf8', inputBg: '#f5f7ff',
  segBg: '#eef1f8', segActive: 'rgba(0,212,255,0.1)',
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { kullanici, cikis }              = useAuth()
  const { isDark, theme, setTheme, language, setLanguage, t } = useSettings()
  const navigate  = useNavigate()
  const [activeTab, setActiveTab] = useState('profil')

  const tk      = isDark ? darkTokens : lightTokens
  const isAdmin = kullanici?.email === 'patron@loop.com' || kullanici?.rol === 'admin'

  // ── Not authenticated gate ────────────────────────────────────────────────
  if (!kullanici) {
    return (
      <div style={{ minHeight: '100vh', background: tk.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FF }}>
        <div style={{ ...notAuthCardStyle, background: tk.cardBg, border: `1px solid ${tk.border}` }}>
          <div style={{ color: CYAN, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{SVG_Shield}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tk.text, marginBottom: 8 }}>{t('signInRequired')}</div>
          <div style={{ fontSize: 13, color: tk.textMuted, marginBottom: 24 }}>{t('signInMsg')}</div>
          <Link to="/giris" style={ctaBtnStyle}>{t('signIn')}</Link>
        </div>
      </div>
    )
  }

  const handleCikis = () => { cikis(); navigate('/') }

  const tabs = [
    { key: 'profil',    label: t('profileInfo'), icon: SVG_User     },
    { key: 'aktivite',  label: t('activity'),    icon: SVG_Activity  },
    { key: 'ayarlar',   label: t('settings'),    icon: SVG_Sliders   },
    ...(isAdmin ? [{ key: 'admin', label: t('adminPanel'), icon: SVG_Settings }] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: tk.bg, color: tk.text, fontFamily: FF }}>

      {/* ── Sticky Top Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64, background: tk.navBg, borderBottom: `1px solid ${tk.border}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FF, color: tk.textMuted, background: tk.inputBg, border: `1px solid ${tk.border}` }}>
            {SVG_Back} {t('back')}
          </button>
          <Link to="/" style={{ fontFamily: FFD, fontSize: 24, color: tk.text, textDecoration: 'none', letterSpacing: 1 }}>
            LOOP<span style={{ color: CYAN }}>.</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme toggle pill */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? t('lightMode') : t('darkMode')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FF, background: tk.inputBg, border: `1px solid ${tk.border}`, color: tk.textMuted, transition: 'all 0.2s' }}
          >
            {isDark ? SVG_Sun : SVG_Moon}
            {isDark ? t('lightMode') : t('darkMode')}
          </button>
          <button onClick={handleCikis} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF, color: '#ff4757', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}>
            {SVG_LogOut} {t('logout')}
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div style={{ display: 'flex', gap: 24, padding: '40px', maxWidth: 1100, margin: '0 auto', alignItems: 'flex-start' }}>

        {/* ── LEFT Sidebar ── */}
        <aside style={{ width: 260, flexShrink: 0, borderRadius: 20, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: tk.cardBg, border: `1px solid ${tk.border}` }}>
          {/* Avatar */}
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: `linear-gradient(135deg, ${CYAN}, #0062ff)`, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px rgba(0,212,255,0.3)` }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: CYAN }}>
              {initials(kullanici.isim)}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: tk.text }}>{kullanici.isim}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 5, color: tk.textMuted, fontSize: 12 }}>
              {SVG_Mail} {kullanici.email}
            </div>
            {isAdmin && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: CYAN, padding: '3px 10px', borderRadius: 40, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em' }}>
                {SVG_Shield} ADMIN
              </div>
            )}
          </div>

          <div style={{ width: '100%', height: 1, background: tk.border, margin: '20px 0' }} />

          {/* Tab nav */}
          {tabs.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 3, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FF, textAlign: 'left', transition: 'all 0.2s', background: activeTab === item.key ? `${CYAN}14` : 'transparent', borderLeft: `3px solid ${activeTab === item.key ? CYAN : 'transparent'}`, color: activeTab === item.key ? CYAN : tk.textMuted }}
            >
              {item.icon} {item.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 20, width: '100%' }}>
            <button onClick={handleCikis} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10, background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.25)', color: '#ff4757', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
              {SVG_LogOut} {t('logout')}
            </button>
          </div>
        </aside>

        {/* ── RIGHT Main ── */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Profil Tab ── */}
          {activeTab === 'profil' && (<>
            <div style={{ borderRadius: 16, padding: '24px 28px', background: tk.cardBg, border: `1px solid ${tk.border}` }}>
              <div style={sectionTitleStyle}>{t('accountInfo')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: t('fullName'),     value: kullanici.isim  },
                  { label: t('email'),        value: kullanici.email },
                  { label: t('role'),         value: isAdmin ? t('systemAdmin') : t('operator') },
                  { label: t('accountStatus'),value: t('accountActive') },
                ].map(f => (
                  <div key={f.label} style={{ borderRadius: 10, padding: '12px 14px', background: tk.inputBg, border: `1px solid ${tk.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: tk.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tk.text }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: 16, padding: '24px 28px', background: tk.cardBg, border: `1px solid ${tk.border}` }}>
              <div style={sectionTitleStyle}>{t('sessionSec')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: t('sessionStatus'), value: t('activeVerified'),   color: '#2ed573' },
                  { label: t('tokenType'),     value: 'JWT Bearer',          color: CYAN      },
                  { label: t('platform'),      value: 'LOOP Command Center v2', color: tk.text },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: tk.inputBg, border: `1px solid ${tk.border}` }}>
                    <span style={{ fontSize: 12, color: tk.textMuted, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* ── Aktivite Tab ── */}
          {activeTab === 'aktivite' && (
            <div style={{ borderRadius: 16, padding: '24px 28px', background: tk.cardBg, border: `1px solid ${tk.border}` }}>
              <div style={sectionTitleStyle}>{t('recentActivity')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: language === 'tr' ? 'Dashboard erişimi'                 : 'Dashboard accessed',        time: language === 'tr' ? 'Az önce'       : 'Just now',      dot: '#2ed573' },
                  { label: language === 'tr' ? 'Partner Network görüntülendi'      : 'Partner Network viewed',    time: language === 'tr' ? '12 dk önce'    : '12 min ago',    dot: CYAN      },
                  { label: language === 'tr' ? 'Rota optimizasyonu tetiklendi'     : 'Route optimization triggered',time: language === 'tr' ? '1 saat önce' : '1 hour ago',   dot: '#ff9f1c' },
                  { label: language === 'tr' ? 'Anomali incelendi — A1'            : 'Anomaly inspected — A1',    time: language === 'tr' ? 'Bugün 14:22'   : 'Today 14:22',   dot: '#ff4757' },
                  { label: language === 'tr' ? 'Sistem girişi'                     : 'System login',              time: language === 'tr' ? 'Bugün'         : 'Today',         dot: '#2ed573' },
                ].map((act, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: tk.inputBg, border: `1px solid ${tk.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.dot, flexShrink: 0, boxShadow: `0 0 6px ${act.dot}` }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: tk.text }}>{act.label}</span>
                    <span style={{ fontSize: 11, color: tk.textMuted, flexShrink: 0 }}>{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Ayarlar Tab ── */}
          {activeTab === 'ayarlar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Theme */}
              <div style={{ borderRadius: 16, padding: '24px 28px', background: tk.cardBg, border: `1px solid ${tk.border}` }}>
                <div style={sectionTitleStyle}>{t('theme')}</div>
                <p style={{ fontSize: 13, color: tk.textMuted, marginBottom: 16 }}>
                  {language === 'tr'
                    ? 'Seçilen tema tüm sayfalara ve haritaya anında uygulanır.'
                    : 'The selected theme is applied instantly across all pages and the map.'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { val: 'dark',  label: t('darkMode'),  icon: SVG_Moon, preview: '#0b1120', accent: '#e8f0ff' },
                    { val: 'light', label: t('lightMode'), icon: SVG_Sun,  preview: '#f0f4ff', accent: '#0a1628' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setTheme(opt.val)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: FF, transition: 'all 0.2s', border: theme === opt.val ? `2px solid ${CYAN}` : `2px solid ${tk.border}`, background: theme === opt.val ? `${CYAN}10` : tk.inputBg }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: opt.preview, display: 'flex', alignItems: 'center', justifyContent: 'center', color: opt.accent, flexShrink: 0, boxShadow: theme === opt.val ? `0 0 12px ${CYAN}40` : 'none' }}>
                        {opt.icon}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: theme === opt.val ? CYAN : tk.text }}>{opt.label}</div>
                        {theme === opt.val && <div style={{ fontSize: 11, color: CYAN, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>{SVG_Check} {language === 'tr' ? 'Seçili' : 'Active'}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div style={{ borderRadius: 16, padding: '24px 28px', background: tk.cardBg, border: `1px solid ${tk.border}` }}>
                <div style={sectionTitleStyle}>{t('language')}</div>
                <p style={{ fontSize: 13, color: tk.textMuted, marginBottom: 16 }}>
                  {language === 'tr'
                    ? 'Seçilen dil tüm arayüz ve Dashboard etiketlerine uygulanır.'
                    : 'The selected language is applied to all UI labels and the Dashboard.'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { val: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                    { val: 'en', label: 'English', flag: '🇬🇧' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setLanguage(opt.val)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: FF, transition: 'all 0.2s', border: language === opt.val ? `2px solid ${CYAN}` : `2px solid ${tk.border}`, background: language === opt.val ? `${CYAN}10` : tk.inputBg }}
                    >
                      <div style={{ fontSize: 28, lineHeight: 1 }}>{opt.flag}</div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: language === opt.val ? CYAN : tk.text }}>{opt.label}</div>
                        {language === opt.val && <div style={{ fontSize: 11, color: CYAN, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>{SVG_Check} {language === 'tr' ? 'Seçili' : 'Active'}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Admin Tab ── */}
          {activeTab === 'admin' && isAdmin && (
            <div style={{ borderRadius: 16, padding: '24px 28px', background: tk.cardBg, border: `1px solid ${tk.border}` }}>
              <div style={sectionTitleStyle}>{t('adminPanel')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { label: language === 'tr' ? 'Toplam Kullanıcı' : 'Total Users',    value: '—', color: CYAN },
                  { label: language === 'tr' ? 'Aktif Oturum'     : 'Active Sessions', value: '1', color: '#2ed573' },
                  { label: language === 'tr' ? 'Partner Sayısı'   : 'Partners',        value: '6', color: '#ff9f1c' },
                  { label: language === 'tr' ? 'API Çağrısı / gün': 'API Calls / day', value: '—', color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} style={{ background: tk.inputBg, border: `1px solid ${tk.border}`, borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: tk.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <Link to="/" style={{ ...ctaBtnStyle, display: 'inline-flex', textDecoration: 'none' }}>
                {t('goToDashboard')}
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const sectionTitleStyle = {
  fontSize: 15, fontWeight: 800, marginBottom: 18, letterSpacing: '-0.01em',
}

const ctaBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, padding: '12px 28px', borderRadius: 10,
  background: `linear-gradient(135deg, ${CYAN}, #0062ff)`,
  color: NAVY, fontSize: 13, fontWeight: 800,
  border: 'none', cursor: 'pointer', boxShadow: `0 6px 20px rgba(0,212,255,0.3)`,
}

const notAuthCardStyle = {
  borderRadius: 20, padding: '48px 40px', textAlign: 'center',
  fontFamily: "'Inter',sans-serif", maxWidth: 360,
}

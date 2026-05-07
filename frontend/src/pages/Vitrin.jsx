// src/pages/Vitrin.jsx
// Advanced Landing Page — the professional "Vitrin" at "/"
// Matches the production design: bold headline typography, light/dark adaptive,
// gradient accent pops, numbered step circles, feature cards, stats bar, CTA.
// Integrates with SettingsContext (theme + i18n) and AuthContext (auth-aware buttons).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useAuth }     from '../context/AuthContext'

/* ─── Design Tokens ──────────────────────────────────────────────────────── */
const FF  = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFH = "'Bebas Neue','Impact',sans-serif"
const CYAN = '#00d4ff'

/* ─── Reusable hover wrapper ─────────────────────────────────────────────── */
function Hoverable({ children, style, hoverStyle, ...props }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...style, ...(hovered ? hoverStyle : {}) }}
      {...props}
    >
      {children}
    </div>
  )
}

export default function Vitrin() {
  const { isDark, t } = useSettings()
  const { kullanici }  = useAuth()
  const navigate       = useNavigate()

  /* ─── Theme palette ────────────────────────────────────────────────────── */
  const bg       = isDark ? '#060c1a' : '#f5f8ff'
  const text     = isDark ? '#e8f0ff' : '#0a1628'
  const muted    = isDark ? '#6a7fa8' : '#5a6a8a'
  const cardBg   = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'
  const cardBrd  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const sectionAlt = isDark ? 'rgba(255,255,255,0.02)' : '#edf2ff'
  const heroBg   = isDark
    ? 'linear-gradient(180deg, #060c1a 0%, #0d1b30 50%, #060c1a 100%)'
    : 'linear-gradient(180deg, #e0f0ff 0%, #f5f8ff 60%, #ffffff 100%)'
  const headlineColor = isDark ? '#e8f0ff' : '#0a1628'

  /* ─── Features data ────────────────────────────────────────────────────── */
  const features = [
    { icon: '📡', title: t('vitrinFeature1Title'), desc: t('vitrinFeature1Desc') },
    { icon: '🤖', title: t('vitrinFeature2Title'), desc: t('vitrinFeature2Desc') },
    { icon: '📊', title: t('vitrinFeature3Title'), desc: t('vitrinFeature3Desc') },
    { icon: '🔒', title: t('vitrinFeature4Title'), desc: t('vitrinFeature4Desc') },
    { icon: '🌍', title: t('vitrinFeature5Title'), desc: t('vitrinFeature5Desc') },
    { icon: '⚡', title: t('vitrinFeature6Title'), desc: t('vitrinFeature6Desc') },
  ]

  /* ─── Operations / Steps data ──────────────────────────────────────────── */
  const operations = [
    { num: '1', title: t('vitrinOp1Title'), desc: t('vitrinOp1Desc') },
    { num: '2', title: t('vitrinOp2Title'), desc: t('vitrinOp2Desc') },
    { num: '3', title: t('vitrinOp3Title'), desc: t('vitrinOp3Desc') },
    { num: '4', title: t('vitrinOp4Title'), desc: t('vitrinOp4Desc') },
  ]

  /* ─── Stats data ───────────────────────────────────────────────────────── */
  const stats = [
    { stat: '99.7%', label: t('vitrinWhy1') },
    { stat: '190+',  label: t('vitrinWhy2') },
    { stat: '50ms',  label: t('vitrinWhy3') },
    { stat: '24/7',  label: t('vitrinWhy4') },
  ]

  return (
    <div style={{ background: bg, color: text, fontFamily: FF, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION — Bold headline typography matching production
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="hero" style={{
        minHeight: '92vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '100px 24px 60px', position: 'relative', overflow: 'hidden',
        background: heroBg,
      }}>

        {/* Decorative gradient orbs */}
        <div style={{ position: 'absolute', top: -180, left: -180, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${CYAN}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -180, right: -180, width: 450, height: 450, borderRadius: '50%', background: `radial-gradient(circle, #0062ff12 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isDark ? `${CYAN}12` : `${CYAN}15`,
          border: `1.5px solid ${CYAN}40`,
          borderRadius: 30, padding: '8px 22px', marginBottom: 36,
          fontSize: 11, fontWeight: 800, color: CYAN, letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: CYAN, boxShadow: `0 0 10px ${CYAN}` }} />
          {t('vitrinBadge')}
        </div>

        {/* ── Big bold headline — 3-line layout ── */}
        <h1 style={{
          fontFamily: FFH, lineHeight: 0.95, margin: '0 0 28px',
          maxWidth: 900, letterSpacing: 3,
        }}>
          <span style={{ display: 'block', fontSize: 'clamp(48px, 8vw, 96px)', color: headlineColor }}>
            {t('vitrinHeroTitle1')}
          </span>
          <span style={{
            display: 'block', fontSize: 'clamp(52px, 9vw, 110px)',
            color: CYAN,
            textShadow: isDark ? `0 0 40px ${CYAN}30` : 'none',
          }}>
            {t('vitrinHeroHighlight')}
          </span>
          <span style={{ display: 'block', fontSize: 'clamp(48px, 8vw, 96px)', color: headlineColor }}>
            {t('vitrinHeroTitle2')}
          </span>
        </h1>

        {/* Sub-description */}
        <p style={{
          maxWidth: 620, fontSize: 16, lineHeight: 1.75, color: muted,
          margin: '0 0 44px', fontWeight: 400,
        }}>
          {t('vitrinHeroDesc')}
        </p>

        {/* ── Step number circles — visual element from screenshot 2 ── */}
        <div style={{ display: 'flex', gap: 48, marginBottom: 44, justifyContent: 'center' }}>
          {['1', '2', '3'].map((num, i) => (
            <div key={num} style={{
              width: 52, height: 52, borderRadius: '50%',
              border: `2px solid ${CYAN}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: CYAN,
              fontFamily: FFH, letterSpacing: 1,
              background: isDark ? `${CYAN}08` : `${CYAN}06`,
              boxShadow: i === 2 ? `0 0 20px ${CYAN}30` : 'none',
              transition: 'all 0.3s',
            }}>
              {num}
            </div>
          ))}
        </div>

        {/* ── CTA Buttons ── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            id="btn-hero-start"
            onClick={() => navigate(kullanici ? '/profil' : '/giris')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '16px 38px', borderRadius: 12,
              background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
              border: 'none', color: '#060c1a', fontFamily: FF,
              fontSize: 15, fontWeight: 800, letterSpacing: '0.03em',
              cursor: 'pointer', boxShadow: `0 8px 32px ${CYAN}35`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${CYAN}50` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 32px ${CYAN}35` }}
          >
            {t('getStarted')} →
          </button>
          <button
            id="btn-hero-track"
            onClick={() => navigate('/takip')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '16px 32px', borderRadius: 12,
              background: 'transparent',
              border: `2px solid ${CYAN}45`, color: CYAN,
              fontFamily: FF, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${CYAN}10`; e.currentTarget.style.borderColor = CYAN }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${CYAN}45` }}
          >
            📍 {t('vitrinLiveTrack')}
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '100px 24px', background: sectionAlt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, color: CYAN, letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}>
              {t('features')}
            </span>
            <h2 style={{
              fontFamily: FFH, fontSize: 'clamp(32px, 5vw, 52px)',
              letterSpacing: 2, margin: '14px 0 0', color: headlineColor,
            }}>
              {t('vitrinFeaturesTitle')}
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {features.map((f, i) => (
              <Hoverable
                key={i}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBrd}`,
                  borderRadius: 18, padding: '32px 28px',
                  transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                  cursor: 'default',
                }}
                hoverStyle={{
                  transform: 'translateY(-4px)',
                  boxShadow: isDark ? `0 12px 40px rgba(0,212,255,0.08)` : '0 12px 40px rgba(0,0,80,0.08)',
                  borderColor: `${CYAN}40`,
                }}
              >
                <div style={{
                  fontSize: 36, marginBottom: 16,
                  width: 56, height: 56, borderRadius: 14,
                  background: isDark ? `${CYAN}10` : `${CYAN}08`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px', color: headlineColor }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: muted, margin: 0 }}>{f.desc}</p>
              </Hoverable>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          OPERATIONS / HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="operations" style={{ padding: '100px 24px', background: bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, color: CYAN, letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}>
              {t('operations')}
            </span>
            <h2 style={{
              fontFamily: FFH, fontSize: 'clamp(32px, 5vw, 52px)',
              letterSpacing: 2, margin: '14px 0 0', color: headlineColor,
            }}>
              {t('vitrinOpsTitle')}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {operations.map((op, i) => (
              <Hoverable
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 24,
                  background: cardBg, border: `1px solid ${cardBrd}`,
                  borderRadius: 18, padding: '28px 32px',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                hoverStyle={{
                  transform: 'translateX(6px)',
                  boxShadow: isDark ? `0 8px 32px rgba(0,212,255,0.06)` : '0 8px 32px rgba(0,0,80,0.06)',
                }}
              >
                <div style={{
                  flexShrink: 0, width: 54, height: 54, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${CYAN}25, #0062ff18)`,
                  border: `2px solid ${CYAN}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 900, color: CYAN, fontFamily: FFH,
                  letterSpacing: 1,
                }}>
                  {op.num}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: headlineColor }}>{op.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: muted, margin: 0 }}>{op.desc}</p>
                </div>
              </Hoverable>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          STATS / WHY US
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="why-us" style={{ padding: '100px 24px', background: sectionAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color: CYAN, letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            {t('whyUs')}
          </span>
          <h2 style={{
            fontFamily: FFH, fontSize: 'clamp(32px, 5vw, 52px)',
            letterSpacing: 2, margin: '14px 0 56px', color: headlineColor,
          }}>
            {t('vitrinWhyTitle')}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 20,
          }}>
            {stats.map((w, i) => (
              <Hoverable
                key={i}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBrd}`,
                  borderRadius: 18, padding: '36px 24px',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                hoverStyle={{
                  transform: 'translateY(-4px)',
                  boxShadow: isDark ? `0 8px 28px rgba(0,212,255,0.08)` : '0 8px 28px rgba(0,0,80,0.06)',
                }}
              >
                <div style={{
                  fontSize: 42, fontWeight: 900, color: CYAN, fontFamily: FFH,
                  letterSpacing: 2, marginBottom: 10,
                  textShadow: isDark ? `0 0 20px ${CYAN}20` : 'none',
                }}>
                  {w.stat}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: muted, letterSpacing: '0.03em' }}>
                  {w.label}
                </div>
              </Hoverable>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
        background: isDark
          ? 'linear-gradient(180deg, #060c1a 0%, #0d1b30 50%, #060c1a 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #e6edff 50%, #f5f8ff 100%)',
      }}>
        <h2 style={{
          fontFamily: FFH, fontSize: 'clamp(28px, 5vw, 48px)',
          letterSpacing: 2, margin: '0 0 18px', color: headlineColor,
        }}>
          {t('vitrinCtaTitle')}
        </h2>
        <p style={{
          fontSize: 15, color: muted, maxWidth: 540,
          margin: '0 auto 36px', lineHeight: 1.65,
        }}>
          {t('vitrinCtaDesc')}
        </p>
        <button
          id="btn-cta-start"
          onClick={() => navigate(kullanici ? '/profil' : '/giris')}
          style={{
            padding: '17px 48px', borderRadius: 12,
            background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
            border: 'none', color: '#060c1a', fontFamily: FF,
            fontSize: 16, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 8px 32px ${CYAN}35`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            letterSpacing: '0.03em',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 44px ${CYAN}50` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 32px ${CYAN}35` }}
        >
          {t('getStarted')} →
        </button>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer style={{
        padding: '36px 24px', textAlign: 'center',
        borderTop: `1px solid ${cardBrd}`,
        fontSize: 12, color: muted, background: bg,
      }}>
        © {new Date().getFullYear()} LOOP Logistics. {t('vitrinFooter')}
      </footer>
    </div>
  )
}

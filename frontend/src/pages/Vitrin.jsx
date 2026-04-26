// src/pages/Vitrin.jsx
// Public landing page — the main marketing/Vitrin page at "/"
// Contains anchor sections for: #features, #operations, #why-us
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useAuth }     from '../context/AuthContext'

const FF  = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFH = "'Bebas Neue', sans-serif"
const CYAN = '#00d4ff'
const NAVY = '#060c1a'

export default function Vitrin() {
  const { isDark, t } = useSettings()
  const { kullanici }  = useAuth()
  const navigate       = useNavigate()

  // Theme tokens
  const bg       = isDark ? '#060c1a' : '#f0f4ff'
  const text     = isDark ? '#e8f0ff' : '#0a1628'
  const muted    = isDark ? '#6a7fa8' : '#5a6a8a'
  const cardBg   = isDark ? 'rgba(255,255,255,0.04)' : '#fff'
  const cardBrd  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const sectionAlt = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,50,100,0.03)'

  const features = [
    { icon: '📡', title: isDark ? 'Real-Time Tracking' : t('vitrinFeature1Title') || 'Gerçek Zamanlı Takip', desc: t('vitrinFeature1Desc') || 'GPS destekli canlı araç ve kargo takibi ile teslimat süreçlerinizi anlık izleyin.' },
    { icon: '🤖', title: t('vitrinFeature2Title') || 'AI Rota Optimizasyonu', desc: t('vitrinFeature2Desc') || 'Yapay zekâ ile en hızlı ve en verimli rotaları otomatik hesaplayın.' },
    { icon: '📊', title: t('vitrinFeature3Title') || 'Gelişmiş Analitik', desc: t('vitrinFeature3Desc') || 'Teslimat performansı, maliyet analizi ve müşteri memnuniyeti raporları.' },
    { icon: '🔒', title: t('vitrinFeature4Title') || 'Kurumsal Güvenlik', desc: t('vitrinFeature4Desc') || 'End-to-end şifreleme, rol tabanlı erişim ve anomali tespiti ile güvenlik.' },
    { icon: '🌍', title: t('vitrinFeature5Title') || 'Global Operasyonlar', desc: t('vitrinFeature5Desc') || '190+ ülkede çok modlu lojistik operasyonlarını tek panelden yönetin.' },
    { icon: '⚡', title: t('vitrinFeature6Title') || 'Entegrasyon API', desc: t('vitrinFeature6Desc') || 'RESTful API ile mevcut ERP, WMS ve TMS sistemlerinize sorunsuz entegre edin.' },
  ]

  const operations = [
    { num: '01', title: t('vitrinOp1Title') || 'Kayıt & Onboarding', desc: t('vitrinOp1Desc') || 'Hesap oluşturun, filonuzu ekleyin ve partner ağınızı kurun.' },
    { num: '02', title: t('vitrinOp2Title') || 'Sipariş & Dispatching', desc: t('vitrinOp2Desc') || 'Siparişleri otomatik olarak en uygun kuryeye atayın.' },
    { num: '03', title: t('vitrinOp3Title') || 'Takip & Yönetim', desc: t('vitrinOp3Desc') || 'Gerçek zamanlı harita üzerinde tüm operasyonları izleyin ve yönetin.' },
    { num: '04', title: t('vitrinOp4Title') || 'Analiz & Raporlama', desc: t('vitrinOp4Desc') || 'Performans metrikleri ve finansal raporlarla süreçleri optimize edin.' },
  ]

  const whyUs = [
    { stat: '99.7%', label: t('vitrinWhy1') || 'Uptime SLA' },
    { stat: '190+', label: t('vitrinWhy2') || 'Desteklenen Ülke' },
    { stat: '50ms', label: t('vitrinWhy3') || 'Ortalama Gecikme' },
    { stat: '24/7', label: t('vitrinWhy4') || 'Destek' },
  ]

  return (
    <div style={{ background: bg, color: text, fontFamily: FF, minHeight: '100vh' }}>

      {/* ═══ HERO ═══ */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${CYAN}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, #0062ff10 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: `${CYAN}10`, border: `1px solid ${CYAN}25`,
          borderRadius: 24, padding: '6px 18px', marginBottom: 28,
          fontSize: 12, fontWeight: 700, color: CYAN, letterSpacing: '0.05em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, boxShadow: `0 0 8px ${CYAN}` }} />
          {t('vitrinBadge') || 'Yeni Nesil Lojistik Platformu'}
        </div>

        <h1 style={{
          fontFamily: FFH, fontSize: 'clamp(42px, 7vw, 80px)',
          letterSpacing: 2, lineHeight: 1.05, margin: '0 0 20px',
          maxWidth: 800,
        }}>
          LOOP<span style={{ color: CYAN }}>.</span>
          <br />
          <span style={{ fontSize: 'clamp(18px, 3vw, 32px)', fontFamily: FF, fontWeight: 300, letterSpacing: 0, color: muted }}>
            {t('vitrinHeroSub') || 'Akıllı Lojistik Yönetim Sistemi'}
          </span>
        </h1>

        <p style={{ maxWidth: 580, fontSize: 16, lineHeight: 1.7, color: muted, margin: '0 0 40px' }}>
          {t('vitrinHeroDesc') || 'Küresel tedarik zinciri operasyonlarınızı tek bir platformdan yönetin. Gerçek zamanlı takip, AI destekli rota optimizasyonu ve kurumsal güvenlik.'}
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(kullanici ? '/profil' : '/giris')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 10,
              background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
              border: 'none', color: NAVY, fontFamily: FF,
              fontSize: 15, fontWeight: 800, letterSpacing: '0.03em',
              cursor: 'pointer', boxShadow: `0 6px 24px ${CYAN}40`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            {t('getStarted') || 'Hemen Başla'} →
          </button>
          <button
            onClick={() => navigate('/takip')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 10,
              background: 'transparent',
              border: `1.5px solid ${CYAN}40`, color: CYAN,
              fontFamily: FF, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            📍 {t('vitrinLiveTrack') || 'Canlı Takip'}
          </button>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: '80px 24px', background: sectionAlt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('features') || 'Özellikler'}
            </span>
            <h2 style={{ fontFamily: FFH, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: 1, margin: '12px 0 0' }}>
              {t('vitrinFeaturesTitle') || 'Neden LOOP?'}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: cardBg, border: `1px solid ${cardBrd}`,
                borderRadius: 16, padding: '28px 24px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: muted, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OPERATIONS ═══ */}
      <section id="operations" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('operations') || 'Operasyonlar'}
            </span>
            <h2 style={{ fontFamily: FFH, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: 1, margin: '12px 0 0' }}>
              {t('vitrinOpsTitle') || 'Nasıl Çalışır?'}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {operations.map((op, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 24,
                background: cardBg, border: `1px solid ${cardBrd}`,
                borderRadius: 16, padding: '24px 28px',
              }}>
                <div style={{
                  flexShrink: 0, width: 48, height: 48, borderRadius: 12,
                  background: `linear-gradient(135deg, ${CYAN}20, #0062ff15)`,
                  border: `1px solid ${CYAN}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, color: CYAN, fontFamily: FFH,
                }}>
                  {op.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>{op.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: muted, margin: 0 }}>{op.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section id="why-us" style={{ padding: '80px 24px', background: sectionAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t('whyUs') || 'Neden Biz'}
          </span>
          <h2 style={{ fontFamily: FFH, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: 1, margin: '12px 0 48px' }}>
            {t('vitrinWhyTitle') || 'Kurumsal Güvenilirlik'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {whyUs.map((w, i) => (
              <div key={i} style={{
                background: cardBg, border: `1px solid ${cardBrd}`,
                borderRadius: 16, padding: '32px 20px',
              }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: CYAN, fontFamily: FFH, letterSpacing: 1, marginBottom: 8 }}>
                  {w.stat}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: muted }}>{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{
        padding: '80px 24px', textAlign: 'center',
        background: `linear-gradient(180deg, ${bg} 0%, ${isDark ? '#0a1830' : '#e6edff'} 100%)`,
      }}>
        <h2 style={{ fontFamily: FFH, fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: 1, margin: '0 0 16px' }}>
          {t('vitrinCtaTitle') || 'Lojistik Operasyonlarınızı Dönüştürün'}
        </h2>
        <p style={{ fontSize: 15, color: muted, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
          {t('vitrinCtaDesc') || 'Ücretsiz hesap oluşturun ve LOOP platformunun gücünü keşfedin.'}
        </p>
        <button
          onClick={() => navigate(kullanici ? '/profil' : '/giris')}
          style={{
            padding: '15px 40px', borderRadius: 10,
            background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
            border: 'none', color: NAVY, fontFamily: FF,
            fontSize: 16, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 6px 24px ${CYAN}40`,
          }}
        >
          {t('getStarted') || 'Hemen Başla'} →
        </button>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: '32px 24px', textAlign: 'center',
        borderTop: `1px solid ${cardBrd}`,
        fontSize: 12, color: muted,
      }}>
        © {new Date().getFullYear()} LOOP Logistics. {t('vitrinFooter') || 'Tüm hakları saklıdır.'}
      </footer>
    </div>
  )
}

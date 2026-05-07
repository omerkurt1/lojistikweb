import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'

const FF = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const FFH = "'Bebas Neue','Impact',sans-serif"
const CYAN = '#00d4ff'

const COPY = {
  tr: {
    badge: 'YENI NESIL LOJISTIK YONETIMI',
    heroTitle1: 'TESLIMATLARINIZI',
    heroHighlight: 'OTOMATIK',
    heroTitle2: 'PILOTA ALIN',
    heroSub: 'Akilli Lojistik Yonetim Sistemi',
    heroDesc: 'Saha operasyonlarinizi kor ucustan cikarin. Maliyetleri dusurun, kuryelerinizi tek ekrandan yonetin ve musteri memnuniyetini zirveye tasiyin.',
    getStarted: 'Hemen Basla',
    liveTrack: 'Canli Takip',
    featuresLabel: 'Ozellikler',
    featuresTitle: 'Neden LOOP?',
    operationsLabel: 'Operasyonlar',
    operationsTitle: 'Nasil Calisir?',
    whyLabel: 'Neden Biz',
    whyTitle: 'Kurumsal Guvenilirlik',
    ctaTitle: 'Lojistik Operasyonlarinizi Donusturun',
    ctaDesc: 'Ucretsiz hesap olusturun ve LOOP platformunun gucunu kesfedin.',
    footer: 'Tum haklari saklidir.',
    features: [
      { icon: '📡', title: 'Gercek Zamanli Takip', desc: 'GPS destekli canli arac ve kargo takibi ile teslimat sureclerini anlik izleyin.' },
      { icon: '🤖', title: 'AI Rota Optimizasyonu', desc: 'Yapay zeka ile en hizli ve en verimli rotalari otomatik hesaplayin.' },
      { icon: '📊', title: 'Gelismis Analitik', desc: 'Teslimat performansi, maliyet analizi ve musteri memnuniyeti raporlari.' },
      { icon: '🔒', title: 'Kurumsal Guvenlik', desc: 'End-to-end sifreleme, rol tabanli erisim ve anomali tespiti ile guvenlik.' },
      { icon: '🌍', title: 'Global Operasyonlar', desc: '190+ ulkede cok modlu lojistik operasyonlarini tek panelden yonetin.' },
      { icon: '⚡', title: 'Entegrasyon API', desc: 'RESTful API ile mevcut ERP, WMS ve TMS sistemlerinize sorunsuz entegre olun.' },
    ],
    operations: [
      { num: '1', title: 'Kayit ve Onboarding', desc: 'Hesap olusturun, filonuzu ekleyin ve partner aginizi kurun.' },
      { num: '2', title: 'Siparis ve Dispatching', desc: 'Siparisleri otomatik olarak en uygun kuryeye atayin.' },
      { num: '3', title: 'Takip ve Yonetim', desc: 'Gercek zamanli harita uzerinde tum operasyonlari izleyin ve yonetin.' },
      { num: '4', title: 'Analiz ve Raporlama', desc: 'Performans metrikleri ve finansal raporlarla surecleri optimize edin.' },
    ],
    stats: [
      { stat: '99.7%', label: 'Uptime SLA' },
      { stat: '190+', label: 'Desteklenen Ulke' },
      { stat: '50ms', label: 'Ortalama Gecikme' },
      { stat: '24/7', label: 'Destek' },
    ],
  },
  en: {
    badge: 'NEXT-GEN LOGISTICS MANAGEMENT',
    heroTitle1: 'PUT YOUR',
    heroHighlight: 'DELIVERIES',
    heroTitle2: 'ON AUTOPILOT',
    heroSub: 'Smart Logistics Management System',
    heroDesc: 'Take your field operations off blind flight. Cut costs, manage your couriers from one screen, and elevate customer satisfaction.',
    getStarted: 'Get Started',
    liveTrack: 'Live Tracking',
    featuresLabel: 'Features',
    featuresTitle: 'Why LOOP?',
    operationsLabel: 'Operations',
    operationsTitle: 'How It Works',
    whyLabel: 'Why Us',
    whyTitle: 'Enterprise Reliability',
    ctaTitle: 'Transform Your Logistics Operations',
    ctaDesc: 'Create a free account and discover the power of the LOOP platform.',
    footer: 'All rights reserved.',
    features: [
      { icon: '📡', title: 'Real-Time Tracking', desc: 'Monitor your deliveries with GPS-powered live vehicle and cargo tracking.' },
      { icon: '🤖', title: 'AI Route Optimization', desc: 'Automatically calculate the fastest and most efficient routes with AI.' },
      { icon: '📊', title: 'Advanced Analytics', desc: 'Delivery performance, cost analysis, and customer satisfaction reports.' },
      { icon: '🔒', title: 'Enterprise Security', desc: 'End-to-end encryption, role-based access, and anomaly detection.' },
      { icon: '🌍', title: 'Global Operations', desc: 'Manage multi-modal logistics operations across 190+ countries from one panel.' },
      { icon: '⚡', title: 'Integration API', desc: 'Seamlessly integrate your ERP, WMS, and TMS systems via RESTful APIs.' },
    ],
    operations: [
      { num: '1', title: 'Register and Onboarding', desc: 'Create your account, add your fleet, and set up your partner network.' },
      { num: '2', title: 'Order and Dispatching', desc: 'Automatically assign orders to the most suitable courier.' },
      { num: '3', title: 'Track and Manage', desc: 'Monitor and manage all operations on a real-time map.' },
      { num: '4', title: 'Analyze and Report', desc: 'Optimize processes with performance metrics and financial reports.' },
    ],
    stats: [
      { stat: '99.7%', label: 'Uptime SLA' },
      { stat: '190+', label: 'Supported Countries' },
      { stat: '50ms', label: 'Average Latency' },
      { stat: '24/7', label: 'Support' },
    ],
  },
}

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
  const { isDark, language } = useSettings()
  const { kullanici } = useAuth()
  const navigate = useNavigate()
  const c = COPY[language === 'en' ? 'en' : 'tr']

  const bg = isDark ? '#060c1a' : '#f5f8ff'
  const text = isDark ? '#e8f0ff' : '#0a1628'
  const muted = isDark ? '#6a7fa8' : '#5a6a8a'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'
  const cardBrd = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const sectionAlt = isDark ? 'rgba(255,255,255,0.02)' : '#edf2ff'
  const heroBg = isDark
    ? 'linear-gradient(180deg, #060c1a 0%, #0d1b30 50%, #060c1a 100%)'
    : 'linear-gradient(180deg, #e0f0ff 0%, #f5f8ff 60%, #ffffff 100%)'
  const headlineColor = isDark ? '#e8f0ff' : '#0a1628'

  return (
    <div style={{ background: bg, color: text, fontFamily: FF, minHeight: '100vh', overflowX: 'hidden' }}>
      <section
        id="hero"
        style={{
          minHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '100px 24px 60px',
          position: 'relative',
          overflow: 'hidden',
          background: heroBg,
        }}
      >
        <div style={{ position: 'absolute', top: -180, left: -180, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${CYAN}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -180, right: -180, width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, #0062ff12 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: isDark ? `${CYAN}12` : `${CYAN}15`,
            border: `1.5px solid ${CYAN}40`,
            borderRadius: 30,
            padding: '8px 22px',
            marginBottom: 36,
            fontSize: 11,
            fontWeight: 800,
            color: CYAN,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: CYAN, boxShadow: `0 0 10px ${CYAN}` }} />
          {c.badge}
        </div>

        <h1 style={{ fontFamily: FFH, lineHeight: 0.95, margin: '0 0 14px', maxWidth: 900, letterSpacing: 3 }}>
          <span style={{ display: 'block', fontSize: 'clamp(48px, 8vw, 96px)', color: headlineColor }}>{c.heroTitle1}</span>
          <span style={{ display: 'block', fontSize: 'clamp(52px, 9vw, 110px)', color: CYAN, textShadow: isDark ? `0 0 40px ${CYAN}30` : 'none' }}>{c.heroHighlight}</span>
          <span style={{ display: 'block', fontSize: 'clamp(48px, 8vw, 96px)', color: headlineColor }}>{c.heroTitle2}</span>
        </h1>

        <p style={{ margin: '0 0 12px', color: CYAN, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 11 }}>
          {c.heroSub}
        </p>
        <p style={{ maxWidth: 620, fontSize: 16, lineHeight: 1.75, color: muted, margin: '0 0 44px', fontWeight: 400 }}>
          {c.heroDesc}
        </p>

        <div style={{ display: 'flex', gap: 48, marginBottom: 44, justifyContent: 'center' }}>
          {['1', '2', '3'].map((num, i) => (
            <div
              key={num}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: `2px solid ${CYAN}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 900,
                color: CYAN,
                fontFamily: FFH,
                letterSpacing: 1,
                background: isDark ? `${CYAN}08` : `${CYAN}06`,
                boxShadow: i === 2 ? `0 0 20px ${CYAN}30` : 'none',
              }}
            >
              {num}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(kullanici ? '/profil' : '/giris')}
            style={{
              padding: '16px 38px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
              border: 'none',
              color: '#060c1a',
              fontFamily: FF,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 8px 32px ${CYAN}35`,
            }}
          >
            {c.getStarted} →
          </button>
          <button
            onClick={() => navigate('/takip')}
            style={{
              padding: '16px 32px',
              borderRadius: 12,
              background: 'transparent',
              border: `2px solid ${CYAN}45`,
              color: CYAN,
              fontFamily: FF,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📍 {c.liveTrack}
          </button>
        </div>
      </section>

      <section id="features" style={{ padding: '100px 24px', background: sectionAlt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: CYAN, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{c.featuresLabel}</span>
            <h2 style={{ fontFamily: FFH, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 2, margin: '14px 0 0', color: headlineColor }}>
              {c.featuresTitle}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {c.features.map((f, i) => (
              <Hoverable
                key={i}
                style={{ background: cardBg, border: `1px solid ${cardBrd}`, borderRadius: 18, padding: '32px 28px', cursor: 'default' }}
                hoverStyle={{
                  transform: 'translateY(-4px)',
                  boxShadow: isDark ? '0 12px 40px rgba(0,212,255,0.08)' : '0 12px 40px rgba(0,0,80,0.08)',
                  borderColor: `${CYAN}40`,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 16, width: 56, height: 56, borderRadius: 14, background: isDark ? `${CYAN}10` : `${CYAN}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px', color: headlineColor }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: muted, margin: 0 }}>{f.desc}</p>
              </Hoverable>
            ))}
          </div>
        </div>
      </section>

      <section id="operations" style={{ padding: '100px 24px', background: bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: CYAN, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{c.operationsLabel}</span>
            <h2 style={{ fontFamily: FFH, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 2, margin: '14px 0 0', color: headlineColor }}>
              {c.operationsTitle}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {c.operations.map((op, i) => (
              <Hoverable
                key={i}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 24, background: cardBg, border: `1px solid ${cardBrd}`, borderRadius: 18, padding: '28px 32px' }}
                hoverStyle={{ transform: 'translateX(6px)', boxShadow: isDark ? '0 8px 32px rgba(0,212,255,0.06)' : '0 8px 32px rgba(0,0,80,0.06)' }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${CYAN}25, #0062ff18)`,
                    border: `2px solid ${CYAN}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 900,
                    color: CYAN,
                    fontFamily: FFH,
                  }}
                >
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

      <section id="why-us" style={{ padding: '100px 24px', background: sectionAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: CYAN, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{c.whyLabel}</span>
          <h2 style={{ fontFamily: FFH, fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 2, margin: '14px 0 56px', color: headlineColor }}>{c.whyTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {c.stats.map((w, i) => (
              <Hoverable
                key={i}
                style={{ background: cardBg, border: `1px solid ${cardBrd}`, borderRadius: 18, padding: '36px 24px' }}
                hoverStyle={{ transform: 'translateY(-4px)', boxShadow: isDark ? '0 8px 28px rgba(0,212,255,0.08)' : '0 8px 28px rgba(0,0,80,0.06)' }}
              >
                <div style={{ fontSize: 42, fontWeight: 900, color: CYAN, fontFamily: FFH, letterSpacing: 2, marginBottom: 10 }}>{w.stat}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: muted, letterSpacing: '0.03em' }}>{w.label}</div>
              </Hoverable>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: '100px 24px',
          textAlign: 'center',
          background: isDark
            ? 'linear-gradient(180deg, #060c1a 0%, #0d1b30 50%, #060c1a 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #e6edff 50%, #f5f8ff 100%)',
        }}
      >
        <h2 style={{ fontFamily: FFH, fontSize: 'clamp(28px, 5vw, 48px)', letterSpacing: 2, margin: '0 0 18px', color: headlineColor }}>{c.ctaTitle}</h2>
        <p style={{ fontSize: 15, color: muted, maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.65 }}>{c.ctaDesc}</p>
        <button
          onClick={() => navigate(kullanici ? '/profil' : '/giris')}
          style={{
            padding: '17px 48px',
            borderRadius: 12,
            background: `linear-gradient(135deg, ${CYAN} 0%, #0088cc 100%)`,
            border: 'none',
            color: '#060c1a',
            fontFamily: FF,
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${CYAN}35`,
            letterSpacing: '0.03em',
          }}
        >
          {c.getStarted} →
        </button>
      </section>

      <footer style={{ padding: '36px 24px', textAlign: 'center', borderTop: `1px solid ${cardBrd}`, fontSize: 12, color: muted, background: bg }}>
        © {new Date().getFullYear()} LOOP Logistics. {c.footer}
      </footer>
    </div>
  )
}

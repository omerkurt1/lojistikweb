// src/context/SettingsContext.jsx
// Single source of truth for Theme and Language across the entire application.
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
const API = 'https://lojistikweb-backend.onrender.com/api'

function getAuthToken() {
  const directToken = localStorage.getItem('loop_token')
  if (directToken) return directToken
  try {
    const user = JSON.parse(localStorage.getItem('loop_user') || '{}')
    return user?.token || ''
  } catch {
    return ''
  }
}

// ─── Full Translation Dictionary ─────────────────────────────────────────────
const TRANSLATIONS = {
  tr: {
    // Navigation
    dashboard:    'Dashboard',
    couriers:     'Kuryeler',
    history:      'Geçmiş',
    report:       'Rapor',
    map:          'Harita',
    partnerNet:   'Partner Ağı',
    profile:      'Profilim',
    logout:       'Çıkış Yap',
    back:         'Geri',
    login:        'Müşteri Girişi',
    getStarted:   'Hemen Başla',
    features:     'Özellikler',
    operations:   'Operasyonlar',
    whyUs:        'Neden Biz',
    requestDemo:  'Demo İsteyin',

    // Vitrin Landing Page
    vitrinBadge:          'YENİ NESİL LOJİSTİK YÖNETİMİ',
    vitrinHeroTitle1:     'TESLİMATLARINIZI',
    vitrinHeroHighlight:  'OTOMATİK',
    vitrinHeroTitle2:     'PİLOTA ALIN',
    vitrinHeroSub:        'Akıllı Lojistik Yönetim Sistemi',
    vitrinHeroDesc:       'Saha operasyonlarınızı kör uçuştan çıkarın. Maliyetleri düşürün, kuryelerinizi tek ekrandan yönetin ve müşteri memnuniyetini zirveye taşıyın.',
    vitrinLiveTrack:      'Canlı Takip',
    vitrinFeaturesTitle:  'Neden LOOP?',
    vitrinFeature1Title:  'Gerçek Zamanlı Takip',
    vitrinFeature1Desc:   'GPS destekli canlı araç ve kargo takibi ile teslimat süreçlerinizi anlık izleyin.',
    vitrinFeature2Title:  'AI Rota Optimizasyonu',
    vitrinFeature2Desc:   'Yapay zekâ ile en hızlı ve en verimli rotaları otomatik hesaplayın.',
    vitrinFeature3Title:  'Gelişmiş Analitik',
    vitrinFeature3Desc:   'Teslimat performansı, maliyet analizi ve müşteri memnuniyeti raporları.',
    vitrinFeature4Title:  'Kurumsal Güvenlik',
    vitrinFeature4Desc:   'End-to-end şifreleme, rol tabanlı erişim ve anomali tespiti ile güvenlik.',
    vitrinFeature5Title:  'Global Operasyonlar',
    vitrinFeature5Desc:   '190+ ülkede çok modlu lojistik operasyonlarını tek panelden yönetin.',
    vitrinFeature6Title:  'Entegrasyon API',
    vitrinFeature6Desc:   'RESTful API ile mevcut ERP, WMS ve TMS sistemlerinize sorunsuz entegre edin.',
    vitrinOpsTitle:       'Nasıl Çalışır?',
    vitrinOp1Title:       'Kayıt & Onboarding',
    vitrinOp1Desc:        'Hesap oluşturun, filonuzu ekleyin ve partner ağınızı kurun.',
    vitrinOp2Title:       'Sipariş & Dispatching',
    vitrinOp2Desc:        'Siparişleri otomatik olarak en uygun kuryeye atayın.',
    vitrinOp3Title:       'Takip & Yönetim',
    vitrinOp3Desc:        'Gerçek zamanlı harita üzerinde tüm operasyonları izleyin ve yönetin.',
    vitrinOp4Title:       'Analiz & Raporlama',
    vitrinOp4Desc:        'Performans metrikleri ve finansal raporlarla süreçleri optimize edin.',
    vitrinWhyTitle:       'Kurumsal Güvenilirlik',
    vitrinWhy1:           'Uptime SLA',
    vitrinWhy2:           'Desteklenen Ülke',
    vitrinWhy3:           'Ortalama Gecikme',
    vitrinWhy4:           'Destek',
    vitrinCtaTitle:       'Lojistik Operasyonlarınızı Dönüştürün',
    vitrinCtaDesc:        'Ücretsiz hesap oluşturun ve LOOP platformunun gücünü keşfedin.',
    vitrinFooter:         'Tüm hakları saklıdır.',

    // Dashboard sidebar
    fleet:        'Filo',
    active:       'Aktif',
    onRoute:      'Yolda',
    delivered:    'Teslim',
    refreshRoutes:'Rotaları Yenile',
    anomaly:      'Anomali',
    optimizeRoute:'Rota Optimize Et',

    // Financial HUD
    revenue:      'Müşteri Geliri',
    cost:         'Partner Maliyeti',
    margin:       'Net Kâr Marjı',
    financial:    'Finansal Özet — Canlı',

    // Anomaly Panel
    anomalyTitle: 'Anomali & Güvenlik',
    activeAlerts: 'aktif uyarı',
    resolved:     'Çözüldü',
    inspect:      'İncele',
    allResolved:  'Tüm anomaliler çözüldü',

    // God Mode Drawer
    godMode:      'GOD MODE — Kurye Müdahale',
    reAssign:     'Acil Yeniden Ata',
    redCode:      'RED-CODE Tetikle',
    suspend:      'Partneri Askıya Al',
    status:       'Durum',
    speed:        'Hız',
    cargo:        'Kargo',
    eta:          'ETA',

    // Profile Page
    profileInfo:  'Profil Bilgileri',
    activity:     'Aktivite',
    adminPanel:   'Admin Paneli',
    settings:     'Ayarlar',
    accountInfo:  'Hesap Bilgileri',
    fullName:     'Ad Soyad',
    email:        'E-Posta',
    role:         'Rol',
    accountStatus:'Hesap Durumu',
    sessionSec:   'Oturum Güvenliği',
    sessionStatus:'Oturum Durumu',
    tokenType:    'Token Türü',
    platform:     'Platform',
    activeVerified:'Aktif & Kimliği Doğrulandı',
    recentActivity:'Son Aktiviteler',
    language:     'Dil',
    theme:        'Tema',
    darkMode:     'Karanlık Mod',
    lightMode:    'Aydınlık Mod',
    turkish:      'Türkçe',
    english:      'English',
    signInRequired:'Giriş Gerekli',
    signInMsg:    'Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.',
    signIn:       'Giriş Yap',
    systemAdmin:  'Sistem Yöneticisi',
    operator:     'Operatör',
    accountActive:'Aktif',
    goToDashboard:"God Mode Dashboard'a Dön",

    // Partner Network
    partnerEco:   'B2B Lojistik Ekosistemi',
    contactInfo:  'İletişim Bilgileri',
    getQuote:     'Teklif Al',
    apiDocs:      'API Dökümanları',
    specialQuote: 'Özel Teklif İste',
    customSolution:'Özel Çözüm Talep Et',
    totalPartners:'Aktif Partner',
    countryNetwork:'Ülke Ağı',
    vehicleFleet: 'Araç Filosu',
    apiAccess:    'API Erişimi',
  },

  en: {
    // Navigation
    dashboard:    'Dashboard',
    couriers:     'Couriers',
    history:      'History',
    report:       'Report',
    map:          'Map',
    partnerNet:   'Partner Network',
    profile:      'My Profile',
    logout:       'Sign Out',
    back:         'Back',
    login:        'Client Login',
    getStarted:   'Get Started',
    features:     'Features',
    operations:   'Operations',
    whyUs:        'Why Us',
    requestDemo:  'Request Demo',

    // Vitrin Landing Page
    vitrinBadge:          'NEXT-GEN LOGISTICS MANAGEMENT',
    vitrinHeroTitle1:     'PUT YOUR',
    vitrinHeroHighlight:  'DELIVERIES',
    vitrinHeroTitle2:     'ON AUTOPILOT',
    vitrinHeroSub:        'Smart Logistics Management System',
    vitrinHeroDesc:       'Take your field operations off blind flight. Cut costs, manage your couriers from one screen and elevate customer satisfaction to the top.',
    vitrinLiveTrack:      'Live Tracking',
    vitrinFeaturesTitle:  'Why LOOP?',
    vitrinFeature1Title:  'Real-Time Tracking',
    vitrinFeature1Desc:   'Monitor your deliveries in real time with GPS-powered live vehicle and cargo tracking.',
    vitrinFeature2Title:  'AI Route Optimization',
    vitrinFeature2Desc:   'Automatically calculate the fastest and most efficient routes with artificial intelligence.',
    vitrinFeature3Title:  'Advanced Analytics',
    vitrinFeature3Desc:   'Delivery performance, cost analysis and customer satisfaction reports.',
    vitrinFeature4Title:  'Enterprise Security',
    vitrinFeature4Desc:   'End-to-end encryption, role-based access and anomaly detection security.',
    vitrinFeature5Title:  'Global Operations',
    vitrinFeature5Desc:   'Manage multi-modal logistics operations across 190+ countries from a single panel.',
    vitrinFeature6Title:  'Integration API',
    vitrinFeature6Desc:   'Seamlessly integrate with your existing ERP, WMS, and TMS systems via RESTful API.',
    vitrinOpsTitle:       'How It Works',
    vitrinOp1Title:       'Register & Onboarding',
    vitrinOp1Desc:        'Create your account, add your fleet, and set up your partner network.',
    vitrinOp2Title:       'Order & Dispatching',
    vitrinOp2Desc:        'Automatically assign orders to the most suitable courier.',
    vitrinOp3Title:       'Track & Manage',
    vitrinOp3Desc:        'Monitor and manage all operations on a real-time map.',
    vitrinOp4Title:       'Analyze & Report',
    vitrinOp4Desc:        'Optimize processes with performance metrics and financial reports.',
    vitrinWhyTitle:       'Enterprise Reliability',
    vitrinWhy1:           'Uptime SLA',
    vitrinWhy2:           'Supported Countries',
    vitrinWhy3:           'Average Latency',
    vitrinWhy4:           'Support',
    vitrinCtaTitle:       'Transform Your Logistics Operations',
    vitrinCtaDesc:        'Create a free account and discover the power of the LOOP platform.',
    vitrinFooter:         'All rights reserved.',

    // Dashboard sidebar
    fleet:        'Fleet',
    active:       'Active',
    onRoute:      'On Route',
    delivered:    'Delivered',
    refreshRoutes:'Refresh Routes',
    anomaly:      'Anomaly',
    optimizeRoute:'Optimize Route',

    // Financial HUD
    revenue:      'Client Revenue',
    cost:         'Partner Cost',
    margin:       'Net Profit Margin',
    financial:    'Financial Summary — Live',

    // Anomaly Panel
    anomalyTitle: 'Anomaly & Security',
    activeAlerts: 'active alerts',
    resolved:     'Resolved',
    inspect:      'Inspect',
    allResolved:  'All anomalies resolved',

    // God Mode Drawer
    godMode:      'GOD MODE — Courier Intervention',
    reAssign:     'Emergency Reassign',
    redCode:      'Trigger RED-CODE',
    suspend:      'Suspend Partner',
    status:       'Status',
    speed:        'Speed',
    cargo:        'Cargo',
    eta:          'ETA',

    // Profile Page
    profileInfo:  'Profile Info',
    activity:     'Activity',
    adminPanel:   'Admin Panel',
    settings:     'Settings',
    accountInfo:  'Account Information',
    fullName:     'Full Name',
    email:        'Email',
    role:         'Role',
    accountStatus:'Account Status',
    sessionSec:   'Session Security',
    sessionStatus:'Session Status',
    tokenType:    'Token Type',
    platform:     'Platform',
    activeVerified:'Active & Identity Verified',
    recentActivity:'Recent Activity',
    language:     'Language',
    theme:        'Theme',
    darkMode:     'Dark Mode',
    lightMode:    'Light Mode',
    turkish:      'Türkçe',
    english:      'English',
    signInRequired:'Login Required',
    signInMsg:    'You need to be logged in to view this page.',
    signIn:       'Sign In',
    systemAdmin:  'System Administrator',
    operator:     'Operator',
    accountActive:'Active',
    goToDashboard:'Go to God Mode Dashboard',

    // Partner Network
    partnerEco:   'B2B Logistics Ecosystem',
    contactInfo:  'Contact Info',
    getQuote:     'Get Quote',
    apiDocs:      'API Docs',
    specialQuote: 'Request Custom Quote',
    customSolution:'Request Custom Solution',
    totalPartners:'Active Partners',
    countryNetwork:'Country Network',
    vehicleFleet: 'Vehicle Fleet',
    apiAccess:    'API Access',
  },
}

// ─── Context ──────────────────────────────────────────────────────────────────
const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  // Initialize from localStorage; default to dark / tr
  const [theme, setThemeState] = useState(() =>
    localStorage.getItem('loop_theme') || 'dark'
  )
  const [language, setLanguageState] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const langFromUrl = params.get('lang')
    if (langFromUrl === 'en' || langFromUrl === 'tr') return langFromUrl
    return localStorage.getItem('loop_lang') || localStorage.getItem('loop_dil') || 'tr'
  })
  const [dbPrefsReady, setDbPrefsReady] = useState(false)

  const hydrateLanguageFromDb = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setDbPrefsReady(true)
      return
    }
    try {
      const r = await fetch(`${API}/auth/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!r.ok) return
      const data = await r.json()
      const dil = data?.preferences?.language === 'en' ? 'en' : 'tr'
      setLanguageState(dil)
    } catch {
      // silent fallback to local value
    } finally {
      setDbPrefsReady(true)
    }
  }, [])

  // Apply theme class to <html> element — works alongside any CSS approach
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
      document.body.style.colorScheme = 'dark'
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
      document.body.style.colorScheme = 'light'
    }
    localStorage.setItem('loop_theme', theme)
  }, [theme])

  // Persist language
  useEffect(() => {
    localStorage.setItem('loop_lang', language)
    localStorage.setItem('loop_dil', language)
    document.documentElement.setAttribute('lang', language)
  }, [language])

  // Pull language preference from DB when session exists
  useEffect(() => {
    hydrateLanguageFromDb()
  }, [hydrateLanguageFromDb])

  // Push language preference to DB whenever user changes it
  useEffect(() => {
    if (!dbPrefsReady) return
    const token = getAuthToken()
    if (!token) return

    fetch(`${API}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ language })
    }).catch(() => {})
  }, [language, dbPrefsReady])

  // Sync language across tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'loop_lang' || e.key === 'loop_dil') {
        const next = (e.newValue === 'en' ? 'en' : 'tr')
        setLanguageState(next)
      }
      if (e.key === 'loop_user' || e.key === 'loop_token') {
        setDbPrefsReady(false)
        hydrateLanguageFromDb()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [hydrateLanguageFromDb])

  // Sync language after login/logout in the same tab
  useEffect(() => {
    const onAuthChange = () => {
      setDbPrefsReady(false)
      hydrateLanguageFromDb()
    }
    window.addEventListener('loop-auth-changed', onAuthChange)
    return () => window.removeEventListener('loop-auth-changed', onAuthChange)
  }, [hydrateLanguageFromDb])

  const setTheme    = useCallback((val) => setThemeState(val), [])
  const setLanguage = useCallback((val) => {
    setLanguageState(val === 'en' ? 'en' : 'tr')
  }, [])
  const toggleTheme = useCallback(() => setThemeState(p => p === 'dark' ? 'light' : 'dark'), [])

  // Translation helper — t('key') returns the string for the active language
  const t = useCallback((key) => TRANSLATIONS[language]?.[key] ?? TRANSLATIONS['tr'][key] ?? key, [language])

  const isDark = theme === 'dark'

  return (
    <SettingsContext.Provider value={{ theme, isDark, setTheme, toggleTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}

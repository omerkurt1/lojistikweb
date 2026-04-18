// src/context/SettingsContext.jsx
// Single source of truth for Theme and Language across the entire application.
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

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
  const [language, setLanguageState] = useState(() =>
    localStorage.getItem('loop_lang') || 'tr'
  )

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
    document.documentElement.setAttribute('lang', language)
  }, [language])

  const setTheme    = useCallback((val) => setThemeState(val), [])
  const setLanguage = useCallback((val) => setLanguageState(val), [])
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

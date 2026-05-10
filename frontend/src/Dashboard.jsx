import { useState, useEffect, useCallback, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import io from 'socket.io-client'
import 'leaflet/dist/leaflet.css'
import './App.css'
import IstatistikPaneli from './istatistik'
import { useAuth }     from './context/AuthContext'
import { useSettings } from './context/SettingsContext'

// Professional SVG Glyphs for local components
const SVG_Alert = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const SVG_Warn = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const SVG_Radio = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
const SVG_Wrench = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
const SVG_Shield = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const FF = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const BACKEND = 'https://lojistikweb-backend.onrender.com'
const soket = io(BACKEND)

// Fixed dashboard basemap for both light and dark UI modes
const TILE_FIXED  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR   = '© OpenStreetMap contributors'

// Unified courier color — corporate cyan
const KURYE_RENK = '#2F6F73'
const KURYE_RENK_OFF = '#6b7280'

// Route color — single professional tone, dimmed for offline
function rotaRengi(k) {
  return k.online ? '#2F6F73' : '#555'
}

function normalizeDurum(durum = '') {
  const s = String(durum).toLowerCase()
  if (s.includes('teslim')) return 'teslim'
  if (s.includes('yolda')) return 'yolda'
  if (s.includes('paketi')) return 'paket'
  return 'diger'
}

function isDelivered(durum = '') {
  return normalizeDurum(durum) === 'teslim'
}

function durumEtiketi(durum = '', lang = 'tr') {
  const k = normalizeDurum(durum)
  if (lang === 'en') {
    if (k === 'teslim') return 'Delivered'
    if (k === 'yolda') return 'On Route'
    if (k === 'paket') return 'Picked Up'
    return durum || 'Preparing'
  }
  if (k === 'teslim') return 'Teslim Edildi'
  if (k === 'yolda') return 'Yolda'
  if (k === 'paket') return 'Paketi Aldı'
  return durum || 'Hazırlanıyor'
}

// ── Partner enrichment data — global freight types ──
const PARTNER_MAP = {
  0: { firma: 'Global Freight Express', tip: 'Air Freight',      kargoTuru: 'Air Freight FCL'            },
  1: { firma: 'CityLine Last-Mile',     tip: 'Cross-border',     kargoTuru: 'Cross-border LTL'           },
  2: { firma: 'ColdChain Logistics',    tip: 'Cold Chain',       kargoTuru: 'Pharma Cold Chain'          },
  3: { firma: 'AeroGlobal Cargo',       tip: 'Air Cargo',        kargoTuru: 'Air Freight FCL'            },
  4: { firma: 'SwiftPort Maritime',     tip: 'Maritime',         kargoTuru: 'Maritime Container TEU'     },
  5: { firma: 'TerraFleet Road',        tip: 'Road Freight TIR', kargoTuru: 'Intermodal TIR'            },
  6: { firma: 'EcoFleet Green',         tip: 'Express Parcel',   kargoTuru: 'Express B2B Parcel'         },
  7: { firma: 'NightOwl Express',       tip: 'Bonded Warehouse', kargoTuru: 'Bonded Warehouse Transfer'  },
}

// ── Anomaly seed data ──
const ANOMALY_SEED = [
  { id: 'A1', severity: 'critical', title: 'Sahte POD Tespiti',  detail: 'GPS-konum uyuşmazlığı — Teslimat #881, konumdan 2.4km sapma', time: '14:22', icon: SVG_Alert },
  { id: 'A2', severity: 'warning',  title: 'Rota Sapması',       detail: 'CityLine Kurye #42 planlanan rotadan 3.2km sapmış', time: '13:58', icon: SVG_Warn },
  { id: 'A3', severity: 'critical', title: 'SLA İhlali',          detail: 'ColdChain teslimat #556 — 45dk gecikme, soğuk zincir riski', time: '13:41', icon: SVG_Alert },
  { id: 'A4', severity: 'info',     title: 'Hız Limiti Aşımı',    detail: 'Kurye Mehmet — Anlık hız 112km/s, limit: 90km/s', time: '13:15', icon: SVG_Radio },
  { id: 'A5', severity: 'warning',  title: 'Uzun Mola Tespiti',   detail: 'Kurye Hasan — 47dk hareketsiz, planlı mola 15dk', time: '12:50', icon: SVG_Warn },
  { id: 'A6', severity: 'info',     title: 'Araç Bakım Uyarısı',  detail: 'TerraFleet #TF-0812 — Motor sıcaklık sensörü uyarısı', time: '12:30', icon: SVG_Wrench },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  MAP ICONS — UNIFIED CORPORATE STYLE
// ═══════════════════════════════════════════════════════════════════════════════
const KAMYON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`

function kamyonIkon(online = true) {
  const bg = online ? KURYE_RENK : KURYE_RENK_OFF
  return new L.DivIcon({
    className: '',
    html: `<div style="
      background:${bg};
      border-radius:50%;
      width:36px; height:36px;
      display:flex; justify-content:center; align-items:center;
      box-shadow:0 3px 12px ${bg}55, 0 0 0 2.5px white;
      border:2px solid white;
      transition:all 0.3s;
      opacity:${online ? 1 : 0.5};
    ">${KAMYON_SVG}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })
}

const HEDEF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`

const hedefIkon = new L.DivIcon({
  className: '',
  html: `<div style="color:white; background:${KURYE_RENK}; border-radius:50%; width:24px; height:24px; display:flex; justify-content:center; align-items:center; box-shadow:0 3px 8px rgba(0,0,0,0.4); border:2px solid white;">${HEDEF_SVG}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

function HaritaKontrol({ hedef }) {
  const map = useMap()
  useEffect(() => {
    // Zoom to 10 when centering on a specific courier — still legible at city scale
    if (hedef) map.flyTo([hedef.enlem, hedef.boylam], 10, { duration: 1.2 })
  }, [hedef, map])
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
//  THEME SYSTEM — returns computed tokens for dark/light
// ═══════════════════════════════════════════════════════════════════════════════
function tema(dark) {
  if (dark) return {
    bg: '#0b1120', panelBg: 'rgba(11,17,32,0.92)', panelBorder: 'rgba(255,255,255,0.07)',
    text: '#e8f0ff', textMuted: '#6a7fa8', textDim: 'rgba(255,255,255,0.35)',
    accent: '#2F6F73', accent2: '#4B8A8F', danger: '#ff4757', warn: '#ff9f1c', success: '#2ed573',
    cardBg: 'rgba(255,255,255,0.03)', cardBorder: 'rgba(255,255,255,0.06)',
    inputBg: 'rgba(255,255,255,0.04)',
    shadow: '0 8px 32px rgba(0,0,0,0.4)',
    glass: { background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  }
  return {
    bg: '#f0f4ff', panelBg: 'rgba(255,255,255,0.95)', panelBorder: 'rgba(0,0,0,0.08)',
    text: '#0a1628', textMuted: '#5a6a8a', textDim: 'rgba(0,0,0,0.35)',
    accent: '#2F6F73', accent2: '#4B8A8F', danger: '#dc3545', warn: '#e67e22', success: '#27ae60',
    cardBg: '#f5f7ff', cardBorder: '#e8ecf8',
    inputBg: '#f0f2f8',
    shadow: '0 4px 20px rgba(0,0,0,0.08)',
    glass: { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Financial HUD — DIRECTIVE 5: overflow-safe, bounded cards ──
function FinansHUD({ t, lang }) {
  const gelir = 145320, maliyet = 108740
  const kar = gelir - maliyet
  const marj = ((kar / gelir) * 100).toFixed(1)
  const marjRenk = kar > 0 ? t.success : t.danger

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      {[
        { label: lang === 'tr' ? 'MÜŞTERİ GELİRİ' : 'CLIENT REVENUE', value: `₺${gelir.toLocaleString('tr-TR')}`, color: t.accent },
        { label: lang === 'tr' ? 'PARTNER MALİYETİ' : 'PARTNER COST', value: `₺${maliyet.toLocaleString('tr-TR')}`, color: t.warn },
        { label: lang === 'tr' ? 'NET KÂR MARJI' : 'NET MARGIN', value: `%${marj}`, color: marjRenk },
      ].map(s => (
        <div key={s.label} style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 10, padding: '8px 10px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: t.textDim, letterSpacing: '0.08em', marginBottom: 4, fontFamily: FF, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: s.color, fontFamily: FF, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Anomaly Panel ──
function AnomalyPanel({ acik, toggle, t, lang, tx }) {
  const [alerts, setAlerts] = useState(ANOMALY_SEED)
  const [resolved, setResolved] = useState(new Set())

  const resolve = (id) => {
    setResolved(prev => new Set([...prev, id]))
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 600)
  }

  const sevColors = { critical: t.danger, warning: t.warn, info: t.accent }

  if (!acik) return null

  return (
    <div style={{
      ...t.glass, position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 340, zIndex: 700, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: FF, borderRadius: '0 0 0 14px',
    }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text, display: 'flex', alignItems: 'center', gap: 6 }}>{SVG_Shield} {tx('anomalyTitle')}</div>
          <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{alerts.length} {tx('activeAlerts')}</div>
        </div>
        <button onClick={toggle} style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: t.textMuted, cursor: 'pointer', fontFamily: FF, fontWeight: 700 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: resolved.has(a.id) ? `${t.success}08` : t.cardBg,
            border: `1px solid ${resolved.has(a.id) ? `${t.success}30` : t.cardBorder}`,
            borderLeft: `3px solid ${sevColors[a.severity]}`,
            borderRadius: 10, padding: '12px 14px', marginBottom: 8,
            opacity: resolved.has(a.id) ? 0.4 : 1, transition: 'opacity 0.5s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{a.icon} {a.title}</span>
              <span style={{ fontSize: 9, color: t.textDim, fontWeight: 600 }}>{a.time}</span>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5, marginBottom: 8 }}>{a.detail}</div>
            {!resolved.has(a.id) && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => resolve(a.id)} style={{ background: `${t.success}15`, color: t.success, border: `1px solid ${t.success}30`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>{tx('resolved')}</button>
                <button style={{ background: `${t.warn}12`, color: t.warn, border: `1px solid ${t.warn}30`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>{tx('inspect')}</button>
              </div>
            )}
          </div>
        ))}
        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: t.textDim, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {tx('allResolved')}
          </div>
        )}
      </div>
    </div>
  )
}

// ── God Mode Intervention Drawer ──
function InterventionDrawer({ kurye, kapat, bildirimEkle, t, lang, tx }) {
  if (!kurye) return null
  const partner = PARTNER_MAP[kurye.id % 8]

  const reAssign = () => { bildirimEkle(lang === 'en' ? `${kurye.isim} job is being reassigned to nearest partner courier...` : `${kurye.isim} yükü en yakın partner kuryeye aktarılıyor...`, 'uyari'); kapat() }
  const redCode  = () => { bildirimEkle(lang === 'en' ? `RED-CODE VIP: ${kurye.isim} delivery is now maximum priority!` : `RED-CODE VIP: ${kurye.isim} teslimatı maksimum önceliğe alındı!`, 'basari'); kapat() }
  const suspend  = () => { bildirimEkle(lang === 'en' ? `${partner.firma} — ${kurye.isim} network access suspended.` : `${partner.firma} — ${kurye.isim} ağ erişimi askıya alındı.`, 'uyari'); kapat() }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={kapat}>
      <div style={{ ...t.glass, width: '100%', maxWidth: 440, padding: 0, overflow: 'hidden', fontFamily: FF, borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accent2} 100%)`, padding: '22px 26px', position: 'relative' }}>
          <button onClick={kapat} style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>{tx('godMode')}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{kurye.isim}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{partner.firma} — {partner.tip}</div>
        </div>
        {/* Body */}
        <div style={{ padding: '18px 26px 26px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {[
              { label: tx('status').toUpperCase(), value: durumEtiketi(kurye.durum, lang), color: kurye.online ? t.success : t.danger },
              { label: tx('speed').toUpperCase(), value: `${kurye.hiz || 0} km/s`, color: t.accent },
              { label: tx('cargo').toUpperCase(), value: partner.kargoTuru, color: t.text },
              { label: tx('eta').toUpperCase(), value: kurye.eta > 0 ? `~${kurye.eta} ${lang === 'en' ? 'min' : 'dk'}` : (lang === 'en' ? 'Delivered' : 'Teslim'), color: t.warn },
            ].map(item => (
              <div key={item.label} style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: t.textDim, letterSpacing: '0.06em', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: t.textDim, marginBottom: 14, fontFamily: 'monospace' }}>{kurye.enlem?.toFixed(5)}, {kurye.boylam?.toFixed(5)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <button onClick={reAssign} style={{ ...actionBtn, background: `${t.accent}18`, border: `1px solid ${t.accent}35`, color: t.accent }}>{tx('reAssign')}</button>
            <button onClick={redCode} style={{ ...actionBtn, background: `${t.danger}15`, border: `1px solid ${t.danger}30`, color: t.danger }}>{tx('redCode')}</button>
            <button onClick={suspend} style={{ ...actionBtn, background: `${t.warn}12`, border: `1px solid ${t.warn}25`, color: t.warn }}>{tx('suspend')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Uygulama() {
  const [kuryeListesi, setKuryeler] = useState([])
  const [siparisFisi,  setFis]      = useState([])
  const [dbGenel,      setDbGenel]  = useState(null)
  const [bildirimler,  setBildirim] = useState([])

  // Theme + Language — from global SettingsContext
  const { isDark: dark, toggleTheme, language: lang, t: tx } = useSettings()
  const t = tema(dark)

  // UI state
  const [aktifSekme,    setSekme]        = useState('kuryeler')
  const [secilenId,     setSecilenId]    = useState(null)
  const [zoomHedef,     setZoomHedef]    = useState(null)
  const [anomalyAcik,   setAnomalyAcik] = useState(false)
  const [interventionK, setIntervention] = useState(null)

  const raporAcik = aktifSekme === 'istatistik'
  // Continental/Eurasian center — shows Europe, Middle East, and western Asia in one view
  const merkez = [48.5, 18.0]

  // Clock
  const [saat, setSaat] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setSaat(new Date()), 1000); return () => clearInterval(i) }, [])

  // ── Backend stats ──
  useEffect(() => {
    const cek = async () => { try { const r = await fetch(`${BACKEND}/api/istatistik/genel`); setDbGenel(await r.json()) } catch {} }
    cek(); const i = setInterval(cek, 30000); return () => clearInterval(i)
  }, [])

  // ── Notifications ──
  const bildirimEkle = useCallback((mesaj, tip = 'bilgi') => {
    const id = Date.now() + Math.random()
    setBildirim(prev => [...prev, { id, mesaj, tip }])
    setTimeout(() => setBildirim(prev => prev.filter(b => b.id !== id)), 5000)
  }, [])

  // ── Socket ──
  useEffect(() => {
    soket.on('kuryeleriGuncelle', setKuryeler)
    soket.on('siparisFisiGuncelle', setFis)
    soket.on('teslimatBildirimi', ({ isim, zaman }) => bildirimEkle(lang === 'en' ? `${isim} completed a delivery (${zaman})` : `${isim} teslimatı tamamladı (${zaman})`, 'basari'))
    return () => { soket.off('kuryeleriGuncelle'); soket.off('siparisFisiGuncelle'); soket.off('teslimatBildirimi') }
  }, [bildirimEkle, lang])

  // ── Actions ──
  const tumRotaYenile = () => { soket.emit('yeniRotaCiz'); bildirimEkle(lang === 'en' ? 'Recalculating all routes...' : 'Tüm rotalar yeniden hesaplanıyor...', 'bilgi') }
  const tekRotaYenile = (k, e) => { e.stopPropagation(); soket.emit('tekKuryeRotaCiz', k.id); bildirimEkle(lang === 'en' ? `Optimizing route for ${k.isim}...` : `${k.isim} rotası optimize ediliyor...`, 'bilgi') }
  const onlineDegistir = (k, e) => { e.stopPropagation(); soket.emit('kuryeOnlineDegistir', k.id); bildirimEkle(k.online ? (lang === 'en' ? `Deactivated: ${k.isim} is offline` : `Deaktive: ${k.isim} çevrimdışı`) : (lang === 'en' ? `Activated: ${k.isim} is online` : `Aktif: ${k.isim} çevrimiçi`), 'uyari') }
  const kuryeyiSec = (k) => { setSecilenId(k.id); setZoomHedef({ ...k, _ts: Date.now() }) }

  // Stats
  const toplam = kuryeListesi.length
  const yolda  = kuryeListesi.filter(k => !isDelivered(k.durum) && k.online).length
  const aktif  = kuryeListesi.filter(k => k.online).length
  const teslim = dbGenel?.toplamTeslimat ?? kuryeListesi.filter(k => isDelivered(k.durum)).length

  // Sidebar width constant
  const SIDEBAR_W = 330

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: t.bg, fontFamily: FF, color: t.text }}>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
        {bildirimler.map(b => (
          <div key={b.id} style={{
            ...t.glass, padding: '12px 16px', fontSize: 12, fontWeight: 600,
            borderLeft: `3px solid ${b.tip === 'basari' ? t.success : b.tip === 'uyari' ? t.warn : t.accent}`,
            color: t.text, animation: 'fadeSlideIn 0.3s ease',
          }}>
            {b.mesaj}
          </div>
        ))}
      </div>

      {/* ═══ INTERVENTION DRAWER (modal overlay) ═══ */}
      {interventionK && <InterventionDrawer kurye={interventionK} kapat={() => setIntervention(null)} bildirimEkle={bildirimEkle} t={t} lang={lang} tx={tx} />}

      {/* ═══ FULL-SCREEN MAP / RAPOR ═══ */}
      {raporAcik ? (
        <div style={{ position: 'absolute', top: 0, left: SIDEBAR_W, right: 0, bottom: 0, zIndex: 1, overflow: 'auto', background: t.bg }}>
          <IstatistikPaneli />
        </div>
      ) : (
        <div style={{ position: 'absolute', top: 0, left: SIDEBAR_W, right: anomalyAcik ? 340 : 0, bottom: 0, zIndex: 1, transition: 'right 0.3s ease' }}>
          <MapContainer center={merkez} zoom={5} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer url={TILE_FIXED} attribution={TILE_ATTR} />
            <HaritaKontrol hedef={zoomHedef} />
            {kuryeListesi.map(kurye => (
              <Fragment key={kurye.id}>
                <Marker position={[kurye.enlem, kurye.boylam]} icon={kamyonIkon(kurye.online)} eventHandlers={{ click: () => setIntervention(kurye) }}>
                  <Popup>
                    <div style={{ fontFamily: FF, fontSize: 12, minWidth: 180 }}>
                      <strong style={{ fontSize: 13 }}>{kurye.isim}</strong><br />
                      <span style={{ color: '#6a7fa8' }}>{PARTNER_MAP[kurye.id % 8]?.firma}</span><br />
                      <span style={{ color: '#2F6F73', fontWeight: 700 }}>{kurye.kargoTuru || PARTNER_MAP[kurye.id % 8]?.kargoTuru}</span><br />
                      {kurye.originHub && <><span style={{ color: '#888', fontSize: 11 }}>From: {kurye.originHub}</span><br /></>}
                      {kurye.destHub   && <><span style={{ color: '#888', fontSize: 11 }}>To: {kurye.destHub}</span><br /></>}
                      <span>{durumEtiketi(kurye.durum, lang)} • {kurye.hiz} km/s</span>
                      {kurye.eta > 0 && <><br /><span>ETA: ~{kurye.eta} {lang === 'en' ? 'min' : 'dk'}</span></>}
                    </div>
                  </Popup>
                </Marker>
                {!isDelivered(kurye.durum) && (
                  <Marker position={[kurye.hedefEnlem, kurye.hedefBoylam]} icon={hedefIkon}>
                    <Popup><strong>{kurye.isim}</strong> — {lang === 'en' ? 'Destination' : 'Hedef'}</Popup>
                  </Marker>
                )}
                {kurye.rota?.length > 1 && (
                  <Polyline positions={kurye.rota} color={rotaRengi(kurye)} weight={isDelivered(kurye.durum) ? 2 : 4} opacity={kurye.online ? 0.8 : 0.3} dashArray={kurye.online ? '8 5' : '3 8'} />
                )}
              </Fragment>
            ))}
          </MapContainer>
        </div>
      )}

      {/* ═══ ANOMALY PANEL (right side, inside map area) ═══ */}
      {!raporAcik && <AnomalyPanel acik={anomalyAcik} toggle={() => setAnomalyAcik(false)} t={t} lang={lang} tx={tx} />}

      {/* ═══════════════════════════════════════════════════════
          LEFT SIDEBAR — SOLID, NO OVERLAP
      ═══════════════════════════════════════════════════════ */}
      <aside style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: SIDEBAR_W, zIndex: 800,
        background: t.panelBg,
        borderRight: `1px solid ${t.panelBorder}`,
        display: 'flex', flexDirection: 'column',
        fontFamily: FF,
        boxShadow: dark ? '4px 0 24px rgba(0,0,0,0.3)' : '2px 0 12px rgba(0,0,0,0.06)',
      }}>

        {/* ── HEADER: Logo + Theme Toggle ── */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 900 }}>LOOP</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: t.accent, padding: '2px 8px', borderRadius: 4, background: `${t.accent}12`, border: `1px solid ${t.accent}25` }}>COMMAND</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: t.textDim, fontFamily: 'monospace', fontWeight: 600 }}>
              {saat.toLocaleTimeString(lang === 'en' ? 'en-US' : 'tr-TR')}
            </span>
            <button
              onClick={toggleTheme}
              title={lang === 'en' ? 'Toggle Theme' : 'Tema Değiştir'}
              style={{
                width: 34, height: 20, borderRadius: 12, padding: 0, cursor: 'pointer',
                border: `1px solid ${t.panelBorder}`,
                background: dark ? 'rgba(47,111,115,0.2)' : '#ccc',
                position: 'relative', transition: 'background 0.3s',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: dark ? t.accent : '#fff',
                position: 'absolute', top: 1,
                left: dark ? 16 : 1,
                transition: 'left 0.3s, background 0.3s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>

        {/* ── FINANCIAL HUD — DIRECTIVE 5: overflow safe ── */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.panelBorder}`, flexShrink: 0, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: t.textDim, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success, boxShadow: `0 0 6px ${t.success}` }} />
            {tx('financial').toUpperCase()}
          </div>
          <FinansHUD t={t} lang={lang} />
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.panelBorder}`, display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {[
            { label: tx('fleet').toUpperCase(), val: toplam, color: t.accent },
            { label: tx('active').toUpperCase(), val: aktif, color: t.success },
            { label: tx('onRoute').toUpperCase(), val: yolda, color: t.warn },
            { label: tx('delivered').toUpperCase(), val: teslim, color: '#a55eea' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, padding: '5px 10px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: t.textDim, letterSpacing: '0.06em' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{s.val}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.panelBorder}`, display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={tumRotaYenile} style={{ ...actionBtn, flex: 1, background: `${t.accent}15`, border: `1px solid ${t.accent}30`, color: t.accent, fontSize: 11 }}>
            {tx('refreshRoutes')}
          </button>
          <button onClick={() => setAnomalyAcik(p => !p)} style={{
            ...actionBtn, background: anomalyAcik ? `${t.danger}15` : t.cardBg,
            border: `1px solid ${anomalyAcik ? `${t.danger}30` : t.cardBorder}`,
            color: anomalyAcik ? t.danger : t.textMuted, fontSize: 11, minWidth: 90, display: 'flex', alignItems: 'center'
          }}>
            {SVG_Alert} {tx('anomaly')} <span style={{ background: t.danger, color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 8, marginLeft: 4 }}>6</span>
          </button>
        </div>

        {/* ── TAB BAR — ALWAYS VISIBLE ── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${t.panelBorder}`, flexShrink: 0 }}>
          {[
            { key: 'kuryeler',   label: `${tx('fleet')} (${aktif}/${toplam})` },
            { key: 'log',        label: tx('history') },
            { key: 'istatistik', label: tx('report') },
          ].map(tab => (
            <button key={tab.key} onClick={() => setSekme(tab.key)} style={{
              background: aktifSekme === tab.key ? `${t.accent}10` : 'transparent',
              border: 'none', borderBottom: aktifSekme === tab.key ? `2px solid ${t.accent}` : '2px solid transparent',
              flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 700, fontFamily: FF,
              color: aktifSekme === tab.key ? t.accent : t.textMuted,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>

          {aktifSekme === 'kuryeler' && kuryeListesi.map(kurye => {
            const partner = PARTNER_MAP[kurye.id % 8]
            const selected = secilenId === kurye.id
            return (
              <div key={kurye.id} onClick={() => kuryeyiSec(kurye)} style={{
                background: selected ? `${t.accent}10` : t.cardBg,
                border: `1px solid ${selected ? `${t.accent}30` : t.cardBorder}`,
                borderRadius: 10, padding: '10px 12px', cursor: 'pointer', marginBottom: 5,
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: kurye.online ? t.success : KURYE_RENK_OFF, boxShadow: kurye.online ? `0 0 6px ${t.success}` : 'none' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{kurye.isim}</span>
                  </div>
                  <button onClick={e => onlineDegistir(kurye, e)} style={{
                    background: kurye.online ? `${t.success}15` : t.cardBg,
                    border: `1px solid ${kurye.online ? `${t.success}30` : t.cardBorder}`,
                    borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700,
                    color: kurye.online ? t.success : t.textDim, cursor: 'pointer', fontFamily: FF,
                  }}>
                    {kurye.online ? tx('active').toUpperCase() : (lang === 'en' ? 'OFFLINE' : 'PASİF')}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: t.textDim, marginBottom: 3 }}>{partner.firma} — {partner.kargoTuru}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ color: t.textMuted }}>{durumEtiketi(kurye.durum, lang)}</span>
                  <span style={{ color: t.textDim }}>•</span>
                  <span style={{ color: t.accent, fontWeight: 600 }}>{kurye.hiz} km/s</span>
                  {kurye.eta > 0 && <>
                    <span style={{ color: t.textDim }}>•</span>
                    <span style={{ color: t.warn, fontWeight: 600 }}>~{kurye.eta}{lang === 'en' ? 'm' : 'dk'}</span>
                  </>}
                </div>
                {kurye.online && !isDelivered(kurye.durum) && (
                  <button onClick={e => tekRotaYenile(kurye, e)} style={{ marginTop: 6, background: `${t.accent}10`, border: `1px solid ${t.accent}20`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 600, color: t.accent, cursor: 'pointer', fontFamily: FF, width: '100%' }}>
                    {tx('optimizeRoute')}
                  </button>
                )}
              </div>
            )
          })}

          {aktifSekme === 'log' && (
            <>
              <div style={{ fontSize: 10, color: t.textDim, padding: '6px 4px', fontWeight: 700 }}>{siparisFisi.length} {lang === 'en' ? 'delivery records' : 'teslimat kaydı'}</div>
              {siparisFisi.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: t.textDim, fontSize: 12 }}>{lang === 'en' ? 'No delivered orders yet' : 'Henüz teslim edilen sipariş yok'}</div>
              ) : siparisFisi.map(log => (
                <div key={log.id} style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 10, padding: '10px 12px', marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: t.success, fontWeight: 700 }}>{log.kuryeIsim}</span>
                    <span style={{ color: t.textDim, fontSize: 10 }}>{log.zaman}</span>
                  </div>
                  <div style={{ fontSize: 10, color: t.textDim, marginTop: 3, fontFamily: 'monospace' }}>{log.hedefEnlem?.toFixed(4)}, {log.hedefBoylam?.toFixed(4)}</div>
                </div>
              ))}
            </>
          )}

          {aktifSekme === 'istatistik' && (
            <div style={{ textAlign: 'center', padding: 30, color: t.textMuted, fontSize: 12 }}>{lang === 'en' ? 'Report panel is open on the right side' : 'Rapor paneli sağ tarafta açıldı'}</div>
          )}
        </div>
      </aside>

      {/* ═══ INLINE STYLES ═══ */}
      <style>{`
        @keyframes fadeSlideIn {
          from { transform: translateX(30px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .leaflet-container {
          background: #e8ecf8 !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(0,0,0,0.15) !important;
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          z-index: 800 !important;
        }
        .leaflet-control-zoom a {
          background: #fff !important;
          color: #333 !important;
          border-color: #ddd !important;
        }
        .leaflet-popup-content-wrapper {
          background: #fff !important;
          color: #333 !important;
          border: 1px solid #ddd !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
        }
        .leaflet-popup-tip {
          background: #fff !important;
        }
        .leaflet-control-attribution { display: none !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}; border-radius: 4px; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const actionBtn = {
  border: 'none', borderRadius: 8,
  fontFamily: "'Inter','Plus Jakarta Sans',sans-serif",
  fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em',
  padding: '10px 14px', fontSize: 12, transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
}

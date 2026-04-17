import { useState, useEffect, useCallback, Fragment, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import io from 'socket.io-client'
import 'leaflet/dist/leaflet.css'
import './App.css'
import IstatistikPaneli from './istatistik'

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const FF = "'Inter','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
const BACKEND = 'https://lojistikweb-backend.onrender.com'
const soket = io(BACKEND)

const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '© OpenStreetMap contributors © CARTO'

const ROTA_RENKLERI = ['#00d4ff','#ff4757','#2ed573','#a55eea','#ff9f1c','#1abc9c','#fd79a8','#ffeaa7']
function rotaRengi(k) {
  if (!k.online) return '#555'
  return ROTA_RENKLERI[k.id % ROTA_RENKLERI.length]
}

// ── Partner companies for "God Mode" enrichment ──
const PARTNER_MAP = {
  0: { firma: 'Global Freight Express', tip: 'Uluslararası Kargo', kargoTuru: 'Multimodal Yük' },
  1: { firma: 'CityLine Last-Mile',    tip: 'Şehir İçi Teslimat', kargoTuru: 'E-Ticaret Paketi' },
  2: { firma: 'ColdChain Logistics',    tip: 'Soğuk Zincir',       kargoTuru: 'Farmasötik' },
  3: { firma: 'AeroGlobal Cargo',       tip: 'Hava Kargo',         kargoTuru: 'Değerli Yük' },
  4: { firma: 'SwiftPort Maritime',     tip: 'Deniz Yolu',         kargoTuru: 'FCL Konteyner' },
  5: { firma: 'TerraFleet Road',        tip: 'Karayolu TIR',       kargoTuru: 'Komple Yük' },
  6: { firma: 'EcoFleet Green',         tip: 'Elektrikli Filo',    kargoTuru: 'Mikro Teslimat' },
  7: { firma: 'NightOwl Express',       tip: 'Gece Operasyonu',    kargoTuru: 'Acil Gönderi' },
}

// ── Anomaly mock data ──
const ANOMALY_SEED = [
  { id: 'A1', severity: 'critical', title: 'Sahte POD Tespiti', detail: 'GPS-konum uyuşmazlığı — Teslimat #881, konumdan 2.4km sapma', time: '14:22', icon: '🚨' },
  { id: 'A2', severity: 'warning',  title: 'Rota Sapması',      detail: 'CityLine Kurye #42 planlanan rotadan 3.2km sapmış', time: '13:58', icon: '⚠️' },
  { id: 'A3', severity: 'critical', title: 'SLA İhlali',         detail: 'ColdChain teslimat #556 — 45dk gecikme, soğuk zincir riski', time: '13:41', icon: '🚨' },
  { id: 'A4', severity: 'info',     title: 'Hız Limiti Aşımı',   detail: 'Kurye Mehmet — Anlık hız 112km/s, limit: 90km/s', time: '13:15', icon: '📡' },
  { id: 'A5', severity: 'warning',  title: 'Uzun Mola Tespiti',  detail: 'Kurye Hasan — 47dk hareketsiz, planlı mola 15dk', time: '12:50', icon: '⚠️' },
  { id: 'A6', severity: 'info',     title: 'Araç Bakım Uyarısı', detail: 'TerraFleet #TF-0812 — Motor sıcaklık sensörü uyarısı', time: '12:30', icon: '🔧' },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  MAP ICONS
// ═══════════════════════════════════════════════════════════════════════════════
const KAMYON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`

function kamyonIkon(online = true, renk = '#3b82f6') {
  const bg = online ? renk : '#444'
  return new L.DivIcon({
    className: '',
    html: `<div style="background:${bg};border-radius:50%;width:38px;height:38px;display:flex;justify-content:center;align-items:center;box-shadow:0 0 16px ${bg}88,0 0 0 3px rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);opacity:${online?1:0.45};">${KAMYON_SVG}</div>`,
    iconSize: [38, 38], iconAnchor: [19, 19]
  })
}

const hedefIkon = new L.DivIcon({
  className: '',
  html: `<div style="font-size:16px;background:#ff4757;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:26px;height:26px;display:flex;justify-content:center;align-items:center;box-shadow:0 2px 8px rgba(255,71,87,0.5);border:2px solid rgba(255,255,255,0.3);"><span style="transform:rotate(45deg)">📍</span></div>`,
  iconSize: [26, 26], iconAnchor: [13, 26]
})

function HaritaKontrol({ hedef }) {
  const map = useMap()
  useEffect(() => {
    if (hedef) map.flyTo([hedef.enlem, hedef.boylam], 15, { duration: 1.2 })
  }, [hedef, map])
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GLASSMORPHISM STYLE TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const GLASS = {
  background: 'rgba(8,14,30,0.82)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
}

const GLASS_LIGHT = {
  ...GLASS,
  background: 'rgba(8,14,30,0.72)',
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Financial HUD ──
function FinansHUD({ kuryeler, dbGenel }) {
  const gelir  = 145320
  const maliyet = 108740
  const kar = gelir - maliyet
  const marj = ((kar / gelir) * 100).toFixed(1)
  const marjRenk = kar > 0 ? '#2ed573' : '#ff4757'

  return (
    <div style={{ ...GLASS, padding: '16px 20px', minWidth: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ed573', boxShadow: '0 0 8px #2ed573' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: FF }}>
          Finansal Özet — Canlı
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4, fontFamily: FF }}>MÜŞTERİ GELİRİ</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#00d4ff', fontFamily: FF }}>₺{gelir.toLocaleString('tr-TR')}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4, fontFamily: FF }}>PARTNER MALİYETİ</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ff9f1c', fontFamily: FF }}>₺{maliyet.toLocaleString('tr-TR')}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4, fontFamily: FF }}>NET KÂR MARJI</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: marjRenk, fontFamily: FF }}>%{marj}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${marj}%`, background: `linear-gradient(90deg, ${marjRenk}, ${marjRenk}88)`, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

// ── Operational Stats Bar ──
function OpBar({ toplam, aktif, yolda, teslim }) {
  return (
    <div style={{ ...GLASS_LIGHT, padding: '10px 16px', display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, fontFamily: FF }}>
      {[
        { label: 'FİLO', val: toplam, color: '#00d4ff' },
        { label: 'AKTİF', val: aktif, color: '#2ed573' },
        { label: 'YOLDA', val: yolda, color: '#ff9f1c' },
        { label: 'TESLİM', val: teslim, color: '#a55eea' },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>{s.label}</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{s.val}</span>
        </div>
      ))}
    </div>
  )
}

// ── Anomaly Panel ──
function AnomalyPanel({ acik, toggle }) {
  const [alerts, setAlerts] = useState(ANOMALY_SEED)
  const [resolved, setResolved] = useState(new Set())

  const resolve = (id) => {
    setResolved(prev => new Set([...prev, id]))
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 600)
  }

  const sevColors = { critical: '#ff4757', warning: '#ff9f1c', info: '#00d4ff' }

  if (!acik) return null

  return (
    <div style={{
      ...GLASS,
      position: 'absolute', top: 16, right: 16, bottom: 16,
      width: 360, zIndex: 800, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: FF,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>🛡️ Anomali & Güvenlik</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{alerts.length} aktif uyarı</div>
        </div>
        <button onClick={toggle} style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', padding: '6px 10px', fontSize: 11 }}>✕</button>
      </div>
      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: resolved.has(a.id) ? 'rgba(46,213,115,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${resolved.has(a.id) ? 'rgba(46,213,115,0.2)' : 'rgba(255,255,255,0.05)'}`,
            borderLeft: `3px solid ${sevColors[a.severity]}`,
            borderRadius: 10, padding: '12px 14px', marginBottom: 8,
            opacity: resolved.has(a.id) ? 0.4 : 1,
            transition: 'opacity 0.5s, background 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{a.icon} {a.title}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{a.time}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 8 }}>{a.detail}</div>
            {!resolved.has(a.id) && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => resolve(a.id)} style={{
                  ...btnBase, background: 'rgba(46,213,115,0.12)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.25)',
                  padding: '4px 10px', fontSize: 10,
                }}>
                  ✓ Çözüldü
                </button>
                <button style={{
                  ...btnBase, background: 'rgba(255,159,28,0.10)', color: '#ff9f1c', border: '1px solid rgba(255,159,28,0.25)',
                  padding: '4px 10px', fontSize: 10,
                }}>
                  🔍 İncele
                </button>
              </div>
            )}
          </div>
        ))}
        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            ✅ Tüm anomaliler çözüldü
          </div>
        )}
      </div>
    </div>
  )
}

// ── God Mode Intervention Drawer ──
function InterventionDrawer({ kurye, kapat, bildirimEkle }) {
  if (!kurye) return null

  const partner = PARTNER_MAP[kurye.id % 8]

  const reAssign = () => {
    bildirimEkle(`🔄 ${kurye.isim} yükü en yakın partner kuryeye aktarılıyor...`, 'uyari')
    kapat()
  }
  const redCode = () => {
    bildirimEkle(`🔴 RED-CODE VIP: ${kurye.isim} teslimatı maksimum önceliğe alındı!`, 'basari')
    kapat()
  }
  const suspend = () => {
    bildirimEkle(`⛔ ${partner.firma} — ${kurye.isim} ağ erişimi askıya alındı.`, 'uyari')
    kapat()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    }} onClick={kapat}>
      <div style={{
        ...GLASS,
        width: '100%', maxWidth: 460, padding: 0, overflow: 'hidden',
        fontFamily: FF, borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header — gradient strip */}
        <div style={{
          background: `linear-gradient(135deg, ${ROTA_RENKLERI[kurye.id % 8]} 0%, ${ROTA_RENKLERI[(kurye.id + 3) % 8]} 100%)`,
          padding: '24px 28px', position: 'relative',
        }}>
          <button onClick={kapat} style={{
            position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.2)', border: 'none',
            borderRadius: '50%', width: 30, height: 30, color: '#fff', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 6 }}>
            GOD MODE — Kurye Müdahale
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{kurye.isim}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{partner.firma} — {partner.tip}</div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px 28px' }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'DURUM', value: kurye.durum || 'yolda', color: kurye.online ? '#2ed573' : '#ff4757' },
              { label: 'HIZ', value: `${kurye.hiz || 0} km/s`, color: '#00d4ff' },
              { label: 'KARGO TİPİ', value: partner.kargoTuru, color: '#a55eea' },
              { label: 'ETA', value: kurye.eta > 0 ? `~${kurye.eta} dk` : 'Teslim edildi', color: '#ff9f1c' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '10px 14px',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Coordinate */}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 16, fontFamily: 'monospace' }}>
            📍 {kurye.enlem?.toFixed(5)}, {kurye.boylam?.toFixed(5)}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={reAssign} style={{
              ...btnAction, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))',
              border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff',
            }}>
              🔄 Acil Yeniden Ata — En Yakın Partner
            </button>
            <button onClick={redCode} style={{
              ...btnAction, background: 'linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,71,87,0.05))',
              border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757',
            }}>
              🔴 RED-CODE Tetikle — VIP Öncelik
            </button>
            <button onClick={suspend} style={{
              ...btnAction, background: 'linear-gradient(135deg, rgba(255,159,28,0.12), rgba(255,159,28,0.04))',
              border: '1px solid rgba(255,159,28,0.25)', color: '#ff9f1c',
            }}>
              ⛔ Partneri Askıya Al — Ağ Erişimini Kes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar Courier Card ──
function KuryeKart({ kurye, secili, onClick, onToggle, onRota }) {
  const partner = PARTNER_MAP[kurye.id % 8]
  return (
    <div onClick={onClick} style={{
      background: secili ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${secili ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
      transition: 'all 0.2s', marginBottom: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: kurye.online ? '#2ed573' : '#555', boxShadow: kurye.online ? '0 0 6px #2ed573' : 'none' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{kurye.isim}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onToggle(kurye, e) }} style={{
          ...btnBase, fontSize: 9, padding: '3px 8px',
          background: kurye.online ? 'rgba(46,213,115,0.12)' : 'rgba(255,255,255,0.06)',
          color: kurye.online ? '#2ed573' : 'rgba(255,255,255,0.3)',
          border: `1px solid ${kurye.online ? 'rgba(46,213,115,0.25)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          {kurye.online ? 'AKTİF' : 'PASİF'}
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{partner.firma} — {partner.kargoTuru}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{kurye.durum}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
        <span style={{ color: '#00d4ff', fontWeight: 600 }}>{kurye.hiz} km/s</span>
        {kurye.eta > 0 && <>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
          <span style={{ color: '#ff9f1c', fontWeight: 600 }}>~{kurye.eta}dk</span>
        </>}
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

  // UI state
  const [aktifSekme,    setSekme]        = useState('kuryeler')
  const [secilenId,     setSecilenId]    = useState(null)
  const [zoomHedef,     setZoomHedef]    = useState(null)
  const [anomalyAcik,   setAnomalyAcik] = useState(false)
  const [interventionK, setIntervention] = useState(null)

  const raporAcik = aktifSekme === 'istatistik'
  const merkez = [41.0082, 28.9784]

  // ── Backend Fetching ──
  useEffect(() => {
    const cek = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/istatistik/genel`)
        const veri = await res.json()
        setDbGenel(veri)
      } catch { /* silent */ }
    }
    cek()
    const t = setInterval(cek, 30000)
    return () => clearInterval(t)
  }, [])

  // ── Notification system ──
  const bildirimEkle = useCallback((mesaj, tip = 'bilgi') => {
    const id = Date.now() + Math.random()
    setBildirim(prev => [...prev, { id, mesaj, tip }])
    setTimeout(() => setBildirim(prev => prev.filter(b => b.id !== id)), 5000)
  }, [])

  // ── Socket events ──
  useEffect(() => {
    soket.on('kuryeleriGuncelle', setKuryeler)
    soket.on('siparisFisiGuncelle', setFis)
    soket.on('teslimatBildirimi', ({ isim, zaman }) =>
      bildirimEkle(`✅ ${isim} teslimatı tamamladı (${zaman})`, 'basari')
    )
    return () => {
      soket.off('kuryeleriGuncelle')
      soket.off('siparisFisiGuncelle')
      soket.off('teslimatBildirimi')
    }
  }, [bildirimEkle])

  // ── Actions ──
  const tumRotaYenile = () => {
    soket.emit('yeniRotaCiz')
    bildirimEkle('🔄 Tüm rotalar yeniden hesaplanıyor...', 'bilgi')
  }
  const tekRotaYenile = (kurye, e) => {
    e.stopPropagation()
    soket.emit('tekKuryeRotaCiz', kurye.id)
    bildirimEkle(`🔄 ${kurye.isim} için rota optimize ediliyor...`, 'bilgi')
  }
  const onlineDegistir = (kurye, e) => {
    e.stopPropagation()
    soket.emit('kuryeOnlineDegistir', kurye.id)
    bildirimEkle(kurye.online ? `⚫ ${kurye.isim} çevrimdışı` : `🟢 ${kurye.isim} çevrimiçi`, 'uyari')
  }
  const kuryeyiSec = (kurye) => {
    setSecilenId(kurye.id)
    setZoomHedef({ ...kurye, _ts: Date.now() })
  }

  // Stats
  const toplam = kuryeListesi.length
  const yolda  = kuryeListesi.filter(k => k.durum !== 'teslim edildi' && k.online).length
  const aktif  = kuryeListesi.filter(k => k.online).length
  const teslim = dbGenel?.toplamTeslimat ?? kuryeListesi.filter(k => k.durum === 'teslim edildi').length

  // Current time for header
  const [saat, setSaat] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setSaat(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#060c1a', fontFamily: FF, color: '#fff',
    }}>

      {/* ═══════════ TOAST NOTIFICATIONS ═══════════ */}
      <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bildirimler.map(b => (
          <div key={b.id} style={{
            ...GLASS, padding: '12px 18px', maxWidth: 380, fontSize: 12, fontWeight: 600,
            borderLeft: `3px solid ${b.tip === 'basari' ? '#2ed573' : b.tip === 'uyari' ? '#ff9f1c' : '#00d4ff'}`,
            animation: 'slideInRight 0.3s ease',
          }}>
            {b.mesaj}
          </div>
        ))}
      </div>

      {/* ═══════════ INTERVENTION DRAWER ═══════════ */}
      {interventionK && (
        <InterventionDrawer
          kurye={interventionK}
          kapat={() => setIntervention(null)}
          bildirimEkle={bildirimEkle}
        />
      )}

      {/* ═══════════ FULL-SCREEN MAP ═══════════ */}
      {raporAcik ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'auto', background: '#0a0f1e' }}>
          <IstatistikPaneli />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapContainer center={merkez} zoom={11} style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer url={TILE_DARK} attribution={TILE_ATTR} />
            <HaritaKontrol hedef={zoomHedef} />
            {kuryeListesi.map(kurye => (
              <Fragment key={kurye.id}>
                <Marker
                  position={[kurye.enlem, kurye.boylam]}
                  icon={kamyonIkon(kurye.online, ROTA_RENKLERI[kurye.id % 8])}
                  eventHandlers={{ click: () => setIntervention(kurye) }}
                >
                  <Popup>
                    <div style={{ fontFamily: FF, fontSize: 12 }}>
                      <strong>🚛 {kurye.isim}</strong> — {PARTNER_MAP[kurye.id % 8]?.firma}<br />
                      {kurye.durum} • {kurye.hiz} km/s
                      {kurye.eta > 0 && <><br />ETA: ~{kurye.eta} dk</>}
                    </div>
                  </Popup>
                </Marker>
                {kurye.durum !== 'teslim edildi' && (
                  <Marker position={[kurye.hedefEnlem, kurye.hedefBoylam]} icon={hedefIkon}>
                    <Popup><strong>{kurye.isim}</strong> — Hedef</Popup>
                  </Marker>
                )}
                {kurye.rota?.length > 1 && (
                  <Polyline
                    positions={kurye.rota}
                    color={rotaRengi(kurye)}
                    weight={kurye.durum === 'teslim edildi' ? 2 : 3}
                    opacity={kurye.online ? 0.75 : 0.25}
                    dashArray={kurye.online ? '8 5' : '3 8'}
                  />
                )}
              </Fragment>
            ))}
          </MapContainer>
        </div>
      )}

      {/* ═══════════ TOP BAR — FLOATING ═══════════ */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: anomalyAcik ? 392 : 16,
        zIndex: 500, display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap',
        transition: 'right 0.3s ease',
      }}>
        {/* Logo + Time */}
        <div style={{ ...GLASS, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, minWidth: 220 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.02em' }}>
            <span style={{ color: '#fff' }}>LOOP</span>
            <span style={{ color: '#00d4ff', fontSize: 12, marginLeft: 6, fontWeight: 600, letterSpacing: '0.08em' }}>COMMAND</span>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, fontFamily: 'monospace' }}>
            {saat.toLocaleTimeString('tr-TR')}
          </div>
        </div>

        {/* Financial HUD */}
        <FinansHUD kuryeler={kuryeListesi} dbGenel={dbGenel} />

        {/* Op Bar */}
        <OpBar toplam={toplam} aktif={aktif} yolda={yolda} teslim={teslim} />

        {/* Anomaly Toggle */}
        <button onClick={() => setAnomalyAcik(p => !p)} style={{
          ...GLASS, ...btnBase, padding: '12px 16px',
          color: anomalyAcik ? '#ff4757' : 'rgba(255,255,255,0.5)',
          border: anomalyAcik ? '1px solid rgba(255,71,87,0.3)' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
        }}>
          🛡️ Anomali
          <span style={{
            background: '#ff4757', color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '1px 6px', borderRadius: 10, minWidth: 16, textAlign: 'center',
          }}>6</span>
        </button>
      </div>

      {/* ═══════════ ANOMALY PANEL ═══════════ */}
      <AnomalyPanel acik={anomalyAcik} toggle={() => setAnomalyAcik(false)} />

      {/* ═══════════ LEFT SIDEBAR — GLASSMORPHISM ═══════════ */}
      <div style={{
        ...GLASS,
        position: 'absolute', left: 16, top: 90, bottom: 16,
        width: 320, zIndex: 600,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: FF,
      }}>

        {/* Action buttons */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={tumRotaYenile} style={{
            ...btnAction, width: '100%',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,98,255,0.08))',
            border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: 12,
          }}>
            🔄 Tüm Rotaları Yenile
          </button>
        </div>

        {/* TAB BAR — ALWAYS VISIBLE, NEVER CONDITIONAL */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}>
          {[
            { key: 'kuryeler',    label: `🚛 Filo (${aktif}/${toplam})` },
            { key: 'log',         label: '📋 Geçmiş' },
            { key: 'istatistik',  label: '📊 Rapor' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setSekme(tab.key)} style={{
              ...btnBase, flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 700,
              color: aktifSekme === tab.key ? '#00d4ff' : 'rgba(255,255,255,0.35)',
              background: aktifSekme === tab.key ? 'rgba(0,212,255,0.06)' : 'transparent',
              borderBottom: aktifSekme === tab.key ? '2px solid #00d4ff' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>

          {aktifSekme === 'kuryeler' && kuryeListesi.map(kurye => (
            <KuryeKart
              key={kurye.id}
              kurye={kurye}
              secili={secilenId === kurye.id}
              onClick={() => kuryeyiSec(kurye)}
              onToggle={onlineDegistir}
              onRota={tekRotaYenile}
            />
          ))}

          {aktifSekme === 'log' && (
            <>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '8px 4px', fontWeight: 700 }}>
                {siparisFisi.length} teslimat kaydı
              </div>
              {siparisFisi.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                  Henüz teslim edilen sipariş yok
                </div>
              ) : siparisFisi.map(log => (
                <div key={log.id} style={{
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 10, padding: '10px 12px', marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#2ed573', fontWeight: 700 }}>✅ {log.kuryeIsim}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{log.zaman}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, fontFamily: 'monospace' }}>
                    📍 {log.hedefEnlem?.toFixed(4)}, {log.hedefBoylam?.toFixed(4)}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* istatistik tab content is rendered full-screen via raporAcik */}
          {aktifSekme === 'istatistik' && (
            <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              📊 Rapor paneli tam ekranda açıldı
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ INLINE ANIMATIONS ═══════════ */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .leaflet-container { background: #0a0f1e !important; }
        .leaflet-control-attribution { display: none !important; }
        .leaflet-popup-content-wrapper {
          background: rgba(8,14,30,0.92) !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip { background: rgba(8,14,30,0.92) !important; }
        /* Custom scrollbar for sidebar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SHARED BUTTON STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const btnBase = {
  border: 'none', borderRadius: 8, fontFamily: FF,
  fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
  transition: 'all 0.2s',
}

const btnAction = {
  ...btnBase,
  padding: '11px 16px', fontSize: 12, borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%',
}

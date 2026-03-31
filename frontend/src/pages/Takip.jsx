// src/pages/Takip.jsx
// Route: /takip  →  Tüm kuryeler canlı izleme (salt okunur, yönetici arayüzü yok)
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import io from 'socket.io-client'
import 'leaflet/dist/leaflet.css'

const BACKEND = 'https://lojistikweb-backend.onrender.com'
const soket   = io(BACKEND)

/* ─── İkonlar ─────────────────────────────────────────────── */
function kuryelkon(renk = '#0062ff', online = true) {
  return new L.DivIcon({
    className: '',
    html: `<div style="
      font-size:20px;
      background:${online ? '#fff' : '#ccc'};
      border-radius:50%;
      width:38px; height:38px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 14px ${renk}55;
      border:2.5px solid ${renk};
      transition:all 0.3s;">🛵</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

const hedefIkonu = new L.DivIcon({
  className: '',
  html: `<div style="
    font-size:16px; background:#ff4757; border-radius:50% 50% 50% 0;
    transform:rotate(-45deg); width:32px; height:32px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 12px #ff475788;">
    <span style="transform:rotate(45deg)">📍</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

/* ─── Renk paleti ──────────────────────────────────────────── */
const RENKLER = [
  '#0062ff','#ff4757','#2ed573','#ffa502','#a55eea',
  '#1e90ff','#ff6348','#26de81','#fd9644','#45aaf2',
]
const renk = (id) => RENKLER[id % RENKLER.length]

/* ─── Durum etiket bilgisi ─────────────────────────────────── */
function durumInfo(d) {
  switch ((d || '').toLowerCase()) {
    case 'teslim edildi': return { emoji: '✅', bg: '#e8faf0', txt: '#1a7a45', label: 'Teslim Edildi' }
    case 'paketi aldi':   return { emoji: '📦', bg: '#e8f0ff', txt: '#1a4db8', label: 'Paketi Aldı'   }
    case 'yolda':         return { emoji: '🛵', bg: '#fff7e6', txt: '#b85a00', label: 'Yolda'         }
    default:              return { emoji: '⏳', bg: '#f3f4f6', txt: '#6b7280', label: d || 'Bekleniyor'}
  }
}

/* ─── ETA görsel sınıfı ────────────────────────────────────── */
function etaRenk(eta) {
  if (!eta || eta <= 0) return { bg:'#f3f4f6', txt:'#6b7280' }
  if (eta <= 5)  return { bg:'#d1fae5', txt:'#065f46' }
  if (eta <= 15) return { bg:'#fef9c3', txt:'#92400e' }
  return             { bg:'#fee2e2', txt:'#991b1b' }
}

/* ─── Harita odak bileşeni ─────────────────────────────────── */
function HaritaFokus({ hedef }) {
  const map = useMap()
  useEffect(() => {
    if (hedef) map.flyTo([hedef.enlem, hedef.boylam], 16, { duration: 1 })
  }, [hedef, map])
  return null
}

/* ─── Animasyonlu sayaç ────────────────────────────────────── */
function useCanliSaat() {
  const [saat, setSaat] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setSaat(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return saat.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/* ══════════════════════════════════════════════════════════════
   ANA BİLEŞEN
══════════════════════════════════════════════════════════════ */
export default function CanlıTakip() {
  const [kuryeler,   setKuryeler]   = useState([])
  const [baglanti,   setBaglanti]   = useState(false)
  const [secilenId,  setSecilenId]  = useState(null)
  const [fokusHedef, setFokus]      = useState(null)
  const [filtre,     setFiltre]     = useState('hepsi') // 'hepsi' | 'aktif' | 'offline'
  const [aramaNot,   setAraNot]     = useState('')
  const saat = useCanliSaat()

  const merkez = [41.0082, 28.9784]

  /* ── Socket bağlantısı ── */
  useEffect(() => {
    soket.on('connect',           () => setBaglanti(true))
    soket.on('disconnect',        () => setBaglanti(false))
    soket.on('kuryeleriGuncelle', setKuryeler)
    return () => {
      soket.off('connect')
      soket.off('disconnect')
      soket.off('kuryeleriGuncelle')
    }
  }, [])

  /* ── Filtreli + arama sonucu kurye listesi ── */
  const gorsel = kuryeler.filter(k => {
    const isimUydu = k.isim?.toLowerCase().includes(aramaNot.toLowerCase())
    if (filtre === 'aktif')  return k.online  && isimUydu
    if (filtre === 'offline') return !k.online && isimUydu
    return isimUydu
  })

  /* ── Özet sayılar ── */
  const toplam  = kuryeler.length
  const aktif   = kuryeler.filter(k => k.online && k.durum !== 'teslim edildi').length
  const offline = kuryeler.filter(k => !k.online).length
  const teslim  = kuryeler.filter(k => k.durum === 'teslim edildi').length
  const ortaEta = aktif > 0
    ? Math.round(kuryeler.filter(k => k.online && k.eta > 0).reduce((s,k) => s + k.eta, 0) / aktif)
    : 0

  /* ── Kurye seçimi / haritaya gitme ── */
  const kuryeSec = useCallback((k) => {
    setSecilenId(prev => prev === k.id ? null : k.id)
    setFokus({ ...k, _ts: Date.now() })
  }, [])

  return (
    <div style={s.sayfa}>

      {/* ══ ÜST NAVBAR ══ */}
      <header style={s.navbar}>
        <div style={s.navLogo}>
          <span style={s.navBadge}>🛰️</span>
          <span style={s.navBaslik}>Canlı Kurye İzleme</span>
        </div>

        <div style={s.navOrtaList}>
          {[
            { key:'hepsi',   etiket:`Tümü (${toplam})` },
            { key:'aktif',   etiket:`Aktif (${aktif})` },
            { key:'offline', etiket:`Offline (${offline})` },
          ].map(f => (
            <button
              key={f.key}
              style={{ ...s.filtreBtn, ...(filtre === f.key ? s.filtreBtnAktif : {}) }}
              onClick={() => setFiltre(f.key)}
            >
              {f.etiket}
            </button>
          ))}
        </div>

        <div style={s.navSag}>
          <span style={s.saatText}>{saat}</span>
          <div style={{ ...s.bagDot, background: baglanti ? '#22c55e' : '#ef4444' }} />
          <span style={s.bagText}>{baglanti ? 'Canlı' : 'Bağlantı yok'}</span>
        </div>
      </header>

      <div style={s.govde}>

        {/* ══ SOL PANEL — KURYELİSTE ══ */}
        <aside style={s.panel}>

          {/* Arama */}
          <div style={s.aramaKutu}>
            <span style={s.aramaIcon}>🔍</span>
            <input
              style={s.aramaInput}
              placeholder="Kurye ara..."
              value={aramaNot}
              onChange={e => setAraNot(e.target.value)}
            />
          </div>

          {/* Özet bant */}
          <div style={s.ozetBant}>
            {[
              { label:'Toplam', val: toplam, color:'#6366f1' },
              { label:'Yolda',  val: aktif,  color:'#f59e0b' },
              { label:'Teslim', val: teslim, color:'#22c55e' },
              { label:'Orta ETA', val: ortaEta > 0 ? `${ortaEta}dk` : '—', color:'#0ea5e9' },
            ].map((it,i) => (
              <div key={i} style={s.ozetKart}>
                <span style={{ ...s.ozetVal, color: it.color }}>{it.val}</span>
                <span style={s.ozetLabel}>{it.label}</span>
              </div>
            ))}
          </div>

          {/* Kurye listesi */}
          <div style={s.liste}>
            {gorsel.length === 0 ? (
              <div style={s.bosMsg}>
                {kuryeler.length === 0 ? '⏳ Bağlantı kuruluyor...' : '🔍 Sonuç bulunamadı'}
              </div>
            ) : gorsel.map(k => {
              const di   = durumInfo(k.durum)
              const etaR = etaEta(k)
              const secili = secilenId === k.id
              return (
                <div
                  key={k.id}
                  style={{
                    ...s.kuryeKart,
                    borderColor: secili ? renk(k.id) : '#e5e7eb',
                    boxShadow: secili ? `0 0 0 2px ${renk(k.id)}33, 0 4px 18px #0002` : '0 1px 4px #0001',
                    opacity: k.online ? 1 : 0.55,
                  }}
                  onClick={() => kuryeSec(k)}
                >
                  {/* Üst satır */}
                  <div style={s.kKartUst}>
                    <div style={s.kIsimSatir}>
                      <div style={{ ...s.kRenkDot, background: renk(k.id) }} />
                      <strong style={s.kIsim}>{k.isim}</strong>
                    </div>
                    <span style={{ ...s.durumBadge, background: di.bg, color: di.txt }}>
                      {di.emoji} {di.label}
                    </span>
                  </div>

                  {/* ETA + Hız bilgi satırı */}
                  {k.online && k.durum !== 'teslim edildi' && (
                    <div style={s.kBilgiSatir}>
                      <div style={{ ...s.etaBadge, background: etaR.bg, color: etaR.txt }}>
                        ⏱ {k.eta > 0 ? `~${k.eta} dk kaldı` : 'Hesaplanıyor'}
                      </div>
                      <span style={s.hizText}>
                        {k.hiz > 0 ? `${k.hiz} km/s` : '—'}
                      </span>
                    </div>
                  )}

                  {/* ETA ilerleme çubuğu */}
                  {k.online && k.durum !== 'teslim edildi' && k.eta > 0 && (
                    <div style={s.etaBarArka}>
                      <div style={{
                        ...s.etaBarOn,
                        width: `${Math.min(100, Math.max(5, 100 - (k.eta / 30) * 100))}%`,
                        background: renk(k.id),
                      }} />
                    </div>
                  )}

                  {/* Teslim edildi durumu */}
                  {k.durum === 'teslim edildi' && (
                    <div style={s.teslimSatir}>✅ Teslimat tamamlandı</div>
                  )}

                  {/* Hayalet mod */}
                  {!k.online && (
                    <div style={s.offlineSatir}>⚫ Çevrimdışı</div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* ══ HARİTA ══ */}
        <div style={s.haritaAlani}>
          {kuryeler.length > 0 ? (
            <MapContainer
              center={merkez}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap"
              />
              <HaritaFokus hedef={fokusHedef} />

              {gorsel.map(k => (
                k.enlem && k.boylam ? (
                  <Marker
                    key={k.id}
                    position={[k.enlem, k.boylam]}
                    icon={kuryelkon(renk(k.id), k.online)}
                    eventHandlers={{ click: () => kuryeSec(k) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: renk(k.id) }}>
                          {k.isim}
                        </div>
                        <div style={{ fontSize: 12, marginBottom: 3 }}>
                          {durumInfo(k.durum).emoji} {durumInfo(k.durum).label}
                        </div>
                        {k.online && k.eta > 0 && (
                          <div style={{ fontSize: 12, color: '#374151' }}>
                            ⏱ <strong>~{k.eta} dk</strong> kaldı
                          </div>
                        )}
                        {k.hiz > 0 && (
                          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                            🏎️ {k.hiz} km/s
                          </div>
                        )}
                        {!k.online && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>⚫ Çevrimdışı</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              ))}

              {/* Teslimat noktaları */}
              {gorsel.map(k =>
                k.hedefEnlem && k.durum !== 'teslim edildi' && k.online ? (
                  <Marker
                    key={`h-${k.id}`}
                    position={[k.hedefEnlem, k.hedefBoylam]}
                    icon={hedefIkonu}
                  >
                    <Popup>
                      <div style={{ fontSize: 12 }}>
                        <strong>{k.isim}</strong><br />📍 Teslimat noktası
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}

              {/* Rota çizgileri */}
              {gorsel.map(k =>
                k.rota?.length > 1 ? (
                  <Polyline
                    key={`r-${k.id}`}
                    positions={k.rota}
                    color={renk(k.id)}
                    weight={secilenId === k.id ? 5 : 3}
                    opacity={k.online ? (secilenId === k.id ? 0.9 : 0.55) : 0.2}
                    dashArray={k.online ? '6 4' : '2 6'}
                  />
                ) : null
              )}
            </MapContainer>
          ) : (
            <div style={s.yukleniyor}>
              <div style={s.spinner} />
              <p style={{ marginTop: 16, color: '#9ca3af', fontSize: 14 }}>
                Kuryeler bekleniyor...
              </p>
            </div>
          )}

          {/* Harita üstü bilgi bandı */}
          <div style={s.haritaBilgi}>
            <span style={s.haritaBilgiItem}>👀 {gorsel.length} kurye gösteriliyor</span>
            {secilenId && (
              <button style={s.sifirlaBtn} onClick={() => setSecilenId(null)}>
                × Seçimi Kaldır
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── ETA rengi yardımcısı ─────────────────────────────────── */
function etaEta(k) {
  return etaRenk(k.eta)
}

/* ─── Stiller ──────────────────────────────────────────────── */
const s = {
  sayfa: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', width: '100vw',
    background: '#f8faff',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif",
    overflow: 'hidden',
  },

  /* navbar */
  navbar: {
    height: 58,
    background: '#0f172a',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 22px',
    flexShrink: 0,
    gap: 16,
    boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
  },
  navLogo: { display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  navBadge: { fontSize:22 },
  navBaslik: { fontSize:15, fontWeight:700, color:'#e2e8f0', letterSpacing:'0.3px' },

  navOrtaList: { display:'flex', gap:6, flexShrink:0 },
  filtreBtn: {
    padding: '5px 14px', borderRadius: 20,
    border: '1.5px solid #334155',
    background: 'transparent', color:'#94a3b8',
    fontSize: 12, fontWeight:600, cursor:'pointer',
    transition:'all 0.2s',
  },
  filtreBtnAktif: {
    background:'#3b82f6', border:'1.5px solid #3b82f6',
    color:'#fff', boxShadow:'0 2px 8px #3b82f655',
  },

  navSag: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  saatText: { fontSize:13, color:'#64748b', fontVariantNumeric:'tabular-nums' },
  bagDot: { width:9, height:9, borderRadius:'50%', transition:'background 0.3s' },
  bagText: { fontSize:12, color:'#64748b' },

  /* gövde */
  govde: { display:'flex', flex:1, overflow:'hidden' },

  /* sol panel */
  panel: {
    width: 300, minWidth:300,
    background:'#fff',
    borderRight:'1px solid #e5e7eb',
    display:'flex', flexDirection:'column',
    gap:12, padding:'14px 12px',
    overflowY:'auto',
    flexShrink:0,
  },

  aramaKutu: {
    display:'flex', alignItems:'center',
    background:'#f1f5f9', borderRadius:10,
    padding:'8px 12px', gap:8,
    border:'1.5px solid #e2e8f0',
  },
  aramaIcon: { fontSize:15, color:'#9ca3af' },
  aramaInput: {
    border:'none', outline:'none', background:'transparent',
    fontSize:13, color:'#1e293b', flex:1,
  },

  /* özet bant */
  ozetBant: {
    display:'grid', gridTemplateColumns:'repeat(4,1fr)',
    gap:6, background:'#f8faff',
    borderRadius:12, padding:'10px 8px',
    border:'1px solid #e2e8f0',
  },
  ozetKart: {
    display:'flex', flexDirection:'column',
    alignItems:'center', gap:2,
  },
  ozetVal: { fontSize:16, fontWeight:800 },
  ozetLabel: { fontSize:10, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' },

  liste: { display:'flex', flexDirection:'column', gap:9, paddingBottom:8 },

  bosMsg: {
    textAlign:'center', color:'#9ca3af',
    padding:'32px 0', fontSize:13,
  },

  /* Kurye kartı */
  kuryeKart: {
    background:'#fff', border:'2px solid #e5e7eb',
    borderRadius:14, padding:'12px 13px',
    cursor:'pointer', transition:'all 0.2s',
  },

  kKartUst: {
    display:'flex', justifyContent:'space-between',
    alignItems:'center', marginBottom:8, gap:6,
  },
  kIsimSatir: { display:'flex', alignItems:'center', gap:7 },
  kRenkDot: { width:10, height:10, borderRadius:'50%', flexShrink:0 },
  kIsim: { fontSize:13, color:'#111827' },

  durumBadge: {
    padding:'3px 10px', borderRadius:20,
    fontSize:11, fontWeight:700, flexShrink:0,
  },

  kBilgiSatir: {
    display:'flex', justifyContent:'space-between',
    alignItems:'center', marginBottom:6,
  },
  etaBadge: {
    padding:'3px 10px', borderRadius:8,
    fontSize:12, fontWeight:700,
  },
  hizText: { fontSize:11, color:'#9ca3af', fontWeight:600 },

  etaBarArka: {
    height:4, background:'#f1f5f9',
    borderRadius:4, overflow:'hidden',
  },
  etaBarOn: {
    height:'100%', borderRadius:4,
    transition:'width 0.6s ease',
  },

  teslimSatir: {
    fontSize:11, color:'#059669',
    fontWeight:600, marginTop:4,
  },
  offlineSatir: {
    fontSize:11, color:'#9ca3af',
    fontWeight:500, marginTop:4,
  },

  /* harita */
  haritaAlani: { flex:1, position:'relative', overflow:'hidden' },

  yukleniyor: {
    height:'100%', display:'flex',
    flexDirection:'column', alignItems:'center',
    justifyContent:'center', background:'#f8faff',
  },
  spinner: {
    width:36, height:36,
    border:'3px solid #e2e8f0',
    borderTopColor:'#3b82f6',
    borderRadius:'50%',
    animation:'spin 0.75s linear infinite',
  },

  haritaBilgi: {
    position:'absolute', bottom:16, left:'50%',
    transform:'translateX(-50%)',
    background:'rgba(15,23,42,0.85)',
    backdropFilter:'blur(8px)',
    borderRadius:20, padding:'7px 18px',
    display:'flex', alignItems:'center', gap:12,
    zIndex:999, color:'#e2e8f0', fontSize:12,
    boxShadow:'0 4px 16px rgba(0,0,0,0.25)',
  },
  haritaBilgiItem: { fontWeight:600 },
  sifirlaBtn: {
    background:'rgba(239,68,68,0.2)',
    border:'1px solid rgba(239,68,68,0.4)',
    borderRadius:8, color:'#fca5a5',
    fontSize:11, padding:'2px 9px',
    cursor:'pointer', fontWeight:700,
  },
}
// src/pages/Takip.jsx
// Route: /takip?id=1   → kuryeId=1'i canlı takip eder
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import io from 'socket.io-client'
import 'leaflet/dist/leaflet.css'

const BACKEND = 'https://lojistikweb-backend.onrender.com'
const soket   = io(BACKEND)

// ── Motor ikonu ──────────────────────────────────────────
const motorIkonu = new L.DivIcon({
  className: '',
  html: `<div style="
    font-size:26px; background:#fff; border-radius:50%;
    width:44px; height:44px; display:flex;
    align-items:center; justify-content:center;
    box-shadow:0 4px 16px rgba(0,98,255,0.25);
    border:2px solid #0062ff;">🛵</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

const hedefIkonu = new L.DivIcon({
  className: '',
  html: `<div style="
    font-size:22px; background:#0062ff; border-radius:50% 50% 50% 0;
    transform:rotate(-45deg); width:36px; height:36px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 12px rgba(0,98,255,0.4);">
    <span style="transform:rotate(45deg)">📍</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

// Kurye hareket edince harita onu takip etsin
function HaritaTakip({ konum, aktif }) {
  const map = useMap()
  const ilk = useRef(true)
  useEffect(() => {
    if (!konum) return
    if (ilk.current) {
      map.setView([konum.enlem, konum.boylam], 15)
      ilk.current = false
    } else if (aktif) {
      map.panTo([konum.enlem, konum.boylam], { animate: true, duration: 1 })
    }
  }, [konum, aktif, map])
  return null
}

// Durum rengini döndür
function durumRengi(durum) {
  if (durum === 'teslim edildi') return { bg: '#e8f5e9', text: '#2e7d32', icon: '✅' }
  if (durum === 'paketi aldi')   return { bg: '#e3f2fd', text: '#1565c0', icon: '📦' }
  return                                { bg: '#fff8e1', text: '#e65100', icon: '🛵' }
}

export default function Takip() {
  const [searchParams] = useSearchParams()
  const kuryeId        = parseInt(searchParams.get('id') || '1')

  const [kurye,      setKurye]      = useState(null)
  const [baglanti,   setBaglanti]   = useState(false)
  const [takipEt,    setTakipEt]    = useState(true)
  const [adimlar,    setAdimlar]    = useState([])

  // Geçmiş konum izi
  useEffect(() => {
    if (kurye && kurye.enlem) {
      setAdimlar(prev => {
        const sonAdim = prev[prev.length - 1]
        if (sonAdim && sonAdim[0] === kurye.enlem && sonAdim[1] === kurye.boylam) return prev
        const yeni = [...prev, [kurye.enlem, kurye.boylam]]
        return yeni.slice(-80) // son 80 adım
      })
    }
  }, [kurye?.enlem, kurye?.boylam])

  useEffect(() => {
    soket.on('connect',    () => setBaglanti(true))
    soket.on('disconnect', () => setBaglanti(false))

    soket.emit('kuryeyiTakipEt', kuryeId)

    soket.on('tekKuryeGuncelle', (veri) => {
      if (veri.id === kuryeId) setKurye(veri)
    })

    return () => {
      soket.off('tekKuryeGuncelle')
      soket.off('connect')
      soket.off('disconnect')
    }
  }, [kuryeId])

  const durum  = kurye ? durumRengi(kurye.durum) : { bg: '#f5f7ff', text: '#8a9abc', icon: '⏳' }
  const teslim = kurye?.durum === 'teslim edildi'

  return (
    <div style={styles.sayfa}>

      {/* ── Üst bar ── */}
      <div style={styles.ustBar}>
        <div style={styles.logo}>🚚 <strong style={{ letterSpacing: 2 }}>LOOP</strong></div>
        <div style={{ ...styles.baglantiDot, background: baglanti ? '#00c853' : '#ff5252' }} />
      </div>

      {/* ── Durum kartı ── */}
      <div style={styles.durumKarti}>
        {teslim ? (
          <div style={styles.teslimBlok}>
            <div style={styles.teslimEmoji}>🎉</div>
            <div style={styles.teslimBaslik}>Siparişiniz Teslim Edildi!</div>
            <div style={styles.teslimAlt}>Alışverişiniz için teşekkürler. Bizi tercih ettiğiniz için mutluyuz.</div>
          </div>
        ) : (
          <>
            <div style={styles.durumUst}>
              <div style={{ ...styles.durumBadge, background: durum.bg, color: durum.text }}>
                {durum.icon} {kurye?.durum || 'Bağlanıyor...'}
              </div>
              <span style={styles.hizText}>{kurye?.hiz ? `${kurye.hiz} km/s` : ''}</span>
            </div>

            <div style={styles.etaSatir}>
              <div style={styles.etaKart}>
                <span style={styles.etaIkon}>⏱</span>
                <div>
                  <div style={styles.etaDeger}>
                    {kurye?.eta ? `~${kurye.eta} dk` : '—'}
                  </div>
                  <div style={styles.etaEtiket}>Tahmini Varış</div>
                </div>
              </div>
              <div style={styles.etaKart}>
                <span style={styles.etaIkon}>👤</span>
                <div>
                  <div style={styles.etaDeger}>{kurye?.isim || '—'}</div>
                  <div style={styles.etaEtiket}>Kurye</div>
                </div>
              </div>
            </div>

            {/* İlerleme çubuğu */}
            {kurye && (
              <div style={styles.progressSarici}>
                <div style={styles.progressAdimlar}>
                  {['Sipariş Alındı', 'Paketi Aldı', 'Yolda', 'Teslim Edildi'].map((ad, i) => {
                    const aktifler = ['sipariş alındı', 'paketi aldi', 'yolda', 'teslim edildi']
                    const aktifIndex = aktifler.findIndex(a => a === kurye.durum?.toLowerCase())
                    const gecildi = i <= aktifIndex
                    return (
                      <div key={i} style={styles.progressAdim}>
                        <div style={{ ...styles.progressNokta, background: gecildi ? '#0062ff' : '#e8ecf8', transform: gecildi ? 'scale(1.15)' : 'scale(1)' }} />
                        <span style={{ ...styles.progressEtiket, color: gecildi ? '#0a1628' : '#b0bcd4', fontWeight: gecildi ? 600 : 400 }}>{ad}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={styles.progressCizgi}>
                  <div style={{
                    ...styles.progressDolu,
                    width: `${Math.min((['sipariş alındı','paketi aldi','yolda','teslim edildi'].findIndex(a=>a===kurye.durum?.toLowerCase())+1) / 4 * 100, 100)}%`
                  }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Harita ── */}
      <div style={styles.haritaKapla}>
        {kurye ? (
          <MapContainer
            center={[kurye.enlem, kurye.boylam]}
            zoom={15}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HaritaTakip konum={kurye} aktif={takipEt} />

            {/* Geçmiş rota izi */}
            {adimlar.length > 1 && (
              <Polyline
                positions={adimlar}
                color="#0062ff"
                weight={3}
                opacity={0.4}
                dashArray="6 4"
              />
            )}

            {/* Kurye marker */}
            <Marker position={[kurye.enlem, kurye.boylam]} icon={motorIkonu}>
              <Popup><strong>{kurye.isim}</strong><br />{kurye.durum} — {kurye.hiz} km/s</Popup>
            </Marker>

            {/* Hedef marker */}
            {!teslim && (
              <Marker position={[kurye.hedefEnlem, kurye.hedefBoylam]} icon={hedefIkonu}>
                <Popup>Teslimat Noktası</Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div style={styles.yukleniyor}>
            <div style={styles.spinner} />
            <p style={{ color: '#8a9abc', fontSize: 14, marginTop: 12 }}>Kurye bağlantısı kuruluyor...</p>
          </div>
        )}

        {/* Harita üstü buton */}
        <button
          style={{ ...styles.takipBtn, background: takipEt ? '#0062ff' : '#fff', color: takipEt ? '#fff' : '#0062ff' }}
          onClick={() => setTakipEt(p => !p)}
        >
          {takipEt ? '📍 Takip Aktif' : '📍 Takip Et'}
        </button>
      </div>

    </div>
  )
}

const styles = {
  sayfa: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#f0f4ff',
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    overflow: 'hidden',
  },
  ustBar: {
    height: 56, background: '#fff',
    borderBottom: '1px solid #e8ecf8',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    flexShrink: 0,
  },
  logo: { fontSize: 18, color: '#0a1628', display: 'flex', alignItems: 'center', gap: 8 },
  baglantiDot: { width: 10, height: 10, borderRadius: '50%', transition: 'background 0.3s' },
  durumKarti: {
    background: '#fff', margin: '12px 16px 0',
    borderRadius: 16, padding: '18px 20px',
    boxShadow: '0 2px 16px rgba(0,0,50,0.07)',
    flexShrink: 0,
  },
  teslimBlok: { textAlign: 'center', padding: '8px 0' },
  teslimEmoji: { fontSize: 40, marginBottom: 8 },
  teslimBaslik: { fontSize: 18, fontWeight: 800, color: '#0a1628', marginBottom: 4 },
  teslimAlt: { fontSize: 13, color: '#8a9abc' },
  durumUst: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  durumBadge: { padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  hizText: { fontSize: 13, color: '#8a9abc', fontWeight: 600 },
  etaSatir: { display: 'flex', gap: 12, marginBottom: 16 },
  etaKart: {
    flex: 1, background: '#f5f7ff', borderRadius: 12,
    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
  },
  etaIkon: { fontSize: 20 },
  etaDeger: { fontSize: 16, fontWeight: 800, color: '#0a1628' },
  etaEtiket: { fontSize: 11, color: '#8a9abc', fontWeight: 500 },
  progressSarici: { position: 'relative', paddingBottom: 4 },
  progressAdimlar: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, position: 'relative', zIndex: 1 },
  progressAdim: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 },
  progressNokta: { width: 10, height: 10, borderRadius: '50%', transition: 'all 0.3s' },
  progressEtiket: { fontSize: 9, textAlign: 'center', lineHeight: 1.2 },
  progressCizgi: { height: 3, background: '#e8ecf8', borderRadius: 2, position: 'absolute', top: 5, left: '5%', width: '90%', zIndex: 0 },
  progressDolu: { height: '100%', background: '#0062ff', borderRadius: 2, transition: 'width 0.5s ease' },
  haritaKapla: { flex: 1, position: 'relative', margin: '12px 16px 16px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,50,0.10)' },
  yukleniyor: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f7ff' },
  spinner: { width: 32, height: 32, border: '3px solid #e8ecf8', borderTopColor: '#0062ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  takipBtn: {
    position: 'absolute', top: 12, right: 12, zIndex: 999,
    padding: '8px 16px', border: '1.5px solid #0062ff',
    borderRadius: 20, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,98,255,0.2)',
    transition: 'all 0.2s',
  },
}
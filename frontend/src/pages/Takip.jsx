// src/pages/Takip.jsx
// Route: /takip  →  Müşteri sipariş takip (tek kurye, kişiselleştirilmiş)
import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSettings } from '../context/SettingsContext'
import { apiFetch } from '../config/api'

const COPY = {
  tr: {
    title: 'Lojistik Sipariş Takip',
    trackNo: 'Sipariş Takip Numarası',
    trackPlaceholder: 'Örn: 1, 2, 3...',
    searching: 'Aranıyor...',
    trackBtn: 'Siparişimi Takip Et',
    helper: "Takip numaranızı sipariş onay SMS'inizde veya e-postanızda bulabilirsiniz.",
    required: 'Lütfen bir takip numarası girin.',
    invalidNo: 'Geçersiz numara. Örnek: 1, 2, 3',
    notFound: 'numaralı sipariş bulunamadı.',
    notFoundCheck: 'numaralı sipariş bulunamadı. Takip numaranızı kontrol edin.',
    noLocation: 'Kurye konum bilgisi alınamadı. Lütfen tekrar deneyin.',
    serverError: 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.',
    yourCourier: 'Kuryeniz',
    eta: 'Tahmini Varış',
    minute: 'dakika',
    deliveredText: 'Teslimatınız başarıyla tamamlandı!',
    orderDetails: 'Sipariş Detayları',
    courier: 'Kurye',
    status: 'Durum',
    remaining: 'Kalan Süre',
    trackOther: '← Farklı Sipariş Takip Et',
    deliveryPoint: '📍 Teslimat Noktanız',
    leftShort: 'kaldı',
    loadingMap: 'Kurye konumu yükleniyor...'
  },
  en: {
    title: 'Order Tracking',
    trackNo: 'Tracking Number',
    trackPlaceholder: 'Ex: 1, 2, 3...',
    searching: 'Searching...',
    trackBtn: 'Track My Order',
    helper: 'You can find your tracking number in your confirmation SMS or email.',
    required: 'Please enter a tracking number.',
    invalidNo: 'Invalid number. Example: 1, 2, 3',
    notFound: 'order could not be found.',
    notFoundCheck: 'order could not be found. Please check your tracking number.',
    noLocation: 'Courier location is unavailable. Please try again.',
    serverError: 'Cannot connect to the server. Please try again.',
    yourCourier: 'Your courier',
    eta: 'Estimated Arrival',
    minute: 'minutes',
    deliveredText: 'Your delivery has been completed successfully!',
    orderDetails: 'Order Details',
    courier: 'Courier',
    status: 'Status',
    remaining: 'Remaining Time',
    trackOther: '← Track Another Order',
    deliveryPoint: '📍 Your Delivery Point',
    leftShort: 'left',
    loadingMap: 'Loading courier location...'
  }
}

/* ─── Kamyon SVG İkonu ────────────────────────────────────── */
const KAMYON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="white">
  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
</svg>`

function kamyonIkonu(renk = '#2F6F73') {
  return new L.DivIcon({
    className: '',
    html: `<div style="
      background:${renk};
      border-radius:50%;
      width:44px; height:44px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 18px ${renk}66, 0 0 0 3px white;
      border:2.5px solid white;
      transition:all 0.3s;">${KAMYON_SVG}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

const hedefIkonu = new L.DivIcon({
  className: '',
  html: `<div style="
    font-size:16px; background:#ff4757; border-radius:50% 50% 50% 0;
    transform:rotate(-45deg); width:36px; height:36px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 14px #ff475788; border:2px solid white;">
    <span style="transform:rotate(45deg); font-size:14px;">📍</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

/* ─── Harita odak bileşeni ─────────────────────────────────── */
function HaritaFokus({ hedef, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (hedef) map.flyTo(hedef, zoom || 16, { duration: 1.2 })
  }, [hedef, map, zoom])
  return null
}

/* ─── Canlı saat ───────────────────────────────────────────── */
function useCanliSaat(language) {
  const [saat, setSaat] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setSaat(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return saat.toLocaleTimeString(language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/* ─── Durum bilgisi ────────────────────────────────────────── */
function durumBilgi(d, language) {
  const en = language === 'en'
  switch ((d || '').toLowerCase()) {
    case 'delivered':
    case 'teslim edildi': return { emoji: '✅', bg: '#d1fae5', txt: '#065f46', label: en ? 'Delivered' : 'Teslim Edildi', aciklama: en ? 'is delivered' : 'teslim etti' }
    case 'picked_up':
    case 'paketi aldi':   return { emoji: '📦', bg: '#dbeafe', txt: '#1e40af', label: en ? 'Picked Up' : 'Paketi Aldı', aciklama: en ? 'picked up your package' : 'paketi aldı' }
    case 'assigned':
    case 'in_transit':
    case 'created':
    case 'yolda':         return { emoji: '🚛', bg: '#fef3c7', txt: '#92400e', label: en ? 'On The Way' : 'Yolda', aciklama: en ? 'is on the way' : 'yolda' }
    default:              return { emoji: '⏳', bg: '#f3f4f6', txt: '#6b7280', label: d || (en ? 'Preparing' : 'Hazırlanıyor'), aciklama: en ? 'is preparing your order' : 'hazırlanıyor' }
  }
}

function normalizeTrackedOrder(order) {
  const pickup = order?.pickup || {
    latitude: order?.pickup_latitude,
    longitude: order?.pickup_longitude,
    address: order?.pickup_address,
  }
  const delivery = order?.delivery || {
    latitude: order?.delivery_latitude,
    longitude: order?.delivery_longitude,
    address: order?.delivery_address,
  }
  const current = order?.courier_location || pickup || delivery
  const hasLocation = Number.isFinite(Number(current?.latitude)) && Number.isFinite(Number(current?.longitude))

  return {
    id: order?.courier_id || order?.id,
    orderId: order?.order_id || order?.id,
    isim: order?.courier_name || `LOOP-${order?.id || ''}`,
    durum: order?.status || 'created',
    enlem: hasLocation ? Number(current.latitude) : null,
    boylam: hasLocation ? Number(current.longitude) : null,
    hedefEnlem: Number(delivery?.latitude),
    hedefBoylam: Number(delivery?.longitude),
    hedefAdres: delivery?.address || order?.delivery_address,
    pickupAdres: pickup?.address || order?.pickup_address,
    eta: order?.eta_minutes || order?.eta || 0,
    hiz: order?.speed || 0,
    rota: pickup?.latitude && delivery?.latitude
      ? [[Number(pickup.latitude), Number(pickup.longitude)], [Number(delivery.latitude), Number(delivery.longitude)]]
      : [],
    tracking_code: order?.tracking_code,
  }
}

/* ══════════════════════════════════════════════════════════════
   ANA BİLEŞEN — Müşteri Takip
══════════════════════════════════════════════════════════════ */
export default function MusteriTakip() {
  const { language } = useSettings()
  const c = COPY[language === 'en' ? 'en' : 'tr']
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900)
  // ── Faz durumu ──
  const [faz, setFaz] = useState('giris') // 'giris' | 'takip'
  const [takipNo, setTakipNo] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  // ── Kurye verisi ──
  const [kurye, setKurye] = useState(null)
  const [baglanti, setBaglanti] = useState(false)
  const [haritaHedef, setHaritaHedef] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const saat = useCanliSaat(language)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isMobile) setPanelOpen(false)
  }, [isMobile])

  // URL'den takip numarasını al (eğer varsa)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setTakipNo(id.toUpperCase().replace('LOOP-', ''))
      // Otomatik sorgulama yapma — kullanıcı butona bassın
    }
  }, [])

  // ── Kurye değiştiğinde haritayı odakla ──
  useEffect(() => {
    if (kurye && kurye.enlem && kurye.boylam) {
      setHaritaHedef([kurye.enlem, kurye.boylam])
    }
  }, [kurye?.enlem, kurye?.boylam])

  // ── Takip numarasını sorgula ──
  const siparisAra = useCallback(async () => {
    const temiz = takipNo.trim().toUpperCase()
    if (!temiz) {
      setHata(c.required)
      return
    }

    setYukleniyor(true)
    setHata('')

    try {
      const code = temiz.startsWith('LOOP-') ? temiz : `LOOP-${temiz}`
      const veri = normalizeTrackedOrder(await apiFetch(`/orders/track/${encodeURIComponent(code)}`))
      setBaglanti(true)

      if (!veri || !veri.enlem || !veri.boylam) {
        setHata(c.noLocation)
        return
      }

      setKurye(veri)
      setHaritaHedef([veri.enlem, veri.boylam])
      setFaz('takip')
      setPanelOpen(false)
    } catch (err) {
      setBaglanti(false)
      setHata(err.message || c.serverError)
    } finally {
      setYukleniyor(false)
    }
  }, [takipNo, c])

  // ── Enter tuşu ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') siparisAra()
  }

  // ── Geri dön ──
  const geriDon = () => {
    setFaz('giris')
    setKurye(null)
    setTakipNo('')
    setHata('')
  }

  /* ════════════════════════════════════════════════════════════
     FAZ 1 — GİRİŞ KAPISI (Tracking Number Entry)
  ════════════════════════════════════════════════════════════ */
  if (faz === 'giris') {
    return (
      <div style={s.girisKapsayici}>
        {/* Animasyonlu arka plan */}
        <div style={s.girisArka}>
          <div style={s.girisOrb1} />
          <div style={s.girisOrb2} />
          <div style={s.girisOrb3} />
        </div>

        <div style={s.girisCam}>
          {/* Logo */}
          <div style={s.girisLogoAlani}>
            <div style={s.girisLogoCircle}>
              <span style={{ fontSize: 32 }}>🚛</span>
            </div>
            <h1 style={s.girisBaslik}>LOOP</h1>
            <p style={s.girisAltBaslik}>{c.title}</p>
          </div>

          {/* Takip formu */}
          <div style={s.girisFormAlani}>
            <label style={s.girisLabel}>{c.trackNo}</label>
            <div style={s.girisInputKutu}>
              <span style={s.girisInputPrefix}>LOOP-</span>
              <input
                id="tracking-input"
                type="text"
                placeholder={c.trackPlaceholder}
                value={takipNo}
                onChange={(e) => { setTakipNo(e.target.value); setHata('') }}
                onKeyDown={handleKeyDown}
                style={s.girisInput}
                autoFocus
              />
            </div>

            {hata && (
              <div style={s.hataKutu}>
                <span>⚠️</span>
                <span>{hata}</span>
              </div>
            )}

            <button
              id="tracking-submit"
              style={{
                ...s.girisBtn,
                opacity: yukleniyor ? 0.7 : 1,
                cursor: yukleniyor ? 'not-allowed' : 'pointer',
              }}
              onClick={siparisAra}
              disabled={yukleniyor}
            >
              {yukleniyor ? (
                <span style={s.girisSpinnerSatir}>
                  <span style={s.girisSpinner} /> {c.searching}
                </span>
              ) : (
                c.trackBtn
              )}
            </button>
          </div>

          {/* Alt bilgi */}
          <p style={s.girisNot}>
            {c.helper}
          </p>
        </div>

        {/* Footer */}
        <div style={s.girisFooter}>
          <span style={s.girisFooterDot} />
          <span>LOOP Lojistik © 2026</span>
        </div>

        {/* Animasyon keyframes */}
        <style>{`
          @keyframes orbFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -20px) scale(1.05); }
            66% { transform: translate(-20px, 15px) scale(0.95); }
          }
          @keyframes spinSmall {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════
     FAZ 2 — TAKİP GÖRÜNÜMÜ (Tek Kurye Haritası)
  ════════════════════════════════════════════════════════════ */
  const di = kurye ? durumBilgi(kurye.durum, language) : null
  const kuryeRenk = '#2F6F73'
  const takipSayfaStyle = isMobile
    ? s.takipSayfa
    : s.takipSayfa
  const takipPanelStyle = isMobile
    ? {
        ...s.takipPanel,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'min(88vw, 360px)',
        minWidth: 0,
        height: '100%',
        maxHeight: 'none',
        borderRight: '1px solid #e5e7eb',
        borderBottom: 'none',
        zIndex: 1200,
        boxShadow: '18px 0 36px rgba(15,23,42,0.22)',
        transform: panelOpen ? 'translateX(0)' : 'translateX(-105%)',
        transition: 'transform 0.28s ease',
      }
    : s.takipPanel
  const haritaAlaniStyle = isMobile
    ? { ...s.haritaAlani, width: '100%', height: '100%' }
    : s.haritaAlani
  const haritaInfoBandStyle = isMobile
    ? {
        ...s.haritaInfoBand,
        left: 12,
        right: 12,
        bottom: 12,
        transform: 'none',
        width: 'auto',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
        padding: '10px 14px',
      }
    : s.haritaInfoBand

  return (
    <div style={takipSayfaStyle}>
      {isMobile && (
        <>
          <button
            type="button"
            aria-label={panelOpen ? 'Close carrier panel' : 'Open carrier panel'}
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen(open => !open)}
            style={s.mobileDrawerBtn}
          >
            <span style={s.mobileDrawerLine} />
            <span style={s.mobileDrawerLine} />
            <span style={s.mobileDrawerLine} />
          </button>
          {panelOpen && <button type="button" aria-label="Close carrier panel overlay" onClick={() => setPanelOpen(false)} style={s.mobileDrawerBackdrop} />}
        </>
      )}

      {/* ── SOL PANEL — Kişiselleştirilmiş Teslimat Bilgisi ── */}
      <aside style={takipPanelStyle}>

        {/* Marka başlık */}
        <div style={s.takipPanelUst}>
          <div style={s.takipLogo}>
            <span style={{ fontSize: 20 }}>🚛</span>
            <span style={s.takipLogoText}>LOOP</span>
          </div>
          <div style={s.takipSaatKutu}>
            <div style={{ ...s.bagDot, background: baglanti ? '#22c55e' : '#ef4444' }} />
            <span style={s.takipSaat}>{saat}</span>
            {isMobile && (
              <button type="button" onClick={() => setPanelOpen(false)} style={s.mobilePanelClose}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Başlık — Kuryeniz */}
        {kurye && (
          <div style={s.takipKuryeBaslik}>
            {/* Avatar */}
            <div style={s.kuryeAvatar}>
              <span style={s.kuryeAvatarText}>
                {kurye.isim?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 style={s.kuryeIsim}>{kurye.isim}</h2>
              <p style={s.kuryeAciklama}>
                {c.yourCourier} <strong>{kurye.isim}</strong> {di?.aciklama}
              </p>
            </div>
          </div>
        )}

        {/* Durum kartı */}
        {kurye && di && (
          <div style={s.durumKart}>
            <div style={s.durumKartUst}>
              <span style={{ ...s.durumBadge, background: di.bg, color: di.txt }}>
                {di.emoji} {di.label}
              </span>
              {kurye.hiz > 0 && (
                <span style={s.hizBadge}>🏎️ {kurye.hiz} km/s</span>
              )}
            </div>

            {/* ETA */}
            {kurye.durum !== 'teslim edildi' && kurye.eta > 0 && (
              <div style={s.etaAlani}>
                <div style={s.etaBaslik}>
                  <span style={s.etaLabel}>{c.eta}</span>
                  <span style={s.etaDeger}>~{kurye.eta} {c.minute}</span>
                </div>
                <div style={s.etaBarArka}>
                  <div style={{
                    ...s.etaBarOn,
                    width: `${Math.min(100, Math.max(8, 100 - (kurye.eta / 30) * 100))}%`,
                  }} />
                </div>
              </div>
            )}

            {/* Teslim edildi */}
            {kurye.durum === 'teslim edildi' && (
              <div style={s.teslimAlani}>
                <div style={s.teslimIcon}>✅</div>
                <p style={s.teslimText}>{c.deliveredText}</p>
              </div>
            )}
          </div>
        )}

        {/* Sipariş detay kartı */}
        {kurye && (
          <div style={s.detayKart}>
            <h3 style={s.detayBaslik}>{c.orderDetails}</h3>
            <div style={s.detaySatir}>
              <span style={s.detayEtiket}>Takip No</span>
              <span style={s.detayDeger}>LOOP-{kurye.id}</span>
            </div>
            <div style={s.detaySatir}>
              <span style={s.detayEtiket}>{c.courier}</span>
              <span style={s.detayDeger}>{kurye.isim}</span>
            </div>
            <div style={s.detaySatir}>
              <span style={s.detayEtiket}>{c.status}</span>
              <span style={{ ...s.detayDeger, color: di?.txt }}>{di?.label}</span>
            </div>
            {kurye.eta > 0 && kurye.durum !== 'teslim edildi' && (
              <div style={s.detaySatir}>
                <span style={s.detayEtiket}>{c.remaining}</span>
                <span style={s.detayDeger}>~{kurye.eta} {c.minute}</span>
              </div>
            )}
          </div>
        )}

        {/* Yeniden ara butonu */}
        <button style={s.geriBtn} onClick={geriDon}>
          {c.trackOther}
        </button>
      </aside>

      {/* ── HARİTA ── */}
      <div style={haritaAlaniStyle}>
        {kurye && kurye.enlem && kurye.boylam ? (
          <MapContainer
            center={[kurye.enlem, kurye.boylam]}
            zoom={15}
            style={{ width: '100%', height: '100%' }}
            zoomControl={!isMobile}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
            <HaritaFokus hedef={haritaHedef} zoom={15} />

            {/* TEK KURYE İŞARETÇİSİ */}
            <Marker
              position={[kurye.enlem, kurye.boylam]}
              icon={kamyonIkonu(kuryeRenk)}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: kuryeRenk, marginBottom: 4 }}>
                    🚛 {kurye.isim}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    {di?.emoji} {di?.label}
                  </div>
                  {kurye.eta > 0 && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      ⏱ <strong>~{kurye.eta} {c.minute}</strong> {c.leftShort}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* TESLİMAT NOKTASI */}
            {kurye.hedefEnlem && kurye.durum !== 'teslim edildi' && (
              <Marker
                position={[kurye.hedefEnlem, kurye.hedefBoylam]}
                icon={hedefIkonu}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong>{c.deliveryPoint}</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* ROTA ÇİZGİSİ */}
            {kurye.rota?.length > 1 && (
              <Polyline
                positions={kurye.rota}
                color={kuryeRenk}
                weight={5}
                opacity={0.8}
                dashArray="8 5"
              />
            )}
          </MapContainer>
        ) : (
          <div style={s.yukleniyor}>
            <div style={s.yukleniyorSpinner} />
            <p style={{ marginTop: 16, color: '#9ca3af', fontSize: 14 }}>
              {c.loadingMap}
            </p>
          </div>
        )}

        {/* Harita üstü bilgi bandı */}
        <div style={haritaInfoBandStyle}>
          <span style={s.haritaInfoItem}>
            🚛 Kuryeniz: <strong>{kurye?.isim}</strong>
          </span>
          {kurye?.eta > 0 && kurye?.durum !== 'teslim edildi' && (
            <span style={s.haritaInfoItem}>
              ⏱ ~{kurye.eta} {c.minute}
            </span>
          )}
        </div>
      </div>

      {/* Animasyonlar */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STİLLER
═══════════════════════════════════════════════════════════════ */
const s = {
  /* ── GİRİŞ KAPISI (Faz 1) ──────────────────────────────── */
  girisKapsayici: {
    minHeight: '100vh', width: '100vw',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif",
    position: 'relative', overflow: 'hidden',
  },

  girisArka: {
    position: 'absolute', inset: 0,
    pointerEvents: 'none', overflow: 'hidden',
  },
  girisOrb1: {
    position: 'absolute', width: 400, height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
    top: '-10%', right: '-5%',
    animation: 'orbFloat 8s ease-in-out infinite',
  },
  girisOrb2: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
    bottom: '-8%', left: '-3%',
    animation: 'orbFloat 10s ease-in-out infinite reverse',
  },
  girisOrb3: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
    top: '40%', left: '50%',
    animation: 'orbFloat 12s ease-in-out infinite',
  },

  girisCam: {
    position: 'relative', zIndex: 10,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24, padding: '48px 44px',
    maxWidth: 440, width: '92%',
    boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
    animation: 'fadeInUp 0.6s ease-out',
  },

  girisLogoAlani: {
    textAlign: 'center', marginBottom: 36,
  },
  girisLogoCircle: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #2F6F73, #4B8A8F)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
    marginBottom: 16,
  },
  girisBaslik: {
    fontSize: 32, fontWeight: 800, color: '#f1f5f9',
    letterSpacing: '4px', margin: '0 0 6px',
  },
  girisAltBaslik: {
    fontSize: 14, color: '#94a3b8', fontWeight: 500,
    letterSpacing: '0.5px', margin: 0,
  },

  girisFormAlani: {
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  girisLabel: {
    fontSize: 12, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  girisInputKutu: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 14, overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  girisInputPrefix: {
    padding: '14px 0 14px 16px',
    fontSize: 15, fontWeight: 700, color: '#64748b',
    letterSpacing: '1px', userSelect: 'none',
  },
  girisInput: {
    flex: 1, border: 'none', outline: 'none',
    background: 'transparent', padding: '14px 16px 14px 4px',
    fontSize: 16, color: '#e2e8f0', fontWeight: 600,
    letterSpacing: '1px',
  },
  girisBtn: {
    width: '100%', padding: '15px 20px',
    background: 'linear-gradient(135deg, #2F6F73, #4B8A8F)',
    border: 'none', borderRadius: 14,
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
    letterSpacing: '0.3px',
    marginTop: 4,
  },
  girisSpinnerSatir: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  girisSpinner: {
    display: 'inline-block', width: 18, height: 18,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spinSmall 0.7s linear infinite',
  },

  hataKutu: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, fontSize: 13, color: '#fca5a5',
  },

  girisNot: {
    fontSize: 11, color: '#64748b', textAlign: 'center',
    lineHeight: '1.5', marginTop: 20,
  },
  girisFooter: {
    position: 'absolute', bottom: 24,
    display: 'flex', alignItems: 'center',
    gap: 8, fontSize: 11, color: '#475569',
  },
  girisFooterDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#22c55e',
  },

  /* ── TAKİP GÖRÜNÜMÜ (Faz 2) ─────────────────────────────── */
  takipSayfa: {
    display: 'flex', height: '100vh', width: '100vw',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif",
    overflow: 'hidden', background: '#f8faff',
  },

  /* Sol Panel */
  takipPanel: {
    width: 340, minWidth: 340,
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex', flexDirection: 'column',
    gap: 16, padding: '20px 18px',
    overflowY: 'auto', flexShrink: 0,
  },

  takipPanelUst: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', paddingBottom: 8,
    borderBottom: '1px solid #f1f5f9',
  },
  takipLogo: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  takipLogoText: {
    fontSize: 18, fontWeight: 800, color: '#0f172a',
    letterSpacing: '2px',
  },
  takipSaatKutu: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  bagDot: {
    width: 8, height: 8, borderRadius: '50%',
    transition: 'background 0.3s',
  },
  takipSaat: {
    fontSize: 12, color: '#9ca3af',
    fontVariantNumeric: 'tabular-nums',
  },

  /* Kurye başlık */
  takipKuryeBaslik: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '16px', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
    borderRadius: 16, border: '1px solid #dbeafe',
  },
  kuryeAvatar: {
    width: 52, height: 52, borderRadius: '50%',
    background: 'linear-gradient(135deg, #2F6F73, #4B8A8F)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
    flexShrink: 0,
  },
  kuryeAvatarText: {
    fontSize: 22, fontWeight: 800, color: '#fff',
  },
  kuryeIsim: {
    fontSize: 18, fontWeight: 800, color: '#0f172a',
    margin: '0 0 2px',
  },
  kuryeAciklama: {
    fontSize: 13, color: '#64748b', margin: 0, lineHeight: '1.4',
  },

  /* Durum kartı */
  durumKart: {
    background: '#ffffff', borderRadius: 16,
    padding: '18px 16px', border: '1px solid #e5e7eb',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  durumKartUst: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  durumBadge: {
    padding: '6px 14px', borderRadius: 24,
    fontSize: 13, fontWeight: 700,
  },
  hizBadge: {
    fontSize: 12, color: '#6b7280', fontWeight: 600,
  },

  /* ETA */
  etaAlani: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  etaBaslik: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12, color: '#9ca3af', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  etaDeger: {
    fontSize: 20, fontWeight: 800, color: '#0f172a',
  },
  etaBarArka: {
    height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden',
  },
  etaBarOn: {
    height: '100%', borderRadius: 6,
    background: 'linear-gradient(90deg, #2F6F73, #4B8A8F)',
    transition: 'width 0.8s ease',
  },

  /* Teslim */
  teslimAlani: {
    textAlign: 'center', padding: '16px 0',
  },
  teslimIcon: { fontSize: 36, marginBottom: 8 },
  teslimText: {
    fontSize: 15, fontWeight: 700, color: '#065f46', margin: 0,
  },

  /* Detay kart */
  detayKart: {
    background: '#f8fafc', borderRadius: 14,
    padding: '16px', border: '1px solid #e2e8f0',
  },
  detayBaslik: {
    fontSize: 12, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    margin: '0 0 12px', paddingBottom: 8,
    borderBottom: '1px solid #e2e8f0',
  },
  detaySatir: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  detayEtiket: {
    fontSize: 13, color: '#9ca3af', fontWeight: 500,
  },
  detayDeger: {
    fontSize: 13, color: '#0f172a', fontWeight: 700,
  },

  /* Geri butonu */
  geriBtn: {
    marginTop: 'auto', width: '100%',
    padding: '12px 16px', border: '1.5px solid #e2e8f0',
    borderRadius: 12, background: 'transparent',
    color: '#64748b', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    textAlign: 'center',
  },

  /* Harita */
  haritaAlani: {
    flex: 1, position: 'relative', overflow: 'hidden',
  },

  yukleniyor: {
    height: '100%', display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#f8faff',
  },
  yukleniyorSpinner: {
    width: 40, height: 40,
    border: '3.5px solid #e2e8f0',
    borderTopColor: '#2F6F73',
    borderRadius: '50%',
    animation: 'spin 0.75s linear infinite',
  },

  haritaInfoBand: {
    position: 'absolute', bottom: 20, left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15,23,42,0.88)',
    backdropFilter: 'blur(12px)',
    borderRadius: 24, padding: '10px 22px',
    display: 'flex', alignItems: 'center', gap: 16,
    zIndex: 999, color: '#e2e8f0', fontSize: 13,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  haritaInfoItem: { fontWeight: 600, whiteSpace: 'nowrap' },
  mobileDrawerBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 1300,
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid rgba(15,23,42,0.14)',
    background: 'rgba(255,255,255,0.94)',
    boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 5,
    cursor: 'pointer',
  },
  mobileDrawerLine: {
    width: 19,
    height: 2,
    borderRadius: 3,
    background: '#0f172a',
  },
  mobileDrawerBackdrop: {
    position: 'absolute',
    inset: 0,
    zIndex: 1100,
    border: 'none',
    background: 'rgba(15,23,42,0.28)',
    cursor: 'pointer',
  },
  mobilePanelClose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#64748b',
    fontSize: 20,
    lineHeight: '20px',
    cursor: 'pointer',
  },
}

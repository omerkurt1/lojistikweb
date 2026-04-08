import { useState, useEffect, useCallback, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import io from 'socket.io-client'
import 'leaflet/dist/leaflet.css'
import './App.css'
import IstatistikPaneli from './istatistik'

// ─── Kamyon SVG İkonu (Profesyonel Truck) ────────────────────────────────────
const KAMYON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
</svg>`

function kamyonMarkerIkonu(online = true) {
  const bg = online ? '#3b82f6' : '#6b7280'
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
      opacity:${online ? 1 : 0.6};">${KAMYON_SVG}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })
}

const hedefIkonu = new L.DivIcon({
  className: '',
  html: `<div style="font-size:18px;background:#e74c3c;border-radius:50% 50% 50% 0;
         transform:rotate(-45deg);width:28px;height:28px;
         display:flex;justify-content:center;align-items:center;
         box-shadow:0 2px 6px rgba(0,0,0,0.35); border:2px solid white;">
           <span style="transform:rotate(45deg)">📍</span>
         </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28]
})

// ─── Harita zoom kontrolcüsü ─────────────────────────────────────────────────
function HaritaKontrol({ hedef }) {
  const map = useMap()
  useEffect(() => {
    if (hedef) {
      map.flyTo([hedef.enlem, hedef.boylam], 15, { duration: 1.2 })
    }
  }, [hedef, map])
  return null
}

// ─── Socket (component dışında bir kez oluştur) ──────────────────────────────
const BACKEND = 'https://lojistikweb-backend.onrender.com'
const soket = io(BACKEND)

// ─── Renk paleti (kurye id'ye göre) ─────────────────────────────────────────
const ROTA_RENKLERI = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c']
function rotaRengi(kurye) {
  if (!kurye.online) return '#aaaaaa'
  const temel = ROTA_RENKLERI[kurye.id % ROTA_RENKLERI.length]
  return kurye.optimizasyonSayisi % 2 === 0 ? temel : '#e67e22'
}

// ─── Tile URL (OSM tek kaynak — karanlık mod CSS filtresiyle sağlanır) ────────
const TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR = '© OpenStreetMap contributors'

// ─── Ana Uygulama ─────────────────────────────────────────────────────────────
export default function Uygulama() {
  const [kuryeListesi, setKuryeler]   = useState([])
  const [siparisFisi,  setFis]        = useState([])
  const [karanlikMod,  setKaranlik]   = useState(false)
  const [aktifSekme,   setSekme]      = useState('kuryeler')   // 'kuryeler' | 'log' | 'istatistik'
  const [raporAcik,    setRaporAcik]  = useState(false)        // haritayı kapatıp rapor göster

  // Sekme değiştirici — harita/rapor görünümünü de yönetir
  const sekmeDegistir = (sekme) => {
    setSekme(sekme)
    setRaporAcik(sekme === 'istatistik')
  }
  const [zoomHedef,    setZoomHedef]  = useState(null)
  const [secilenId,    setSecilenId]  = useState(null)
  const [bildirimler,  setBildirim]   = useState([])
  const [dbGenel,      setDbGenel]    = useState(null)  // DB'den toplam teslimat

  const merkez = [41.0082, 28.9784]

  // DB'den genel istatistik çek (sayfa yenilenince sıfırlanmaz)
  useEffect(() => {
    const cek = async () => {
      try {
        const res = await fetch('https://lojistikweb-backend.onrender.com/api/istatistik/genel')
        const veri = await res.json()
        setDbGenel(veri)
      } catch { /* DB yoksa sessizce geç */ }
    }
    cek()
    const t = setInterval(cek, 30000)
    return () => clearInterval(t)
  }, [])

  // ── Bildirim sistemi ──
  const bildirimEkle = useCallback((mesaj, tip = 'bilgi') => {
    const id = Date.now() + Math.random()
    setBildirim(prev => [...prev, { id, mesaj, tip }])
    setTimeout(() => setBildirim(prev => prev.filter(b => b.id !== id)), 4500)
  }, [])

  // ── Socket olayları ──
  useEffect(() => {
    soket.on('kuryeleriGuncelle',  setKuryeler)
    soket.on('siparisFisiGuncelle', setFis)
    soket.on('teslimatBildirimi', ({ isim, zaman }) => {
      bildirimEkle(`✅ ${isim} teslimatı tamamladı! (${zaman})`, 'basari')
    })
    return () => {
      soket.off('kuryeleriGuncelle')
      soket.off('siparisFisiGuncelle')
      soket.off('teslimatBildirimi')
    }
  }, [bildirimEkle])

  // ── Aksiyon fonksiyonları ──
  const tumRotaYenile = () => {
    soket.emit('yeniRotaCiz')
    bildirimEkle('🔄 Tüm aktif kuryeler için yeni rota oluşturuluyor...', 'bilgi')
  }

  const tekRotaYenile = (kurye, e) => {
    e.stopPropagation()
    soket.emit('tekKuryeRotaCiz', kurye.id)
    bildirimEkle(`🔄 ${kurye.isim} için yeni rota oluşturuluyor...`, 'bilgi')
  }

  const onlineDegistir = (kurye, e) => {
    e.stopPropagation()
    soket.emit('kuryeOnlineDegistir', kurye.id)
    bildirimEkle(
      kurye.online
        ? `⚫ ${kurye.isim} çevrimdışı yapıldı`
        : `🟢 ${kurye.isim} çevrimiçi yapıldı`,
      'uyari'
    )
  }

  const siparisEkle = () => {
    soket.emit('yeniSiparisEkle')
    bildirimEkle('📦 Yeni kurye atanıyor...', 'bilgi')
  }

  const kuryeyiSec = (kurye) => {
    setSecilenId(kurye.id)
    setZoomHedef({ ...kurye, _ts: Date.now() }) // ts: flyTo'nun tekrar tetiklenmesi için
  }

  // ── Özet istatistikler ──
  // toplam/yolda/offline → canlı socket verisi (gerçek zamanlı)
  // teslim → DB'den (sayfa yenilenince sıfırlanmaz)
  const toplam  = kuryeListesi.length
  const yolda   = kuryeListesi.filter(k => k.durum !== 'teslim edildi' && k.online).length
  const aktif   = kuryeListesi.filter(k => k.online).length
  const teslim  = dbGenel?.toplamTeslimat ?? kuryeListesi.filter(k => k.durum === 'teslim edildi').length

  return (
    <div className={`ana-kutu${karanlikMod ? ' karanlik' : ''}`}>

      {/* ── Toast Bildirimleri ── */}
      <div className="bildirim-alan">
        {bildirimler.map(b => (
          <div key={b.id} className={`bildirim bildirim-${b.tip}`}>{b.mesaj}</div>
        ))}
      </div>

      {/* ══════════════════════ SOL PANEL ══════════════════════ */}
      <aside className="sol-panel">

        {/* Başlık */}
        <div className="panel-baslik">
          <span className="panel-logo">🚛 Kurye Takip</span>
          <button className="icon-btn" onClick={() => setKaranlik(p => !p)} title="Tema değiştir">
            {karanlikMod ? '☀️' : '🌙'}
          </button>
        </div>

        {/* İstatistik kartları */}
        <div className="stat-grid">
          <div className="stat-kart" style={{ borderTop: '3px solid #00bcd4' }}>
            <span className="stat-deger" style={{ color: '#00bcd4' }}>{toplam}</span>
            <span className="stat-etiket">Toplam</span>
          </div>
          <div className="stat-kart yolda">
            <span className="stat-deger">{yolda}</span>
            <span className="stat-etiket">Yolda</span>
          </div>
          <div className="stat-kart teslim">
            <span className="stat-deger">{teslim}</span>
            <span className="stat-etiket">Toplam Teslim</span>
          </div>
          <div className="stat-kart" style={{ borderTop: '3px solid #00bcd4' }}>
            <span className="stat-deger" style={{ color: '#00bcd4' }}>{aktif}</span>
            <span className="stat-etiket">Aktif</span>
          </div>
        </div>

        {/* Aksiyon butonları - sadece rota yenileme */}
        <div className="btn-grup">
          <button className="btn btn-mavi"  onClick={tumRotaYenile}>🔄 Tüm Rotaları Yenile</button>
        </div>

        {/* Sekme başlıkları */}
        <div className="sekme-baslik">
          <button
            id="sekme-kuryeler"
            className={`sekme${aktifSekme === 'kuryeler' ? ' aktif' : ''}`}
            onClick={() => sekmeDegistir('kuryeler')}
          >
            🚛 Kuryeler ({aktif}/{toplam})
          </button>
          <button
            id="sekme-gecmis"
            className={`sekme${aktifSekme === 'log' ? ' aktif' : ''}`}
            onClick={() => sekmeDegistir('log')}
          >
            📋 Geçmiş
          </button>
          <button
            id="sekme-rapor"
            className={`sekme${aktifSekme === 'istatistik' ? ' aktif' : ''}`}
            onClick={() => sekmeDegistir('istatistik')}
          >
            📊 Rapor
          </button>
        </div>

        {/* ── Kurye Listesi ── */}
        {aktifSekme === 'kuryeler' && (
          <div className="liste">
            {kuryeListesi.map(kurye => (
              <div
                key={kurye.id}
                className={`kurye-kart${!kurye.online ? ' offline' : ''}${secilenId === kurye.id ? ' secili' : ''}`}
                onClick={() => kuryeyiSec(kurye)}
              >
                {/* Kart üst satır */}
                <div className="kart-ust">
                  <div className="kart-isim">
                    <span className={`nokta${kurye.online ? ' online' : ' pasif'}`} />
                    <strong>{kurye.isim}</strong>
                  </div>
                  <button
                    className={`toggle-btn${kurye.online ? ' aktif' : ' pasif'}`}
                    onClick={(e) => onlineDegistir(kurye, e)}
                  >
                    {kurye.online ? 'Aktif' : 'Pasif'}
                  </button>
                </div>

                {/* Durum ve hız */}
                <div className="kart-orta">
                  <span className={`badge badge-${kurye.durum.replace(/ /g, '-')}`}>
                    {kurye.durum}
                  </span>
                  <span className="hiz">{kurye.hiz} km/s</span>
                </div>

                {/* ETA */}
                {kurye.online && kurye.durum !== 'teslim edildi' && kurye.eta > 0 && (
                  <div className="eta">⏱ Tahmini varış: ~{kurye.eta} dk</div>
                )}

                {/* Optimizasyon sayısı */}
                {kurye.optimizasyonSayisi > 0 && (
                  <div className="opt-bilgi">🔄 Rota {kurye.optimizasyonSayisi}× güncellendi</div>
                )}

                {/* Tek kurye rota butonu */}
                {kurye.online && kurye.durum !== 'teslim edildi' && (
                  <button
                    className="btn btn-kucuk btn-turuncu"
                    onClick={(e) => tekRotaYenile(kurye, e)}
                  >
                    Bu Kurye İçin Rota Yenile
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Sipariş Geçmişi Log ── */}
        {aktifSekme === 'log' && (
          <div className="liste">
            <div className="log-baslik-satir">
              <span className="log-toplam-badge">{siparisFisi.length} teslimat</span>
            </div>
            {siparisFisi.length === 0 ? (
              <p className="bos-mesaj">Henüz teslim edilen sipariş yok.</p>
            ) : (
              siparisFisi.map(log => (
                <div key={log.id} className="log-satir">
                  <div className="log-ust">
                    <span>✅ <strong>{log.kuryeIsim}</strong></span>
                    <span className="log-saat">{log.zaman}</span>
                  </div>
                  <div className="log-konum">
                    📍 {log.hedefEnlem.toFixed(4)}, {log.hedefBoylam.toFixed(4)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </aside>

      {/* ══════════════════════ HARİTA / RAPOR ══════════════════════ */}
      {raporAcik ? (
        <div className="rapor-alan">
          <IstatistikPaneli />
        </div>
      ) : (
      <div className="harita-alan">
        <MapContainer center={merkez} zoom={11}>
          <TileLayer
            url={TILE_URL}
            attribution={TILE_ATTR}
          />

          <HaritaKontrol hedef={zoomHedef} />

          {kuryeListesi.map(kurye => (
            <Fragment key={kurye.id}>
              {/* Kurye marker — KAMYON ikonu */}
              <Marker
                position={[kurye.enlem, kurye.boylam]}
                icon={kamyonMarkerIkonu(kurye.online)}
              >
                <Popup>
                  <strong>🚛 {kurye.isim}</strong><br />
                  Durum: {kurye.durum}<br />
                  Hız: {kurye.hiz} km/s<br />
                  {kurye.eta > 0 && <>ETA: ~{kurye.eta} dk<br /></>}
                  {!kurye.online && <span style={{ color: '#888' }}>⚫ Çevrimdışı</span>}
                </Popup>
              </Marker>

              {/* Hedef/teslimat noktası marker */}
              {kurye.durum !== 'teslim edildi' && (
                <Marker position={[kurye.hedefEnlem, kurye.hedefBoylam]} icon={hedefIkonu}>
                  <Popup>
                    <strong>{kurye.isim}</strong> — Teslimat Noktası
                  </Popup>
                </Marker>
              )}

              {/* Rota çizgisi */}
              {kurye.rota?.length > 1 && (
                <Polyline
                  positions={kurye.rota}
                  color={rotaRengi(kurye)}
                  weight={kurye.durum === 'teslim edildi' ? 2 : 4}
                  opacity={kurye.online ? 0.85 : 0.35}
                  dashArray={kurye.online ? '6 4' : '2 6'}
                />
              )}
            </Fragment>
          ))}
        </MapContainer>
      </div>
      )}
    </div>
  )
}
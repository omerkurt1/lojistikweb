import { useState, useEffect, useCallback, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import io from 'socket.io-client'
import 'leaflet/dist/leaflet.css'
import './App.css'
import IstatistikPaneli from './istatistik'
import { useAuth } from './context/AuthContext'

// ─── Kamyon SVG İkonu (Profesyonel Truck) ────────────────────────────────────
const KAMYON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`

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

// ─── Tile URL ─────────────────────────────────────────────────────────────────
const TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR = '© OpenStreetMap contributors'

// ─── Profil Modalı ─────────────────────────────────────────────────────────────
function ProfilModali({ kullanici, cikis, kapat }) {
  const initials = kullanici?.isim
    ? kullanici.isim.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div style={profilStyles.overlay} onClick={kapat}>
      <div style={profilStyles.modal} onClick={e => e.stopPropagation()}>
        {/* Kapat butonu */}
        <button style={profilStyles.kapatBtn} onClick={kapat}>✕</button>

        {/* Avatar + İsim */}
        <div style={profilStyles.avatarSarici}>
          <div style={profilStyles.avatar}>{initials}</div>
          <div>
            <div style={profilStyles.isim}>{kullanici?.isim || '—'}</div>
            <div style={profilStyles.email}>{kullanici?.email || '—'}</div>
          </div>
        </div>

        {/* Bilgi satırları */}
        <div style={profilStyles.bilgiGrid}>
          <div style={profilStyles.bilgiKart}>
            <span style={profilStyles.bilgiEtiket}>Ad Soyad</span>
            <span style={profilStyles.bilgiDeger}>{kullanici?.isim || '—'}</span>
          </div>
          <div style={profilStyles.bilgiKart}>
            <span style={profilStyles.bilgiEtiket}>E-Posta</span>
            <span style={profilStyles.bilgiDeger}>{kullanici?.email || '—'}</span>
          </div>
          <div style={profilStyles.bilgiKart}>
            <span style={profilStyles.bilgiEtiket}>Hesap Türü</span>
            <span style={{
              ...profilStyles.bilgiDeger,
              color: kullanici?.email === 'patron@loop.com' ? '#e67e22' : '#27ae60',
              fontWeight: 700,
            }}>
              {kullanici?.email === 'patron@loop.com' ? '👑 Admin' : '👤 Kullanıcı'}
            </span>
          </div>
          <div style={profilStyles.bilgiKart}>
            <span style={profilStyles.bilgiEtiket}>Durum</span>
            <span style={{ ...profilStyles.bilgiDeger, color: '#27ae60', fontWeight: 700 }}>
              ● Aktif
            </span>
          </div>
        </div>

        {/* Çıkış butonu */}
        <button
          style={profilStyles.cikisBtn}
          onClick={() => { cikis(); kapat() }}
        >
          🚪 Çıkış Yap
        </button>
      </div>
    </div>
  )
}

const profilStyles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 9998,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    padding: '36px 32px 28px',
    width: '100%', maxWidth: 400,
    position: 'relative',
    boxShadow: '0 8px 48px rgba(0,0,0,0.22)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  kapatBtn: {
    position: 'absolute', top: 14, right: 18,
    background: 'none', border: 'none',
    fontSize: 18, cursor: 'pointer', color: '#8a9abc',
    lineHeight: 1,
  },
  avatarSarici: {
    display: 'flex', alignItems: 'center', gap: 16,
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid #e8ecf8',
  },
  avatar: {
    width: 64, height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0056b3, #00bcd4)',
    color: '#fff',
    fontSize: 22, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(0,86,179,0.30)',
  },
  isim: {
    fontSize: 20, fontWeight: 700, color: '#0a1628',
    marginBottom: 4,
  },
  email: {
    fontSize: 13, color: '#8a9abc',
  },
  bilgiGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 12, marginBottom: 24,
  },
  bilgiKart: {
    background: '#f5f7ff',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: 4,
    border: '1px solid #e8ecf8',
  },
  bilgiEtiket: {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: '#8a9abc',
  },
  bilgiDeger: {
    fontSize: 14, fontWeight: 600, color: '#0a1628',
  },
  cikisBtn: {
    width: '100%',
    padding: '13px',
    background: '#fff0f0',
    border: '1.5px solid #ffcdd2',
    borderRadius: 10,
    color: '#c62828',
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
}

// ─── Ana Uygulama ─────────────────────────────────────────────────────────────
export default function Uygulama() {
  const { kullanici, cikis } = useAuth()

  const [kuryeListesi, setKuryeler]   = useState([])
  const [siparisFisi,  setFis]        = useState([])
  const [karanlikMod,  setKaranlik]   = useState(false)

  // ── Sekme yönetimi — raporAcik'tan BAĞIMSIZ ──────────────────────────────
  // 'kuryeler' | 'log' | 'istatistik'
  const [aktifSekme, setSekme] = useState('kuryeler')

  // İstatistik sekmesi harita alanını değiştiriyor; diğer sekmeler haritayı korur
  const raporAcik = aktifSekme === 'istatistik'

  const [profilAcik,   setProfilAcik] = useState(false)
  const [zoomHedef,    setZoomHedef]  = useState(null)
  const [secilenId,    setSecilenId]  = useState(null)
  const [bildirimler,  setBildirim]   = useState([])
  const [dbGenel,      setDbGenel]    = useState(null)

  const merkez = [41.0082, 28.9784]

  // DB'den genel istatistik çek
  useEffect(() => {
    const cek = async () => {
      try {
        const res = await fetch('https://lojistikweb-backend.onrender.com/api/istatistik/genel')
        const veri = await res.json()
        setDbGenel(veri)
      } catch { /* sessizce geç */ }
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

  const kuryeyiSec = (kurye) => {
    setSecilenId(kurye.id)
    setZoomHedef({ ...kurye, _ts: Date.now() })
  }

  // ── Özet istatistikler ──
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

      {/* ── Profil Modalı ── */}
      {profilAcik && kullanici && (
        <ProfilModali
          kullanici={kullanici}
          cikis={cikis}
          kapat={() => setProfilAcik(false)}
        />
      )}

      {/* ══════════════════════ SOL PANEL ══════════════════════ */}
      <aside className="sol-panel">

        {/* Başlık — tema + auth-gated profil butonu */}
        <div className="panel-baslik">
          <span className="panel-logo">🚛 Kurye Takip</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Kullanıcı giriş yapmışsa Profil butonu göster */}
            {kullanici ? (
              <button
                id="btn-profil-acik"
                title={`${kullanici.isim} — Profile Bak`}
                onClick={() => setProfilAcik(true)}
                style={profilBtnStyle}
              >
                {kullanici.isim.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </button>
            ) : (
              <a
                href="https://lojistikweb1.vercel.app/giris"
                style={girisLinkStyle}
                title="Giriş Yap"
              >
                Giriş
              </a>
            )}
            <button className="icon-btn" onClick={() => setKaranlik(p => !p)} title="Tema değiştir">
              {karanlikMod ? '☀️' : '🌙'}
            </button>
          </div>
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

        {/* Aksiyon butonları */}
        <div className="btn-grup">
          <button className="btn btn-mavi" onClick={tumRotaYenile}>🔄 Tüm Rotaları Yenile</button>
        </div>

        {/* ── Sekme Başlıkları — her zaman görünür, koşulsuz ── */}
        <div className="sekme-baslik">
          <button
            id="sekme-kuryeler"
            className={`sekme${aktifSekme === 'kuryeler' ? ' aktif' : ''}`}
            onClick={() => setSekme('kuryeler')}
          >
            🚛 Kuryeler ({aktif}/{toplam})
          </button>
          <button
            id="sekme-gecmis"
            className={`sekme${aktifSekme === 'log' ? ' aktif' : ''}`}
            onClick={() => setSekme('log')}
          >
            📋 Geçmiş
          </button>
          <button
            id="sekme-rapor"
            className={`sekme${aktifSekme === 'istatistik' ? ' aktif' : ''}`}
            onClick={() => setSekme('istatistik')}
          >
            📊 Rapor
          </button>
        </div>

        {/* ── Kurye Listesi (yalnızca 'kuryeler' sekmesinde) ── */}
        {aktifSekme === 'kuryeler' && (
          <div className="liste">
            {kuryeListesi.map(kurye => (
              <div
                key={kurye.id}
                className={`kurye-kart${!kurye.online ? ' offline' : ''}${secilenId === kurye.id ? ' secili' : ''}`}
                onClick={() => kuryeyiSec(kurye)}
              >
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

                <div className="kart-orta">
                  <span className={`badge badge-${kurye.durum.replace(/ /g, '-')}`}>
                    {kurye.durum}
                  </span>
                  <span className="hiz">{kurye.hiz} km/s</span>
                </div>

                {kurye.online && kurye.durum !== 'teslim edildi' && kurye.eta > 0 && (
                  <div className="eta">⏱ Tahmini varış: ~{kurye.eta} dk</div>
                )}

                {kurye.optimizasyonSayisi > 0 && (
                  <div className="opt-bilgi">🔄 Rota {kurye.optimizasyonSayisi}× güncellendi</div>
                )}

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

        {/* ── Sipariş Geçmişi Log (yalnızca 'log' sekmesinde) ── */}
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
            <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
            <HaritaKontrol hedef={zoomHedef} />

            {kuryeListesi.map(kurye => (
              <Fragment key={kurye.id}>
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

                {kurye.durum !== 'teslim edildi' && (
                  <Marker position={[kurye.hedefEnlem, kurye.hedefBoylam]} icon={hedefIkonu}>
                    <Popup>
                      <strong>{kurye.isim}</strong> — Teslimat Noktası
                    </Popup>
                  </Marker>
                )}

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

// ── Satır-içi stil sabitleri ──────────────────────────────────────────────────
const profilBtnStyle = {
  width: 34, height: 34,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #0056b3, #00bcd4)',
  color: '#fff',
  border: 'none',
  fontSize: 13, fontWeight: 800,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,86,179,0.30)',
  flexShrink: 0,
  letterSpacing: '0.03em',
}

const girisLinkStyle = {
  padding: '4px 12px',
  borderRadius: 6,
  background: 'rgba(0,86,179,0.08)',
  border: '1px solid rgba(0,86,179,0.25)',
  color: '#0056b3',
  fontSize: 12, fontWeight: 700,
  textDecoration: 'none',
  cursor: 'pointer',
}
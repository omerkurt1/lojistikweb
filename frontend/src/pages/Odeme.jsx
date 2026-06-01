// src/pages/Odeme.jsx
// Route: /odeme
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../config/api'

const ACCENT_PRIMARY = '#2F6F73'
const ACCENT_SECONDARY = '#4B8A8F'
const ACCENT_SHADOW = 'rgba(47, 111, 115, 0.28)'
const ACCENT_TEXT_ON_SOLID = '#F6FBFC'

// ── Mini konfeti ──────────────────────────────────────────
function Konfeti({ aktif }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  useEffect(() => {
    if (!aktif) return
    const canvas  = canvasRef.current
    const ctx     = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const parcalar = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 6 + Math.random() * 8,
      h: 10 + Math.random() * 6,
      renk: ['#4B8A8F','#00c853','#ffab00','#ff5252','#aa00ff','#2F6F73'][Math.floor(Math.random()*6)],
      hiz: 2 + Math.random() * 4,
      sallanma: (Math.random() - 0.5) * 3,
      aci: Math.random() * 360,
      donme: (Math.random() - 0.5) * 6,
    }))

    function ciz() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let devam = false
      parcalar.forEach(p => {
        p.y     += p.hiz
        p.x     += p.sallanma
        p.aci   += p.donme
        ctx.save()
        ctx.translate(p.x + p.w/2, p.y + p.h/2)
        ctx.rotate(p.aci * Math.PI / 180)
        ctx.fillStyle = p.renk
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h)
        ctx.restore()
        if (p.y < canvas.height) devam = true
      })
      if (devam) animRef.current = requestAnimationFrame(ciz)
    }
    ciz()
    return () => cancelAnimationFrame(animRef.current)
  }, [aktif])

  if (!aktif) return null
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />
}

// ── Kart formatlama ───────────────────────────────────────
function formatKart(val)  { return val.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim() }
function formatSkt(val)   { return val.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2') }
function maskeleKart(val) {
  const t = val.replace(/\s/g,'')
  if (t.length < 13) return val || '•••• •••• •••• ••••'
  return `•••• •••• •••• ${t.slice(-4)}`
}

export default function Odeme() {
  const { kullanici } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ kartSahibi: kullanici?.isim || '', kartNo: '', skt: '', cvv: '' })
  const [yukleniyor, setYuk] = useState(false)
  const [hata,       setHata]  = useState('')
  const [basarili,   setBasarili] = useState(false)
  const [konfeti,    setKonfeti]  = useState(false)
  const [onYuz,      setOnYuz]    = useState(true) // kart flip

  const guncelle = e => {
    let { name, value } = e.target
    if (name === 'kartNo') value = formatKart(value)
    if (name === 'skt')    value = formatSkt(value)
    if (name === 'cvv')    value = value.replace(/\D/g,'').slice(0,4)
    setForm(p => ({ ...p, [name]: value }))
  }

  const gonder = async e => {
    e.preventDefault()
    setHata('')
    const kartSayisal = form.kartNo.replace(/\s/g,'')
    if (kartSayisal.length < 16) return setHata('Kart numarası 16 haneli olmalıdır.')
    if (!form.skt.includes('/'))  return setHata('SKT formatı: AA/YY')
    if (form.cvv.length < 3)      return setHata('CVV 3-4 haneli olmalıdır.')

    setYuk(true)
    try {
      const orderId = Number(new URLSearchParams(window.location.search).get('order_id') || 1)
      await apiFetch('/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount: 49.99,
          currency: 'TRY',
          payment_method_id: `card_${kartSayisal.slice(-4)}`,
        })
      })

      // Başarı!
      setBasarili(true)
      setKonfeti(true)
      setTimeout(() => navigate('/takip?id=1'), 4000)
    } catch (err) {
      setHata(err.message)
    } finally {
      setYuk(false)
    }
  }

  // ── Sipariş Alındı ekranı ────────────────────────────
  if (basarili) {
    return (
      <>
        <Konfeti aktif={konfeti} />
        <div style={styles.basariSayfa}>
          <div style={styles.basariKart}>
            <h2 style={styles.basariBaslik}>Siparişiniz Alındı!</h2>
            <p style={styles.basariAlt}>Ödemeniz başarıyla işlendi. Takip ekranına yönlendiriliyorsunuz...</p>
            <div style={styles.basariLoader}>
              <div style={styles.loaderCizgi} />
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={styles.sayfa}>
      <div style={styles.icerik}>

        {/* Sol: Sipariş özeti */}
        <div style={styles.siparisSarici}>
          <button style={styles.geriBtn} onClick={() => navigate(-1)}>← Geri</button>
          <h2 style={styles.solBaslik}>Sipariş Özeti</h2>

          <div style={styles.siparisKart}>
            <div style={styles.siparisRow}>
              <span style={styles.siparisEtiket}>Hizmet</span>
              <span style={styles.siparisValue}>LOOP Express Teslimat</span>
            </div>
            <div style={styles.siparisRow}>
              <span style={styles.siparisEtiket}>Teslimat Süresi</span>
              <span style={styles.siparisValue}>~30 dk</span>
            </div>
            <div style={styles.siparisRow}>
              <span style={styles.siparisEtiket}>Kurye Takibi</span>
              <span style={{ ...styles.siparisValue, color: '#00c853', fontWeight: 700 }}>✓ Canlı Takip</span>
            </div>
            <div style={styles.ayirac} />
            <div style={{ ...styles.siparisRow, marginTop: 8 }}>
              <span style={{ ...styles.siparisEtiket, fontWeight: 700, color: '#0a1628', fontSize: 15 }}>Toplam</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: ACCENT_PRIMARY }}>₺49,99</span>
            </div>
          </div>

          {/* Güvenlik rozetleri */}
          <div style={styles.guvenlikSatir}>
            {['SSL Şifreleme', 'Güvenli Ödeme', 'İade Garantisi'].map(g => (
              <span key={g} style={styles.guvenlikBadge}>{g}</span>
            ))}
          </div>
        </div>

        {/* Sağ: Kart formu */}
        <div style={styles.formSarici}>

          {/* 3D Kart */}
          <div
            style={{ ...styles.kartKapla, perspective: 1000 }}
            onClick={() => setOnYuz(p => !p)}
            title="Kartı çevirmek için tıkla"
          >
            <div style={{
              ...styles.kart3d,
              transform: onYuz ? 'rotateY(0deg)' : 'rotateY(180deg)',
              transition: 'transform 0.5s ease',
              transformStyle: 'preserve-3d',
              position: 'relative',
              height: 200,
            }}>
              {/* Ön yüz */}
              <div style={{ ...styles.kartYuz, ...styles.kartOn }}>
                <div style={styles.kartLogo}>LOOP</div>
                <div style={styles.kartChip}>▦</div>
                <div style={styles.kartNumara}>{maskeleKart(form.kartNo)}</div>
                <div style={styles.kartAlt}>
                  <div>
                    <div style={styles.kartEtiket}>KART SAHİBİ</div>
                    <div style={styles.kartDeger}>{form.kartSahibi || 'AD SOYAD'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.kartEtiket}>SON KULLANMA</div>
                    <div style={styles.kartDeger}>{form.skt || 'AA/YY'}</div>
                  </div>
                  <div style={styles.kartVisa}>VISA</div>
                </div>
              </div>

              {/* Arka yüz */}
              <div style={{ ...styles.kartYuz, ...styles.kartArka }}>
                <div style={styles.magnet} />
                <div style={styles.cvvSatir}>
                  <div style={styles.imzaBant} />
                  <div style={styles.cvvKutu}>
                    <div style={styles.cvvEtiket}>CVV</div>
                    <div style={styles.cvvDeger}>{form.cvv || '•••'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={gonder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={styles.fGrup}>
              <label style={styles.fEtiket}>Kart Üzerindeki İsim</label>
              <input name="kartSahibi" value={form.kartSahibi} onChange={guncelle}
                placeholder="AHMET YILMAZ" required style={styles.fInput}
                onFocus={() => setOnYuz(true)}/>
            </div>

            <div style={styles.fGrup}>
              <label style={styles.fEtiket}>Kart Numarası</label>
              <div style={styles.kartNoSarici}>
                <input name="kartNo" value={form.kartNo} onChange={guncelle}
                  placeholder="0000 0000 0000 0000" required maxLength={19}
                  style={{ ...styles.fInput, paddingRight: 50, letterSpacing: '0.08em' }}
                  onFocus={() => setOnYuz(true)} />
                <span style={styles.kartNoIkon}>•••</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={styles.fGrup}>
                <label style={styles.fEtiket}>Son Kullanma (AA/YY)</label>
                <input name="skt" value={form.skt} onChange={guncelle}
                  placeholder="12/26" required maxLength={5}
                  style={styles.fInput} onFocus={() => setOnYuz(true)} />
              </div>
              <div style={styles.fGrup}>
                <label style={styles.fEtiket}>CVV</label>
                <input name="cvv" value={form.cvv} onChange={guncelle}
                  placeholder="•••" required maxLength={4} type="password"
                  style={styles.fInput} onFocus={() => setOnYuz(false)} />
              </div>
            </div>

            {hata && <div style={styles.hataMesaj}>{hata}</div>}

            <button type="submit" disabled={yukleniyor} style={{
              ...styles.odemeBtn,
              opacity: yukleniyor ? 0.75 : 1,
              cursor: yukleniyor ? 'not-allowed' : 'pointer',
            }}>
              {yukleniyor
                ? <><span style={styles.btnSpinner} /> Ödeme İşleniyor...</>
                : '₺49,99 Öde ve Siparişi Tamamla'}
            </button>

            <p style={styles.testNotu}>
              Test: <code>4242 4242 4242 4242</code> · SKT: herhangi · CVV: herhangi
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles = {
  sayfa: {
    minHeight: '100vh', background: '#f0f4ff',
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    display: 'flex', flexDirection: 'column',
  },
  icerik: {
    maxWidth: 960, margin: '0 auto', padding: '60px 24px',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48,
    width: '100%', alignItems: 'start',
  },
  siparisSarici: { display: 'flex', flexDirection: 'column', gap: 16 },
  geriBtn: { background: 'none', border: 'none', color: '#6b7fa8', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, width: 'fit-content' },
  solBaslik: { fontSize: 24, fontWeight: 800, color: '#0a1628' },
  siparisKart: { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,50,0.07)' },
  siparisRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  siparisEtiket: { fontSize: 13, color: '#8a9abc' },
  siparisValue: { fontSize: 14, fontWeight: 600, color: '#0a1628' },
  ayirac: { height: 1, background: '#e8ecf8', margin: '4px 0 8px' },
  guvenlikSatir: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  guvenlikBadge: { background: '#fff', border: '1px solid #e8ecf8', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#6b7fa8' },

  formSarici: { display: 'flex', flexDirection: 'column', gap: 20 },
  kartKapla: { cursor: 'pointer', userSelect: 'none' },
  kart3d: { width: '100%', borderRadius: 18 },
  kartYuz: {
    position: 'absolute', inset: 0,
    borderRadius: 18, padding: 24,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  },
  kartOn: {
    background: `linear-gradient(135deg, #0a1628 0%, ${ACCENT_PRIMARY} 100%)`,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  kartArka: {
    background: 'linear-gradient(135deg, #111 0%, #2a2a4a 100%)',
    transform: 'rotateY(180deg)',
  },
  kartLogo: { fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: '#fff', letterSpacing: 3 },
  kartChip: { fontSize: 28, color: '#ffd700', width: 36 },
  kartNumara: { fontSize: 18, color: '#fff', letterSpacing: '0.12em', fontFamily: 'monospace', textAlign: 'center' },
  kartAlt: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  kartEtiket: { fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  kartDeger: { fontSize: 13, color: '#fff', fontWeight: 600, letterSpacing: '0.04em' },
  kartVisa: { fontSize: 16, fontStyle: 'italic', fontWeight: 900, color: '#fff', opacity: 0.8 },
  magnet: { height: 40, background: '#111', margin: '20px -24px 0', borderRadius: 0 },
  imzaBant: { flex: 1, height: 36, background: 'repeating-linear-gradient(90deg,#eee 0px,#eee 12px,#ccc 12px,#ccc 14px)', borderRadius: 4 },
  cvvSatir: { display: 'flex', gap: 10, alignItems: 'center', margin: '12px 0' },
  cvvKutu: { background: '#fff', borderRadius: 6, padding: '4px 12px', minWidth: 60, textAlign: 'center' },
  cvvEtiket: { fontSize: 9, color: '#888' },
  cvvDeger: { fontSize: 14, fontWeight: 700, letterSpacing: '0.2em' },

  fGrup: { display: 'flex', flexDirection: 'column', gap: 6 },
  fEtiket: { fontSize: 12, fontWeight: 700, color: '#8a9abc', letterSpacing: '0.05em', textTransform: 'uppercase' },
  fInput: {
    padding: '12px 14px', border: '1.5px solid #e8ecf8', borderRadius: 10,
    fontSize: 14, color: '#0a1628', outline: 'none',
    fontFamily: 'inherit', background: '#fafbff', transition: 'border-color 0.2s',
  },
  kartNoSarici: { position: 'relative' },
  kartNoIkon: { position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18 },
  hataMesaj: {
    background: '#fff0f0', border: '1px solid #ffcdd2',
    color: '#c62828', borderRadius: 8, padding: '10px 14px', fontSize: 13,
  },
  odemeBtn: {
    padding: '15px', background: `linear-gradient(135deg, ${ACCENT_PRIMARY} 0%, ${ACCENT_SECONDARY} 100%)`, color: ACCENT_TEXT_ON_SOLID,
    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
    boxShadow: `0 4px 20px ${ACCENT_SHADOW}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'transform 0.15s',
  },
  btnSpinner: {
    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.7s linear infinite',
  },
  testNotu: { fontSize: 11, color: '#b0bcd4', textAlign: 'center' },

  basariSayfa: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f0f4ff', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  basariKart: {
    background: '#fff', borderRadius: 24, padding: '52px 44px',
    maxWidth: 420, width: '100%', textAlign: 'center',
    boxShadow: '0 8px 48px rgba(0,0,50,0.12)',
  },
  basariBaslik: { fontSize: 26, fontWeight: 800, color: '#0a1628', marginBottom: 12 },
  basariAlt: { fontSize: 15, color: '#8a9abc', lineHeight: 1.6, marginBottom: 28 },
  basariLoader: { height: 4, background: '#e8ecf8', borderRadius: 2, overflow: 'hidden' },
  loaderCizgi: {
    height: '100%', background: ACCENT_PRIMARY, borderRadius: 2,
    animation: 'loaderAnim 4s linear forwards',
    width: '0%',
  },
}

// Global CSS animasyonları
const cssAnimasyonlar = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes loaderAnim { from { width: 0% } to { width: 100% } }
`
const styleEl = document.createElement('style')
styleEl.textContent = cssAnimasyonlar
document.head.appendChild(styleEl)

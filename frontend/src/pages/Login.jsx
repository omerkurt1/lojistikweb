// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

const COPY = {
  tr: {
    passMismatch: 'Şifreler eşleşmiyor.',
    loginOk: 'Giriş başarılı! Yönlendiriliyorsunuz...',
    registerOk: 'Hesabınız oluşturuldu! Yönlendiriliyorsunuz...',
    tabLogin: 'Giriş Yap',
    tabRegister: 'Kayıt Ol',
    fullName: 'Ad Soyad',
    email: 'E-Posta',
    pass: 'Şifre',
    passAgain: 'Şifre Tekrar',
    loadingLogin: 'Giriş yapılıyor...',
    loadingRegister: 'Hesap oluşturuluyor...',
    submitLogin: 'Giriş Yap →',
    submitRegister: 'Hesap Oluştur →',
    noAccount: 'Hesabınız yok mu? ',
    registerNow: 'Kayıt olun',
    hasAccount: 'Zaten üye misiniz? ',
    loginNow: 'Giriş yapın',
    or: 'veya',
    liveTrack: '📍  Canlı Takip Et →',
    slogan: 'Akıllı Lojistik Yönetim Sistemi'
  },
  en: {
    passMismatch: 'Passwords do not match.',
    loginOk: 'Login successful! Redirecting...',
    registerOk: 'Account created! Redirecting...',
    tabLogin: 'Sign In',
    tabRegister: 'Sign Up',
    fullName: 'Full Name',
    email: 'Email',
    pass: 'Password',
    passAgain: 'Confirm Password',
    loadingLogin: 'Signing in...',
    loadingRegister: 'Creating account...',
    submitLogin: 'Sign In →',
    submitRegister: 'Create Account →',
    noAccount: "Don't have an account? ",
    registerNow: 'Sign up',
    hasAccount: 'Already have an account? ',
    loginNow: 'Sign in',
    or: 'or',
    liveTrack: '📍  Track Live →',
    slogan: 'Smart Logistics Management Platform'
  }
}

export default function Login() {
  const { giris, kayit } = useAuth()
  const { language } = useSettings()
  const navigate = useNavigate()
  const vitrinUrl = 'https://lojistikweb-vitrin.vercel.app/#teknoloji'
  const c = COPY[language === 'en' ? 'en' : 'tr']

  const [sekme, setSekme] = useState('giris')  // 'giris' | 'kayit'
  const [form, setForm] = useState({ isim: '', email: '', sifre: '', sifreTekrar: '' })
  const [yukleniyor, setYuk] = useState(false)
  const [hata, setHata] = useState('')
  const [basari, setBasari] = useState('')

  const guncelle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  // ── Form gönderme: tüm yönlendirme kararları BURADAN verilir ──
  const gonder = async e => {
    e.preventDefault()
    setHata(''); setBasari('')

    if (sekme === 'kayit' && form.sifre !== form.sifreTekrar) {
      return setHata(c.passMismatch)
    }

    setYuk(true)
    try {
      if (sekme === 'giris') {
        const sonuc = await giris({ email: form.email, sifre: form.sifre })
        const kullanici = sonuc?.kullanici
        const isAdmin =
          (kullanici?.email || '').toLowerCase() === 'patron@loop.com' ||
          (kullanici?.rol || '').toLowerCase() === 'admin'

        setBasari(c.loginOk)
        if (isAdmin) {
          window.open('https://lojistikweb1.vercel.app/dashboard', '_blank', 'noopener,noreferrer')
        }
        window.location.replace(vitrinUrl)

      } else {
        await kayit({ isim: form.isim, email: form.email, sifre: form.sifre })
        setBasari(c.registerOk)
        window.location.replace(vitrinUrl)
      }
    } catch (err) {
      setHata(err.message)
    } finally {
      setYuk(false)
    }
  }  // ← gonder() burada kapanır

  // ── Bileşen render çıktısı — gonder() DIŞINDA, doğru yerde ──
  return (
    <div style={styles.sayfa}>
      {/* Arka plan efekti */}
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <div style={styles.kart}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🚚</span>
          <span style={styles.logoText}>LOOP</span>
        </div>
        <p style={styles.logoAlt}>{c.slogan}</p>

        {/* Sekmeler */}
        <div style={styles.sekmeSarici}>
          <button
            style={{ ...styles.sekme, ...(sekme === 'giris' ? styles.sekmeAktif : {}) }}
            onClick={() => { setSekme('giris'); setHata('') }}
          >
            {c.tabLogin}
          </button>
          <button
            style={{ ...styles.sekme, ...(sekme === 'kayit' ? styles.sekmeAktif : {}) }}
            onClick={() => { setSekme('kayit'); setHata('') }}
          >
            {c.tabRegister}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={gonder} style={styles.form}>
          {sekme === 'kayit' && (
            <div style={styles.grup}>
              <label style={styles.etiket}>{c.fullName}</label>
              <input
                name="isim"
                value={form.isim}
                onChange={guncelle}
                placeholder="Ahmet Yılmaz"
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.grup}>
            <label style={styles.etiket}>{c.email}</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={guncelle}
              placeholder="ahmet@firma.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.grup}>
            <label style={styles.etiket}>{c.pass}</label>
            <input
              name="sifre"
              type="password"
              value={form.sifre}
              onChange={guncelle}
              placeholder="••••••••"
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          {sekme === 'kayit' && (
            <div style={styles.grup}>
              <label style={styles.etiket}>{c.passAgain}</label>
              <input
                name="sifreTekrar"
                type="password"
                value={form.sifreTekrar}
                onChange={guncelle}
                placeholder="••••••••"
                required
                style={styles.input}
              />
            </div>
          )}

          {hata && <div style={styles.hataMesaj}>{hata}</div>}
          {basari && <div style={styles.basariMesaj}>{basari}</div>}

          <button type="submit" disabled={yukleniyor} style={{
            ...styles.buton,
            opacity: yukleniyor ? 0.7 : 1,
            cursor: yukleniyor ? 'not-allowed' : 'pointer'
          }}>
            {yukleniyor
              ? (sekme === 'giris' ? c.loadingLogin : c.loadingRegister)
              : (sekme === 'giris' ? c.submitLogin : c.submitRegister)}
          </button>
        </form>

        {/* Alt link */}
        <p style={styles.altMetin}>
          {sekme === 'giris'
            ? <><span>{c.noAccount}</span><button style={styles.linkBtn} onClick={() => setSekme('kayit')}>{c.registerNow}</button></>
            : <><span>{c.hasAccount}</span><button style={styles.linkBtn} onClick={() => setSekme('giris')}>{c.loginNow}</button></>
          }
        </p>

        <div style={styles.ayirac}>
          <span style={styles.ayiracCizgi} />
          <span style={styles.ayiracMetin}>{c.or}</span>
          <span style={styles.ayiracCizgi} />
        </div>

        {/* Canlı takip sayfasına hızlı erişim */}
        <button id="btn-canli-takip" style={styles.takipBtn} onClick={() => navigate('/takip')}>
          {c.liveTrack}
        </button>
      </div>
    </div>
  )
}  // ← Login bileşeni burada kapanır

// ── Stiller — bileşen DIŞINDA, modül seviyesinde tanımlanır ──
const styles = {
  sayfa: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f4ff',
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute', top: -120, left: -100,
    width: 400, height: 400, borderRadius: '50%',
    background: 'rgba(0, 120, 255, 0.07)', filter: 'blur(60px)', pointerEvents: 'none',
  },
  bgBlob2: {
    position: 'absolute', bottom: -100, right: -80,
    width: 350, height: 350, borderRadius: '50%',
    background: 'rgba(0, 200, 180, 0.07)', filter: 'blur(60px)', pointerEvents: 'none',
  },
  kart: {
    background: '#fff',
    borderRadius: 20,
    padding: '40px 40px 32px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 40px rgba(0,0,50,0.10)',
    position: 'relative',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    justifyContent: 'center', marginBottom: 6,
  },
  logoIcon: { fontSize: 28 },
  logoText: {
    fontSize: 28, fontWeight: 800, letterSpacing: 3,
    color: '#0a1628',
  },
  logoAlt: {
    textAlign: 'center', fontSize: 13, color: '#8a9abc',
    marginBottom: 28,
  },
  sekmeSarici: {
    display: 'flex', background: '#f3f5fb',
    borderRadius: 10, padding: 4, marginBottom: 24,
  },
  sekme: {
    flex: 1, padding: '9px 0', border: 'none',
    background: 'transparent', borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    color: '#8a9abc', transition: 'all 0.2s',
  },
  sekmeAktif: {
    background: '#fff', color: '#0a1628',
    boxShadow: '0 1px 6px rgba(0,0,50,0.10)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  grup: { display: 'flex', flexDirection: 'column', gap: 6 },
  etiket: { fontSize: 12, fontWeight: 700, color: '#8a9abc', letterSpacing: '0.05em', textTransform: 'uppercase' },
  input: {
    padding: '12px 14px', border: '1.5px solid #e8ecf8',
    borderRadius: 10, fontSize: 14, color: '#0a1628',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    background: '#fafbff',
  },
  buton: {
    padding: '14px', background: '#0062ff',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginTop: 4, transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 16px rgba(0,98,255,0.28)',
  },
  hataMesaj: {
    background: '#fff0f0', border: '1px solid #ffcdd2',
    color: '#c62828', borderRadius: 8, padding: '10px 14px',
    fontSize: 13, fontWeight: 500,
  },
  basariMesaj: {
    background: '#f0fff4', border: '1px solid #c8e6c9',
    color: '#2e7d32', borderRadius: 8, padding: '10px 14px',
    fontSize: 13, fontWeight: 500,
  },
  altMetin: { textAlign: 'center', fontSize: 13, color: '#8a9abc', marginTop: 20 },
  linkBtn: {
    background: 'none', border: 'none', color: '#0062ff',
    fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0,
  },
  ayirac: {
    display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 0',
  },
  ayiracCizgi: { flex: 1, height: 1, background: '#e8ecf8' },
  ayiracMetin: { fontSize: 12, color: '#b0bcd4' },
  takipBtn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #0062ff 0%, #00b4d8 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    marginTop: 10,
    boxShadow: '0 4px 18px rgba(0,98,255,0.28)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    letterSpacing: '0.3px',
  },
}

// backend/routes/auth.js
const express = require('express')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')

const router  = express.Router()
const JWT_SECRET  = process.env.JWT_SECRET  || 'loop_super_gizli_key_2026'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

// JWT oluşturucu
function tokenUret(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

// ─── POST /api/auth/kayit ────────────────────────────────
router.post('/kayit', async (req, res) => {
  try {
    const { isim, email, sifre } = req.body

    // ── 1. Alan doğrulama ──────────────────────────────────
    if (!isim || !email || !sifre) {
      return res.status(400).json({ hata: 'İsim, e-posta ve şifre zorunludur.' })
    }
    if (sifre.length < 6) {
      return res.status(400).json({ hata: 'Şifre en az 6 karakter olmalıdır.' })
    }

    // ── 2. Mevcut kullanıcı kontrolü ───────────────────────
    const mevcut = await User.findOne({ email: email.trim().toLowerCase() })
    if (mevcut) {
      return res.status(400).json({ hata: 'Bu e-posta adresi zaten kayıtlı.' })
    }

    // ── 3. Kullanıcı oluştur ───────────────────────────────
    const kullanici = await User.create({ isim: isim.trim(), email: email.trim().toLowerCase(), sifre })
    const token     = tokenUret(kullanici._id)

    return res.status(201).json({
      mesaj     : 'Kayıt başarılı!',
      token,
      kullanici : kullanici.toJSON()
    })
  } catch (err) {
    // ── Tam hata nesnesini logla (Mongoose ValidationError detayları için) ──
    console.error('[Auth/kayit] HATA DETAYI:', err)

    // Mongoose duplicate key hatası (race condition durumunda)
    if (err.code === 11000) {
      return res.status(400).json({ hata: 'Bu e-posta adresi zaten kayıtlı.' })
    }
    // Mongoose doğrulama hatası → alan bazlı mesajları birleştir
    if (err.name === 'ValidationError') {
      const mesajlar = Object.values(err.errors).map(e => e.message).join(' | ')
      return res.status(400).json({ hata: mesajlar })
    }
    // Diğer tüm hatalar → 500, ama mesajı da döndür (geliştirme kolaylığı için)
    return res.status(500).json({ hata: `Sunucu hatası: ${err.message}` })
  }
})

// ─── POST /api/auth/giris ────────────────────────────────
router.post('/giris', async (req, res) => {
  try {
    const { email, sifre } = req.body

    if (!email || !sifre) {
      return res.status(400).json({ hata: 'E-posta ve şifre zorunludur.' })
    }

    // Kullanıcıyı bul (şifre alanını da getir)
    const kullanici = await User.findOne({ email }).select('+sifre')
    if (!kullanici) {
      return res.status(401).json({ hata: 'E-posta veya şifre hatalı.' })
    }

    const dogru = await kullanici.sifreDogru(sifre)
    if (!dogru) {
      return res.status(401).json({ hata: 'E-posta veya şifre hatalı.' })
    }

    if (!kullanici.aktif) {
      return res.status(403).json({ hata: 'Hesabınız devre dışı bırakılmış.' })
    }

    const token = tokenUret(kullanici._id)

    res.json({
      mesaj     : 'Giriş başarılı!',
      token,
      kullanici : kullanici.toJSON()
    })
  } catch (err) {
    console.error('[Auth/giris]', err.message)
    res.status(500).json({ hata: 'Sunucu hatası.' })
  }
})

// ─── GET /api/auth/ben  (token doğrulama) ───────────────
router.get('/ben', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ hata: 'Token bulunamadı.' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    const kullanici = await User.findById(decoded.id)
    if (!kullanici) return res.status(401).json({ hata: 'Kullanıcı bulunamadı.' })
    res.json({ kullanici })
  } catch {
    res.status(401).json({ hata: 'Geçersiz veya süresi dolmuş token.' })
  }
})

module.exports = router
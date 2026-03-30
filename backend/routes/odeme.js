// backend/routes/odeme.js
// npm install stripe   →  gerçek Stripe entegrasyonu
// STRIPE_SECRET_KEY .env'de yoksa simülasyon modu devreye girer
const express = require('express')
const router  = express.Router()

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
let stripe = null
if (STRIPE_KEY) {
  stripe = require('stripe')(STRIPE_KEY)
}

// ─── POST /api/odeme/islem ───────────────────────────────
// Body: { kartNo, skt, cvv, tutar, siparisDetay }
router.post('/islem', async (req, res) => {
  try {
    const { tutar = 4999, siparisDetay = {} } = req.body

    // Temel doğrulama
    const { kartNo, skt, cvv } = req.body
    if (!kartNo || !skt || !cvv) {
      return res.status(400).json({ hata: 'Kart bilgileri eksik.' })
    }

    const temizKartNo = kartNo.replace(/\s/g, '')
    if (temizKartNo.length !== 16 || !/^\d+$/.test(temizKartNo)) {
      return res.status(400).json({ hata: 'Geçersiz kart numarası.' })
    }

    // ── GERÇEK STRİPE MODU ──────────────────────────────
    if (stripe) {
      // Test kartı: 4242 4242 4242 4242
      // Gerçek entegrasyonda frontend'den paymentMethodId gelir.
      // Burada amount kuruş cinsindendir (₺49.99 → 4999)
      const paymentIntent = await stripe.paymentIntents.create({
        amount  : tutar,   // kuruş
        currency: 'try',
        payment_method_types: ['card'],
        metadata: { ...siparisDetay }
      })

      return res.json({
        basarili      : true,
        clientSecret  : paymentIntent.client_secret,
        odemeId       : paymentIntent.id,
        mesaj         : 'Ödeme başlatıldı.',
        mod           : 'stripe'
      })
    }

    // ── SİMÜLASYON MODU (Stripe key yoksa) ─────────────
    // Test için: kart numarası 0000 ile bitiyorsa hata döner
    if (temizKartNo.endsWith('0000')) {
      return res.status(402).json({
        basarili: false,
        hata    : 'Ödeme reddedildi. (Simülasyon: bakiye yetersiz)'
      })
    }

    // Gerçekçi gecikme simülasyonu
    await new Promise(r => setTimeout(r, 900))

    const odemeId = 'SIM_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase()

    res.json({
      basarili : true,
      odemeId,
      tutar    : (tutar / 100).toFixed(2),
      mesaj    : 'Ödeme başarıyla alındı.',
      mod      : 'simulasyon',
      zaman    : new Date().toISOString()
    })

  } catch (err) {
    console.error('[Odeme/islem]', err.message)
    res.status(500).json({ hata: 'Ödeme işlemi sırasında hata oluştu.' })
  }
})

// ─── GET /api/odeme/dogrula/:odemeId ────────────────────
router.get('/dogrula/:odemeId', async (req, res) => {
  try {
    const { odemeId } = req.params
    if (stripe && !odemeId.startsWith('SIM_')) {
      const pi = await stripe.paymentIntents.retrieve(odemeId)
      return res.json({ durum: pi.status, odemeId })
    }
    // Simülasyon: SIM_ ile başlayan her ID geçerli
    res.json({ durum: 'succeeded', odemeId })
  } catch (err) {
    res.status(404).json({ hata: 'Ödeme bulunamadı.' })
  }
})

module.exports = router
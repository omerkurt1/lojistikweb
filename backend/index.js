// ─────────────────────────────────────────────────────────────
//  Kurye Takip — Backend (Final)
//  npm install express socket.io cors axios mongoose dotenv
//  .env → ORS_API_KEY, MONGO_URI, PORT
// ─────────────────────────────────────────────────────────────
require('dotenv').config()

const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const cors       = require('cors')
const axios      = require('axios')
const mongoose   = require('mongoose')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io     = new Server(server, { cors: { origin: '*' } })

const ORS_KEY   = process.env.ORS_API_KEY
const MONGO_URI = process.env.MONGO_URI
const PORT      = process.env.PORT || 5000

// ════════════════════════════════════════════════════════════
//  MONGOOSE MODELLERİ
// ════════════════════════════════════════════════════════════

// 1) Kurye profili + kümülatif istatistik
const KuryeSchema = new mongoose.Schema({
  kuryeId           : { type: Number, required: true, unique: true },
  isim              : { type: String,  required: true },
  toplamTeslimat    : { type: Number,  default: 0 },
  toplamSure        : { type: Number,  default: 0 },   // dakika
  ortalamaSure      : { type: Number,  default: 0 },   // dakika
  optimizasyonSayisi: { type: Number,  default: 0 },
  sonGuncelleme     : { type: Date,    default: Date.now }
}, { collection: 'kuryeler' })

// 2) Teslimat kaydı — her teslim için bir doküman
const TeslimatSchema = new mongoose.Schema({
  kuryeId         : { type: Number,  required: true, index: true },
  kuryeIsim       : { type: String,  required: true },
  baslangicEnlem  : Number,
  baslangicBoylam : Number,
  hedefEnlem      : Number,
  hedefBoylam     : Number,
  baslangicZamani : { type: Date, required: true },
  bitisZamani     : { type: Date, default: Date.now },
  sureDakika      : { type: Number,  default: 0 },
  rotaOptimize    : { type: Boolean, default: false }
}, { collection: 'teslimatlar' })

// 3) Günlük özet — upsert ile güncellenir
const GunlukOzetSchema = new mongoose.Schema({
  tarih              : { type: String, required: true, unique: true }, // YYYY-MM-DD
  toplamTeslimat     : { type: Number, default: 0 },
  saatlikDagilim     : { type: [Number], default: () => Array(24).fill(0) },
  enCokTeslimatKurye : { type: String, default: '' },
  guncellemeZamani   : { type: Date, default: Date.now }
}, { collection: 'gunluk_ozet' })

// 4) Konum geçmişi — ~15sn'de bir snapshot
const KonumSchema = new mongoose.Schema({
  kuryeId   : { type: Number, required: true, index: true },
  kuryeIsim : String,
  enlem     : Number,
  boylam    : Number,
  hiz       : Number,
  zaman     : { type: Date, default: Date.now }
}, { collection: 'konum_gecmis' })
KonumSchema.index({ kuryeId: 1, zaman: -1 })

const KuryeModel   = mongoose.model('Kurye',      KuryeSchema)
const TeslimatModel= mongoose.model('Teslimat',   TeslimatSchema)
const GunlukOzet   = mongoose.model('GunlukOzet', GunlukOzetSchema)
const KonumModel   = mongoose.model('Konum',      KonumSchema)

// DB bağlı mı? — DB yoksa kayıtlar sessizce atlanır
let dbBagli = false

// ════════════════════════════════════════════════════════════
//  BELLEK İÇİ DURUM
// ════════════════════════════════════════════════════════════
let siparisFisi = []

const BASLANGIC_KURYELER = [
  { id: 1, isim: 'Ahmet',  enlem: 41.0660, boylam: 28.9900, hedefEnlem: 41.0422, hedefBoylam: 29.0060 },
  { id: 2, isim: 'Mehmet', enlem: 40.9900, boylam: 29.0250, hedefEnlem: 40.9540, hedefBoylam: 29.0950 },
  { id: 3, isim: 'Ayse',   enlem: 40.9780, boylam: 28.8720, hedefEnlem: 40.9930, hedefBoylam: 28.9200 },
]

let kuryeler = BASLANGIC_KURYELER.map(k => ({
  ...k,
  rota: [], hedefSira: 1,
  durum: 'yolda', hiz: 0,
  optimizasyonSayisi: 0, online: true, eta: 0,
  baslangicZamani: new Date()
}))

// ════════════════════════════════════════════════════════════
//  YARDIMCI FONKSİYONLAR
// ════════════════════════════════════════════════════════════
function etaHesapla(k) {
  if (!k.rota || k.hedefSira >= k.rota.length) return 0
  return Math.max(1, Math.ceil(((k.rota.length - k.hedefSira) * 1.5) / 60))
}

function bugunTarih() {
  return new Date().toISOString().split('T')[0]
}

async function gercekRotaCiz(basEnlem, basBoylam, bitisEnlem, bitisBoylam, optimizasyonModu) {
  try {
    let duraklar = [[basBoylam, basEnlem], [bitisBoylam, bitisEnlem]]
    if (optimizasyonModu) {
      const araEnlem  = (basEnlem  + bitisEnlem)  / 2 + (Math.random() - 0.5) * 0.01
      const araBoylam = (basBoylam + bitisBoylam) / 2 + (Math.random() - 0.5) * 0.01
      duraklar.splice(1, 0, [araBoylam, araEnlem])
    }
    const cevap = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      { coordinates: duraklar },
      { headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' } }
    )
    return cevap.data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
  } catch (e) {
    console.error('Rota Hatası:', e.response?.data ?? e.message)
    return [[basEnlem, basBoylam], [bitisEnlem, bitisBoylam]]
  }
}

// Teslimatı DB'ye yaz + kurye profili + günlük özet güncelle
async function teslimatKaydet(kurye) {
  if (!dbBagli) return
  const simdi      = new Date()
  const sureDakika = Math.round((simdi - new Date(kurye.baslangicZamani)) / 60000)

  try {
    // 1) Teslimat belgesi
    await TeslimatModel.create({
      kuryeId        : kurye.id,
      kuryeIsim      : kurye.isim,
      baslangicEnlem : kurye.enlem,
      baslangicBoylam: kurye.boylam,
      hedefEnlem     : kurye.hedefEnlem,
      hedefBoylam    : kurye.hedefBoylam,
      baslangicZamani: kurye.baslangicZamani,
      bitisZamani    : simdi,
      sureDakika,
      rotaOptimize   : kurye.optimizasyonSayisi > 0
    })

    // 2) Kurye profili güncelle (upsert)
    const doc = await KuryeModel.findOneAndUpdate(
      { kuryeId: kurye.id },
      {
        $set: { isim: kurye.isim, sonGuncelleme: simdi },
        $inc: { toplamTeslimat: 1, toplamSure: sureDakika, optimizasyonSayisi: kurye.optimizasyonSayisi }
      },
      { upsert: true, new: true }
    )
    if (doc) {
      doc.ortalamaSure = doc.toplamTeslimat > 0
        ? Math.round(doc.toplamSure / doc.toplamTeslimat) : 0
      await doc.save()
    }

    // 3) Günlük özet
    const saat = simdi.getHours()
    await GunlukOzet.findOneAndUpdate(
      { tarih: bugunTarih() },
      { $inc: { toplamTeslimat: 1, [`saatlikDagilim.${saat}`]: 1 }, $set: { guncellemeZamani: simdi } },
      { upsert: true }
    )

    // 4) Günlük en çok teslimat yapan kurye
    const gunBas = new Date(); gunBas.setHours(0,0,0,0)
    const lider = await TeslimatModel.aggregate([
      { $match: { bitisZamani: { $gte: gunBas } } },
      { $group: { _id: '$kuryeIsim', sayi: { $sum: 1 } } },
      { $sort: { sayi: -1 } }, { $limit: 1 }
    ])
    if (lider[0]) {
      await GunlukOzet.updateOne(
        { tarih: bugunTarih() },
        { $set: { enCokTeslimatKurye: lider[0]._id } }
      )
    }

    console.log(`[DB] ${kurye.isim} → teslimat OK (${sureDakika} dk)`)
  } catch (err) {
    console.error('[DB] Kayıt hatası:', err.message)
  }
}

// ════════════════════════════════════════════════════════════
//  REST API — FRONTEND'İN BEKLEDİĞİ TÜM ENDPOINT'LER
// ════════════════════════════════════════════════════════════

// GET /api/istatistik/genel
app.get('/api/istatistik/genel', async (_req, res) => {
  try {
    if (!dbBagli) {
      return res.json({
        toplamTeslimat   : 0,
        bugunTeslimat    : 0,
        aktifKurye       : kuryeler.filter(k => k.online).length,
        yoldakiSiparis   : kuryeler.filter(k => k.durum !== 'teslim edildi' && k.online).length,
        genelOrtalamaSure: 0,
        dbDurumu         : 'bağlı değil'
      })
    }
    const gunBas = new Date(); gunBas.setHours(0,0,0,0)
    const [toplam, bugun, profiller] = await Promise.all([
      TeslimatModel.countDocuments(),
      TeslimatModel.countDocuments({ bitisZamani: { $gte: gunBas } }),
      KuryeModel.find()
    ])
    const genelOrt = profiller.length > 0
      ? Math.round(profiller.reduce((t, k) => t + k.ortalamaSure, 0) / profiller.length) : 0
    res.json({
      toplamTeslimat   : toplam,
      bugunTeslimat    : bugun,
      aktifKurye       : kuryeler.filter(k => k.online).length,
      yoldakiSiparis   : kuryeler.filter(k => k.durum !== 'teslim edildi' && k.online).length,
      genelOrtalamaSure: genelOrt,
      dbDurumu         : 'bağlı'
    })
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// GET /api/istatistik/kuryeler
app.get('/api/istatistik/kuryeler', async (_req, res) => {
  try {
    if (!dbBagli) return res.json([])
    const profiller = await KuryeModel.find().sort({ toplamTeslimat: -1 })
    res.json(profiller)
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// GET /api/istatistik/kurye/:id  →  profil + son 50 teslimat
app.get('/api/istatistik/kurye/:id', async (req, res) => {
  try {
    if (!dbBagli) return res.json({ profil: null, gecmis: [] })
    const kuryeId = Number(req.params.id)
    const [profil, gecmis] = await Promise.all([
      KuryeModel.findOne({ kuryeId }),
      TeslimatModel.find({ kuryeId }).sort({ bitisZamani: -1 }).limit(50)
    ])
    res.json({ profil, gecmis })
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// GET /api/istatistik/gunluk  →  bugünün saatlik dağılımı
app.get('/api/istatistik/gunluk', async (_req, res) => {
  try {
    if (!dbBagli) return res.json({ tarih: bugunTarih(), toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
    const ozet = await GunlukOzet.findOne({ tarih: bugunTarih() })
    res.json(ozet || { tarih: bugunTarih(), toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// GET /api/istatistik/gunluk/:tarih  →  belirli gün (YYYY-MM-DD)
app.get('/api/istatistik/gunluk/:tarih', async (req, res) => {
  try {
    if (!dbBagli) return res.json({ tarih: req.params.tarih, toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
    const ozet = await GunlukOzet.findOne({ tarih: req.params.tarih })
    res.json(ozet || { tarih: req.params.tarih, toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// GET /api/istatistik/haftalik  →  son 7 günün günlük toplamları
app.get('/api/istatistik/haftalik', async (_req, res) => {
  try {
    if (!dbBagli) return res.json([])
    const yediGunOnce = new Date()
    yediGunOnce.setDate(yediGunOnce.getDate() - 7); yediGunOnce.setHours(0,0,0,0)
    const veriler = await TeslimatModel.aggregate([
      { $match: { bitisZamani: { $gte: yediGunOnce } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$bitisZamani' } }, sayi: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    res.json(veriler)
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// GET /api/teslimatlar?limit=20&kuryeId=1
app.get('/api/teslimatlar', async (req, res) => {
  try {
    if (!dbBagli) return res.json([])
    const limit   = Math.min(Number(req.query.limit) || 20, 200)
    const kuryeId = req.query.kuryeId ? Number(req.query.kuryeId) : null
    const filtre  = kuryeId ? { kuryeId } : {}
    const liste   = await TeslimatModel.find(filtre).sort({ bitisZamani: -1 }).limit(limit)
    res.json(liste)
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// GET /api/konum/:kuryeId  →  konum geçmişi (bonus)
app.get('/api/konum/:kuryeId', async (req, res) => {
  try {
    if (!dbBagli) return res.json([])
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const liste = await KonumModel
      .find({ kuryeId: parseInt(req.params.kuryeId) })
      .sort({ zaman: -1 }).limit(limit)
    res.json(liste.reverse())
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// Health check
app.get('/api/saglik', (_req, res) => {
  res.json({ durum: 'çalışıyor', db: dbBagli ? 'bağlı' : 'bağlı değil', zaman: new Date() })
})

// ════════════════════════════════════════════════════════════
//  SOCKET.IO
// ════════════════════════════════════════════════════════════
io.on('connection', socket => {
  socket.emit('kuryeleriGuncelle',   kuryeler)
  socket.emit('siparisFisiGuncelle', siparisFisi)

  socket.on('yeniRotaCiz', async () => {
    for (const k of kuryeler) {
      if (!k.online || k.durum === 'teslim edildi') continue
      k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, true)
      k.hedefSira = 1; k.optimizasyonSayisi++
    }
    io.emit('kuryeleriGuncelle', kuryeler)
  })

  socket.on('tekKuryeRotaCiz', async kuryeId => {
    const k = kuryeler.find(k => k.id === kuryeId)
    if (k && k.online && k.durum !== 'teslim edildi') {
      k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, true)
      k.hedefSira = 1; k.optimizasyonSayisi++
      io.emit('kuryeleriGuncelle', kuryeler)
    }
  })

  socket.on('kuryeOnlineDegistir', kuryeId => {
    const k = kuryeler.find(k => k.id === kuryeId)
    if (k) { k.online = !k.online; io.emit('kuryeleriGuncelle', kuryeler) }
  })

  socket.on('yeniSiparisEkle', async () => {
    const yeniId = kuryeler.length + 1
    const bEn = 41.0000 + Math.random() * 0.08, bBo = 28.9200 + Math.random() * 0.10
    const hEn = 41.0200 + Math.random() * 0.08, hBo = 28.9400 + Math.random() * 0.10
    const rota = await gercekRotaCiz(bEn, bBo, hEn, hBo, false)
    const yeniKurye = {
      id: yeniId, isim: 'Kurye ' + yeniId,
      enlem: bEn, boylam: bBo, hedefEnlem: hEn, hedefBoylam: hBo,
      rota, hedefSira: 1, durum: 'yolda', hiz: 0,
      optimizasyonSayisi: 0, online: true, eta: 0,
      baslangicZamani: new Date()
    }
    if (dbBagli) {
      await KuryeModel.findOneAndUpdate(
        { kuryeId: yeniId },
        { $setOnInsert: { kuryeId: yeniId, isim: yeniKurye.isim } },
        { upsert: true }
      ).catch(() => {})
    }
    kuryeler.push(yeniKurye)
    io.emit('kuryeleriGuncelle', kuryeler)
  })
})

// ════════════════════════════════════════════════════════════
//  HAREKET DÖNGÜSÜ
// ════════════════════════════════════════════════════════════
let donguSayac = 0

setInterval(() => {
  donguSayac++

  kuryeler.forEach(k => {
    if (!k.online) return

    if (k.rota && k.hedefSira < k.rota.length) {
      const [hEn, hBo] = k.rota[k.hedefSira]
      const dEn = hEn - k.enlem, dBo = hBo - k.boylam
      const uzak = Math.sqrt(dEn * dEn + dBo * dBo)

      if (uzak > 0.0005) {
        k.enlem  += (dEn / uzak) * 0.001
        k.boylam += (dBo / uzak) * 0.001
        k.hiz     = 40 + Math.floor(Math.random() * 10)
        k.durum   = 'yolda'
      } else {
        k.hedefSira++
      }
      k.eta = etaHesapla(k)

      // ~15sn'de bir konum snapshot (10 * 1.5sn = 15sn)
      if (dbBagli && donguSayac % 10 === 0) {
        KonumModel.create({
          kuryeId: k.id, kuryeIsim: k.isim,
          enlem: parseFloat(k.enlem.toFixed(5)),
          boylam: parseFloat(k.boylam.toFixed(5)),
          hiz: k.hiz
        }).catch(() => {})
      }

    } else if (k.durum !== 'teslim edildi') {
      k.durum = 'teslim edildi'; k.hiz = 0; k.eta = 0

      // DB'ye async kaydet (döngüyü bloklamaz)
      teslimatKaydet(k)

      const log = {
        id: Date.now() + k.id, kuryeIsim: k.isim,
        zaman: new Date().toLocaleTimeString('tr-TR'),
        hedefEnlem: k.hedefEnlem, hedefBoylam: k.hedefBoylam
      }
      siparisFisi.unshift(log)
      if (siparisFisi.length > 100) siparisFisi.pop()

      io.emit('teslimatBildirimi',   { isim: k.isim, zaman: log.zaman })
      io.emit('siparisFisiGuncelle', siparisFisi)
    }
  })

  io.emit('kuryeleriGuncelle', kuryeler)
}, 1500)

// ════════════════════════════════════════════════════════════
//  BAŞLAT
// ════════════════════════════════════════════════════════════
async function ilkYukleme() {
  for (const k of kuryeler) {
    k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, false)
  }
  if (dbBagli) {
    for (const k of kuryeler) {
      await KuryeModel.findOneAndUpdate(
        { kuryeId: k.id },
        { $setOnInsert: { kuryeId: k.id, isim: k.isim } },
        { upsert: true }
      ).catch(() => {})
    }
    console.log('✅ Kurye profilleri DB\'de hazır.')
  }
  console.log('✅ İlk rotalar yüklendi.')
}

mongoose.connect(MONGO_URI)
  .then(() => {
    dbBagli = true
    console.log('✅ MongoDB bağlandı.')
    server.listen(PORT, () => console.log(`🚀 Sunucu :${PORT}`))
    ilkYukleme()
  })
  .catch(err => {
    console.error('❌ MongoDB bağlanamadı:', err.message)
    console.log('⚠️  DB olmadan devam ediliyor — veriler sadece bellekte tutulacak.')
    server.listen(PORT, () => console.log(`🚀 Sunucu :${PORT} (DB yok)`))
    ilkYukleme()
  })

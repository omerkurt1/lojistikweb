// ─────────────────────────────────────────────────────────────
//  Kurye Takip — Backend
//  Bağımlılıklar: express, socket.io, cors, axios, mongoose
//  .env dosyası gerekli → bkz. .env.example
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

// ─── Ortam değişkenleri ──────────────────────────────────────
const ORS_KEY   = process.env.ORS_API_KEY   // OpenRouteService key
const MONGO_URI = process.env.MONGO_URI     // mongodb+srv://...
const PORT      = process.env.PORT || 5000

// ════════════════════════════════════════════════════════════
//  MONGOOSE ŞEMALARI
// ════════════════════════════════════════════════════════════

// 1) Kurye Profili + Kümülatif İstatistikler
const kuryeSchema = new mongoose.Schema({
  kuryeId           : { type: Number, required: true, unique: true },
  isim              : { type: String, required: true },
  toplamTeslimat    : { type: Number, default: 0 },
  toplamSure        : { type: Number, default: 0 },   // dakika
  ortalamaSure      : { type: Number, default: 0 },   // dakika
  optimizasyonSayisi: { type: Number, default: 0 },
  sonGuncelleme     : { type: Date,   default: Date.now }
}, { collection: 'kuryeler' })

// 2) Teslimat Kaydı — her teslim için bir doküman
const teslimatSchema = new mongoose.Schema({
  kuryeId         : { type: Number, required: true, index: true },
  kuryeIsim       : { type: String, required: true },
  baslangicEnlem  : Number,
  baslangicBoylam : Number,
  hedefEnlem      : Number,
  hedefBoylam     : Number,
  baslangicZamani : { type: Date, required: true },
  bitisZamani     : { type: Date, default: Date.now },
  sureDakika      : { type: Number, default: 0 },
  rotaOptimize    : { type: Boolean, default: false }
}, { collection: 'teslimatlar' })

// 3) Günlük Özet — upsert ile güncellenir
const gunlukOzetSchema = new mongoose.Schema({
  tarih              : { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  toplamTeslimat     : { type: Number, default: 0 },
  saatlikDagilim     : { type: [Number], default: () => Array(24).fill(0) },
  enCokTeslimatKurye : { type: String, default: '' },
  guncellemeZamani   : { type: Date, default: Date.now }
}, { collection: 'gunluk_ozet' })

const KuryeModel   = mongoose.model('Kurye',      kuryeSchema)
const TeslimatModel= mongoose.model('Teslimat',   teslimatSchema)
const GunlukOzet   = mongoose.model('GunlukOzet', gunlukOzetSchema)

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

function etaHesapla(kurye) {
  if (!kurye.rota || kurye.hedefSira >= kurye.rota.length) return 0
  const kalanAdim = kurye.rota.length - kurye.hedefSira
  return Math.max(1, Math.ceil((kalanAdim * 1.5) / 60))
}

function bugunTarih() {
  return new Date().toISOString().split('T')[0]
}

// Teslimatı MongoDB'ye yaz + profil + günlük özet güncelle
async function teslimatKaydet(kurye) {
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

    // 2) Kurye profilini güncelle
    const guncellenmis = await KuryeModel.findOneAndUpdate(
      { kuryeId: kurye.id },
      {
        $set: { isim: kurye.isim, sonGuncelleme: simdi },
        $inc: {
          toplamTeslimat    : 1,
          toplamSure        : sureDakika,
          optimizasyonSayisi: kurye.optimizasyonSayisi
        }
      },
      { upsert: true, new: true }
    )
    if (guncellenmis) {
      guncellenmis.ortalamaSure = guncellenmis.toplamTeslimat > 0
        ? Math.round(guncellenmis.toplamSure / guncellenmis.toplamTeslimat)
        : 0
      await guncellenmis.save()
    }

    // 3) Günlük özet
    const saat = simdi.getHours()
    await GunlukOzet.findOneAndUpdate(
      { tarih: bugunTarih() },
      {
        $inc: { toplamTeslimat: 1, [`saatlikDagilim.${saat}`]: 1 },
        $set: { guncellemeZamani: simdi }
      },
      { upsert: true }
    )

    // 4) Günün en çok teslimat yapan kuryesi
    const gunBaslangic = new Date(); gunBaslangic.setHours(0,0,0,0)
    const sonuc = await TeslimatModel.aggregate([
      { $match: { bitisZamani: { $gte: gunBaslangic } } },
      { $group: { _id: '$kuryeIsim', sayi: { $sum: 1 } } },
      { $sort: { sayi: -1 } },
      { $limit: 1 }
    ])
    const enCok = sonuc[0]?._id || ''
    await GunlukOzet.updateOne(
      { tarih: bugunTarih() },
      { $set: { enCokTeslimatKurye: enCok } }
    )

    console.log(`[DB] ${kurye.isim} → kayıt OK (${sureDakika} dk)`)
  } catch (err) {
    console.error('[DB] Kayıt hatası:', err.message)
  }
}

// Rota çiz
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
      { headers: { 'Authorization': ORS_KEY, 'Content-Type': 'application/json' } }
    )

    return cevap.data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
  } catch (hata) {
    console.log('Rota Hatası:', hata.response ? hata.response.data : hata.message)
    return [[basEnlem, basBoylam], [bitisEnlem, bitisBoylam]]
  }
}

// İlk yükleme
async function ilkYukleme() {
  for (const k of kuryeler) {
    k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, false)
  }
  for (const k of kuryeler) {
    await KuryeModel.findOneAndUpdate(
      { kuryeId: k.id },
      { $setOnInsert: { kuryeId: k.id, isim: k.isim } },
      { upsert: true }
    )
  }
  console.log('Rotalar yüklendi, kurye profilleri hazır.')
}

// ════════════════════════════════════════════════════════════
//  REST API — İSTATİSTİK ENDPOINT'LERİ
// ════════════════════════════════════════════════════════════

// Genel özet
app.get('/api/istatistik/genel', async (_req, res) => {
  try {
    const gunBaslangic = new Date(); gunBaslangic.setHours(0,0,0,0)

    const [toplamTeslimat, bugunTeslimat, kuryeProfilleri] = await Promise.all([
      TeslimatModel.countDocuments(),
      TeslimatModel.countDocuments({ bitisZamani: { $gte: gunBaslangic } }),
      KuryeModel.find()
    ])

    const genelOrt = kuryeProfilleri.length > 0
      ? Math.round(
          kuryeProfilleri.reduce((t, k) => t + k.ortalamaSure, 0) / kuryeProfilleri.length
        )
      : 0

    res.json({
      toplamTeslimat,
      bugunTeslimat,
      aktifKurye       : kuryeler.filter(k => k.online).length,
      yoldakiSiparis   : kuryeler.filter(k => k.durum !== 'teslim edildi' && k.online).length,
      genelOrtalamaSure: genelOrt
    })
  } catch (err) { res.status(500).json({ hata: err.message }) }
})

// Tüm kuryelerin istatistiği
app.get('/api/istatistik/kuryeler', async (_req, res) => {
  try {
    const profiller = await KuryeModel.find().sort({ toplamTeslimat: -1 })
    res.json(profiller)
  } catch (err) { res.status(500).json({ hata: err.message }) }
})

// Tek kurye: profil + son 50 teslimat
app.get('/api/istatistik/kurye/:id', async (req, res) => {
  try {
    const kuryeId = Number(req.params.id)
    const [profil, gecmis] = await Promise.all([
      KuryeModel.findOne({ kuryeId }),
      TeslimatModel.find({ kuryeId }).sort({ bitisZamani: -1 }).limit(50)
    ])
    res.json({ profil, gecmis })
  } catch (err) { res.status(500).json({ hata: err.message }) }
})

// Bugünün saatlik dağılımı
app.get('/api/istatistik/gunluk', async (_req, res) => {
  try {
    const ozet = await GunlukOzet.findOne({ tarih: bugunTarih() })
    res.json(ozet || { tarih: bugunTarih(), toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
  } catch (err) { res.status(500).json({ hata: err.message }) }
})

// Belirli bir günün özeti (YYYY-MM-DD)
app.get('/api/istatistik/gunluk/:tarih', async (req, res) => {
  try {
    const ozet = await GunlukOzet.findOne({ tarih: req.params.tarih })
    res.json(ozet || { tarih: req.params.tarih, toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
  } catch (err) { res.status(500).json({ hata: err.message }) }
})

// Son 7 günün günlük teslimat sayıları
app.get('/api/istatistik/haftalik', async (_req, res) => {
  try {
    const yediGunOnce = new Date()
    yediGunOnce.setDate(yediGunOnce.getDate() - 7)
    yediGunOnce.setHours(0,0,0,0)

    const veriler = await TeslimatModel.aggregate([
      { $match: { bitisZamani: { $gte: yediGunOnce } } },
      { $group: {
          _id : { $dateToString: { format: '%Y-%m-%d', date: '$bitisZamani' } },
          sayi: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ])
    res.json(veriler)
  } catch (err) { res.status(500).json({ hata: err.message }) }
})

// Son teslimatlar listesi (?limit=20&kuryeId=1)
app.get('/api/teslimatlar', async (req, res) => {
  try {
    const limit   = Math.min(Number(req.query.limit) || 20, 200)
    const kuryeId = req.query.kuryeId ? Number(req.query.kuryeId) : null
    const filtre  = kuryeId ? { kuryeId } : {}
    const liste   = await TeslimatModel.find(filtre).sort({ bitisZamani: -1 }).limit(limit)
    res.json(liste)
  } catch (err) { res.status(500).json({ hata: err.message }) }
})

// ════════════════════════════════════════════════════════════
//  SOCKET.IO
// ════════════════════════════════════════════════════════════
io.on('connection', socket => {
  socket.emit('kuryeleriGuncelle', kuryeler)
  socket.emit('siparisFisiGuncelle', siparisFisi)

  socket.on('yeniRotaCiz', async () => {
    for (const k of kuryeler) {
      if (!k.online || k.durum === 'teslim edildi') continue
      k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, true)
      k.hedefSira = 1
      k.optimizasyonSayisi++
    }
    io.emit('kuryeleriGuncelle', kuryeler)
  })

  socket.on('tekKuryeRotaCiz', async (kuryeId) => {
    const k = kuryeler.find(k => k.id === kuryeId)
    if (k && k.online && k.durum !== 'teslim edildi') {
      k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, true)
      k.hedefSira = 1
      k.optimizasyonSayisi++
      io.emit('kuryeleriGuncelle', kuryeler)
    }
  })

  socket.on('kuryeOnlineDegistir', (kuryeId) => {
    const k = kuryeler.find(k => k.id === kuryeId)
    if (k) { k.online = !k.online; io.emit('kuryeleriGuncelle', kuryeler) }
  })

  socket.on('yeniSiparisEkle', async () => {
    const yeniId = kuryeler.length + 1
    const bEn = 41.0000 + (Math.random() * 0.08)
    const bBo = 28.9200 + (Math.random() * 0.10)
    const hEn = 41.0200 + (Math.random() * 0.08)
    const hBo = 28.9400 + (Math.random() * 0.10)
    const yeniRota = await gercekRotaCiz(bEn, bBo, hEn, hBo, false)

    await KuryeModel.findOneAndUpdate(
      { kuryeId: yeniId },
      { $setOnInsert: { kuryeId: yeniId, isim: 'Kurye ' + yeniId } },
      { upsert: true }
    )

    kuryeler.push({
      id: yeniId, isim: 'Kurye ' + yeniId,
      enlem: bEn, boylam: bBo,
      hedefEnlem: hEn, hedefBoylam: hBo,
      rota: yeniRota, hedefSira: 1,
      durum: 'yolda', hiz: 0,
      optimizasyonSayisi: 0, online: true, eta: 0,
      baslangicZamani: new Date()
    })
    io.emit('kuryeleriGuncelle', kuryeler)
  })
})

// ════════════════════════════════════════════════════════════
//  HAREKET DÖNGÜSÜ
// ════════════════════════════════════════════════════════════
setInterval(() => {
  kuryeler.forEach(k => {
    if (!k.online) return

    if (k.rota && k.hedefSira < k.rota.length) {
      const sirakiNokta = k.rota[k.hedefSira]
      const dEn  = sirakiNokta[0] - k.enlem
      const dBo  = sirakiNokta[1] - k.boylam
      const mesafe = Math.sqrt(dEn * dEn + dBo * dBo)

      if (mesafe > 0.0005) {
        k.enlem  += (dEn / mesafe) * 0.001
        k.boylam += (dBo / mesafe) * 0.001
        k.hiz     = 40 + Math.floor(Math.random() * 10)
        k.durum   = 'yolda'
      } else {
        k.hedefSira++
      }
      k.eta = etaHesapla(k)

    } else if (k.durum !== 'teslim edildi') {
      k.durum = 'teslim edildi'
      k.hiz   = 0
      k.eta   = 0

      const yeniLog = {
        id         : Date.now() + k.id,
        kuryeIsim  : k.isim,
        zaman      : new Date().toLocaleTimeString('tr-TR'),
        hedefEnlem : k.hedefEnlem,
        hedefBoylam: k.hedefBoylam
      }
      siparisFisi.unshift(yeniLog)
      if (siparisFisi.length > 100) siparisFisi.pop()

      teslimatKaydet(k)  // async — ana döngüyü bloklamaz

      io.emit('teslimatBildirimi', { isim: k.isim, zaman: yeniLog.zaman })
      io.emit('siparisFisiGuncelle', siparisFisi)
    }
  })

  io.emit('kuryeleriGuncelle', kuryeler)
}, 1500)

// ════════════════════════════════════════════════════════════
//  BAŞLAT
// ════════════════════════════════════════════════════════════
async function baslat() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB bağlantısı kuruldu.')
    await ilkYukleme()
    server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor.`))
  } catch (err) {
    console.error('Başlatma hatası:', err.message)
    process.exit(1)
  }
}

baslat()

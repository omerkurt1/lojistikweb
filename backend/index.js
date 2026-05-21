// backend/server.js  — LOOP Lojistik Backend (Final)
// npm install express socket.io cors axios mongoose dotenv bcryptjs jsonwebtoken stripe
require('dotenv').config()

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const axios = require('axios')
const mongoose = require('mongoose')

// ─── Yeni route'lar ──────────────────────────────────────
const authRoutes = require('./routes/auth')
const odemeRoutes = require('./routes/odeme')

const app = express()
app.use(cors())
app.use(express.json())

// ─── Route'ları bağla ────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/odeme', odemeRoutes)

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const ORS_KEY = process.env.ORS_API_KEY
const MONGO_URI = process.env.MONGO_URI
const PORT = process.env.PORT || 5000
const FIXED_COURIER_COUNT = 5

// ════════════════════════════════════════════════════════════
//  MONGOOSE MODELLERİ
// ════════════════════════════════════════════════════════════
const KuryeSchema = new mongoose.Schema({
  kuryeId: { type: Number, required: true, unique: true },
  isim: { type: String, required: true },
  toplamTeslimat: { type: Number, default: 0 },
  toplamSure: { type: Number, default: 0 },
  ortalamaSure: { type: Number, default: 0 },
  optimizasyonSayisi: { type: Number, default: 0 },
  sonGuncelleme: { type: Date, default: Date.now }
}, { collection: 'kuryeler' })

const TeslimatSchema = new mongoose.Schema({
  kuryeId: { type: Number, required: true, index: true },
  kuryeIsim: { type: String, required: true },
  baslangicEnlem: Number, baslangicBoylam: Number,
  hedefEnlem: Number, hedefBoylam: Number,
  baslangicZamani: { type: Date, required: true },
  bitisZamani: { type: Date, default: Date.now },
  sureDakika: { type: Number, default: 0 },
  rotaOptimize: { type: Boolean, default: false }
}, { collection: 'teslimatlar' })

const GunlukOzetSchema = new mongoose.Schema({
  tarih: { type: String, required: true, unique: true },
  toplamTeslimat: { type: Number, default: 0 },
  saatlikDagilim: { type: [Number], default: () => Array(24).fill(0) },
  enCokTeslimatKurye: { type: String, default: '' },
  guncellemeZamani: { type: Date, default: Date.now }
}, { collection: 'gunluk_ozet' })

const KonumSchema = new mongoose.Schema({
  kuryeId: { type: Number, required: true, index: true },
  kuryeIsim: String, enlem: Number, boylam: Number, hiz: Number,
  zaman: { type: Date, default: Date.now }
}, { collection: 'konum_gecmis' })
KonumSchema.index({ kuryeId: 1, zaman: -1 })

const KuryeModel = mongoose.model('Kurye', KuryeSchema)
const TeslimatModel = mongoose.model('Teslimat', TeslimatSchema)
const GunlukOzet = mongoose.model('GunlukOzet', GunlukOzetSchema)
const KonumModel = mongoose.model('Konum', KonumSchema)

let dbBagli = false

// ════════════════════════════════════════════════════════════
//  BELLEK İÇİ DURUM
// ════════════════════════════════════════════════════════════
let siparisFisi = []

// ════════════════════════════════════════════════════════════
//  GLOBAL LOGISTICS HUBS — Real land-based coordinates
//  These are the only permitted spawn/destination points.
//  No courier can ever appear in the sea.
// ════════════════════════════════════════════════════════════
const GLOBAL_HUBS = [
  { id: 'IST', isim: 'İstanbul Hub',        enlem: 41.0082, boylam: 28.9784 },
  { id: 'FRA', isim: 'Frankfurt Gateway',   enlem: 50.1109, boylam:  8.6821 },
  { id: 'LON', isim: 'London Heathrow',     enlem: 51.4700, boylam: -0.4543 },
  { id: 'ANK', isim: 'Ankara Logistics',    enlem: 39.9208, boylam: 32.8541 },
  { id: 'MUC', isim: 'Munich FreightPort',  enlem: 48.1351, boylam: 11.5820 },
  { id: 'WAW', isim: 'Warsaw Transit',      enlem: 52.2297, boylam: 21.0122 },
  { id: 'BUC', isim: 'Bucharest Depot',     enlem: 44.4268, boylam: 26.1025 },
  { id: 'ATH', isim: 'Athens Port',         enlem: 37.9838, boylam: 23.7275 },
  { id: 'SOF', isim: 'Sofia Cross-dock',    enlem: 42.6977, boylam: 23.3219 },
  { id: 'BEL', isim: 'Belgrade TIR Hub',    enlem: 44.8176, boylam: 20.4569 },
  { id: 'BUD', isim: 'Budapest Freight',    enlem: 47.4979, boylam: 19.0402 },
  { id: 'VIE', isim: 'Vienna Gateway',      enlem: 48.2082, boylam: 16.3738 },
]

const CARGO_TYPES = [
  'Air Freight FCL',
  'Cross-border LTL',
  'Maritime Container TEU',
  'Road Freight FTL',
  'Intermodal TIR',
  'Pharma Cold Chain',
  'Bonded Warehouse Transfer',
  'Express B2B Parcel',
]

const COURIER_NAMES = [
  'Ahmet Çelik', 'Mehmet Demir', 'Ayşe Kaya', 'Fatma Şahin',
  'Ali Yıldız',  'Hasan Arslan', 'Elif Güneş', 'Okan Doğan',
]
let demoAtamaSayaci = 0

// Pick two different hubs at random — guarantees land-to-land only
function rastgeleHubCifti() {
  let a = Math.floor(Math.random() * GLOBAL_HUBS.length)
  let b
  do { b = Math.floor(Math.random() * GLOBAL_HUBS.length) } while (b === a)
  return [GLOBAL_HUBS[a], GLOBAL_HUBS[b]]
}

// Create a small jitter (max ±0.03°, ~3km) so couriers don't stack on hub centre
function hubJitter(hub) {
  return {
    enlem: hub.enlem + (Math.random() - 0.5) * 0.06,
    boylam: hub.boylam + (Math.random() - 0.5) * 0.06,
  }
}

const BASLANGIC_KURYELER = Array.from({ length: FIXED_COURIER_COUNT }, (_x, i) => {
  const [basHub, hedefHub] = rastgeleHubCifti()
  const bas = hubJitter(basHub)
  const hedef = hubJitter(hedefHub)
  return {
    id: i + 1,
    isim: `${COURIER_NAMES[i % COURIER_NAMES.length]} #${i + 1}`,
    enlem: bas.enlem,
    boylam: bas.boylam,
    hedefEnlem: hedef.enlem,
    hedefBoylam: hedef.boylam,
  }
})

let kuryeler = BASLANGIC_KURYELER.map((k, i) => ({
  ...k, rota: [], hedefSira: 1,
  durum: 'yolda', hiz: 0, optimizasyonSayisi: 0,
  online: true, eta: 0, baslangicZamani: new Date(),
  kargoTuru: CARGO_TYPES[i % CARGO_TYPES.length],
}))

// ════════════════════════════════════════════════════════════
//  YARDIMCI
// ════════════════════════════════════════════════════════════
function etaHesapla(k) {
  if (!k.rota || k.hedefSira >= k.rota.length) return 0
  return Math.max(1, Math.ceil(((k.rota.length - k.hedefSira) * 1.5) / 60))
}
function bugunTarih() { return new Date().toISOString().split('T')[0] }

function basitRotaOlustur(basEn, basBo, bitEn, bitBo, adim = 22) {
  const rota = []
  for (let i = 0; i <= adim; i++) {
    const t = i / adim
    const en = basEn + (bitEn - basEn) * t
    const bo = basBo + (bitBo - basBo) * t
    rota.push([en, bo])
  }
  return rota
}

async function gercekRotaCiz(basEnlem, basBoylam, bitisEnlem, bitisBoylam, opt) {
  try {
    let duraklar = [[basBoylam, basEnlem], [bitisBoylam, bitisEnlem]]
    if (opt) {
      const araEn = (basEnlem + bitisEnlem) / 2 + (Math.random() - 0.5) * 0.01
      const araBo = (basBoylam + bitisBoylam) / 2 + (Math.random() - 0.5) * 0.01
      duraklar.splice(1, 0, [araBo, araEn])
    }
    const c = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      { coordinates: duraklar },
      { headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' } }
    )
    return c.data.features[0].geometry.coordinates.map(x => [x[1], x[0]])
  } catch (e) {
    return [[basEnlem, basBoylam], [bitisEnlem, bitisBoylam]]
  }
}

async function kuryeYeniGoreveHazirla(kurye) {
  // Demo gününde kurye kümelenmesini azaltmak için atamayı dağıtarak yap.
  const startIndex = (kurye.id + demoAtamaSayaci) % GLOBAL_HUBS.length
  const endIndex = (startIndex + 3 + (demoAtamaSayaci % (GLOBAL_HUBS.length - 1))) % GLOBAL_HUBS.length
  const basHub = GLOBAL_HUBS[startIndex]
  const hedefHub = GLOBAL_HUBS[endIndex === startIndex ? (endIndex + 1) % GLOBAL_HUBS.length : endIndex]
  demoAtamaSayaci++
  const bas = hubJitter(basHub)
  const hedef = hubJitter(hedefHub)
  kurye.enlem = bas.enlem
  kurye.boylam = bas.boylam
  kurye.hedefEnlem = hedef.enlem
  kurye.hedefBoylam = hedef.boylam
  // Teslim sonrası yeni göreve geçişte dış API beklemeden anında rota üret.
  kurye.rota = basitRotaOlustur(bas.enlem, bas.boylam, hedef.enlem, hedef.boylam)
  kurye.hedefSira = 1
  kurye.durum = 'yolda'
  kurye.hiz = 0
  kurye.eta = etaHesapla(kurye)
  kurye.online = true
  kurye.baslangicZamani = new Date()
  kurye.kargoTuru = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)]
  kurye.originHub = basHub.isim
  kurye.destHub = hedefHub.isim
}

async function teslimatKaydet(kurye) {
  if (!dbBagli) return
  const simdi = new Date()
  const sureDakika = Math.round((simdi - new Date(kurye.baslangicZamani)) / 60000)
  try {
    await TeslimatModel.create({
      kuryeId: kurye.id, kuryeIsim: kurye.isim,
      baslangicEnlem: kurye.enlem, baslangicBoylam: kurye.boylam,
      hedefEnlem: kurye.hedefEnlem, hedefBoylam: kurye.hedefBoylam,
      baslangicZamani: kurye.baslangicZamani, bitisZamani: simdi,
      sureDakika, rotaOptimize: kurye.optimizasyonSayisi > 0
    })
    const doc = await KuryeModel.findOneAndUpdate(
      { kuryeId: kurye.id },
      { $set: { isim: kurye.isim, sonGuncelleme: simdi }, $inc: { toplamTeslimat: 1, toplamSure: sureDakika } },
      { upsert: true, returnDocument: 'after' }
    )
    if (doc) { doc.ortalamaSure = Math.round(doc.toplamSure / doc.toplamTeslimat); await doc.save() }
    const saat = simdi.getHours()
    await GunlukOzet.findOneAndUpdate(
      { tarih: bugunTarih() },
      { $inc: { toplamTeslimat: 1, [`saatlikDagilim.${saat}`]: 1 }, $set: { guncellemeZamani: simdi } },
      { upsert: true }
    )
    const gunBas = new Date(); gunBas.setHours(0, 0, 0, 0)
    const lider = await TeslimatModel.aggregate([
      { $match: { bitisZamani: { $gte: gunBas } } },
      { $group: { _id: '$kuryeIsim', sayi: { $sum: 1 } } },
      { $sort: { sayi: -1 } }, { $limit: 1 }
    ])
    if (lider[0]) await GunlukOzet.updateOne({ tarih: bugunTarih() }, { $set: { enCokTeslimatKurye: lider[0]._id } })
  } catch (err) { console.error('[DB]', err.message) }
}

// ════════════════════════════════════════════════════════════
//  REST API
// ════════════════════════════════════════════════════════════
app.get('/api/istatistik/genel', async (_req, res) => {
  try {
    if (!dbBagli) return res.json({ toplamTeslimat: 0, bugunTeslimat: 0, aktifKurye: kuryeler.filter(k => k.online).length, yoldakiSiparis: kuryeler.filter(k => k.durum !== 'teslim edildi' && k.online).length, genelOrtalamaSure: 0, dbDurumu: 'bağlı değil' })
    const gunBas = new Date(); gunBas.setHours(0, 0, 0, 0)
    const [toplam, bugun, profiller] = await Promise.all([
      TeslimatModel.countDocuments(),
      TeslimatModel.countDocuments({ bitisZamani: { $gte: gunBas } }),
      KuryeModel.find()
    ])
    const genelOrt = profiller.length > 0 ? Math.round(profiller.reduce((t, k) => t + k.ortalamaSure, 0) / profiller.length) : 0
    res.json({ toplamTeslimat: toplam, bugunTeslimat: bugun, aktifKurye: kuryeler.filter(k => k.online).length, yoldakiSiparis: kuryeler.filter(k => k.durum !== 'teslim edildi' && k.online).length, genelOrtalamaSure: genelOrt, dbDurumu: 'bağlı' })
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

app.get('/api/istatistik/kuryeler', async (_req, res) => {
  try {
    if (!dbBagli) return res.json([])
    res.json(await KuryeModel.find().sort({ toplamTeslimat: -1 }))
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

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

app.get('/api/istatistik/gunluk', async (_req, res) => {
  try {
    if (!dbBagli) return res.json({ tarih: bugunTarih(), toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
    res.json(await GunlukOzet.findOne({ tarih: bugunTarih() }) || { tarih: bugunTarih(), toplamTeslimat: 0, saatlikDagilim: Array(24).fill(0) })
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

app.get('/api/istatistik/haftalik', async (_req, res) => {
  try {
    if (!dbBagli) return res.json([])
    const y = new Date(); y.setDate(y.getDate() - 7); y.setHours(0, 0, 0, 0)
    res.json(await TeslimatModel.aggregate([
      { $match: { bitisZamani: { $gte: y } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$bitisZamani' } }, sayi: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]))
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

app.get('/api/teslimatlar', async (req, res) => {
  try {
    if (!dbBagli) return res.json([])
    const limit = Math.min(Number(req.query.limit) || 20, 200)
    const kuryeId = req.query.kuryeId ? Number(req.query.kuryeId) : null
    res.json(await TeslimatModel.find(kuryeId ? { kuryeId } : {}).sort({ bitisZamani: -1 }).limit(limit))
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// ── Müşteri takip için canlı kurye konumu ──────────────
app.get('/api/kurye/:id/konum', (req, res) => {
  const k = kuryeler.find(k => k.id === parseInt(req.params.id))
  if (!k) return res.status(404).json({ hata: 'Kurye bulunamadı.' })
  res.json({ id: k.id, isim: k.isim, enlem: k.enlem, boylam: k.boylam, durum: k.durum, hiz: k.hiz, eta: k.eta })
})

// ── Müşteri sipariş takip (LOOP-{id} formatı) ─────────
app.get('/api/takip/:trackingId', (req, res) => {
  try {
    // LOOP-3, LOOP-12 veya sadece 3, 12 formatını parse et
    const raw = req.params.trackingId.toUpperCase().replace('LOOP-', '').trim()
    const kuryeId = parseInt(raw, 10)

    if (isNaN(kuryeId) || kuryeId <= 0) {
      return res.status(400).json({ hata: 'Geçersiz takip numarası formatı. Örnek: LOOP-1 veya 1' })
    }

    const k = kuryeler.find(k => k.id === kuryeId)
    if (!k) {
      return res.status(404).json({ hata: `LOOP-${kuryeId} numaralı sipariş bulunamadı. Lütfen takip numaranızı kontrol edin.` })
    }

    // Müşteriye kurye verisi döndür (rota dahil — haritada çizilecek)
    res.json({
      id: k.id,
      isim: k.isim,
      enlem: k.enlem,
      boylam: k.boylam,
      hedefEnlem: k.hedefEnlem,
      hedefBoylam: k.hedefBoylam,
      durum: k.durum,
      hiz: k.hiz,
      eta: k.eta,
      rota: k.rota || [],
      online: k.online
    })
  } catch (err) {
    res.status(500).json({ hata: 'Sunucu hatası. Lütfen tekrar deneyin.' })
  }
})

app.get('/api/saglik', (_req, res) => {
  res.json({ durum: 'çalışıyor', db: dbBagli ? 'bağlı' : 'bağlı değil', zaman: new Date() })
})

// ════════════════════════════════════════════════════════════
//  SOCKET.IO
// ════════════════════════════════════════════════════════════
io.on('connection', socket => {
  socket.emit('kuryeleriGuncelle', kuryeler)
  socket.emit('siparisFisiGuncelle', siparisFisi)

  // Müşteri belirli bir kuryeyi takip etmek için odaya girer
  socket.on('kuryeyiTakipEt', (kuryeId) => {
    socket.join(`kurye_${kuryeId}`)
    const k = kuryeler.find(k => k.id === kuryeId)
    if (k) socket.emit('tekKuryeGuncelle', k)
  })

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
    socket.emit('hata', `Demo modunda kurye sayısı sabit ${FIXED_COURIER_COUNT}. Yeni kurye ekleme kapalıdır.`)
  })
})

// ════════════════════════════════════════════════════════════
//  HAREKET DÖNGÜSÜ
// ════════════════════════════════════════════════════════════
let donguSayac = 0

setInterval(async () => {
  donguSayac++
  for (const k of kuryeler) {
    if (!k.online) continue
    if (k.rota && k.hedefSira < k.rota.length) {
      const [hEn, hBo] = k.rota[k.hedefSira]
      const dEn = hEn - k.enlem, dBo = hBo - k.boylam
      const uzak = Math.sqrt(dEn * dEn + dBo * dBo)
      if (uzak > 0.0005) {
        k.enlem += (dEn / uzak) * 0.001
        k.boylam += (dBo / uzak) * 0.001
        k.hiz = 40 + Math.floor(Math.random() * 10)
        k.durum = 'yolda'
      } else { k.hedefSira++ }
      k.eta = etaHesapla(k)
      // Demo günü için depolama büyümesini engellemek adına konum geçmişi DB'ye yazılmıyor.
      // Müşteri takip odasına push et
      io.to(`kurye_${k.id}`).emit('tekKuryeGuncelle', k)
    } else if (k.durum !== 'teslim edildi') {
      k.durum = 'teslim edildi'; k.hiz = 0; k.eta = 0
      // Demo günü için DB büyümesini minimumda tutmak adına teslimat geçmişi DB'ye yazılmıyor.
      const log = { id: Date.now() + k.id, kuryeIsim: k.isim, zaman: new Date().toLocaleTimeString('tr-TR'), hedefEnlem: k.hedefEnlem, hedefBoylam: k.hedefBoylam }
      siparisFisi.unshift(log)
      if (siparisFisi.length > 100) siparisFisi.pop()
      io.emit('teslimatBildirimi', { isim: k.isim, zaman: log.zaman })
      io.emit('siparisFisiGuncelle', siparisFisi)
      io.to(`kurye_${k.id}`).emit('tekKuryeGuncelle', k)
      try {
        await kuryeYeniGoreveHazirla(k)
        io.to(`kurye_${k.id}`).emit('tekKuryeGuncelle', k)
      } catch (err) {
        console.error('[DEMO_RECYCLE]', err.message)
      }
    }
  }
  io.emit('kuryeleriGuncelle', kuryeler)
}, 1500)

// ════════════════════════════════════════════════════════════
//  OTOMATİK SİPARİŞ SİSTEMİ
//  Demo modu: 30sn'de yeni kurye üretimi KALDIRILDI.
//  Sistem sabit 5 kurye ile çalışır; teslim sonrası aynı kurye yeni rotaya atanır.
// ════════════════════════════════════════════════════════════
console.log(`🧪 Demo modu aktif: sabit ${FIXED_COURIER_COUNT} kurye, teslim sonrası otomatik yeniden rota.`)

// ════════════════════════════════════════════════════════════
//  BAŞLAT — Bulletproof Production Startup
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
      ).catch(() => { })
    }
  }
  console.log('✅ Rotalar yüklendi.')
}

async function adminSeed() {
  // Eğer patron@loop.com yoksa otomatik oluştur
  const User = require('./models/User')
  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'patron@loop.com'
  const ADMIN_SIFRE    = process.env.ADMIN_SIFRE    || 'Loop2026!'
  const ADMIN_ISIM     = 'Admin'
  try {
    const mevcut = await User.findOne({ email: ADMIN_EMAIL })
    if (!mevcut) {
      await User.create({ isim: ADMIN_ISIM, email: ADMIN_EMAIL, sifre: ADMIN_SIFRE })
      console.log(`✅ Admin hesabı oluşturuldu → ${ADMIN_EMAIL} / ${ADMIN_SIFRE}`)
    } else {
      console.log(`ℹ️  Admin hesabı zaten mevcut → ${ADMIN_EMAIL}`)
    }
  } catch (err) {
    console.error('❌ Admin seed hatası:', err.message)
  }
}

async function sunucuBaslat() {
  // ── 1. Render'ın PORT'una her zaman bağlan — DB'den ÖNCE ──
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`)
  })

  // ── 2. MongoDB bağlantısını dene — başarısız olsa da uygulama çalışmaya devam eder ──
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI ortam değişkeni tanımlı değil! Render "Environment" sekmesine ekleyin.')
    }
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    dbBagli = true
    console.log('✅ MongoDB Atlas bağlantısı başarılı.')
  } catch (err) {
    dbBagli = false
    console.error('❌ MongoDB bağlantı hatası:', err.message)
    console.warn('⚠️  Uygulama DB olmadan çalışmaya devam ediyor. Yalnızca bellek içi veri kullanılacak.')
  }

  // ── 3. Admin hesabını seed et (patron@loop.com yoksa yarat) ──
  if (dbBagli) await adminSeed()

  // ── 4. Başlangıç rotalarını yükle (DB'ye bağlı olsun ya da olmasın) ──
  await ilkYukleme()
}

sunucuBaslat().catch(err => {
  console.error('💀 Kritik başlatma hatası:', err.message)
  process.exit(1)
})

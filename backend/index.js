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

const BASLANGIC_KURYELER = [
  { id: 1, isim: 'Ahmet', enlem: 41.0660, boylam: 28.9900, hedefEnlem: 41.0422, hedefBoylam: 29.0060 },
  { id: 2, isim: 'Mehmet', enlem: 40.9900, boylam: 29.0250, hedefEnlem: 40.9540, hedefBoylam: 29.0950 },
  { id: 3, isim: 'Ayse', enlem: 40.9780, boylam: 28.8720, hedefEnlem: 40.9930, hedefBoylam: 28.9200 },
]

let kuryeler = BASLANGIC_KURYELER.map(k => ({
  ...k, rota: [], hedefSira: 1,
  durum: 'yolda', hiz: 0, optimizasyonSayisi: 0,
  online: true, eta: 0, baslangicZamani: new Date()
}))

// ════════════════════════════════════════════════════════════
//  YARDIMCI
// ════════════════════════════════════════════════════════════
function etaHesapla(k) {
  if (!k.rota || k.hedefSira >= k.rota.length) return 0
  return Math.max(1, Math.ceil(((k.rota.length - k.hedefSira) * 1.5) / 60))
}
function bugunTarih() { return new Date().toISOString().split('T')[0] }

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
      { upsert: true, new: true }
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
    const yeniId = kuryeler.length + 1
    const bEn = 41.0000 + Math.random() * 0.08, bBo = 28.9200 + Math.random() * 0.10
    const hEn = 41.0200 + Math.random() * 0.08, hBo = 28.9400 + Math.random() * 0.10
    const rota = await gercekRotaCiz(bEn, bBo, hEn, hBo, false)
    const yeniKurye = { id: yeniId, isim: 'Kurye ' + yeniId, enlem: bEn, boylam: bBo, hedefEnlem: hEn, hedefBoylam: hBo, rota, hedefSira: 1, durum: 'yolda', hiz: 0, optimizasyonSayisi: 0, online: true, eta: 0, baslangicZamani: new Date() }
    if (dbBagli) await KuryeModel.findOneAndUpdate({ kuryeId: yeniId }, { $setOnInsert: { kuryeId: yeniId, isim: yeniKurye.isim } }, { upsert: true }).catch(() => { })
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
        k.enlem += (dEn / uzak) * 0.001
        k.boylam += (dBo / uzak) * 0.001
        k.hiz = 40 + Math.floor(Math.random() * 10)
        k.durum = 'yolda'
      } else { k.hedefSira++ }
      k.eta = etaHesapla(k)
      if (dbBagli && donguSayac % 10 === 0) {
        KonumModel.create({ kuryeId: k.id, kuryeIsim: k.isim, enlem: parseFloat(k.enlem.toFixed(5)), boylam: parseFloat(k.boylam.toFixed(5)), hiz: k.hiz }).catch(() => { })
      }
      // Müşteri takip odasına push et
      io.to(`kurye_${k.id}`).emit('tekKuryeGuncelle', k)
    } else if (k.durum !== 'teslim edildi') {
      k.durum = 'teslim edildi'; k.hiz = 0; k.eta = 0
      teslimatKaydet(k)
      const log = { id: Date.now() + k.id, kuryeIsim: k.isim, zaman: new Date().toLocaleTimeString('tr-TR'), hedefEnlem: k.hedefEnlem, hedefBoylam: k.hedefBoylam }
      siparisFisi.unshift(log)
      if (siparisFisi.length > 100) siparisFisi.pop()
      io.emit('teslimatBildirimi', { isim: k.isim, zaman: log.zaman })
      io.emit('siparisFisiGuncelle', siparisFisi)
      io.to(`kurye_${k.id}`).emit('tekKuryeGuncelle', k)
    }
  })
  io.emit('kuryeleriGuncelle', kuryeler)
}, 1500)

// ════════════════════════════════════════════════════════════
//  OTOMATİK SİPARİŞ SİSTEMİ — Her 30sn'de 1 yeni kurye
// ════════════════════════════════════════════════════════════
setInterval(async () => {
  const yeniId = kuryeler.length + 1
  const bEn = 41.0000 + Math.random() * 0.08
  const bBo = 28.9200 + Math.random() * 0.10
  const hEn = 41.0200 + Math.random() * 0.08
  const hBo = 28.9400 + Math.random() * 0.10
  const rota = await gercekRotaCiz(bEn, bBo, hEn, hBo, false)
  const yeniKurye = {
    id: yeniId,
    isim: 'Kurye ' + yeniId,
    enlem: bEn, boylam: bBo,
    hedefEnlem: hEn, hedefBoylam: hBo,
    rota, hedefSira: 1,
    durum: 'yolda', hiz: 0,
    optimizasyonSayisi: 0, online: true,
    eta: 0, baslangicZamani: new Date()
  }
  if (dbBagli) {
    await KuryeModel.findOneAndUpdate(
      { kuryeId: yeniId },
      { $setOnInsert: { kuryeId: yeniId, isim: yeniKurye.isim } },
      { upsert: true }
    ).catch(() => { })
  }
  kuryeler.push(yeniKurye)
  io.emit('kuryeleriGuncelle', kuryeler)
  console.log(`📦 Otomatik sipariş eklendi: ${yeniKurye.isim}`)
}, 30000)

// ════════════════════════════════════════════════════════════
//  BAŞLAT
// ════════════════════════════════════════════════════════════
async function ilkYukleme() {
  for (const k of kuryeler) k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, false)
  if (dbBagli) {
    for (const k of kuryeler) await KuryeModel.findOneAndUpdate({ kuryeId: k.id }, { $setOnInsert: { kuryeId: k.id, isim: k.isim } }, { upsert: true }).catch(() => { })
  }
  console.log('✅ Rotalar yüklendi.')
}

mongoose.connect(MONGO_URI)
  .then(() => { dbBagli = true; console.log('✅ MongoDB bağlandı.'); server.listen(PORT, () => console.log(`🚀 Sunucu :${PORT}`)); ilkYukleme() })
  .catch(err => { console.error('❌ MongoDB:', err.message); console.log('⚠️  DB olmadan devam...'); server.listen(PORT, () => console.log(`🚀 Sunucu :${PORT} (DB yok)`)); ilkYukleme() })

const PORT = process.env.PORT || 5000;

// Eğer sendeki kod server.listen ise 'app' yerine 'server' yazmayı unutma!
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sunucu ${PORT} portunda aslanlar gibi çalışıyor!`);
});
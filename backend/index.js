require('dotenv').config()
const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const cors       = require('cors')
const axios      = require('axios')
const mongoose   = require('mongoose')

// ─────────────────────────────────────────────────────────────
//  PRODUCTION'DA BUNLARI .env DOSYASINA TAŞI
//  require('dotenv').config()
// ─────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<KULLANICI>:<SIFRE>@cluster0.mongodb.net/kuryetakip?retryWrites=true&w=majority'
const API_KEY   = process.env.ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUwMDBkZDk2NTNiZjRiZjdiNGVkOTFkNThmZWYxMTY5IiwiaCI6Im11cm11cjY0In0='
const PORT      = process.env.PORT || 5000

// ═══════════════════════════════════════════════════════════════
//  MONGOOSE MODELLERİ
// ═══════════════════════════════════════════════════════════════

// ── Sipariş ──────────────────────────────────────────────────
const SiparisSchema = new mongoose.Schema({
  kuryeIsim:        { type: String, required: true },
  baslangicEnlem:   Number,
  baslangicBoylam:  Number,
  hedefEnlem:       Number,
  hedefBoylam:      Number,
  durum:            { type: String, enum: ['yolda', 'paketi aldi', 'teslim edildi'], default: 'yolda' },
  olusturmaTarihi:  { type: Date, default: Date.now },
  teslimTarihi:     Date,
  teslimSuresiDk:   Number
})
const SiparisModel = mongoose.model('Siparis', SiparisSchema)

// ── Konum geçmişi ─────────────────────────────────────────────
const KonumSchema = new mongoose.Schema({
  kuryeId:   { type: Number, required: true },
  kuryeIsim: String,
  enlem:     Number,
  boylam:    Number,
  hiz:       Number,
  zaman:     { type: Date, default: Date.now }
})
KonumSchema.index({ kuryeId: 1, zaman: -1 })
const KonumModel = mongoose.model('Konum', KonumSchema)

// ═══════════════════════════════════════════════════════════════
//  EXPRESS + SOCKET.IO
// ═══════════════════════════════════════════════════════════════
const app    = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io     = new Server(server, { cors: { origin: '*' } })

// ═══════════════════════════════════════════════════════════════
//  BELLEK İÇİ DURUM
// ═══════════════════════════════════════════════════════════════
let siparisFisi = []

let kuryeler = [
  { id: 1, isim: 'Ahmet',  enlem: 41.0660, boylam: 28.9900, hedefEnlem: 41.0422, hedefBoylam: 29.0060, rota: [], hedefSira: 1, durum: 'paketi aldi', hiz: 0, optimizasyonSayisi: 0, online: true, eta: 0, _siparisId: null, _baslangic: null },
  { id: 2, isim: 'Mehmet', enlem: 40.9900, boylam: 29.0250, hedefEnlem: 40.9540, hedefBoylam: 29.0950, rota: [], hedefSira: 1, durum: 'yolda',       hiz: 0, optimizasyonSayisi: 0, online: true, eta: 0, _siparisId: null, _baslangic: null },
  { id: 3, isim: 'Ayse',   enlem: 40.9780, boylam: 28.8720, hedefEnlem: 40.9930, hedefBoylam: 28.9200, rota: [], hedefSira: 1, durum: 'yolda',       hiz: 0, optimizasyonSayisi: 0, online: true, eta: 0, _siparisId: null, _baslangic: null }
]

// ═══════════════════════════════════════════════════════════════
//  YARDIMCI
// ═══════════════════════════════════════════════════════════════
function etaHesapla(k) {
  if (!k.rota || k.hedefSira >= k.rota.length) return 0
  return Math.max(1, Math.ceil(((k.rota.length - k.hedefSira) * 1.5) / 60))
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
      { headers: { Authorization: API_KEY, 'Content-Type': 'application/json' } }
    )
    return cevap.data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
  } catch (e) {
    console.error('Rota Hatası:', e.response?.data ?? e.message)
    return [[basEnlem, basBoylam], [bitisEnlem, bitisBoylam]]
  }
}

async function siparisAc(k) {
  try {
    const doc = await SiparisModel.create({
      kuryeIsim:       k.isim,
      baslangicEnlem:  k.enlem,
      baslangicBoylam: k.boylam,
      hedefEnlem:      k.hedefEnlem,
      hedefBoylam:     k.hedefBoylam,
      durum:           k.durum
    })
    k._siparisId = doc._id
    k._baslangic = new Date()
  } catch (e) { console.error('siparisAc:', e.message) }
}

async function siparisTeslimEt(k) {
  if (!k._siparisId) return
  try {
    const teslimTarihi = new Date()
    const sure = k._baslangic
      ? Math.round((teslimTarihi - k._baslangic) / 60000)
      : null
    await SiparisModel.findByIdAndUpdate(k._siparisId, {
      durum: 'teslim edildi',
      teslimTarihi,
      teslimSuresiDk: sure
    })
  } catch (e) { console.error('siparisTeslimEt:', e.message) }
}

// ═══════════════════════════════════════════════════════════════
//  REST API — İSTATİSTİKLER
// ═══════════════════════════════════════════════════════════════

// Genel özet
app.get('/api/istatistik', async (_req, res) => {
  try {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
    const [toplamSiparis, toplamTeslim, bugunTeslim, ortSure] = await Promise.all([
      SiparisModel.countDocuments(),
      SiparisModel.countDocuments({ durum: 'teslim edildi' }),
      SiparisModel.countDocuments({ durum: 'teslim edildi', teslimTarihi: { $gte: bugun } }),
      SiparisModel.aggregate([
        { $match: { durum: 'teslim edildi', teslimSuresiDk: { $ne: null } } },
        { $group: { _id: null, ort: { $avg: '$teslimSuresiDk' } } }
      ])
    ])
    res.json({
      toplamSiparis,
      toplamTeslim,
      bugunTeslim,
      ortTeslimSuresiDk: ortSure[0] ? Math.round(ortSure[0].ort) : null,
      aktifKurye:   kuryeler.filter(k => k.online).length,
      offlineKurye: kuryeler.filter(k => !k.online).length
    })
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// Son N günün günlük dağılımı
app.get('/api/istatistik/gunluk', async (req, res) => {
  try {
    const gun = Math.min(parseInt(req.query.gun) || 7, 90)
    const bas = new Date(); bas.setDate(bas.getDate() - gun); bas.setHours(0, 0, 0, 0)
    const sonuc = await SiparisModel.aggregate([
      { $match: { durum: 'teslim edildi', teslimTarihi: { $gte: bas } } },
      { $group: {
          _id: { gun: { $dayOfMonth: '$teslimTarihi' }, ay: { $month: '$teslimTarihi' }, yil: { $year: '$teslimTarihi' } },
          sayi: { $sum: 1 },
          ortSure: { $avg: '$teslimSuresiDk' }
      }},
      { $sort: { '_id.yil': 1, '_id.ay': 1, '_id.gun': 1 } }
    ])
    res.json(sonuc.map(r => ({
      tarih: `${r._id.gun}/${r._id.ay}/${r._id.yil}`,
      sayi: r.sayi,
      ortSure: r.ortSure ? Math.round(r.ortSure) : null
    })))
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// Kurye bazlı performans
app.get('/api/istatistik/kurye', async (_req, res) => {
  try {
    const sonuc = await SiparisModel.aggregate([
      { $group: {
          _id:    '$kuryeIsim',
          toplam: { $sum: 1 },
          teslim: { $sum: { $cond: [{ $eq: ['$durum', 'teslim edildi'] }, 1, 0] } },
          ortSure: { $avg: { $cond: [{ $gt: ['$teslimSuresiDk', null] }, '$teslimSuresiDk', null] } }
      }},
      { $sort: { teslim: -1 } }
    ])
    res.json(sonuc.map(r => ({
      isim:       r._id,
      toplam:     r.toplam,
      teslim:     r.teslim,
      basariOrani: r.toplam > 0 ? Math.round((r.teslim / r.toplam) * 100) : 0,
      ortSure:    r.ortSure ? Math.round(r.ortSure) : null
    })))
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// Bugün saat bazlı yoğunluk
app.get('/api/istatistik/saatlik', async (_req, res) => {
  try {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
    const sonuc = await SiparisModel.aggregate([
      { $match: { durum: 'teslim edildi', teslimTarihi: { $gte: bugun } } },
      { $group: { _id: { $hour: '$teslimTarihi' }, sayi: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    res.json(
      Array.from({ length: 24 }, (_, i) => {
        const b = sonuc.find(r => r._id === i)
        return { saat: `${String(i).padStart(2, '0')}:00`, sayi: b?.sayi ?? 0 }
      })
    )
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// Son siparişler
app.get('/api/siparis', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100)
    const filtre = req.query.durum ? { durum: req.query.durum } : {}
    const liste  = await SiparisModel.find(filtre).sort({ olusturmaTarihi: -1 }).limit(limit)
    res.json(liste)
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// Kurye konum geçmişi
app.get('/api/konum/:kuryeId', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const liste = await KonumModel
      .find({ kuryeId: parseInt(req.params.kuryeId) })
      .sort({ zaman: -1 })
      .limit(limit)
    res.json(liste.reverse())
  } catch (e) { res.status(500).json({ hata: e.message }) }
})

// ═══════════════════════════════════════════════════════════════
//  SOCKET.IO
// ═══════════════════════════════════════════════════════════════
io.on('connection', socket => {
  socket.emit('kuryeleriGuncelle',   kuryeler)
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

  socket.on('tekKuryeRotaCiz', async kuryeId => {
    const k = kuryeler.find(k => k.id === kuryeId)
    if (k && k.online && k.durum !== 'teslim edildi') {
      k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, true)
      k.hedefSira = 1
      k.optimizasyonSayisi++
      io.emit('kuryeleriGuncelle', kuryeler)
    }
  })

  socket.on('kuryeOnlineDegistir', kuryeId => {
    const k = kuryeler.find(k => k.id === kuryeId)
    if (k) { k.online = !k.online; io.emit('kuryeleriGuncelle', kuryeler) }
  })

  socket.on('yeniSiparisEkle', async () => {
    const yeniId = kuryeler.length + 1
    const bEn = 41.0000 + Math.random() * 0.08
    const bBo = 28.9200 + Math.random() * 0.10
    const hEn = 41.0200 + Math.random() * 0.08
    const hBo = 28.9400 + Math.random() * 0.10
    const rota = await gercekRotaCiz(bEn, bBo, hEn, hBo, false)

    const yeniKurye = {
      id: yeniId, isim: 'Kurye ' + yeniId,
      enlem: bEn, boylam: bBo,
      hedefEnlem: hEn, hedefBoylam: hBo,
      rota, hedefSira: 1, durum: 'yolda',
      hiz: 0, optimizasyonSayisi: 0,
      online: true, eta: 0,
      _siparisId: null, _baslangic: null
    }
    await siparisAc(yeniKurye)
    kuryeler.push(yeniKurye)
    io.emit('kuryeleriGuncelle', kuryeler)
  })
})

// ═══════════════════════════════════════════════════════════════
//  HAREKET DÖNGÜSÜ
// ═══════════════════════════════════════════════════════════════
let konumSayac = 0

setInterval(() => {
  konumSayac++

  kuryeler.forEach(k => {
    if (!k.online) return

    if (k.rota && k.hedefSira < k.rota.length) {
      const [hEn, hBo] = k.rota[k.hedefSira]
      const dEn = hEn - k.enlem
      const dBo = hBo - k.boylam
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

      // ~15 saniyede bir konum snapshot'u DB'ye yaz
      if (konumSayac % 10 === 0) {
        KonumModel.create({
          kuryeId:   k.id,
          kuryeIsim: k.isim,
          enlem:     parseFloat(k.enlem.toFixed(5)),
          boylam:    parseFloat(k.boylam.toFixed(5)),
          hiz:       k.hiz
        }).catch(() => {})
      }

    } else if (k.durum !== 'teslim edildi') {
      k.durum = 'teslim edildi'
      k.hiz   = 0
      k.eta   = 0

      siparisTeslimEt(k)

      const log = {
        id:          Date.now() + k.id,
        kuryeIsim:   k.isim,
        zaman:       new Date().toLocaleTimeString('tr-TR'),
        hedefEnlem:  k.hedefEnlem,
        hedefBoylam: k.hedefBoylam
      }
      siparisFisi.unshift(log)
      if (siparisFisi.length > 100) siparisFisi.pop()

      io.emit('teslimatBildirimi',  { isim: k.isim, zaman: log.zaman })
      io.emit('siparisFisiGuncelle', siparisFisi)
    }
  })

  io.emit('kuryeleriGuncelle', kuryeler)
}, 1500)

// ═══════════════════════════════════════════════════════════════
//  BAĞLANTI & BAŞLATMA
// ═══════════════════════════════════════════════════════════════
async function ilkYukleme() {
  for (const k of kuryeler) {
    k.rota = await gercekRotaCiz(k.enlem, k.boylam, k.hedefEnlem, k.hedefBoylam, false)
    await siparisAc(k)
  }
  console.log('✅ İlk rotalar ve sipariş kayıtları hazır.')
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB bağlandı.')
    server.listen(PORT, () => console.log(`🚀 Sunucu :${PORT}`))
    ilkYukleme()
  })
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err.message)
    console.log('⚠️  DB olmadan devam ediliyor...')
    server.listen(PORT, () => console.log(`🚀 Sunucu :${PORT} (DB yok)`))
    ilkYukleme()
  })
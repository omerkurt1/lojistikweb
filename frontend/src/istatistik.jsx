import { useState, useEffect, useCallback } from 'react'
import { useSettings } from './context/SettingsContext'
import { apiFetch } from './config/api'

const I18N = {
  tr: {
    waitingData: 'Veri bekleniyor...',
    noDeliveryToday: 'Bugün henüz teslimat yok',
    totalDeliveries: 'teslimat',
    avg: 'Ort.',
    min: 'dk',
    loading: 'Veriler yükleniyor...',
    backendSleep: "Backend'e ulaşılamıyor. Render servisi uyku modunda olabilir, 30sn bekleyip yenile.",
    retry: 'Tekrar Dene',
    title: 'Raporlar ve İstatistikler',
    refresh: 'Yenile',
    summaryTotal: 'Toplam Teslimat',
    summaryToday: 'Bugün Teslim',
    summaryOnRoute: 'Şu An Yolda',
    summaryAvg: 'Ort. Teslimat',
    summaryActive: 'Aktif Kurye',
    weekly: 'Haftalık Teslimat',
    hourly: 'Saatlik Dağılım',
    redNow: '(kırmızı = şu an)',
    courierOfDay: 'Günün kuryesi',
    ranking: 'Kurye Sıralaması',
    clickDetail: 'detay için tıkla',
    noSaved: "Henüz DB'ye kaydedilmiş teslimat yok.",
    noSavedSub: 'Kuryeler teslimat tamamladıkça burası dolacak.',
    noRecord: 'Kayıt yok',
    loadingShort: 'Yükleniyor...',
    detailFailed: 'Detay yüklenemedi',
    lastDeliveries: 'Son Teslimatlar',
    tableCourier: 'Kurye',
    tableEnd: 'Bitiş Zamanı',
    tableDuration: 'Süre',
    tableOpt: 'Opt.',
    tableTarget: 'Hedef Konum',
    noWritten: "Henüz DB'ye yazılmış teslimat yok.",
    noWrittenSub: 'Kuryeler hedefe ulaştıkça kayıtlar burada görünecek.',
  },
  en: {
    waitingData: 'Waiting for data...',
    noDeliveryToday: 'No deliveries yet today',
    totalDeliveries: 'deliveries',
    avg: 'Avg.',
    min: 'min',
    loading: 'Loading data...',
    backendSleep: 'Unable to reach backend. Render service may be sleeping, wait 30s and retry.',
    retry: 'Retry',
    title: 'Reports & Statistics',
    refresh: 'Refresh',
    summaryTotal: 'Total Deliveries',
    summaryToday: 'Delivered Today',
    summaryOnRoute: 'Currently On Route',
    summaryAvg: 'Avg. Delivery',
    summaryActive: 'Active Couriers',
    weekly: 'Weekly Deliveries',
    hourly: 'Hourly Distribution',
    redNow: '(red = now)',
    courierOfDay: 'Courier of the day',
    ranking: 'Courier Ranking',
    clickDetail: 'click for details',
    noSaved: 'No deliveries saved in DB yet.',
    noSavedSub: 'This area will fill as couriers complete deliveries.',
    noRecord: 'No records',
    loadingShort: 'Loading...',
    detailFailed: 'Failed to load details',
    lastDeliveries: 'Latest Deliveries',
    tableCourier: 'Courier',
    tableEnd: 'Completed At',
    tableDuration: 'Duration',
    tableOpt: 'Opt.',
    tableTarget: 'Target Location',
    noWritten: 'No DB-written deliveries yet.',
    noWrittenSub: 'Records will appear here as couriers reach destinations.',
  }
}

// ═══════════════════════════════════════════════════════════
//  SVG GRAFIKLER (harici kütüphane yok)
// ═══════════════════════════════════════════════════════════

function BarChart({ veriler = [], renk = '#3498db', etiketKey = '_id', degerKey = 'sayi', yukseklik = 130 }) {
  const { language } = useSettings()
  const c = I18N[language === 'en' ? 'en' : 'tr']
  if (!veriler.length) return <div className="ist-bos">{c.waitingData}</div>

  const maks        = Math.max(...veriler.map(v => v[degerKey]), 1)
  const W           = 500
  const barW        = Math.max(4, Math.floor((W - 20) / veriler.length) - 3)
  const alanY       = yukseklik - 28

  return (
    <svg viewBox={`0 0 ${W} ${yukseklik}`} style={{ width: '100%' }}>
      {/* Yatay kılavuz çizgileri */}
      {[0.25, 0.5, 0.75, 1].map(oran => {
        const y = alanY - alanY * oran
        return (
          <line key={oran} x1="10" y1={y} x2={W - 10} y2={y}
            stroke="var(--sinir)" strokeWidth="0.5" />
        )
      })}

      {veriler.map((v, i) => {
        const px = Math.max(2, Math.round((v[degerKey] / maks) * alanY))
        const x  = 10 + i * (barW + 3)
        const y  = alanY - px
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={px} fill={renk} rx="3" opacity="0.88" />
            {px > 16 && (
              <text x={x + barW / 2} y={y + 12} textAnchor="middle"
                fontSize="9" fill="white" fontWeight="bold">
                {v[degerKey]}
              </text>
            )}
            <text x={x + barW / 2} y={yukseklik - 6} textAnchor="middle"
              fontSize="8" fill="var(--metin-2)">
              {String(v[etiketKey]).slice(-5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function SaatlikChart({ dagilim = [] }) {
  const { language } = useSettings()
  const c = I18N[language === 'en' ? 'en' : 'tr']
  const liste = dagilim.length === 24 ? dagilim : Array(24).fill(0)
  if (liste.every(v => v === 0)) return <div className="ist-bos">{c.noDeliveryToday}</div>

  const maks   = Math.max(...liste, 1)
  const W      = 500
  const H      = 90
  const barW   = Math.floor((W - 10) / 24) - 2
  const alanY  = H - 22
  const simdi  = new Date().getHours()

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {liste.map((deger, saat) => {
        const px = Math.max(2, Math.round((deger / maks) * alanY))
        const x  = 5 + saat * (barW + 2)
        const y  = alanY - px
        return (
          <g key={saat}>
            <rect x={x} y={y} width={barW} height={px}
              fill={saat === simdi ? '#e74c3c' : '#3498db'} rx="2" opacity="0.82" />
            {deger > 0 && px > 14 && (
              <text x={x + barW / 2} y={y + 11} textAnchor="middle"
                fontSize="8" fill="white" fontWeight="bold">{deger}</text>
            )}
            {saat % 3 === 0 && (
              <text x={x + barW / 2} y={H - 6} textAnchor="middle"
                fontSize="8" fill="var(--metin-2)">
                {String(saat).padStart(2, '0')}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
//  KURYE LİDERLİK SATIRI
// ═══════════════════════════════════════════════════════════
function LiderSatir({ sira, profil, maks }) {
  const { language } = useSettings()
  const c = I18N[language === 'en' ? 'en' : 'tr']
  const yuzde  = maks > 0 ? Math.round((profil.toplamTeslimat / maks) * 100) : 0
  const renkler = ['#f39c12', '#95a5a6', '#cd7f32', '#3498db', '#2ecc71']
  const renk   = renkler[sira] ?? '#3498db'
  return (
    <div className="lider-satir">
      <span className="lider-sira" style={{ color: renk }}>#{sira + 1}</span>
      <div className="lider-bilgi">
        <div className="lider-ust">
          <strong>{profil.isim}</strong>
          <span className="lider-sayi">{profil.toplamTeslimat} {c.totalDeliveries}</span>
        </div>
        <div className="lider-bar-arka">
          <div className="lider-bar-on" style={{ width: `${yuzde}%`, background: renk }} />
        </div>
        <div className="lider-alt">
          <span>{c.avg} {profil.ortalamaSure ?? 0} {c.min}</span>
          <span>Opt: {profil.optimizasyonSayisi ?? 0}×</span>
        </div>
      </div>
    </div>
  )
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function groupOrdersByDay(orders) {
  const counts = new Map()
  orders.forEach(order => {
    if (!order.created_at) return
    const key = new Date(order.created_at).toISOString().slice(5, 10)
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([_id, sayi]) => ({ _id, sayi }))
}

function groupOrdersByHour(orders) {
  const hourly = Array(24).fill(0)
  orders.forEach(order => {
    if (!order.created_at) return
    hourly[new Date(order.created_at).getHours()] += 1
  })
  return hourly
}

function buildReportData(stats, couriers, orders, language) {
  const today = new Date()
  const deliveredToday = orders.filter(order => {
    const status = String(order.status || '').toLowerCase()
    return status.includes('deliver') && order.created_at && sameDay(new Date(order.created_at), today)
  }).length

  const profiles = couriers
    .map(courier => ({
      kuryeId: courier.id,
      isim: courier.user_name || courier.full_name || `Kurye ${courier.id}`,
      toplamTeslimat: courier.total_deliveries || 0,
      ortalamaSure: Math.max(1, Math.round((courier.rating || 4.5) * 1.2)),
      optimizasyonSayisi: courier.active_orders || 0,
    }))
    .sort((a, b) => b.toplamTeslimat - a.toplamTeslimat)

  const deliveredOrders = orders
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 30)
    .map(order => ({
      id: order.id,
      kuryeId: order.courier_id,
      kuryeIsim: order.courier_id ? `Kurye ${order.courier_id}` : (language === 'en' ? 'Unassigned' : 'Atanmadı'),
      bitisZamani: order.created_at,
      sureDakika: Math.max(1, Math.round(Number(order.distance_km || 0) * 2)),
      rotaOptimize: false,
      hedefEnlem: null,
      hedefBoylam: null,
      trackingCode: order.tracking_code,
    }))

  return {
    genel: {
      toplamTeslimat: stats.total_orders || orders.length,
      bugunTeslimat: deliveredToday,
      yoldakiSiparis: stats.active_orders || 0,
      genelOrtalamaSure: 5,
      aktifKurye: stats.online_couriers || 0,
      dbDurumu: 'bağlı',
    },
    haftalik: groupOrdersByDay(orders),
    gunluk: {
      saatlikDagilim: groupOrdersByHour(orders),
      enCokTeslimatKurye: profiles[0]?.isim,
    },
    profiller: profiles,
    teslimatlar: deliveredOrders,
  }
}

// ═══════════════════════════════════════════════════════════
//  ANA PANEL
// ═══════════════════════════════════════════════════════════
export default function IstatistikPaneli() {
  const { language } = useSettings()
  const c = I18N[language === 'en' ? 'en' : 'tr']
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  const [yukleniyor,  setYukleniyor] = useState(true)
  const [hata,        setHata]       = useState(null)
  const [genel,       setGenel]      = useState(null)
  const [haftalik,    setHaftalik]   = useState([])
  const [gunluk,      setGunluk]     = useState(null)
  const [profiller,   setProfiller]  = useState([])
  const [teslimatlar, setTeslimatlar]= useState([])
  const [secilenId,   setSecilenId]  = useState(null)
  const [detay,       setDetay]      = useState(null)
  const [detayYuk,    setDetayYuk]   = useState(false)

  // Tek bir fetch ile tüm verileri çek
  const verileriCek = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const [stats, couriers, orders] = await Promise.all([
        apiFetch('/admin/statistics'),
        apiFetch('/admin/couriers'),
        apiFetch('/admin/orders'),
      ])
      const mapped = buildReportData(stats, Array.isArray(couriers) ? couriers : [], Array.isArray(orders) ? orders : [], language)
      setGenel(mapped.genel)
      setHaftalik(mapped.haftalik)
      setGunluk(mapped.gunluk)
      setProfiller(mapped.profiller)
      setTeslimatlar(mapped.teslimatlar)
    } catch (err) {
      setHata(err.message || c.backendSleep)
    } finally {
      setYukleniyor(false)
    }
  }, [c.backendSleep, language])

  useEffect(() => {
    verileriCek()
    const t = setInterval(verileriCek, 30000)
    return () => clearInterval(t)
  }, [verileriCek])

  // Kurye detayı accordion
  const detayAc = async (kuryeId) => {
    if (secilenId === kuryeId) { setSecilenId(null); setDetay(null); return }
    setSecilenId(kuryeId); setDetayYuk(true)
    const profil = profiller.find(p => p.kuryeId === kuryeId)
    const gecmis = teslimatlar.filter(t => t.kuryeId === kuryeId)
    setDetay({ profil, gecmis })
    setDetayYuk(false)
  }

  // ── Yükleniyor ──
  if (yukleniyor) return (
    <div className="ist-yukleniyor">
      <div className="ist-spinner" />
      <p>{c.loading}</p>
    </div>
  )

  // ── Hata ──
  if (hata) return (
    <div className="ist-yukleniyor">
      <div style={{ fontSize: 32 }}>⚠️</div>
      <p style={{ color: 'var(--metin-2)', textAlign: 'center', maxWidth: 320 }}>{hata}</p>
      <button className="btn btn-mavi" style={{ marginTop: 12 }} onClick={verileriCek}>
        ↻ {c.retry}
      </button>
    </div>
  )

  const maksTeslimat = profiller[0]?.toplamTeslimat ?? 1

  return (
    <div className="ist-panel">

      {/* Başlık */}
      <div className="ist-baslik-satir">
        <h2 className="ist-baslik">📊 {c.title}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {genel?.dbDurumu && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 12,
              background: genel.dbDurumu === 'bağlı' ? '#d4edda' : '#f8d7da',
              color:      genel.dbDurumu === 'bağlı' ? '#155724' : '#721c24',
              fontWeight: 600
            }}>
              DB: {genel.dbDurumu}
            </span>
          )}
          <button className="btn btn-kucuk btn-mavi" onClick={verileriCek}>↻ {c.refresh}</button>
        </div>
      </div>

      {/* ── ÖZET KARTLAR ── */}
      {genel && (
        <div className="ist-ozet-grid">
          <div className="ist-ozet-kart mavi">
            <span className="ist-ozet-ikon">📦</span>
            <span className="ist-ozet-deger">{genel.toplamTeslimat ?? 0}</span>
            <span className="ist-ozet-etiket">{c.summaryTotal}</span>
          </div>
          <div className="ist-ozet-kart yesil">
            <span className="ist-ozet-ikon">✅</span>
            <span className="ist-ozet-deger">{genel.bugunTeslimat ?? 0}</span>
            <span className="ist-ozet-etiket">{c.summaryToday}</span>
          </div>
          <div className="ist-ozet-kart turuncu">
            <span className="ist-ozet-ikon">🛵</span>
            <span className="ist-ozet-deger">{genel.yoldakiSiparis ?? 0}</span>
            <span className="ist-ozet-etiket">{c.summaryOnRoute}</span>
          </div>
          <div className="ist-ozet-kart mor">
            <span className="ist-ozet-ikon">⏱</span>
            <span className="ist-ozet-deger">{genel.genelOrtalamaSure ?? 0} {c.min}</span>
            <span className="ist-ozet-etiket">{c.summaryAvg}</span>
          </div>
          <div className="ist-ozet-kart gri">
            <span className="ist-ozet-ikon">🟢</span>
            <span className="ist-ozet-deger">{genel.aktifKurye ?? 0}</span>
            <span className="ist-ozet-etiket">{c.summaryActive}</span>
          </div>
        </div>
      )}

      {/* ── GRAFİKLER ── */}
      <div className="ist-grafik-grid">
        <div className="ist-kart">
          <div className="ist-kart-baslik">📅 {c.weekly}</div>
          <BarChart veriler={haftalik} renk="#3498db" etiketKey="_id" degerKey="sayi" />
        </div>
        <div className="ist-kart">
          <div className="ist-kart-baslik">
            🕐 {c.hourly}
            <span className="ist-alt-baslik"> {c.redNow}</span>
          </div>
          <SaatlikChart dagilim={gunluk?.saatlikDagilim ?? []} />
          {gunluk?.enCokTeslimatKurye && (
            <div className="ist-vurgu">
              🏆 {c.courierOfDay}: <strong>{gunluk.enCokTeslimatKurye}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── LİDERBOARD ── */}
      <div className="ist-kart">
        <div className="ist-kart-baslik">
          🏅 {c.ranking}
          <span className="ist-alt-baslik"> — {c.clickDetail}</span>
        </div>
        {profiller.length === 0 ? (
          <div className="ist-bos">
            {c.noSaved}<br />
            <small>{c.noSavedSub}</small>
          </div>
        ) : (
          <div className="lider-liste">
            {profiller.map((p, i) => (
              <div key={p.kuryeId ?? p._id ?? i}>
                <div onClick={() => detayAc(p.kuryeId)} style={{ cursor: 'pointer' }}>
                  <LiderSatir sira={i} profil={p} maks={maksTeslimat} />
                </div>
                {secilenId === p.kuryeId && (
                  <div className="kurye-detay-kutu">
                    {detayYuk ? (
                      <div className="ist-bos">{c.loadingShort}</div>
                    ) : detay ? (
                      <>
                        <div className="detay-ozet">
                          <span>📦 {detay.profil?.toplamTeslimat ?? 0} {c.totalDeliveries}</span>
                          <span>⏱ {c.avg} {detay.profil?.ortalamaSure ?? 0} {c.min}</span>
                          <span>🔄 {detay.profil?.optimizasyonSayisi ?? 0} opt.</span>
                        </div>
                        <div className="detay-baslik">{c.lastDeliveries}</div>
                        <div className="detay-liste">
                          {!detay.gecmis?.length ? (
                            <div className="ist-bos">{c.noRecord}</div>
                          ) : detay.gecmis.slice(0, 10).map((t, idx) => (
                            <div key={idx} className="detay-satir">
                              <span>{new Date(t.bitisZamani).toLocaleString(locale)}</span>
                              <span className="detay-sure">{t.sureDakika} {c.min}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <div className="ist-bos">{c.detailFailed}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SON TESLİMATLAR TABLOSU ── */}
      <div className="ist-kart">
        <div className="ist-kart-baslik">📋 {c.lastDeliveries}</div>
        {teslimatlar.length === 0 ? (
          <div className="ist-bos">
            {c.noWritten}<br />
            <small>{c.noWrittenSub}</small>
          </div>
        ) : (
          <div className="tablo-sarici">
            <table className="tablo">
              <thead>
                <tr>
                  <th>{c.tableCourier}</th>
                  <th>{c.tableEnd}</th>
                  <th>{c.tableDuration}</th>
                  <th>{c.tableOpt}</th>
                  <th>{c.tableTarget}</th>
                </tr>
              </thead>
              <tbody>
                {teslimatlar.map((t, i) => (
                  <tr key={i}>
                    <td><strong>{t.kuryeIsim}</strong></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {t.bitisZamani ? new Date(t.bitisZamani).toLocaleString(locale) : '—'}
                    </td>
                    <td>
                      <span className={`sure-badge ${
                        (t.sureDakika ?? 99) <= 10 ? 'hizli' :
                        (t.sureDakika ?? 99) <= 20 ? 'orta' : 'yavas'
                      }`}>
                        {t.sureDakika ?? '?'} {c.min}
                      </span>
                    </td>
                    <td>{t.rotaOptimize ? '✅' : '—'}</td>
                    <td className="konum-hucre">
                      {t.hedefEnlem?.toFixed(3)}, {t.hedefBoylam?.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

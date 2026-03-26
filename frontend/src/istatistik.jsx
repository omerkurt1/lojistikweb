import { useState, useEffect, useCallback } from 'react'

const API = 'https://lojistikweb-backend.onrender.com/api'

// ─── SVG Bar Chart ────────────────────────────────────────────
function BarChart({ veriler, renk = '#3498db', etiketAnahtari = '_id', degerAnahtari = 'sayi', yukseklik = 120 }) {
  if (!veriler || veriler.length === 0) {
    return <div className="ist-bos">Veri yok</div>
  }

  const maks  = Math.max(...veriler.map(v => v[degerAnahtari]), 1)
  const genislik = 500
  const barGenislik = Math.floor((genislik - 20) / veriler.length) - 3
  const barAlanY = yukseklik - 30

  return (
    <svg viewBox={`0 0 ${genislik} ${yukseklik}`} style={{ width: '100%' }}>
      {veriler.map((v, i) => {
        const yukseklikPx = Math.max(2, Math.round((v[degerAnahtari] / maks) * barAlanY))
        const x = 10 + i * (barGenislik + 3)
        const y = barAlanY - yukseklikPx

        return (
          <g key={i}>
            <rect
              x={x} y={y}
              width={barGenislik} height={yukseklikPx}
              fill={renk} rx="2" opacity="0.85"
            />
            {/* Değer etiketi — sadece yüksek barlarda göster */}
            {yukseklikPx > 14 && (
              <text x={x + barGenislik / 2} y={y + 11} textAnchor="middle"
                fontSize="9" fill="white" fontWeight="bold">
                {v[degerAnahtari]}
              </text>
            )}
            {/* X eksen etiketi */}
            <text
              x={x + barGenislik / 2}
              y={yukseklik - 6}
              textAnchor="middle"
              fontSize="8"
              fill="var(--metin-2)"
            >
              {String(v[etiketAnahtari]).length > 5
                ? String(v[etiketAnahtari]).slice(-5)
                : v[etiketAnahtari]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Saatlik Bar Chart (24 saat, dizi formatı) ───────────────
function SaatlikChart({ dagilim = [] }) {
  if (!dagilim || dagilim.length === 0) {
    return <div className="ist-bos">Veri yok</div>
  }

  const maks = Math.max(...dagilim, 1)
  const genislik = 500
  const yukseklik = 90
  const barGenislik = Math.floor((genislik - 10) / 24) - 2
  const barAlanY = yukseklik - 22

  return (
    <svg viewBox={`0 0 ${genislik} ${yukseklik}`} style={{ width: '100%' }}>
      {dagilim.map((deger, saat) => {
        const yukseklikPx = Math.max(1, Math.round((deger / maks) * barAlanY))
        const x = 5 + saat * (barGenislik + 2)
        const y = barAlanY - yukseklikPx
        const simdi = new Date().getHours()
        const renk  = saat === simdi ? '#e74c3c' : '#3498db'

        return (
          <g key={saat}>
            <rect x={x} y={y} width={barGenislik} height={yukseklikPx}
              fill={renk} rx="2" opacity="0.8" />
            {saat % 4 === 0 && (
              <text x={x + barGenislik / 2} y={yukseklik - 6}
                textAnchor="middle" fontSize="8" fill="var(--metin-2)">
                {String(saat).padStart(2, '0')}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Liderlik tablosu satırı ─────────────────────────────────
function LiderSatir({ sira, profil, maks }) {
  const yuzde = maks > 0 ? Math.round((profil.toplamTeslimat / maks) * 100) : 0
  const renkler = ['#f39c12', '#95a5a6', '#cd7f32', '#3498db', '#2ecc71']
  const renk = renkler[sira] || '#3498db'

  return (
    <div className="lider-satir">
      <span className="lider-sira" style={{ color: renk }}>#{sira + 1}</span>
      <div className="lider-bilgi">
        <div className="lider-ust">
          <strong>{profil.isim}</strong>
          <span className="lider-sayi">{profil.toplamTeslimat} teslimat</span>
        </div>
        <div className="lider-bar-arka">
          <div className="lider-bar-on" style={{ width: `${yuzde}%`, background: renk }} />
        </div>
        <div className="lider-alt">
          <span>Ort. süre: {profil.ortalamaSure} dk</span>
          <span>Opt: {profil.optimizasyonSayisi}×</span>
        </div>
      </div>
    </div>
  )
}

// ─── Ana İstatistik Paneli ────────────────────────────────────
export default function IstatistikPaneli() {
  const [yukleniyor, setYukleniyor] = useState(true)
  const [genel,    setGenel]    = useState(null)
  const [haftalik, setHaftalik] = useState([])
  const [gunluk,   setGunluk]   = useState(null)
  const [kuryeProfil, setKuryeProfil] = useState([])
  const [sonTeslimat, setSonTeslimat] = useState([])
  const [secilenKurye, setSecilenKurye] = useState(null)
  const [kuryeDetay,   setKuryeDetay]   = useState(null)
  const [detayYukleniyor, setDetayYuk]  = useState(false)

  const verileriCek = useCallback(async () => {
    setYukleniyor(true)
    try {
      const [g, h, gun, kp, st] = await Promise.all([
        fetch(`${API}/istatistik/genel`).then(r => r.json()),
        fetch(`${API}/istatistik/haftalik`).then(r => r.json()),
        fetch(`${API}/istatistik/gunluk`).then(r => r.json()),
        fetch(`${API}/istatistik/kuryeler`).then(r => r.json()),
        fetch(`${API}/teslimatlar?limit=30`).then(r => r.json()),
      ])
      setGenel(g)
      setHaftalik(Array.isArray(h) ? h : [])
      setGunluk(gun)
      setKuryeProfil(Array.isArray(kp) ? kp : [])
      setSonTeslimat(Array.isArray(st) ? st : [])
    } catch (err) {
      console.error('İstatistik çekme hatası:', err)
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => {
    verileriCek()
    const interval = setInterval(verileriCek, 30000) // 30sn'de bir yenile
    return () => clearInterval(interval)
  }, [verileriCek])

  // Kurye detayı aç
  const kuryeDetayAc = async (kuryeId) => {
    if (secilenKurye === kuryeId) { setSecilenKurye(null); setKuryeDetay(null); return }
    setSecilenKurye(kuryeId)
    setDetayYuk(true)
    try {
      const data = await fetch(`${API}/istatistik/kurye/${kuryeId}`).then(r => r.json())
      setKuryeDetay(data)
    } catch (err) {
      console.error('Kurye detay hatası:', err)
    } finally {
      setDetayYuk(false)
    }
  }

  if (yukleniyor) {
    return (
      <div className="ist-yukleniyor">
        <div className="ist-spinner" />
        <p>Veriler yükleniyor...</p>
      </div>
    )
  }

  const maksTeslimat = kuryeProfil.length > 0 ? kuryeProfil[0].toplamTeslimat : 1

  return (
    <div className="ist-panel">

      {/* ── Yenile Butonu ── */}
      <div className="ist-baslik-satir">
        <h2 className="ist-baslik">📊 Raporlar ve İstatistikler</h2>
        <button className="btn btn-kucuk btn-mavi" onClick={verileriCek}>
          ↻ Yenile
        </button>
      </div>

      {/* ══════ ÖZET KARTLAR ══════ */}
      {genel && (
        <div className="ist-ozet-grid">
          <div className="ist-ozet-kart mavi">
            <span className="ist-ozet-ikon">📦</span>
            <span className="ist-ozet-deger">{genel.toplamTeslimat}</span>
            <span className="ist-ozet-etiket">Toplam Teslimat</span>
          </div>
          <div className="ist-ozet-kart yesil">
            <span className="ist-ozet-ikon">✅</span>
            <span className="ist-ozet-deger">{genel.bugunTeslimat}</span>
            <span className="ist-ozet-etiket">Bugün Teslim</span>
          </div>
          <div className="ist-ozet-kart turuncu">
            <span className="ist-ozet-ikon">🛵</span>
            <span className="ist-ozet-deger">{genel.yoldakiSiparis}</span>
            <span className="ist-ozet-etiket">Şu An Yolda</span>
          </div>
          <div className="ist-ozet-kart mor">
            <span className="ist-ozet-ikon">⏱</span>
            <span className="ist-ozet-deger">{genel.genelOrtalamaSure} dk</span>
            <span className="ist-ozet-etiket">Ort. Teslimat</span>
          </div>
          <div className="ist-ozet-kart gri">
            <span className="ist-ozet-ikon">🟢</span>
            <span className="ist-ozet-deger">{genel.aktifKurye}</span>
            <span className="ist-ozet-etiket">Aktif Kurye</span>
          </div>
        </div>
      )}

      {/* ══════ GRAFIKLER ══════ */}
      <div className="ist-grafik-grid">

        {/* Haftalık bar chart */}
        <div className="ist-kart">
          <div className="ist-kart-baslik">📅 Haftalık Teslimat</div>
          {haftalik.length > 0
            ? <BarChart veriler={haftalik} renk="#3498db" etiketAnahtari="_id" degerAnahtari="sayi" />
            : <div className="ist-bos">Bu haftaya ait teslimat verisi bulunamadı</div>
          }
        </div>

        {/* Saatlik dağılım */}
        <div className="ist-kart">
          <div className="ist-kart-baslik">🕐 Bugünkü Saatlik Dağılım
            <span className="ist-alt-baslik"> (kırmızı = şu an)</span>
          </div>
          {gunluk
            ? <SaatlikChart dagilim={gunluk.saatlikDagilim} />
            : <div className="ist-bos">Bugün teslimat verisi yok</div>
          }
          {gunluk?.enCokTeslimatKurye && (
            <div className="ist-vurgu">
              🏆 Günün kuryesi: <strong>{gunluk.enCokTeslimatKurye}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ══════ KURYE LİDERBOARD ══════ */}
      <div className="ist-kart">
        <div className="ist-kart-baslik">🏅 Kurye Sıralaması
          <span className="ist-alt-baslik"> — detay için tıkla</span>
        </div>
        {kuryeProfil.length === 0 ? (
          <div className="ist-bos">Henüz teslimat kaydı yok</div>
        ) : (
          <div className="lider-liste">
            {kuryeProfil.map((p, i) => (
              <div key={p.kuryeId}>
                <div onClick={() => kuryeDetayAc(p.kuryeId)} style={{ cursor: 'pointer' }}>
                  <LiderSatir sira={i} profil={p} maks={maksTeslimat} />
                </div>

                {/* Açılır Detay */}
                {secilenKurye === p.kuryeId && (
                  <div className="kurye-detay-kutu">
                    {detayYukleniyor ? (
                      <div className="ist-bos">Yükleniyor...</div>
                    ) : kuryeDetay ? (
                      <>
                        <div className="detay-ozet">
                          <span>📦 {kuryeDetay.profil?.toplamTeslimat || 0} teslimat</span>
                          <span>⏱ Ort. {kuryeDetay.profil?.ortalamaSure || 0} dk</span>
                          <span>🔄 {kuryeDetay.profil?.optimizasyonSayisi || 0} opt.</span>
                        </div>
                        <div className="detay-baslik">Son Teslimatlar</div>
                        <div className="detay-liste">
                          {kuryeDetay.gecmis?.length === 0 ? (
                            <div className="ist-bos">Kayıt yok</div>
                          ) : (
                            kuryeDetay.gecmis?.slice(0, 10).map((t, idx) => (
                              <div key={idx} className="detay-satir">
                                <span>{new Date(t.bitisZamani).toLocaleString('tr-TR')}</span>
                                <span className="detay-sure">{t.sureDakika} dk</span>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════ SON TESLİMATLAR TABLOSU ══════ */}
      <div className="ist-kart">
        <div className="ist-kart-baslik">📋 Son Teslimatlar</div>
        {sonTeslimat.length === 0 ? (
          <div className="ist-bos">Henüz kayıt yok</div>
        ) : (
          <div className="tablo-sarici">
            <table className="tablo">
              <thead>
                <tr>
                  <th>Kurye</th>
                  <th>Bitiş Zamanı</th>
                  <th>Süre</th>
                  <th>Rota Opt.</th>
                  <th>Hedef Konum</th>
                </tr>
              </thead>
              <tbody>
                {sonTeslimat.map((t, i) => (
                  <tr key={i}>
                    <td><strong>{t.kuryeIsim}</strong></td>
                    <td>{new Date(t.bitisZamani).toLocaleString('tr-TR')}</td>
                    <td>
                      <span className={`sure-badge ${t.sureDakika <= 10 ? 'hizli' : t.sureDakika <= 20 ? 'orta' : 'yavas'}`}>
                        {t.sureDakika} dk
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
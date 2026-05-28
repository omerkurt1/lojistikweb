// src/pages/PartnerNetwork.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

// ─── Profession SVG Icons ────────────────────────────────────────────────────
const SVG_Plane = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21.5 4c0 0-2 .5-3.5 2L14.5 9.5 6.3 7.7l-1.6 1.6 6.3 3.6-4.6 4.6-2.8-.7L2 17.8l4.4 1.1L7.5 22l1.6-1.6-.7-2.8 4.6-4.6 3.6 6.3z"/></svg>;
const SVG_Bike = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>;
const SVG_Cold = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 16-2 2-2-2"/><path d="m10 8 2-2 2 2"/><path d="m16 10 2 2-2 2"/><path d="m8 14-2-2 2-2"/><line x1="12" x2="12" y1="4" y2="20"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="18" x2="16" y1="6" y2="8"/><line x1="6" x2="8" y1="18" y2="16"/><line x1="6" x2="8" y1="6" y2="8"/><line x1="18" x2="16" y1="18" y2="16"/></svg>;
const SVG_Rocket = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
const SVG_Ship = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>;
const SVG_Truck = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const SVG_Check = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

// ─── Mock partner data ────────────────────────────────────────────────────────
const PARTNERLER = [
  {
    id: 1,
    isim: 'Global Freight Express',
    kisa: 'Uluslararası Kargo & Lojistik',
    aciklama:
      'Avrupa ve Asya koridorlarında kapsamlı uluslararası kargo hizmetleri. Gümrük danışmanlığı, multimodal taşıma ve anlık gönderi takibi tek platformda.',
    uzmanlik: ['Uluslararası Taşıma', 'Gümrük Danışmanlığı', 'Multimodal'],
    renk: '#3f6f6a',
    renk2: '#2c4f4b',
    ikon: SVG_Plane,
    api: 'https://api.globalfreightexpress.com/v3/docs',
    email: 'integrations@globalfreightexpress.com',
    telefon: '+90 212 850 00 01',
    entType: 'REST API',
  },
  {
    id: 2,
    isim: 'CityLine Last-Mile',
    kisa: 'Şehir İçi Anlık Teslimat',
    aciklama:
      'İstanbul, Ankara ve İzmir başta olmak üzere 12 büyükşehirde aynı gün teslimat hizmeti. Bisiklet kuryeleri, elektrikli araçlar ve drone teslimatı seçenekleriyle karbon-nötr lojistik.',
    uzmanlik: ['Same-Day Delivery', 'Micro-Fulfillment', 'Drone Pilot'],
    renk: '#5f8f52',
    renk2: '#3f6640',
    ikon: SVG_Bike,
    api: 'https://developer.cityline.io/docs',
    email: 'partners@cityline.io',
    telefon: '+90 216 444 58 78',
    entType: 'Webhook + REST',
  },
  {
    id: 3,
    isim: 'ColdChain Logistics',
    kisa: 'Soğuk Zincir & Kontrollü Depo',
    aciklama:
      'Farmasötik, gıda ve biyomedikal ürünler için -25°C ile +25°C arasında kesintisiz sıcaklık kontrollü depolama, taşıma ve dağıtım hizmeti. FDA & ISO 9001 sertifikalı.',
    uzmanlik: ['Pharma Cold Chain', 'ISO 9001', 'Reefer Truck'],
    renk: '#467b89',
    renk2: '#2f5761',
    ikon: SVG_Cold,
    api: 'https://api.coldchain.com.tr/endpoints',
    email: 'api-support@coldchain.com.tr',
    telefon: '+90 232 500 22 44',
    entType: 'SOAP + REST',
  },
  {
    id: 4,
    isim: 'AeroGlobal Cargo',
    kisa: 'Hava Kargo & Ekspres Uçuş',
    aciklama:
      'Türkiye\'nin tüm havalimanlarına ve 60+ ülkeye günlük charter ve hat uçuşları. Kıymetli yük, e-ticaret paketleri ve acil gönderi için kapıdan kapıya hava kargo çözümleri.',
    uzmanlik: ['Air Freight', 'Charter Uçuşu', 'Değerli Yük'],
    renk: '#7b6a52',
    renk2: '#584b39',
    ikon: SVG_Rocket,
    api: 'https://cargo.aeroglobal.aero/api/v2/reference',
    email: 'tech-partners@aeroglobal.aero',
    telefon: '+90 312 960 77 00',
    entType: 'OAuth 2.0 + REST',
  },
  {
    id: 5,
    isim: 'SwiftPort Maritime',
    kisa: 'Deniz Yolu Konteyner Taşımacılığı',
    aciklama:
      'İzmir Aliağa, Mersin ve İstanbul limanlarından Akdeniz, Karadeniz ve Körfez hatlarına FCL/LCL konteyner çözümleri. Gerçek zamanlı gemi takip entegrasyonu.',
    uzmanlik: ['FCL / LCL', 'Port Agency', 'AIS Takip'],
    renk: '#a6693d',
    renk2: '#7a4b2d',
    ikon: SVG_Ship,
    api: 'https://api.swiftport.com/marine/v1',
    email: 'integrations@swiftport.com',
    telefon: '+90 232 888 10 20',
    entType: 'GraphQL + REST',
  },
  {
    id: 6,
    isim: 'TerraFleet Road Freight',
    kisa: 'Karayolu Parsiyel & Komple Yük',
    aciklama:
      'TIR, frigorifik araç ve lowbed çekicilerden oluşan 2.000+ araçlık filo ile Türkiye\'nin tüm illerine ve TIR güzergahında 40+ ülkeye parsiyel ve komple yük hizmeti.',
    uzmanlik: ['FTL / LTL', 'TIR Güzergahı', 'ADR Tehlikeli Madde'],
    renk: '#8a5e4d',
    renk2: '#664337',
    ikon: SVG_Truck,
    api: 'https://terrafleet.com.tr/developers',
    email: 'b2b@terrafleet.com.tr',
    telefon: '+90 342 600 40 50',
    entType: 'REST API + EDI',
  },
]

const PARTNER_EN = {
  1: {
    kisa: 'International Cargo & Logistics',
    aciklama: 'Comprehensive international cargo services across Europe and Asia corridors. Customs consulting, multimodal transport and live shipment tracking in one platform.',
    uzmanlik: ['International Transport', 'Customs Advisory', 'Multimodal']
  },
  2: {
    kisa: 'Urban Instant Delivery',
    aciklama: 'Same-day delivery across 12 major cities, especially Istanbul, Ankara and Izmir. Carbon-neutral logistics with bike couriers, EVs and drone delivery options.',
    uzmanlik: ['Same-Day Delivery', 'Micro-Fulfillment', 'Drone Pilot']
  },
  3: {
    kisa: 'Cold Chain & Controlled Storage',
    aciklama: 'Continuous temperature-controlled storage, transport and distribution for pharma, food and biomedical products between -25°C and +25°C. FDA & ISO 9001 certified.',
    uzmanlik: ['Pharma Cold Chain', 'ISO 9001', 'Reefer Truck']
  },
  4: {
    kisa: 'Air Cargo & Express Flights',
    aciklama: 'Daily charter and scheduled flights to all Turkish airports and 60+ countries. Door-to-door air cargo solutions for valuable goods, e-commerce parcels and urgent shipments.',
    uzmanlik: ['Air Freight', 'Charter Flights', 'Valuable Cargo']
  },
  5: {
    kisa: 'Maritime Container Shipping',
    aciklama: 'FCL/LCL container solutions from Izmir Aliağa, Mersin and Istanbul ports to Mediterranean, Black Sea and Gulf routes with real-time vessel tracking integration.',
    uzmanlik: ['FCL / LCL', 'Port Agency', 'AIS Tracking']
  },
  6: {
    kisa: 'Road Partial & Full Truckload',
    aciklama: 'Partial and full-load services to all cities in Turkey and 40+ countries on TIR routes with a 2,000+ vehicle fleet including TIR, reefer and lowbed trucks.',
    uzmanlik: ['FTL / LTL', 'TIR Corridor', 'ADR Dangerous Goods']
  }
}

const COPY = {
  tr: {
    back: '← Anasayfaya dön',
    badge: 'B2B Lojistik Ekosistemi',
    titleSuffix: 'Ağı',
    subtitle: "Türkiye'nin ve dünyanın önde gelen lojistik operatörleriyle tek API üzerinden entegre olun. Kara, hava, deniz ve soğuk zincir çözümlerini LOOP platformundan yönetin.",
    stat1: 'Aktif Partner',
    stat2: 'Ülke Ağı',
    stat3: 'Araç Filosu',
    stat4: 'API Erişimi',
    contact: 'İletişim Bilgileri',
    quote: 'Teklif Al',
    ctaTitle: 'Özel Entegrasyon mu İstiyorsunuz?',
    ctaSub: 'Mevcut partnerlerimizin dışında özel bir taşıyıcıyla entegrasyon için çözüm ekibimizle görüşün.',
    ctaBtn: 'Özel Çözüm Talep Et',
    toastMeeting: ' ile görüşme talebiniz iletildi!',
    toastSpecial: 'Çözüm ekibimiz en kısa sürede sizinle iletişime geçecek!',
    toastQuoteDone: ' ekibine özel teklif talebiniz iletildi!',
    apiType: 'API Türü',
    supportEmail: 'Destek E-Posta',
    phone: 'Telefon',
    apiDocs: 'API Dokümantasyon',
    openDocs: 'Dokümana Git →',
    apiDocsBtn: 'API Dökümanları',
    specialQuote: 'Özel Teklif İste',
    sent: 'Talep Gönderildi'
  },
  en: {
    back: '← Return to homepage',
    badge: 'B2B Logistics Ecosystem',
    titleSuffix: 'Network',
    subtitle: 'Integrate with top logistics operators in Turkey and worldwide through one API. Manage road, air, maritime and cold-chain solutions from LOOP.',
    stat1: 'Active Partners',
    stat2: 'Country Network',
    stat3: 'Vehicle Fleet',
    stat4: 'API Access',
    contact: 'Contact Info',
    quote: 'Get Quote',
    ctaTitle: 'Need a Custom Integration?',
    ctaSub: 'Talk to our solution team to integrate a custom carrier outside our current partner network.',
    ctaBtn: 'Request Custom Solution',
    toastMeeting: ' meeting request has been submitted!',
    toastSpecial: 'Our solution team will contact you shortly!',
    toastQuoteDone: ' custom quote request has been sent!',
    apiType: 'API Type',
    supportEmail: 'Support Email',
    phone: 'Phone',
    apiDocs: 'API Documentation',
    openDocs: 'Open Docs →',
    apiDocsBtn: 'API Docs',
    specialQuote: 'Request Special Quote',
    sent: 'Request Sent'
  }
}

// ─── Toast Bileşeni ───────────────────────────────────────────────────────────
function Toast({ mesaj, kapat, isMobile }) {
  return (
    <div style={{ ...toastStyle, ...(isMobile ? { left: 12, right: 12, bottom: 12, maxWidth: 'none' } : {}) }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{SVG_Check} {mesaj}</span>
      <button onClick={kapat} style={toastKapatStyle}>✕</button>
    </div>
  )
}

function localizePartner(partner, language) {
  if (language !== 'en') return partner
  const alt = PARTNER_EN[partner.id]
  if (!alt) return partner
  return {
    ...partner,
    kisa: alt.kisa,
    aciklama: alt.aciklama,
    uzmanlik: alt.uzmanlik
  }
}

// ─── Partner Detay Modalı ─────────────────────────────────────────────────────
function PartnerModal({ partner, kapat, toastGoster, c, isMobile }) {
  const [gonderildi, setGonderildi] = useState(false)

  const teklifIste = () => {
    setGonderildi(true)
    setTimeout(() => {
      kapat()
      toastGoster(`${partner.isim}${c.toastQuoteDone}`)
    }, 600)
  }

  return (
    <div style={overlayStyle} onClick={kapat}>
      <div style={{ ...modalStyle, ...(isMobile ? { maxHeight: '90vh', overflowY: 'auto' } : {}) }} onClick={e => e.stopPropagation()}>

        {/* Başlık */}
        <div style={{ ...modalHeaderStyle, background: `linear-gradient(135deg, ${partner.renk} 0%, ${partner.renk2} 100%)` }}>
          <div style={modalIkonStyle}>{partner.ikon}</div>
          <div>
            <div style={modalIsimStyle}>{partner.isim}</div>
            <div style={modalKisaStyle}>{partner.kisa}</div>
          </div>
          <button style={modalKapatBtnStyle} onClick={kapat}>✕</button>
        </div>

        <div style={modalGovdeStyle}>

          {/* Uzmanlık etiketleri */}
          <div style={etiketSatirStyle}>
            {partner.uzmanlik.map(u => (
              <span key={u} style={{ ...etiketStyle, borderColor: partner.renk, color: partner.renk }}>
                {u}
              </span>
            ))}
          </div>

          {/* Entegrasyon bilgileri */}
          <div style={{ ...bilgiGridStyle, ...(isMobile ? { gridTemplateColumns: '1fr' } : {}) }}>
            <div style={bilgiKartStyle}>
              <div style={bilgiEtiketStyle}>{c.apiType}</div>
              <div style={bilgiDegerStyle}>{partner.entType}</div>
            </div>
            <div style={bilgiKartStyle}>
              <div style={bilgiEtiketStyle}>{c.supportEmail}</div>
              <a href={`mailto:${partner.email}`} style={{ ...bilgiDegerStyle, color: partner.renk, textDecoration: 'none' }}>
                {partner.email}
              </a>
            </div>
            <div style={bilgiKartStyle}>
              <div style={bilgiEtiketStyle}>{c.phone}</div>
              <div style={bilgiDegerStyle}>{partner.telefon}</div>
            </div>
            <div style={bilgiKartStyle}>
              <div style={bilgiEtiketStyle}>{c.apiDocs}</div>
              <a
                href={partner.api}
                target="_blank"
                rel="noreferrer"
                style={{ ...bilgiDegerStyle, color: partner.renk, textDecoration: 'none' }}
              >
                {c.openDocs}
              </a>
            </div>
          </div>

          {/* CTA Butonlar */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <a
              href={partner.api}
              target="_blank"
              rel="noreferrer"
              style={{
                ...apiBtn,
                background: `linear-gradient(135deg, ${partner.renk}, ${partner.renk2})`,
              }}
            >
              {c.apiDocsBtn}
            </a>
            <button
              onClick={teklifIste}
              disabled={gonderildi}
              style={{
                ...teklifBtnStyle,
                borderColor: partner.renk,
                color: gonderildi ? '#8a9abc' : partner.renk,
                cursor: gonderildi ? 'default' : 'pointer',
              }}
            >
              {gonderildi ? c.sent : c.specialQuote}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function PartnerNetwork() {
  const { language } = useSettings()
  const navigate = useNavigate()
  const [secilenPartner, setSecilen] = useState(null)
  const [toast, setToast]           = useState('')
  const [isMobile, setIsMobile]     = useState(() => window.innerWidth <= 900)
  const c = COPY[language === 'en' ? 'en' : 'tr']

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toastGoster = useCallback((mesaj) => {
    setToast(mesaj)
    setTimeout(() => setToast(''), 4000)
  }, [])

  return (
    <div style={sayfaStyle}>

      {/* Toast */}
      {toast && <Toast mesaj={toast} kapat={() => setToast('')} isMobile={isMobile} />}

      {/* Partner Detay Modalı */}
      {secilenPartner && (
        <PartnerModal
          partner={secilenPartner}
          kapat={() => setSecilen(null)}
          toastGoster={toastGoster}
          c={c}
          isMobile={isMobile}
        />
      )}

      {/* ── Header ── */}
      <div style={{ ...headerStyle, ...(isMobile ? { padding: '24px 16px 20px' } : {}) }}>
        <button style={geriBtn} onClick={() => navigate('/')}>{c.back}</button>
        <div style={headerIcStyle}>
          <div style={headerBadgeStyle}>{c.badge}</div>
          <h1 style={headerBaslikStyle}>Partner <span style={{ color: '#2f6f62' }}>{c.titleSuffix}</span></h1>
          <p style={headerAltStyle}>
            {c.subtitle}
          </p>
        </div>

        {/* İstatistik satırı */}
        <div style={{ ...statSatirStyle, ...(isMobile ? { gap: 10 } : {}) }}>
          {[
            { deger: '6+',    etiket: c.stat1 },
            { deger: '40+',   etiket: c.stat2 },
            { deger: '2.000+',etiket: c.stat3 },
            { deger: '7/24',  etiket: c.stat4 },
          ].map(s => (
            <div key={s.etiket} style={statKartStyle}>
              <div style={statDegerStyle}>{s.deger}</div>
              <div style={statEtiketStyle}>{s.etiket}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Partner Grid ── */}
      <div style={{ ...gridWrapStyle, ...(isMobile ? { padding: '18px 12px' } : {}) }}>
        <div style={{ ...gridStyle, ...(isMobile ? { gridTemplateColumns: '1fr', gap: 14 } : {}) }}>
          {PARTNERLER.map(rawPartner => {
            const p = localizePartner(rawPartner, language)
            return (
            <div key={p.id} style={kartStyle} className="partner-kart">

              {/* Kart üst şerit */}
              <div style={{ ...kartUstStyle, background: `linear-gradient(135deg, ${p.renk} 0%, ${p.renk2} 100%)` }}>
                <span style={kartIkonStyle}>{p.ikon}</span>
                <span style={entTypeBadgeStyle}>{p.entType}</span>
              </div>

              {/* Kart gövde */}
              <div style={kartGovdeStyle}>
                <h3 style={kartIsimStyle}>{p.isim}</h3>
                <p style={kartKisaStyle}>{p.kisa}</p>
                <p style={kartAciklamaStyle}>{p.aciklama}</p>

                {/* Uzmanlık etiketleri */}
                <div style={etiketSatirStyle}>
                  {p.uzmanlik.map(u => (
                    <span key={u} style={{ ...etiketStyle, borderColor: p.renk + '55', color: p.renk }}>
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              {/* Kart alt butonlar */}
              <div style={kartAltStyle}>
                <button
                  onClick={() => setSecilen(p)}
                  style={iletisimBtnStyle}
                >
                  {c.contact}
                </button>
                <button
                  onClick={() => {
                    setSecilen(p)
                    setTimeout(() => {
                      toastGoster(`${p.isim}${c.toastMeeting}`)
                    }, 200)
                  }}
                  style={{ ...entegreBtnStyle, background: `linear-gradient(135deg, ${p.renk}, ${p.renk2})` }}
                >
                  {c.quote}
                </button>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div style={{ ...ctaBannerStyle, ...(isMobile ? { margin: '0 12px 18px', padding: '20px 16px' } : {}) }}>
        <div>
          <div style={ctaBaslikStyle}>{c.ctaTitle}</div>
          <div style={ctaAltStyle}>
            {c.ctaSub}
          </div>
        </div>
        <button
          style={ctaBtnStyle}
          onClick={() => toastGoster(c.toastSpecial)}
        >
          {c.ctaBtn}
        </button>
      </div>

      {/* Hover animasyonu için inline style */}
      <style>{`
        .partner-kart {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .partner-kart:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(0,0,50,0.14) !important;
        }
      `}</style>
    </div>
  )
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const FF = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

const sayfaStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #f8f4ec 0%, #f0e9dc 100%)',
  fontFamily: FF,
}

const headerStyle = {
  background: '#fcf9f3',
  borderBottom: '1px solid #e4dac7',
  padding: '40px 48px 32px',
}

const geriBtn = {
  background: 'none', border: 'none',
  color: '#6a5f4f', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', padding: 0, marginBottom: 24,
  display: 'block',
}

const headerIcStyle = {
  maxWidth: 640,
}

const headerBadgeStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'rgba(63,111,106,0.10)', border: '1px solid rgba(63,111,106,0.25)',
  color: '#2f6f62', fontSize: 11, fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '4px 14px', borderRadius: 40, marginBottom: 14,
}

const headerBaslikStyle = {
  fontSize: 36, fontWeight: 800, color: '#2c3128',
  marginBottom: 12, lineHeight: 1.15,
}

const headerAltStyle = {
  fontSize: 15, color: '#6c6658', lineHeight: 1.7,
  maxWidth: 560, marginBottom: 28,
}

const statSatirStyle = {
  display: 'flex', gap: 24, flexWrap: 'wrap',
}

const statKartStyle = {
  background: '#f6f0e6',
  border: '1px solid #dfd1bc',
  borderRadius: 12, padding: '12px 20px',
  minWidth: 110,
}

const statDegerStyle = {
  fontSize: 24, fontWeight: 800, color: '#2f6f62',
}

const statEtiketStyle = {
  fontSize: 11, fontWeight: 600, color: '#7a7568',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  marginTop: 2,
}

const gridWrapStyle = {
  padding: '40px 48px',
  maxWidth: 1280, margin: '0 auto',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: 24,
}

const kartStyle = {
  background: '#fffdf9',
  borderRadius: 18,
  boxShadow: '0 6px 24px rgba(75,60,35,0.10)',
  border: '1px solid #e6dccb',
  overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
}

const kartUstStyle = {
  height: 80,
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
}

const kartIkonStyle = {
  fontSize: 32,
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
}

const entTypeBadgeStyle = {
  background: 'rgba(255,255,255,0.2)',
  color: '#fff', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '4px 10px', borderRadius: 40,
  border: '1px solid rgba(255,255,255,0.3)',
}

const kartGovdeStyle = {
  padding: '20px 20px 12px',
  flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
}

const kartIsimStyle = {
  fontSize: 17, fontWeight: 800, color: '#2e3028', margin: 0,
}

const kartKisaStyle = {
  fontSize: 12, fontWeight: 600, color: '#7a7568',
  textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
}

const kartAciklamaStyle = {
  fontSize: 13, color: '#615d52', lineHeight: 1.65,
  margin: '4px 0 8px', flex: 1,
}

const etiketSatirStyle = {
  display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4,
}

const etiketStyle = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
  padding: '3px 9px', borderRadius: 40,
  border: '1.5px solid', background: 'transparent',
}

const kartAltStyle = {
  padding: '12px 20px 20px',
  display: 'flex', gap: 10,
}

const iletisimBtnStyle = {
  flex: 1, padding: '10px 0',
  background: '#f4eee3', border: '1.5px solid #d9ccb6',
  borderRadius: 10, fontSize: 12, fontWeight: 700,
  color: '#5e594d', cursor: 'pointer',
  transition: 'background 0.2s',
}

const entegreBtnStyle = {
  flex: 1, padding: '10px 0',
  border: 'none', borderRadius: 10,
  fontSize: 12, fontWeight: 700,
  color: '#fff', cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  transition: 'opacity 0.2s, transform 0.15s',
}

// ─── Modal Stiller ────────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(10,22,40,0.60)',
  backdropFilter: 'blur(6px)',
  zIndex: 9000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24,
}

const modalStyle = {
  background: '#fff', borderRadius: 22,
  width: '100%', maxWidth: 520,
  boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
  overflow: 'hidden',
  fontFamily: FF,
}

const modalHeaderStyle = {
  padding: '28px 28px 24px',
  display: 'flex', alignItems: 'center', gap: 16,
  position: 'relative',
}

const modalIkonStyle = {
  fontSize: 40,
  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
  flexShrink: 0,
}

const modalIsimStyle = {
  fontSize: 20, fontWeight: 800, color: '#fff',
}

const modalKisaStyle = {
  fontSize: 12, color: 'rgba(255,255,255,0.75)',
  fontWeight: 600, marginTop: 3,
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

const modalKapatBtnStyle = {
  position: 'absolute', top: 14, right: 16,
  background: 'rgba(255,255,255,0.18)',
  border: 'none', borderRadius: '50%',
  width: 32, height: 32, fontSize: 14,
  color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const modalGovdeStyle = {
  padding: '24px 28px 28px',
  display: 'flex', flexDirection: 'column', gap: 16,
}

const bilgiGridStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
}

const bilgiKartStyle = {
  background: '#f5f7ff', border: '1px solid #e8ecf8',
  borderRadius: 12, padding: '12px 14px',
  display: 'flex', flexDirection: 'column', gap: 4,
}

const bilgiEtiketStyle = {
  fontSize: 10, fontWeight: 700, color: '#8a9abc',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const bilgiDegerStyle = {
  fontSize: 12, fontWeight: 600, color: '#0a1628', wordBreak: 'break-all',
}

const apiBtn = {
  flex: 1, padding: '12px 0',
  border: 'none', borderRadius: 10,
  color: '#fff', fontSize: 13, fontWeight: 700,
  textDecoration: 'none', textAlign: 'center',
  cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
}

const teklifBtnStyle = {
  flex: 1, padding: '12px 0',
  background: 'transparent',
  border: '1.5px solid', borderRadius: 10,
  fontSize: 13, fontWeight: 700,
  transition: 'background 0.2s',
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
const ctaBannerStyle = {
  margin: '0 48px 48px',
  background: 'linear-gradient(135deg, #3b4f4b 0%, #5e4a3c 100%)',
  borderRadius: 20, padding: '36px 40px',
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', gap: 24,
  flexWrap: 'wrap',
}

const ctaBaslikStyle = {
  fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6,
}

const ctaAltStyle = {
  fontSize: 13, color: 'rgba(255,255,255,0.78)', maxWidth: 500,
}

const ctaBtnStyle = {
  padding: '13px 28px',
  background: 'linear-gradient(135deg, #c58d4e, #a6693d)',
  border: 'none', borderRadius: 12,
  color: '#fffaf2', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', whiteSpace: 'nowrap',
  boxShadow: '0 8px 26px rgba(98,63,31,0.32)',
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const toastStyle = {
  position: 'fixed', bottom: 28, right: 28,
  background: '#0a1628',
  color: '#fff', padding: '14px 20px',
  borderRadius: 12, fontSize: 14, fontWeight: 600,
  boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
  display: 'flex', alignItems: 'center', gap: 14,
  zIndex: 9999, animation: 'toastIn 0.3s ease forwards',
  maxWidth: 420,
}

const toastKapatStyle = {
  background: 'none', border: 'none',
  color: 'rgba(255,255,255,0.5)', fontSize: 14,
  cursor: 'pointer', lineHeight: 1, flexShrink: 0,
}

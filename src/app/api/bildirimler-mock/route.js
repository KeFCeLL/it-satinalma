import { NextResponse } from 'next/server';

// Mock bildirim verileri
const mockBildirimler = [
  {
    id: "mock-bildirim-1",
    kullaniciId: "test-admin-id",
    baslik: "Yeni bir talep onayınız var",
    icerik: "IT Departmanı tarafından oluşturulan talep onayınızı bekliyor",
    okundu: false,
    link: "/dashboard-all/bekleyenler",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-bildirim-2",
    kullaniciId: "test-admin-id",
    baslik: "Talebiniz onaylandı",
    icerik: "Dizüstü bilgisayar talebi Finans Departmanı tarafından onaylandı",
    okundu: false,
    link: "/dashboard-all/talepler",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: "mock-bildirim-3",
    kullaniciId: "test-admin-id",
    baslik: "Toplantı hatırlatması",
    icerik: "Yarın saat 10:00'da IT departmanı toplantısı var",
    okundu: true,
    link: "/dashboard-all",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 gün önce
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 gün önce
  }
];

// Kullanıcının bildirimlerini getir
async function getBildirimlerHandler(request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const okundu = searchParams.get('okundu');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '10');
    
    // Filtrelenmiş bildirimler
    let filteredBildirimler = [...mockBildirimler];
    
    // Okunma durumu filtresi
    if (okundu !== null && okundu !== undefined) {
      const isOkundu = okundu === 'true';
      filteredBildirimler = filteredBildirimler.filter(bildirim => bildirim.okundu === isOkundu);
    }
    
    // Sayfalama için toplam sayı
    const total = filteredBildirimler.length;
    
    // Sayfalama uygula
    const paginatedBildirimler = filteredBildirimler.slice(
      (sayfa - 1) * sayfaBasi,
      sayfa * sayfaBasi
    );
    
    // Okunmamış bildirim sayısı
    const okunmamisSayisi = mockBildirimler.filter(b => !b.okundu).length;
    
    console.log('Mock bildirimler gönderiliyor');
    return NextResponse.json({
      success: true,
      data: paginatedBildirimler,
      meta: {
        total,
        sayfa,
        sayfaBasi,
        toplamSayfa: Math.ceil(total / sayfaBasi),
        okunmamisSayisi
      }
    });
  } catch (error) {
    console.error('Bildirimler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: "Bildirim verisi alınamadı", error: error.message },
      { status: 500 }
    );
  }
}

// Tüm bildirimleri okundu olarak işaretle
async function readAllBildirimlerHandler(request) {
  try {
    // Okunmamış bildirim sayısını bul
    const okunmamisSayisi = mockBildirimler.filter(b => !b.okundu).length;
    
    // Tüm bildirimleri okundu olarak işaretle
    mockBildirimler.forEach(bildirim => {
      bildirim.okundu = true;
      bildirim.updatedAt = new Date();
    });
    
    return NextResponse.json({
      success: true,
      message: `${okunmamisSayisi} bildirim okundu olarak işaretlendi`,
      count: okunmamisSayisi
    });
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: "Bildirimler işaretlenemedi", error: error.message },
      { status: 500 }
    );
  }
}

// Export handler'ları
export const GET = getBildirimlerHandler;
export const PUT = readAllBildirimlerHandler;
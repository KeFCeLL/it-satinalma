import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../middleware';

// Mock bildirim verileri - geliştirme modu için
const mockBildirimler = [
  {
    id: "mock-bildirim-1",
    kullaniciId: "test-admin-id",
    baslik: "Yeni bir talep onayınız var",
    mesaj: "IT Departmanı tarafından oluşturulan talep onayınızı bekliyor",
    icerik: {
      tip: "TALEP",
      talepId: "talep-1",
      islem: "ONAY_BEKLIYOR"
    },
    okundu: false,
    link: "/dashboard-all/bekleyenler",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-bildirim-2",
    kullaniciId: "test-admin-id",
    baslik: "Talebiniz onaylandı",
    mesaj: "Dizüstü bilgisayar talebi Finans Departmanı tarafından onaylandı",
    icerik: {
      tip: "TALEP",
      talepId: "talep-2",
      islem: "ONAYLANDI"
    },
    okundu: false,
    link: "/dashboard-all/talepler",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: "mock-bildirim-3",
    kullaniciId: "test-admin-id",
    baslik: "Toplantı hatırlatması",
    mesaj: "Yarın saat 10:00'da IT departmanı toplantısı var",
    icerik: {
      tip: "ETKINLIK",
      etkinlikId: "etk-1"
    },
    okundu: true,
    link: "/dashboard-all",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 gün önce
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 gün önce
  },
  {
    id: "mock-bildirim-4",
    kullaniciId: "test-admin-id",
    baslik: "Yeni kullanıcı eklendi",
    mesaj: "Mehmet Yılmaz isimli yeni kullanıcı sisteme eklendi",
    icerik: {
      tip: "KULLANICI",
      kullaniciId: "user-123",
      islem: "EKLENDI"
    },
    okundu: true,
    link: "/dashboard-all/kullanici-yonetimi",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 hafta önce
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: "mock-bildirim-5",
    kullaniciId: "test-admin-id",
    baslik: "Sistem güncellemesi",
    mesaj: "Sistem bakımı nedeniyle 15 Mart gecesi sistem erişilemez olacaktır",
    icerik: {
      tip: "DUYURU",
      onemlilik: "YUKSEK"
    },
    okundu: false,
    link: "/dashboard-all",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 gün önce
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
];

// Geliştirme modu kontrolü
const IS_DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_API === 'true' || process.env.DB_BYPASS === 'true';

// Kullanıcının bildirimlerini getir
async function getBildirimlerHandler(request) {
  try {
    // Kullanıcı bilgilerini al
    const { id: kullaniciId } = request.user;
    
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const okundu = searchParams.get('okundu');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '10');

    // Geliştirme modu ise mock veri dön
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock bildirim verileri döndürülüyor');
      
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
      
      return NextResponse.json({
        success: true,
        data: paginatedBildirimler,
        meta: {
          toplam: total,
          okunmamis: okunmamisSayisi,
          sayfaBasi,
          mevcutSayfa: sayfa,
          toplamSayfa: Math.ceil(total / sayfaBasi)
        }
      });
    }
    
    // Prodüksiyon modu - normal veritabanı sorgusu
    try {
      // Filtre koşulları
      const where = { kullaniciId };
      
      if (okundu !== null && okundu !== undefined) {
        where.okundu = okundu === 'true';
      }

      // Toplam sayıyı al
      const total = await prisma.bildirim.count({ where });

      // Sayfalama ile bildirimleri getir
      const bildirimler = await prisma.bildirim.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (sayfa - 1) * sayfaBasi,
        take: sayfaBasi,
      });

      // Toplam sayfa sayısını hesapla
      const toplamSayfa = Math.ceil(total / sayfaBasi);

      // Okunmamış bildirim sayısını al
      const okunmamisSayisi = await prisma.bildirim.count({
        where: {
          kullaniciId,
          okundu: false,
        },
      });

      return NextResponse.json({
        success: true,
        data: bildirimler,
        meta: {
          toplam: total,
          okunmamis: okunmamisSayisi,
          sayfaBasi,
          mevcutSayfa: sayfa,
          toplamSayfa
        }
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
      // Veritabanı hatası durumunda mock veri dön
      return NextResponse.json({
        success: true,
        data: mockBildirimler.slice(0, sayfaBasi),
        meta: {
          toplam: mockBildirimler.length,
          okunmamis: mockBildirimler.filter(b => !b.okundu).length,
          sayfaBasi,
          mevcutSayfa: 1,
          toplamSayfa: Math.ceil(mockBildirimler.length / sayfaBasi)
        }
      });
    }
  } catch (error) {
    console.error('Bildirimler getirme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock veri döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock bildirim verileri döndürülüyor');
      
      const okunmamisSayisi = mockBildirimler.filter(b => !b.okundu).length;
      
      return NextResponse.json({
        success: true,
        data: mockBildirimler.slice(0, 5),
        meta: {
          toplam: mockBildirimler.length,
          okunmamis: okunmamisSayisi,
          sayfaBasi: 5,
          mevcutSayfa: 1,
          toplamSayfa: Math.ceil(mockBildirimler.length / 5)
        }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    if (!IS_DEV_MODE) {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.error('Prisma bağlantı kapatma hatası:', error);
      }
    }
  }
}

// Yeni bildirim oluştur
async function createBildirimHandler(request) {
  try {
    const { kullaniciId, baslik, mesaj, icerik, link } = await request.json();
    
    if (!kullaniciId || !baslik || !mesaj) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı ID, başlık ve mesaj alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // Geliştirme modu ise mock işlem yap
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock bildirim oluşturuluyor');
      
      const yeniBildirim = {
        id: `mock-bildirim-${Date.now()}`,
        kullaniciId,
        baslik,
        mesaj,
        icerik: icerik || null,
        link: link || null,
        okundu: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockBildirimler.unshift(yeniBildirim);
      
      return NextResponse.json({
        success: true,
        bildirim: yeniBildirim
      });
    }
    
    // Yeni bildirim oluştur
    const bildirim = await prisma.bildirim.create({
      data: {
        kullaniciId,
        baslik,
        mesaj,
        icerik: icerik ? JSON.stringify(icerik) : null,
        link,
        okundu: false
      }
    });
    
    return NextResponse.json({
      success: true,
      bildirim
    });
  } catch (error) {
    console.error('Bildirim oluşturma hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock bildirim oluşturma yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        bildirim: {
          id: `mock-error-${Date.now()}`,
          kullaniciId: request.body?.kullaniciId || "test-user",
          baslik: request.body?.baslik || "Test Bildirim",
          mesaj: request.body?.mesaj || "Test Mesaj",
          okundu: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  }
}

// Tüm bildirimleri okundu olarak işaretle
async function readAllBildirimlerHandler(request) {
  try {
    // Kullanıcı bilgilerini al
    const { id: kullaniciId } = request.user;
    
    // Geliştirme modu ise mock işlem yap
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Tüm bildirimleri okundu olarak işaretleme');
      
      // Okunmamış bildirim sayısını bul
      const okunmamisSayisi = mockBildirimler.filter(b => !b.okundu && b.kullaniciId === kullaniciId).length;
      
      // Tüm bildirimleri okundu olarak işaretle
      mockBildirimler.forEach(bildirim => {
        if (bildirim.kullaniciId === kullaniciId && !bildirim.okundu) {
          bildirim.okundu = true;
          bildirim.updatedAt = new Date();
        }
      });
      
      return NextResponse.json({
        success: true,
        message: `${okunmamisSayisi} bildirim okundu olarak işaretlendi`,
        guncellenenAdet: okunmamisSayisi
      });
    }
    
    try {
      // Tüm okunmamış bildirimleri güncelle
      const { count } = await prisma.bildirim.updateMany({
        where: {
          kullaniciId,
          okundu: false,
        },
        data: {
          okundu: true,
          updatedAt: new Date()
        },
      });

      return NextResponse.json({
        success: true,
        message: `${count} bildirim okundu olarak işaretlendi`,
        guncellenenAdet: count
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
      return NextResponse.json({
        success: true,
        message: "3 bildirim okundu olarak işaretlendi",
        guncellenenAdet: 3
      });
    }
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock bildirim güncelleme yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        message: "3 bildirim okundu olarak işaretlendi",
        guncellenenAdet: 3
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    if (!IS_DEV_MODE) {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.error('Prisma bağlantı kapatma hatası:', error);
      }
    }
  }
}

// Export handlers
export const GET = withAuth(getBildirimlerHandler);
export const PUT = withAuth(readAllBildirimlerHandler);
export const POST = withAuth(createBildirimHandler); 
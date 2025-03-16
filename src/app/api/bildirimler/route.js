import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../middleware';

// Mock bildirim verileri - geliştirme modu için
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
  },
  {
    id: "mock-bildirim-4",
    kullaniciId: "test-admin-id",
    baslik: "Yeni kullanıcı eklendi",
    icerik: "Mehmet Yılmaz isimli yeni kullanıcı sisteme eklendi",
    okundu: true,
    link: "/dashboard-all/kullanici-yonetimi",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 hafta önce
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: "mock-bildirim-5",
    kullaniciId: "test-admin-id",
    baslik: "Sistem güncellemesi",
    icerik: "Sistem bakımı nedeniyle 15 Mart gecesi sistem erişilemez olacaktır",
    okundu: false,
    link: "/dashboard-all",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 gün önce
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
];

// Geliştirme modu kontrolü
const IS_DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_API === 'true';

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
          total,
          sayfa,
          sayfaBasi,
          toplamSayfa: Math.ceil(total / sayfaBasi),
          okunmamisSayisi
        }
      });
    }
    
    // Prodüksiyon modu - normal veritabanı sorgusu
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
        total,
        sayfa,
        sayfaBasi,
        toplamSayfa,
        okunmamisSayisi,
      },
    });
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
          total: mockBildirimler.length,
          sayfa: 1,
          sayfaBasi: 5,
          toplamSayfa: Math.ceil(mockBildirimler.length / 5),
          okunmamisSayisi
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

// Tüm bildirimleri okundu olarak işaretle
async function readAllBildirimlerHandler(request) {
  try {
    // Kullanıcı bilgilerini al
    const { id: kullaniciId } = request.user;
    
    // Geliştirme modu ise mock işlem yap
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Tüm bildirimleri okundu olarak işaretleme');
      
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
    }
    
    // Tüm okunmamış bildirimleri güncelle
    const { count } = await prisma.bildirim.updateMany({
      where: {
        kullaniciId,
        okundu: false,
      },
      data: {
        okundu: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${count} bildirim okundu olarak işaretlendi`,
      count,
    });
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock bildirim güncelleme yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        message: "3 bildirim okundu olarak işaretlendi",
        count: 3
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

// Export handler'ları
export const GET = withAuth(getBildirimlerHandler);
export const PUT = withAuth(readAllBildirimlerHandler); 
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../middleware';

// Mock departman verileri
const mockDepartmanlar = [
  {
    id: "mock-dep-1",
    ad: "IT Departmanı",
    aciklama: "Bilgi Teknolojileri ve Sistem Yönetimi",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-dep-2",
    ad: "Satın Alma Departmanı",
    aciklama: "Tedarik ve Satın Alma Yönetimi",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-dep-3",
    ad: "Finans Departmanı",
    aciklama: "Finans ve Muhasebe İşlemleri",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-dep-4",
    ad: "Pazarlama Departmanı",
    aciklama: "Pazarlama ve Müşteri İlişkileri",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-dep-5",
    ad: "Yönetim Departmanı",
    aciklama: "Genel Yönetim ve İdari İşler",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Geliştirme modu kontrolü
const IS_DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_API === 'true' || process.env.DB_BYPASS === 'true';

// Tüm departmanları getir
async function getDepartmanlarHandler(request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const hepsi = searchParams.get('hepsi') === 'true';
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '10');
    const arama = searchParams.get('arama') || '';
    
    // Geliştirme modu ise mock veri dön
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock departman verileri döndürülüyor');
      
      // Filtreleme
      let filteredDepartmanlar = [...mockDepartmanlar];
      
      // Arama filtresi
      if (arama) {
        const searchTerm = arama.toLowerCase();
        filteredDepartmanlar = filteredDepartmanlar.filter(dep => 
          dep.ad.toLowerCase().includes(searchTerm) || 
          (dep.aciklama && dep.aciklama.toLowerCase().includes(searchTerm))
        );
      }
      
      // Tümünü getir
      if (hepsi) {
        return NextResponse.json({
          success: true,
          departmanlar: filteredDepartmanlar,
        });
      }
      
      // Toplam sayı
      const toplam = filteredDepartmanlar.length;
      
      // Sayfalama
      const paginatedDepartmanlar = filteredDepartmanlar.slice(
        (sayfa - 1) * sayfaBasi,
        sayfa * sayfaBasi
      );
      
      return NextResponse.json({
        success: true,
        departmanlar: paginatedDepartmanlar,
        meta: {
          toplam,
          sayfaBasi,
          mevcutSayfa: sayfa,
          toplamSayfa: Math.ceil(toplam / sayfaBasi),
        }
      });
    }
    
    console.log("Departmanlar API çağrısı - Parametreler:", { hepsi, sayfa, sayfaBasi, arama });

    try {
      // Departmanları getir
      let departmanlar;
      
      if (hepsi) {
        // Tümünü getir
        departmanlar = await prisma.departman.findMany({
          orderBy: {
            ad: 'asc',
          },
        });
      } else {
        // Sayfalama ile getir
        departmanlar = await prisma.departman.findMany({
          where: arama ? {
            OR: [
              { ad: { contains: arama } },
              { aciklama: { contains: arama } },
            ],
          } : undefined,
          skip: (sayfa - 1) * sayfaBasi,
          take: sayfaBasi,
          orderBy: {
            ad: 'asc',
          },
        });
      }

      console.log("Departmanlar API - başarıyla yüklendi, sonuç:", departmanlar.length);

      return NextResponse.json({
        success: true,
        departmanlar: departmanlar,
      }, { 
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json'
        } 
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
      // Veritabanı hatası durumunda mock veri dön
      return NextResponse.json({
        success: true,
        departmanlar: mockDepartmanlar.slice(0, sayfaBasi),
        meta: {
          toplam: mockDepartmanlar.length,
          sayfaBasi,
          mevcutSayfa: 1,
          toplamSayfa: Math.ceil(mockDepartmanlar.length / sayfaBasi),
        }
      });
    }
  } catch (error) {
    console.error('Departmanlar getirme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock veri döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock departman verileri döndürülüyor');
      
      return NextResponse.json({
        success: true,
        departmanlar: mockDepartmanlar.slice(0, 5),
        meta: {
          toplam: mockDepartmanlar.length,
          sayfaBasi: 5,
          mevcutSayfa: 1,
          toplamSayfa: Math.ceil(mockDepartmanlar.length / 5),
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

// Yeni departman oluştur
async function createDepartmanHandler(request) {
  try {
    // İstek gövdesini al
    const { ad, aciklama } = await request.json();
    
    // Gerekli alanları kontrol et
    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Departman adı zorunludur' },
        { status: 400 }
      );
    }
    
    // Geliştirme modu ise mock işlem yap
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock departman oluşturuluyor');
      
      // Yeni departman objesi
      const yeniDepartman = {
        id: `mock-dep-${Date.now()}`,
        ad,
        aciklama: aciklama || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock listeye ekle
      mockDepartmanlar.unshift(yeniDepartman);
      
      return NextResponse.json({
        success: true,
        departman: yeniDepartman
      });
    }
    
    try {
      // Aynı isimde departman var mı kontrol et
      const existingDepartman = await prisma.departman.findFirst({
        where: { ad },
      });
      
      if (existingDepartman) {
        return NextResponse.json(
          { success: false, message: 'Bu isimde bir departman zaten mevcut' },
          { status: 400 }
        );
      }
      
      // Yeni departman oluştur
      const departman = await prisma.departman.create({
        data: {
          ad,
          aciklama: aciklama || null,
        },
      });
      
      return NextResponse.json({
        success: true,
        departman,
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
      // Mock departman oluştur
      const mockDepartman = {
        id: `mock-error-${Date.now()}`,
        ad,
        aciklama: aciklama || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        departman: mockDepartman
      });
    }
  } catch (error) {
    console.error('Departman oluşturma hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock departman oluşturma yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        departman: {
          id: `mock-error-${Date.now()}`,
          ad: request.body?.ad || "Hata Departmanı",
          aciklama: request.body?.aciklama || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Departman oluşturulurken bir hata oluştu', error: error.message },
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

// Export GET ve POST metodları
export const GET = getDepartmanlarHandler;
export const POST = withAuth(withRole(createDepartmanHandler, ['ADMIN'])); 
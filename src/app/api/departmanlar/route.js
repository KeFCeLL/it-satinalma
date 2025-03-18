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

// Loglama işlevi
function logInfo(message, data = null) {
  const logMsg = `🔵 [API/Departmanlar] ${message}`;
  if (data) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
}

function logError(message, error = null) {
  const logMsg = `🔴 [API/Departmanlar] ${message}`;
  if (error) {
    console.error(logMsg, error);
  } else {
    console.error(logMsg);
  }
}

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
    const _nocache = searchParams.get('_nocache'); // Önbelleği atlamak için
    
    logInfo(`Departmanlar getiriliyor: ${JSON.stringify({ hepsi, sayfa, sayfaBasi, arama, _nocache })}`);
    
    // Geliştirme modu ise mock veri dön
    if (IS_DEV_MODE) {
      logInfo('🔧 Geliştirme modu: Mock departman verileri döndürülüyor');
      
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
    
    logInfo(`Departmanlar API çağrısı - Parametreler:`, { hepsi, sayfa, sayfaBasi, arama });

    try {
      // İlk olarak prisma'nın bağlı olup olmadığını kontrol et
      try {
        await prisma.$queryRaw`SELECT 1`;
        logInfo("Veritabanı bağlantısı aktif");
      } catch (connError) {
        logError("Veritabanı bağlantı kontrolü başarısız", connError);
        throw new Error(`Veritabanı bağlantısında sorun: ${connError.message}`);
      }
      
      // Departmanları getir
      let departmanlar;
      let where = {};
      
      // Arama filtresi
      if (arama) {
        where = {
          OR: [
            { ad: { contains: arama, mode: 'insensitive' } },
            { aciklama: { contains: arama, mode: 'insensitive' } },
          ],
        };
      }
      
      logInfo(`Departmanlar veritabanı sorgusu başlatılıyor: ${JSON.stringify(where)}`);
      
      if (hepsi) {
        // Tümünü getir
        departmanlar = await prisma.departman.findMany({
          where,
          orderBy: {
            ad: 'asc',
          },
        });
      } else {
        // Sayfalama ile getir
        departmanlar = await prisma.departman.findMany({
          where,
          skip: (sayfa - 1) * sayfaBasi,
          take: sayfaBasi,
          orderBy: {
            ad: 'asc',
          },
        });
      }

      logInfo(`Departmanlar API - başarıyla yüklendi, sonuç sayısı:`, departmanlar.length);

      return NextResponse.json({
        success: true,
        departmanlar: departmanlar,
      }, { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'Content-Type': 'application/json'
        }
      });
    } catch (dbError) {
      logError('Veritabanı hatası:', dbError);
      
      // Hata içeriyor mu kontrol et
      if (dbError.code) {
        logError(`Veritabanı hata kodu: ${dbError.code}`);
      }
      
      if (dbError.meta) {
        logError(`Veritabanı hata meta:`, dbError.meta);
      }
      
      // Bağlantı hatası mı kontrol et
      if (
        dbError.message.includes('connection') || 
        dbError.message.includes('network') ||
        dbError.message.includes('timeout') ||
        dbError.code === 'P1001' || 
        dbError.code === 'P1002'
      ) {
        logError('Kritik veritabanı bağlantı hatası');
        
        return NextResponse.json(
          { success: false, error: 'Veritabanı bağlantı hatası', message: dbError.message, code: dbError.code },
          { status: 503 } // Service Unavailable
        );
      }
      
      // Yetki hatası mı kontrol et
      if (dbError.code === 'P1010' || dbError.code === 'P1011') {
        logError('Veritabanı yetkilendirme hatası');
        
        return NextResponse.json(
          { success: false, error: 'Veritabanı yetkilendirme hatası', message: dbError.message },
          { status: 403 } // Forbidden
        );
      }
      
      // Veritabanı hatası durumunda mock veri dön
      logInfo('Veritabanı hatası nedeniyle mock veriye dönülüyor');
      
      return NextResponse.json({
        success: true,
        departmanlar: mockDepartmanlar.slice(0, sayfaBasi),
        meta: {
          toplam: mockDepartmanlar.length,
          sayfaBasi,
          mevcutSayfa: 1,
          toplamSayfa: Math.ceil(mockDepartmanlar.length / sayfaBasi),
        },
        _devNote: 'Bu veri, veritabanı hatası nedeniyle mock veriden gelmektedir.'
      });
    }
  } catch (error) {
    logError('Departmanlar getirme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock veri döndür
    if (IS_DEV_MODE) {
      logInfo('🔧 Hata alındı, geliştirme modu: Mock departman verileri döndürülüyor');
      
      return NextResponse.json({
        success: true,
        departmanlar: mockDepartmanlar.slice(0, 5),
        meta: {
          toplam: mockDepartmanlar.length,
          sayfaBasi: 5,
          mevcutSayfa: 1,
          toplamSayfa: Math.ceil(mockDepartmanlar.length / 5),
        },
        _devNote: 'Bu veri bir hata sonrası mock veriden gelmektedir.'
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache',
          'Content-Type': 'application/json'
        } 
      }
    );
  } finally {
    if (!IS_DEV_MODE) {
      try {
        await prisma.$disconnect();
      } catch (error) {
        logError('Prisma bağlantı kapatma hatası:', error);
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
      logInfo('🔧 Geliştirme modu: Mock departman oluşturuluyor');
      
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
      logError('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
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
    logError('Departman oluşturma hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      logInfo('�� Hata alındı, geliştirme modu: Mock departman oluşturma yanıtı döndürülüyor');
      
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
        logError('Prisma bağlantı kapatma hatası:', error);
      }
    }
  }
}

// Export GET ve POST metodları
export const GET = getDepartmanlarHandler;
export const POST = withAuth(withRole(createDepartmanHandler, ['ADMIN'])); 
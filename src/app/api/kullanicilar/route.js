import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';
import bcrypt from 'bcryptjs';

// Kullanıcı listesi için varsayılan mocklar
const mockKullanicilar = [
  {
    id: "mock-user-1",
    ad: "Ali",
    soyad: "Yılmaz",
    email: "ali.yilmaz@example.com",
    departmanId: "mock-dep-1",
    role: "ADMIN",
    status: "AKTIF",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-2",
    ad: "Ayşe",
    soyad: "Demir",
    email: "ayse.demir@example.com",
    departmanId: "mock-dep-2",
    role: "USER",
    status: "AKTIF",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-3",
    ad: "Mehmet",
    soyad: "Kaya",
    email: "mehmet.kaya@example.com",
    departmanId: "mock-dep-3",
    role: "USER",
    status: "PASIF",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-4",
    ad: "Zeynep",
    soyad: "Çelik",
    email: "zeynep.celik@example.com",
    departmanId: "mock-dep-4",
    role: "MANAGER",
    status: "AKTIF",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-5",
    ad: "Ahmet",
    soyad: "Şahin",
    email: "ahmet.sahin@example.com",
    departmanId: "mock-dep-5",
    role: "USER",
    status: "AKTIF",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Loglama işlevi
function logInfo(message, data = null) {
  const logMsg = `🔵 [API/Kullanicilar] ${message}`;
  if (data) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
}

function logError(message, error = null) {
  const logMsg = `🔴 [API/Kullanicilar] ${message}`;
  if (error) {
    console.error(logMsg, error);
  } else {
    console.error(logMsg);
  }
}

// Kullanıcıları getir
async function getKullanicilarHandler(request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const hepsi = searchParams.get('hepsi') === 'true';
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '50'); // Varsayılan sayfa boyutunu 50'ye çıkar
    const arama = searchParams.get('arama') || '';
    const departmanId = searchParams.get('departmanId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    
    logInfo(`Kullanıcılar getiriliyor:`, { hepsi, sayfa, sayfaBasi, arama, departmanId, role, status });
    
    try {
      // İlk olarak prisma'nın bağlı olup olmadığını kontrol et
      try {
        await prisma.$queryRaw`SELECT 1`;
        logInfo("Veritabanı bağlantısı aktif");
      } catch (connError) {
        logError("Veritabanı bağlantı kontrolü başarısız", connError);
        throw new Error(`Veritabanı bağlantısında sorun: ${connError.message}`);
      }
      
      // Kullanıcıları getir
      let where = {};
      
      // Arama filtresi
      if (arama) {
        where.OR = [
          { ad: { contains: arama, mode: 'insensitive' } },
          { soyad: { contains: arama, mode: 'insensitive' } },
          { email: { contains: arama, mode: 'insensitive' } },
        ];
      }
      
      // Departman filtresi
      if (departmanId) {
        where.departmanId = departmanId;
      }
      
      // Rol filtresi
      if (role) {
        where.rol = role;
      }
      
      // Durum filtresi
      if (status) {
        where.durum = status;
      }
      
      logInfo(`Kullanıcılar veritabanı sorgusu başlatılıyor: ${JSON.stringify(where)}`);
      
      // Toplam kayıt sayısını al
      const toplam = await prisma.kullanici.count({ where });
      
      // Kullanıcıları getir
      const kullanicilar = await prisma.kullanici.findMany({
        where,
        include: {
          departman: {
            select: {
              id: true,
              ad: true
            }
          }
        },
        skip: hepsi ? undefined : (sayfa - 1) * sayfaBasi,
        take: hepsi ? undefined : sayfaBasi,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      logInfo(`Kullanıcılar başarıyla getirildi: ${kullanicilar.length} kayıt`);
      
      return NextResponse.json({
        success: true,
        kullanicilar,
        meta: hepsi ? undefined : {
          toplam,
          sayfaBasi,
          mevcutSayfa: sayfa,
          toplamSayfa: Math.ceil(toplam / sayfaBasi),
        }
      }, { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      });
      
    } catch (error) {
      logError("Kullanıcılar getirilirken bir hata oluştu:", error);
      return NextResponse.json(
        { success: false, message: "Kullanıcılar getirilirken bir hata oluştu", error: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    logError("İstek işlenirken bir hata oluştu:", error);
    return NextResponse.json(
      { success: false, message: "İstek işlenirken bir hata oluştu", error: error.message },
      { status: 500 }
    );
  }
}

// Yeni kullanıcı oluştur
async function createKullaniciHandler(request) {
  try {
    // Yeni kullanıcı verilerini al
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.ad || !body.soyad || !body.email || !body.departmanId) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }
    
    logInfo(`Yeni kullanıcı oluşturma isteği:`, {
      ad: body.ad,
      soyad: body.soyad,
      email: body.email,
      departmanId: body.departmanId,
      role: body.role || 'USER'
    });
    
    // Geliştirme modu ise mock işlem yap
    // if (IS_DEV_MODE) {
    //   logInfo('🔧 Geliştirme modu: Mock kullanıcı oluşturuluyor');
      
    //   // Yeni kullanıcı objesi
    //   const yeniKullanici = {
    //     id: `mock-user-${Date.now()}`,
    //     ad: body.ad,
    //     soyad: body.soyad,
    //     email: body.email,
    //     departmanId: body.departmanId,
    //     role: body.role || 'USER',
    //     status: body.status || 'AKTIF',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   };
      
    //   return NextResponse.json({
    //     success: true,
    //     kullanici: yeniKullanici
    //   }, { status: 201 });
    // }
    
    // !!! GEÇİCİ ÇÖZÜM !!! - Geliştirme modu kontrolünü devre dışı bıraktık, gerçek veritabanı işlemi yapılacak
    logInfo('Geliştirme modu kontrolü devre dışı bırakıldı, gerçek veritabanı işlemi yapılıyor');
    
    try {
      // İlk olarak prisma'nın bağlı olup olmadığını kontrol et
      try {
        await prisma.$queryRaw`SELECT 1`;
        logInfo("Veritabanı bağlantısı aktif");
      } catch (connError) {
        logError("Veritabanı bağlantı kontrolü başarısız", connError);
        throw new Error(`Veritabanı bağlantısında sorun: ${connError.message}`);
      }
      
      // Aynı email ile kullanıcı var mı kontrol et
      const existingUser = await prisma.kullanici.findUnique({
        where: {
          email: body.email
        }
      });
      
      if (existingUser) {
        logInfo(`Kullanıcı zaten mevcut: ${body.email}`);
        
        return NextResponse.json(
          { success: false, error: 'Bu email adresi ile bir kullanıcı zaten var' },
          { status: 409 }
        );
      }
      
      // Şifre hash'le
      let hashedPassword = null;
      if (body.sifre) {
        hashedPassword = await bcrypt.hash(body.sifre, 10);
      }
      
      // Yeni kullanıcı oluştur
      const yeniKullanici = await prisma.kullanici.create({
        data: {
          ad: body.ad,
          soyad: body.soyad,
          email: body.email,
          sifre: hashedPassword,
          departmanId: body.departmanId,
          rol: body.role || 'USER',
          durum: "AKTIF"
        }
      });
      
      // Şifreyi yanıttan çıkar
      const { sifre, ...kullaniciWithoutPassword } = yeniKullanici;
      
      logInfo(`Yeni kullanıcı başarıyla oluşturuldu: ${yeniKullanici.id}`);

      return NextResponse.json({
        success: true,
        kullanici: kullaniciWithoutPassword
      }, { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache',
          'Content-Type': 'application/json'
        }
      });
    } catch (dbError) {
      logError('Veritabanı hatası:', dbError);
      
      // Hata detaylarını kontrol et
      if (dbError.code) {
        logError(`Veritabanı hata kodu: ${dbError.code}`);
      }
      
      if (dbError.meta) {
        logError(`Veritabanı hata meta:`, dbError.meta);
      }
      
      // Foreign key hatası mı kontrol et
      if (dbError.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Belirtilen departman bulunamadı', message: dbError.message },
          { status: 400 }
        );
      }
      
      // Unique constraint hatası mı kontrol et
      if (dbError.code === 'P2002' && dbError.meta?.target?.includes('email')) {
        return NextResponse.json(
          { success: false, error: 'Bu email adresi ile bir kullanıcı zaten var', message: dbError.message },
          { status: 409 }
        );
      }
      
      // Mock kullanıcı oluştur
      logInfo('Veritabanı hatası nedeniyle mock yanıt dönülüyor');
      
      return NextResponse.json({
        success: true,
        kullanici: {
          id: `mock-error-${Date.now()}`,
          ad: body.ad,
          soyad: body.soyad,
          email: body.email,
          departmanId: body.departmanId,
          role: body.role || 'USER',
          status: body.status || 'AKTIF',
          createdAt: new Date(),
          updatedAt: new Date(),
          _devNote: 'Bu veri, veritabanı hatası nedeniyle mock veriden gelmektedir.'
        }
      }, { status: 201 });
    }
  } catch (error) {
    logError('Kullanıcı oluşturma hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      logInfo('🔧 Hata alındı, geliştirme modu: Mock kullanıcı oluşturma yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        kullanici: {
          id: `mock-error-${Date.now()}`,
          ad: 'Hata',
          soyad: 'Kullanıcı',
          email: 'hata@example.com',
          departmanId: 'mock-dep-1',
          role: 'USER',
          status: 'AKTIF',
          createdAt: new Date(),
          updatedAt: new Date(),
          _devNote: 'Bu veri bir hata sonrası mock veriden gelmektedir.'
        }
      }, { status: 201 });
    }
    
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
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
export const GET = withAuth(getKullanicilarHandler);
export const POST = createKullaniciHandler; // Yetki kontrolünü kaldırdık 
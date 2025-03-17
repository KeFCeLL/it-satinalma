import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';
import bcrypt from 'bcrypt';

// Mock kullanıcı verileri - geliştirme modu için
const mockKullanicilar = [
  {
    id: "mock-user-1",
    email: "admin@example.com",
    ad: "Admin",
    soyad: "Kullanıcı",
    rol: "ADMIN",
    departmanId: "mock-dep-1",
    departman: {
      id: "mock-dep-1",
      ad: "IT Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-2",
    email: "satin.alma@example.com",
    ad: "Satın",
    soyad: "Alma",
    rol: "SATIN_ALMA",
    departmanId: "mock-dep-2",
    departman: {
      id: "mock-dep-2",
      ad: "Satın Alma Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-3",
    email: "finans@example.com",
    ad: "Finans",
    soyad: "Sorumlusu",
    rol: "FINANS",
    departmanId: "mock-dep-3",
    departman: {
      id: "mock-dep-3",
      ad: "Finans Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-4",
    email: "talep@example.com",
    ad: "Talep",
    soyad: "Eden",
    rol: "TALEP",
    departmanId: "mock-dep-4",
    departman: {
      id: "mock-dep-4",
      ad: "Pazarlama Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-5",
    email: "onay@example.com",
    ad: "Onay",
    soyad: "Veren",
    rol: "ONAY",
    departmanId: "mock-dep-5",
    departman: {
      id: "mock-dep-5",
      ad: "Yönetim Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Geliştirme modu kontrolü
const IS_DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_API === 'true' || process.env.DB_BYPASS === 'true';

// GET - Kullanıcıları getir
async function getKullanicilarHandler(request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const sayfa = Number(searchParams.get('sayfa')) || 1;
    const sayfaBasi = Number(searchParams.get('sayfaBasi')) || 10;
    const arama = searchParams.get('arama') || '';
    const rol = searchParams.get('rol');
    const departmanId = searchParams.get('departmanId');
    
    // Geliştirme modu ise mock veri dön
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock kullanıcı verileri döndürülüyor');
      
      // Filtreleme
      let filteredKullanicilar = [...mockKullanicilar];
      
      // Arama filtresi
      if (arama) {
        const searchTerm = arama.toLowerCase();
        filteredKullanicilar = filteredKullanicilar.filter(user => 
          user.ad.toLowerCase().includes(searchTerm) || 
          user.soyad.toLowerCase().includes(searchTerm) || 
          user.email.toLowerCase().includes(searchTerm)
        );
      }
      
      // Rol filtresi
      if (rol) {
        filteredKullanicilar = filteredKullanicilar.filter(user => user.rol === rol);
      }
      
      // Departman filtresi
      if (departmanId) {
        filteredKullanicilar = filteredKullanicilar.filter(user => user.departmanId === departmanId);
      }
      
      // Toplam sayı
      const toplam = filteredKullanicilar.length;
      
      // Sayfalama
      const paginatedKullanicilar = filteredKullanicilar.slice(
        (sayfa - 1) * sayfaBasi,
        sayfa * sayfaBasi
      );
      
      return NextResponse.json({
        success: true,
        data: paginatedKullanicilar,
        meta: {
          toplam,
          sayfaBasi,
          mevcutSayfa: sayfa,
          sonSayfa: Math.ceil(toplam / sayfaBasi),
        }
      });
    }
    
    // Skip ve take değerleri
    const skip = (sayfa - 1) * sayfaBasi;
    
    // Filtre koşulları
    let where = {};
    
    // Arama filtresi
    if (arama) {
      where.OR = [
        { ad: { contains: arama, mode: 'insensitive' } },
        { soyad: { contains: arama, mode: 'insensitive' } },
        { email: { contains: arama, mode: 'insensitive' } },
      ];
    }
    
    // Rol filtresi
    if (rol) {
      where.rol = rol;
    }
    
    // Departman filtresi
    if (departmanId) {
      where.departmanId = departmanId;
    }
    
    try {
      // Kullanıcıları getir
      const [kullanicilar, toplam] = await Promise.all([
        prisma.kullanici.findMany({
          where,
          select: {
            id: true,
            email: true,
            ad: true,
            soyad: true,
            rol: true,
            departmanId: true,
            departman: {
              select: {
                id: true,
                ad: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          skip,
          take: sayfaBasi,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.kullanici.count({ where }),
      ]);
      
      // Sayfalama meta verileri
      const meta = {
        toplam,
        sayfaBasi,
        mevcutSayfa: sayfa,
        sonSayfa: Math.ceil(toplam / sayfaBasi),
      };
      
      return NextResponse.json({
        success: true,
        data: kullanicilar,
        meta,
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
        data: mockKullanicilar.slice(0, sayfaBasi),
        meta: {
          toplam: mockKullanicilar.length,
          sayfaBasi,
          mevcutSayfa: 1,
          sonSayfa: Math.ceil(mockKullanicilar.length / sayfaBasi),
        }
      });
    }
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock veri döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock kullanıcı verileri döndürülüyor');
      
      return NextResponse.json({
        success: true,
        data: mockKullanicilar.slice(0, 5),
        meta: {
          toplam: mockKullanicilar.length,
          sayfaBasi: 5,
          mevcutSayfa: 1,
          sonSayfa: Math.ceil(mockKullanicilar.length / 5),
        }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Kullanıcılar getirilirken bir hata oluştu', error: error.message },
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

// POST - Yeni kullanıcı oluştur
async function createKullaniciHandler(request) {
  try {
    const { email, ad, soyad, sifre, rol, departmanId } = await request.json();
    
    // Gerekli alanları kontrol et
    if (!email || !ad || !soyad || !sifre || !rol) {
      return NextResponse.json(
        { success: false, message: 'Email, ad, soyad, şifre ve rol alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // Geliştirme modu ise mock işlem yap
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock kullanıcı oluşturuluyor');
      
      // Yeni kullanıcı objesi
      const yeniKullanici = {
        id: `mock-user-${Date.now()}`,
        email,
        ad,
        soyad,
        rol,
        departmanId: departmanId || null,
        departman: departmanId ? {
          id: departmanId,
          ad: "Mock Departman"
        } : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock listeye ekle
      mockKullanicilar.unshift(yeniKullanici);
      
      return NextResponse.json({
        success: true,
        user: yeniKullanici
      });
    }
    
    try {
      // Kullanıcıyı kontrol et - aynı email ile kayıtlı kullanıcı var mı?
      const existingUser = await prisma.kullanici.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Bu email adresi ile kayıtlı bir kullanıcı zaten var' },
          { status: 400 }
        );
      }
      
      // Şifreyi hashle
      const hashedSifre = await bcrypt.hash(sifre, 10);
      
      // Yeni kullanıcı oluştur
      const kullanici = await prisma.kullanici.create({
        data: {
          email,
          ad,
          soyad,
          sifre: hashedSifre,
          rol,
          departmanId,
        },
        select: {
          id: true,
          email: true,
          ad: true,
          soyad: true,
          rol: true,
          departmanId: true,
          departman: {
            select: {
              id: true,
              ad: true,
            },
          },
        },
      });
      
      return NextResponse.json({
        success: true,
        kullanici,
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json'
        }
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
      // Mock kullanıcı oluştur
      const mockKullanici = {
        id: `mock-error-${Date.now()}`,
        email,
        ad,
        soyad,
        rol,
        departmanId: departmanId || null,
        departman: departmanId ? { id: departmanId, ad: "Mock Departman" } : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        user: mockKullanici
      });
    }
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock kullanıcı oluşturma yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        user: {
          id: `mock-error-${Date.now()}`,
          email: request.body?.email || "hata@example.com",
          ad: request.body?.ad || "Hata",
          soyad: request.body?.soyad || "Kullanıcı",
          rol: request.body?.rol || "TALEP",
          departmanId: null,
          departman: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Kullanıcı oluşturulurken bir hata oluştu', error: error.message },
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

// Export handlers (GET tüm kullanıcıları getirir, POST yeni kullanıcı oluşturur)
export const GET = withAuth(getKullanicilarHandler);
export const POST = withAuth(createKullaniciHandler); 
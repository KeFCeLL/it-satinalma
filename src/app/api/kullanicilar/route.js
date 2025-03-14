import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';
import bcrypt from 'bcrypt';

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
    });
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    
    return NextResponse.json(
      { error: 'Kullanıcılar getirilirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Yeni kullanıcı oluştur
async function createKullaniciHandler(request) {
  try {
    // Request body'den verileri al
    const body = await request.json();
    const { email, sifre, ad, soyad, rol, departmanId } = body;
    
    console.log("Kullanıcı oluşturma isteği alındı:", { email, ad, soyad, rol, departmanId, sifreLength: sifre?.length });
    
    // Zorunlu alanları kontrol et
    if (!email || !sifre || !ad || !soyad || !rol) {
      console.log("Eksik alanlar:", { 
        emailVar: !!email, 
        sifreVar: !!sifre, 
        adVar: !!ad, 
        soyadVar: !!soyad, 
        rolVar: !!rol 
      });
      
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik', eksikAlanlar: { email: !email, sifre: !sifre, ad: !ad, soyad: !soyad, rol: !rol } },
        { status: 400 }
      );
    }
    
    // Kullanıcının daha önce kayıtlı olup olmadığını kontrol et
    const existingUser = await prisma.kullanici.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log("Kullanıcı zaten var:", email);
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var' },
        { status: 400 }
      );
    }
    
    try {
      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(sifre, 10);
      
      // DepartmanId kontrolü - varsa ve geçerliyse kullan, yoksa null olarak ayarla
      let validDepartmanId = null;
      if (departmanId) {
        // Departmanın var olup olmadığını kontrol et
        const departman = await prisma.departman.findUnique({
          where: { id: departmanId }
        });
        
        if (departman) {
          validDepartmanId = departmanId;
        } else {
          console.warn(`Belirtilen departmanId (${departmanId}) veritabanında bulunamadı. Null olarak ayarlanıyor.`);
        }
      }
      
      // Yeni kullanıcı oluştur
      const newUser = await prisma.kullanici.create({
        data: {
          email,
          sifre: hashedPassword,
          ad,
          soyad,
          rol,
          departmanId: validDepartmanId,
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
          createdAt: true,
          updatedAt: true,
        },
      });
      
      console.log("Kullanıcı başarıyla oluşturuldu:", newUser.id);
      return NextResponse.json({
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu',
        user: newUser,
      });
    } catch (dbError) {
      console.error('Veritabanı işlemi sırasında hata:', dbError);
      return NextResponse.json(
        { error: `Veritabanı hatası: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    
    return NextResponse.json(
      { error: `Kullanıcı oluşturulurken bir hata oluştu: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export handlers (GET tüm kullanıcıları getirir, POST yeni kullanıcı oluşturur)
export const GET = withAuth(getKullanicilarHandler); // Tüm kullanıcıları sadece yetkililer görebilir
export const POST = withAuth(createKullaniciHandler); // Geçici olarak tüm kullanıcılara oluşturma yetkisi ver 
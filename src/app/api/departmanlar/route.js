import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../middleware';

// Tüm departmanları getir
async function getDepartmanlarHandler(request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const hepsi = searchParams.get('hepsi') === 'true';
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '10');
    const arama = searchParams.get('arama') || '';
    
    console.log("Departmanlar API çağrısı - Parametreler:", { hepsi, sayfa, sayfaBasi, arama });

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

    console.log("Departmanlar API - tüm departmanlar:", JSON.stringify(departmanlar, null, 2));
    console.log("Departmanlar API - başarıyla yüklendi, sonuç:", departmanlar.length);

    return NextResponse.json({
      success: true,
      departmanlar: departmanlar,
    });
  } catch (error) {
    console.error('Departmanlar getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Yeni departman ekle
async function createDepartmanHandler(request) {
  try {
    console.log("Departman oluşturma isteği alındı");
    
    // İsteği kontrol et
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Geçersiz Content-Type:", contentType);
      return NextResponse.json(
        { success: false, message: "Geçersiz istek formatı. JSON göndermelisiniz." },
        { status: 400 }
      );
    }
    
    // JSON verisini al
    const body = await request.json().catch(err => {
      console.error("JSON parse hatası:", err);
      return null;
    });
    
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Geçersiz JSON verisi" },
        { status: 400 }
      );
    }
    
    const { ad, aciklama } = body;
    console.log("Departman oluşturma verisi:", { ad, aciklama });

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Departman adı gereklidir' },
        { status: 400 }
      );
    }

    // Aynı isimde departman var mı kontrol et - SQLite için uyumlu sorgu
    // SQLite'da büyük/küçük harf duyarsız sorgu yapmak için LOWER() kullanırız
    const existingDepartman = await prisma.departman.findFirst({
      where: {
        ad: {
          equals: ad,
        },
      },
    });

    if (existingDepartman) {
      console.log("Bu isimde departman zaten var:", existingDepartman);
      return NextResponse.json(
        { success: false, message: 'Bu isimde bir departman zaten mevcut' },
        { status: 400 }
      );
    }

    try {
      // Yeni departman oluştur
      const newDepartman = await prisma.departman.create({
        data: {
          ad,
          aciklama: aciklama || null,
        },
      });
      
      console.log("Yeni departman oluşturuldu:", newDepartman);
      return NextResponse.json({
        success: true,
        message: 'Departman başarıyla oluşturuldu',
        departman: newDepartman,
      }, { status: 201 });
    } catch (dbError) {
      console.error("Veritabanı hatası:", dbError);
      return NextResponse.json(
        { success: false, message: 'Veritabanı hatası', error: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Departman oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export GET ve POST metodları
export const GET = getDepartmanlarHandler; // Yetkilendirme olmadan erişilebilir
// export const POST = withAuth(createDepartmanHandler); // Yetkilendirme ile 
export const POST = createDepartmanHandler; // Yetkilendirme olmadan, test için 
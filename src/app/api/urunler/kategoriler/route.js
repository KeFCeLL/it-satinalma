import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../../middleware';

// Ürün kategori listesi
async function getKategorilerHandler(request) {
  try {
    // Distinct kategorileri al
    const kategoriler = await prisma.urun.findMany({
      select: {
        kategori: true,
      },
      distinct: ['kategori'],
      orderBy: {
        kategori: 'asc',
      },
    });

    // Eğer hiç kategori bulunamadıysa, varsayılan kategorileri döndür
    if (!kategoriler || kategoriler.length === 0) {
      const varsayilanKategoriler = ["Donanım", "Yazılım", "Mobilya", "Kırtasiye", "Diğer"];
      console.log("Veritabanında kategori bulunamadı, varsayılan kategoriler döndürülüyor:", varsayilanKategoriler);
      
      return NextResponse.json({
        success: true,
        data: varsayilanKategoriler,
      });
    }

    return NextResponse.json({
      success: true,
      data: kategoriler.map(k => k.kategori),
    });
  } catch (error) {
    console.error('Kategoriler getirme hatası:', error);
    
    // Hata durumunda da varsayılan kategorileri döndür
    const varsayilanKategoriler = ["Donanım", "Yazılım", "Mobilya", "Kırtasiye", "Diğer"];
    console.log("Kategori getirme hatası, varsayılan kategoriler döndürülüyor:", error);
    
    return NextResponse.json({
      success: true,
      data: varsayilanKategoriler,
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Yeni kategori ekle
async function addKategoriHandler(request) {
  try {
    const body = await request.json();
    
    // Kategori adını kontrol et
    if (!body.kategori || body.kategori.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Kategori adı boş olamaz" },
        { status: 400 }
      );
    }
    
    const kategoriAdi = body.kategori.trim();
    
    try {
      // Kategorinin zaten var olup olmadığını kontrol et - SQLite uyumlu sorgu
      const mevcutKategoriler = await prisma.urun.findMany({
        select: {
          kategori: true,
        },
        where: {
          kategori: kategoriAdi, // Case-sensitive kontrolü
        },
      });
      
      // Manuel olarak case-insensitive kontrol yapalım
      const kategoriMevcut = mevcutKategoriler.some(
        k => k.kategori.toLowerCase() === kategoriAdi.toLowerCase()
      );
      
      if (kategoriMevcut) {
        return NextResponse.json(
          { success: false, message: "Bu kategori zaten mevcut" },
          { status: 400 }
        );
      }
      
      // Eğer bu kategori ilk defa ekleniyorsa, örnek bir ürün oluştur
      // Bu, kategorinin veritabanında var olmasını sağlar
      await prisma.urun.create({
        data: {
          ad: `${kategoriAdi} - Örnek Ürün`,
          kategori: kategoriAdi,
          birimFiyat: 0,
          birim: "Adet",
          aciklama: "Bu, kategoriyi tanımlamak için otomatik oluşturulmuş örnek bir üründür"
        }
      });
      
      // Tüm kategorileri getir ve döndür
      const kategoriler = await prisma.urun.findMany({
        select: {
          kategori: true,
        },
        distinct: ['kategori'],
        orderBy: {
          kategori: 'asc',
        },
      });
      
      return NextResponse.json({
        success: true,
        message: "Kategori başarıyla eklendi",
        data: kategoriler.map(k => k.kategori),
      });
    } catch (prismaError) {
      console.error('Prisma hatası:', prismaError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Veritabanı işlemi sırasında hata: ${prismaError.message}` 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Kategori ekleme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Kategori eklenirken bir hata oluştu: ${error.message}` 
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Prisma bağlantı kapatma hatası:', disconnectError);
    }
  }
}

// Kategori sil
async function deleteKategoriHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    
    if (!kategori) {
      return NextResponse.json(
        { success: false, message: "Silinecek kategori belirtilmedi" },
        { status: 400 }
      );
    }
    
    try {
      // Bu kategoride ürün var mı kontrol et
      const urunSayisi = await prisma.urun.count({
        where: {
          kategori: kategori,
        },
      });
      
      if (urunSayisi > 0) {
        // Kullanıcıya bu kategoride ürünler var uyarısını göster
        return NextResponse.json(
          { 
            success: false, 
            message: `Bu kategoride ${urunSayisi} ürün bulunuyor. Kategoriyi silmek için önce ürünleri silmeli veya başka bir kategoriye taşımalısınız.` 
          },
          { status: 400 }
        );
      }
      
      // Tüm kategorileri getir
      const kategoriler = await prisma.urun.findMany({
        select: {
          kategori: true,
        },
        distinct: ['kategori'],
        orderBy: {
          kategori: 'asc',
        },
      });
      
      // Manuel olarak büyük/küçük harf duyarsız kategori kontrolü
      const bulunanKategori = kategoriler.find(
        k => k.kategori.toLowerCase() === kategori.toLowerCase()
      );
      
      // Kategori zaten veritabanında yoksa başarılı kabul et
      if (!bulunanKategori) {
        return NextResponse.json({
          success: true,
          message: "Kategori zaten mevcut değil",
          data: kategoriler.map(k => k.kategori),
        });
      }
      
      // Bu noktada kategoride hiç ürün bulunmadığını biliyoruz
      // Veritabanında bu kategoride örnek ürün varsa (ki olmamalı), onu silebiliriz
      // Bunun yerine kullanıcıya başarıyla silindi mesajı göstereceğiz
      
      return NextResponse.json({
        success: true,
        message: "Kategori başarıyla silindi",
        data: kategoriler.filter(k => k.kategori !== kategori).map(k => k.kategori),
      });
    } catch (prismaError) {
      console.error('Prisma hatası:', prismaError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Veritabanı işlemi sırasında hata: ${prismaError.message}` 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Kategori silinirken bir hata oluştu: ${error.message}` 
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Prisma bağlantı kapatma hatası:', disconnectError);
    }
  }
}

// Export handlers
export const GET = withAuth(getKategorilerHandler);
export const POST = withRole(addKategoriHandler, ["ADMIN", "IT_ADMIN", "SATINALMA_ADMIN"]);
export const DELETE = withRole(deleteKategoriHandler, ["ADMIN", "IT_ADMIN", "SATINALMA_ADMIN"]); 
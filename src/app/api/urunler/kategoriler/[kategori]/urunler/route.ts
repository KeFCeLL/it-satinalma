import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';

// Loglama işlevi
function logInfo(message: string, data: any = null) {
  const logMsg = `🔵 [API/Urunler/Kategoriler/Urunler] ${message}`;
  if (data) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
}

function logError(message: string, error: any = null) {
  const logMsg = `🔴 [API/Urunler/Kategoriler/Urunler] ${message}`;
  if (error) {
    console.error(logMsg, error);
  } else {
    console.error(logMsg);
  }
}

async function deleteKategoriUrunleriHandler(
  request: Request,
  { params }: { params: { kategori: string } }
) {
  try {
    const { kategori } = params;
    
    logInfo(`Kategori ürünlerini silme isteği:`, { kategori });

    try {
      // Kategorideki ürünleri sil
      const result = await prisma.urun.deleteMany({
        where: {
          kategori: kategori
        }
      });

      logInfo(`Kategori ürünleri başarıyla silindi:`, { 
        kategori,
        silinenUrunSayisi: result.count 
      });

      return NextResponse.json({
        success: true,
        message: `${result.count} ürün başarıyla silindi`
      });

    } catch (error: any) {
      logError('Veritabanı hatası:', error);
      return NextResponse.json(
        { success: false, error: 'Ürünler silinirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logError('İstek işlenirken bir hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

async function updateUrunKategorileriHandler(
  request: Request,
  { params }: { params: { kategori: string } }
) {
  try {
    const { kategori } = params;
    const body = await request.json();
    const { yeniKategori } = body;

    if (!yeniKategori) {
      return NextResponse.json(
        { success: false, message: "Yeni kategori belirtilmedi" },
        { status: 400 }
      );
    }

    // Ürünleri yeni kategoriye taşı
    await prisma.urun.updateMany({
      where: {
        kategori: kategori,
      },
      data: {
        kategori: yeniKategori,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ürünler başarıyla taşındı",
    });
  } catch (error) {
    console.error('Ürün kategorileri güncelleme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Ürünler taşınırken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Sadece ADMIN ve IT_ADMIN rollerine sahip kullanıcılar ürünleri silebilir
export const DELETE = withAuth(withRole(['ADMIN', 'IT_ADMIN'], deleteKategoriUrunleriHandler));
export const PATCH = withRole(updateUrunKategorileriHandler, ["ADMIN", "IT_ADMIN", "SATINALMA_ADMIN"]); 
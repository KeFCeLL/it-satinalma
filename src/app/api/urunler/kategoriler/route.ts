import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');

    if (kategori) {
      // Belirli bir kategorideki ürün sayısını kontrol et
      const urunSayisi = await prisma.urun.count({
        where: {
          kategori: kategori
        }
      });

      return NextResponse.json({
        success: true,
        urunSayisi,
        message: `${kategori} kategorisinde ${urunSayisi} ürün bulunuyor.`
      });
    }

    // Tüm kategorileri getir
    const kategoriler = await prisma.urun.findMany({
      select: {
        kategori: true
      },
      distinct: ['kategori'],
      orderBy: {
        kategori: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: kategoriler.map((k: { kategori: string }) => k.kategori)
    });
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Kategoriler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');

    if (!kategori) {
      return NextResponse.json(
        { success: false, message: 'Kategori belirtilmedi' },
        { status: 400 }
      );
    }

    // Kategoriyi sil
    await prisma.urun.deleteMany({
      where: {
        kategori: kategori
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    console.error('Kategori silinirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Kategori silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
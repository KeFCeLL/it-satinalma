import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET metodu ile kategori ekleme - Vercel'de POST sorunları için alternatif çözüm
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategoriAdi = searchParams.get('name');

    if (!kategoriAdi || kategoriAdi.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir kategori adı gereklidir' },
        { status: 400 }
      );
    }

    // Kategorinin zaten var olup olmadığını kontrol et
    const mevcutKategori = await prisma.urun.findFirst({
      where: {
        kategori: {
          equals: kategoriAdi.trim(),
          mode: 'insensitive' // Büyük-küçük harf duyarsız
        }
      }
    });

    if (mevcutKategori) {
      return NextResponse.json(
        { success: false, message: 'Bu kategori zaten mevcut' },
        { status: 400 }
      );
    }

    // Yeni bir kategori oluşturmak için örnek bir ürün ekliyoruz
    await prisma.urun.create({
      data: {
        ad: `${kategoriAdi} - Örnek Ürün`,
        kategori: kategoriAdi.trim(),
        birimFiyat: 0,
        birim: 'Adet',
        aciklama: 'Bu ürün, yeni kategori oluşturmak için otomatik olarak eklenmiştir.'
      }
    });

    // Tüm kategorileri döndür
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
      message: 'Kategori başarıyla eklendi',
      data: kategoriler.map((k: { kategori: string }) => k.kategori)
    });
  } catch (error) {
    console.error('Kategori eklenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Kategori eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../middleware';

// Tüm ürünleri getir
async function getUrunlerHandler(request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    const aramaMetni = searchParams.get('q');
    const sortBy = searchParams.get('sortBy') || 'ad';
    const sortDir = searchParams.get('sortDir') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Filtre koşulları
    const where = {};
    
    if (kategori) {
      where.kategori = kategori;
    }
    
    if (aramaMetni) {
      where.OR = [
        {
          ad: {
            contains: aramaMetni,
            mode: 'insensitive',
          },
        },
        {
          aciklama: {
            contains: aramaMetni,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Sıralama
    const orderBy = {};
    orderBy[sortBy] = sortDir;

    // Toplam sayıyı al
    const total = await prisma.urun.count({ where });

    // Sayfalama ile ürünleri getir
    const urunler = await prisma.urun.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: urunler,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Ürünler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Yeni ürün ekle
async function createUrunHandler(request) {
  try {
    const { ad, kategori, birimFiyat, birim, aciklama } = await request.json();
    
    console.log("API'ye gelen veriler:", { ad, kategori, birimFiyat, birim, aciklama });

    // Zorunlu alanları kontrol et
    if (!ad || !kategori || !birimFiyat) {
      return NextResponse.json(
        { success: false, message: 'Ad, kategori ve birim fiyat alanları zorunludur' },
        { status: 400 }
      );
    }

    // Birim fiyatı sayısal olmalı
    if (isNaN(parseFloat(birimFiyat))) {
      return NextResponse.json(
        { success: false, message: 'Birim fiyat sayısal bir değer olmalıdır' },
        { status: 400 }
      );
    }

    // Aynı isimde ürün var mı kontrol et
    const existingUrun = await prisma.urun.findFirst({
      where: {
        ad: ad
      },
    });

    if (existingUrun) {
      return NextResponse.json(
        { success: false, message: 'Bu isimde bir ürün zaten mevcut' },
        { status: 400 }
      );
    }

    // Yeni ürün oluştur
    const newUrun = await prisma.urun.create({
      data: {
        ad,
        kategori,
        birimFiyat: parseFloat(birimFiyat),
        birim: birim || 'Adet',
        aciklama: aciklama || '',
      },
    });
    
    console.log("Oluşturulan ürün:", newUrun);

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: newUrun,
    }, { status: 201 });
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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

    return NextResponse.json({
      success: true,
      data: kategoriler.map(k => k.kategori),
    });
  } catch (error) {
    console.error('Kategoriler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// İzin verilen roller
const adminRoles = ['ADMIN', 'IT_ADMIN', 'SATINALMA_ADMIN'];

// Export handler'ları
export const GET = withAuth(getUrunlerHandler);
export const POST = withRole(createUrunHandler, adminRoles); 
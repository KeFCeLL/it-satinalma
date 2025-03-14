import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../middleware';

// Kullanıcının bildirimlerini getir
async function getBildirimlerHandler(request) {
  try {
    // Kullanıcı bilgilerini al
    const { id: kullaniciId } = request.user;
    
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const okundu = searchParams.get('okundu');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Filtre koşulları
    const where = { kullaniciId };
    
    if (okundu !== null && okundu !== undefined) {
      where.okundu = okundu === 'true';
    }

    // Toplam sayıyı al
    const total = await prisma.bildirim.count({ where });

    // Sayfalama ile bildirimleri getir
    const bildirimler = await prisma.bildirim.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(total / pageSize);

    // Okunmamış bildirim sayısını al
    const okunmamisCount = await prisma.bildirim.count({
      where: {
        kullaniciId,
        okundu: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: bildirimler,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        okunmamisCount,
      },
    });
  } catch (error) {
    console.error('Bildirimler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Tüm bildirimleri okundu olarak işaretle
async function readAllBildirimlerHandler(request) {
  try {
    // Kullanıcı bilgilerini al
    const { id: kullaniciId } = request.user;
    
    // Tüm okunmamış bildirimleri güncelle
    const { count } = await prisma.bildirim.updateMany({
      where: {
        kullaniciId,
        okundu: false,
      },
      data: {
        okundu: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${count} bildirim okundu olarak işaretlendi`,
      count,
    });
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export handler'ları
export const GET = withAuth(getBildirimlerHandler);
export const PUT = withAuth(readAllBildirimlerHandler); 
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../../middleware';

// Tek ürün getir
async function getUrunHandler(request, { params }) {
  try {
    const id = await params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Ürün ID gereklidir' },
        { status: 400 }
      );
    }

    const urun = await prisma.urun.findUnique({
      where: { id },
    });

    if (!urun) {
      return NextResponse.json(
        { success: false, message: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: urun,
    });
  } catch (error) {
    console.error('Ürün getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Ürün güncelle
async function updateUrunHandler(request, { params }) {
  try {
    const id = await params.id;
    const { ad, kategori, birimFiyat, birim, aciklama } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Ürün ID gereklidir' },
        { status: 400 }
      );
    }

    // Zorunlu alanları kontrol et
    if (!ad || !kategori || !birimFiyat || !birim) {
      return NextResponse.json(
        { success: false, message: 'Ad, kategori, birim fiyat ve birim alanları zorunludur' },
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

    // Ürünün var olup olmadığını kontrol et
    const existingUrun = await prisma.urun.findUnique({
      where: { id },
    });

    if (!existingUrun) {
      return NextResponse.json(
        { success: false, message: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    // Aynı isimde başka bir ürün var mı kontrol et
    const duplicateUrun = await prisma.urun.findFirst({
      where: {
        ad: ad,
        NOT: {
          id: id
        }
      }
    });

    if (duplicateUrun) {
      return NextResponse.json(
        { success: false, message: 'Bu isimde başka bir ürün zaten mevcut' },
        { status: 400 }
      );
    }

    // Ürünü güncelle
    const updatedUrun = await prisma.urun.update({
      where: { id },
      data: {
        ad,
        kategori,
        birimFiyat: parseFloat(birimFiyat),
        birim,
        aciklama: aciklama || '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: updatedUrun,
    });
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Ürün sil
async function deleteUrunHandler(request, { params }) {
  try {
    const id = await params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Ürün ID gereklidir' },
        { status: 400 }
      );
    }

    // Ürünün var olup olmadığını kontrol et
    const existingUrun = await prisma.urun.findUnique({
      where: { id },
      include: {
        talepItems: true,
      },
    });

    if (!existingUrun) {
      return NextResponse.json(
        { success: false, message: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    // İlişkili talep varsa silmeyi engelle
    if (existingUrun.talepItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Bu ürüne ait talep kayıtları bulunduğu için silinemez',
          talepSayisi: existingUrun.talepItems.length
        },
        { status: 400 }
      );
    }

    // Ürünü sil
    await prisma.urun.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla silindi',
    });
  } catch (error) {
    console.error('Ürün silme hatası:', error);
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
export const GET = withAuth(getUrunHandler);
export const PUT = withRole(updateUrunHandler, adminRoles);
export const DELETE = withRole(deleteUrunHandler, adminRoles); 
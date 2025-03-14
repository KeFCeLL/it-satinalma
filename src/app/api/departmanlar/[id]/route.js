import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../../middleware';

// Tek departman getir
async function getDepartmanHandler(request, { params }) {
  try {
    const id = await params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Departman ID gereklidir' },
        { status: 400 }
      );
    }

    const departman = await prisma.departman.findUnique({
      where: { id },
      include: {
        kullanicilar: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
            rol: true,
          },
        },
      },
    });

    if (!departman) {
      return NextResponse.json(
        { success: false, message: 'Departman bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: departman,
    });
  } catch (error) {
    console.error('Departman getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Departman güncelle
async function updateDepartmanHandler(request, { params }) {
  try {
    const id = await params.id;
    const body = await request.json();
    const { ad, aciklama } = body;

    console.log("Departman güncelleme isteği alındı:", { id, ad, aciklama });

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Departman ID gereklidir' },
        { status: 400 }
      );
    }

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Departman adı gereklidir' },
        { status: 400 }
      );
    }

    // Departmanın var olup olmadığını kontrol et
    const existingDepartman = await prisma.departman.findUnique({
      where: { id },
    });

    if (!existingDepartman) {
      return NextResponse.json(
        { success: false, message: 'Departman bulunamadı' },
        { status: 404 }
      );
    }

    // Aynı isimde başka bir departman var mı kontrol et
    const duplicateDepartman = await prisma.departman.findFirst({
      where: {
        ad: {
          equals: ad,
        },
        NOT: {
          id: id,
        },
      },
    });

    if (duplicateDepartman) {
      return NextResponse.json(
        { success: false, message: 'Bu isimde başka bir departman zaten mevcut' },
        { status: 400 }
      );
    }

    // Departmanı güncelle
    const updatedDepartman = await prisma.departman.update({
      where: { id },
      data: { 
        ad,
        aciklama: aciklama || null 
      },
    });

    console.log("Departman güncellendi:", updatedDepartman);
    
    return NextResponse.json({
      success: true,
      message: 'Departman başarıyla güncellendi',
      departman: updatedDepartman,
    });
  } catch (error) {
    console.error('Departman güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Departman sil
async function deleteDepartmanHandler(request, { params }) {
  try {
    const id = await params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Departman ID gereklidir' },
        { status: 400 }
      );
    }

    // Departmanın var olup olmadığını kontrol et
    const existingDepartman = await prisma.departman.findUnique({
      where: { id },
      include: {
        kullanicilar: true,
        talepler: true,
      },
    });

    if (!existingDepartman) {
      return NextResponse.json(
        { success: false, message: 'Departman bulunamadı' },
        { status: 404 }
      );
    }

    // İlişkili kullanıcı veya talep varsa silmeyi engelle
    if (existingDepartman.kullanicilar.length > 0 || existingDepartman.talepler.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Bu departmana ait kullanıcılar veya talepler bulunduğu için silinemez',
          kullaniciSayisi: existingDepartman.kullanicilar.length,
          talepSayisi: existingDepartman.talepler.length
        },
        { status: 400 }
      );
    }

    // Departmanı sil
    await prisma.departman.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Departman başarıyla silindi',
    });
  } catch (error) {
    console.error('Departman silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Admin ve IT_ADMIN yetkileri gerektiren işlemler için
const adminRoles = ['ADMIN', 'IT_ADMIN'];

// Export handler'ları
export const GET = getDepartmanHandler;
export const PUT = updateDepartmanHandler;
export const DELETE = deleteDepartmanHandler; 
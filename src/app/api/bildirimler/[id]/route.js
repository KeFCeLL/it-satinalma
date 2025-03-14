import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../../middleware';

// Tek bir bildirimi getir
async function getBildirimHandler(request, { params }) {
  try {
    const id = await params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Bildirim ID gereklidir' },
        { status: 400 }
      );
    }

    // Bildirimi getir
    const bildirim = await prisma.bildirim.findUnique({
      where: { id },
    });

    if (!bildirim) {
      return NextResponse.json(
        { success: false, message: 'Bildirim bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı yetki kontrolü
    const { id: kullaniciId } = request.user;

    if (bildirim.kullaniciId !== kullaniciId) {
      return NextResponse.json(
        { success: false, message: 'Bu bildirimi görüntüleme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bildirim,
    });
  } catch (error) {
    console.error('Bildirim getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Bildirimi okundu olarak işaretle
async function updateBildirimHandler(request, { params }) {
  try {
    const id = await params.id;
    const { okundu } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Bildirim ID gereklidir' },
        { status: 400 }
      );
    }

    if (okundu === undefined) {
      return NextResponse.json(
        { success: false, message: 'Okundu durumu gereklidir' },
        { status: 400 }
      );
    }

    // Bildirimin var olup olmadığını kontrol et
    const bildirim = await prisma.bildirim.findUnique({
      where: { id },
    });

    if (!bildirim) {
      return NextResponse.json(
        { success: false, message: 'Bildirim bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı yetki kontrolü
    const { id: kullaniciId } = request.user;

    if (bildirim.kullaniciId !== kullaniciId) {
      return NextResponse.json(
        { success: false, message: 'Bu bildirimi güncelleme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Bildirimi güncelle
    const updatedBildirim = await prisma.bildirim.update({
      where: { id },
      data: {
        okundu,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bildirim başarıyla güncellendi',
      data: updatedBildirim,
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

// Bildirimi sil
async function deleteBildirimHandler(request, { params }) {
  try {
    const id = await params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Bildirim ID gereklidir' },
        { status: 400 }
      );
    }

    // Bildirimin var olup olmadığını kontrol et
    const bildirim = await prisma.bildirim.findUnique({
      where: { id },
    });

    if (!bildirim) {
      return NextResponse.json(
        { success: false, message: 'Bildirim bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı yetki kontrolü
    const { id: kullaniciId, rol } = request.user;

    if (bildirim.kullaniciId !== kullaniciId && rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Bu bildirimi silme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Bildirimi sil
    await prisma.bildirim.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Bildirim başarıyla silindi',
    });
  } catch (error) {
    console.error('Bildirim silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export handler'ları
export const GET = withAuth(getBildirimHandler);
export const PUT = withAuth(updateBildirimHandler);
export const DELETE = withAuth(deleteBildirimHandler); 
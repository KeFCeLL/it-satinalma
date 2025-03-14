import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';
import bcrypt from 'bcrypt';

// GET - Tek bir kullanıcıyı getir
async function getKullaniciHandler(request, { params }) {
  try {
    const { id } = params;
    
    // Kullanıcıyı bul
    const kullanici = await prisma.kullanici.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        rol: true,
        departmanId: true,
        departman: {
          select: {
            id: true,
            ad: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!kullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: kullanici,
    });
  } catch (error) {
    console.error('Kullanıcı getirme hatası:', error);
    
    return NextResponse.json(
      { error: 'Kullanıcı getirilirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Kullanıcı güncelle
async function updateKullaniciHandler(request, { params }) {
  try {
    // Oturum bilgisi middleware tarafından ekleniyor
    const sessionUser = request.user;
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Bu işlem için giriş yapmalısınız" },
        { status: 401 }
      );
    }

    // Admin değilse ve kendi hesabı değilse erişim engelleme
    if (sessionUser.rol !== "ADMIN" && sessionUser.id !== params.id) {
      return NextResponse.json(
        { error: "Bu işleme erişim yetkiniz yok" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { email, sifre, ad, soyad, rol, departmanId, durum } = body;
    
    // Kullanıcının var olup olmadığını kontrol et
    const existingUser = await prisma.kullanici.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    // Güncelleme verileri
    const updateData = {};
    
    // Temel alanlar - herkes kendi hesabını veya admin başkalarını güncelleyebilir
    if (email !== undefined) updateData.email = email;
    if (ad !== undefined) updateData.ad = ad;
    if (soyad !== undefined) updateData.soyad = soyad;
    
    // Durum değişikliği tüm kullanıcılar için geçerli
    if (durum !== undefined) updateData.durum = durum;
    
    // Admin yetkileri gerektiren alanlar
    if (sessionUser.rol === "ADMIN") {
      if (rol !== undefined) updateData.rol = rol;
      if (departmanId !== undefined) updateData.departmanId = departmanId || null;
    }
    
    // Eğer şifre varsa güncelle
    if (sifre) {
      updateData.sifre = await bcrypt.hash(sifre, 10);
    }
    
    // Kullanıcıyı güncelle
    const updatedUser = await prisma.kullanici.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        ad: true,
        soyad: true,
        rol: true,
        departmanId: true,
        durum: true,
        departman: {
          select: {
            id: true,
            ad: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    
    return NextResponse.json(
      { error: 'Kullanıcı güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Kullanıcı sil
async function deleteKullaniciHandler(request, { params }) {
  try {
    const { id } = params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const existingUser = await prisma.kullanici.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    // Admin kullanıcısının silinmesini engelle
    if (existingUser.rol === 'ADMIN' && existingUser.email === 'admin@sirket.com') {
      return NextResponse.json(
        { error: 'Ana yönetici hesabı silinemez' },
        { status: 403 }
      );
    }
    
    // Kullanıcıyı sil
    await prisma.kullanici.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi',
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    
    return NextResponse.json(
      { error: 'Kullanıcı silinirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export handlers
export const GET = withAuth(getKullaniciHandler);
export const PUT = withAuth(updateKullaniciHandler);
export const DELETE = withRole(deleteKullaniciHandler, ['ADMIN']); 
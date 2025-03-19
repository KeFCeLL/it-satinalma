import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/api/middleware';

const prisma = new PrismaClient();

// Kullanıcı detaylarını getir
async function getKullaniciHandler(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // Kullanıcıyı getir
    const kullanici = await prisma.kullanici.findUnique({
      where: { id },
      include: {
        departman: true
      }
    });

    if (!kullanici) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Şifreyi yanıttan çıkar
    const { sifre, ...kullaniciWithoutPassword } = kullanici;

    return NextResponse.json({
      success: true,
      kullanici: kullaniciWithoutPassword
    });
  } catch (error: any) {
    console.error('Kullanıcı getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Kullanıcı güncelleme
async function updateKullaniciHandler(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();

    // Gerekli alanları kontrol et
    if (!body.ad || !body.soyad || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Kullanıcıyı güncelle
    const updatedKullanici = await prisma.kullanici.update({
      where: { id },
      data: {
        ad: body.ad,
        soyad: body.soyad,
        email: body.email,
        departmanId: body.departmanId,
        rol: body.rol,
        durum: body.durum
      }
    });

    // Şifreyi yanıttan çıkar
    const { sifre, ...kullaniciWithoutPassword } = updatedKullanici;

    return NextResponse.json({
      success: true,
      kullanici: kullaniciWithoutPassword
    });
  } catch (error: any) {
    console.error('Kullanıcı güncelleme hatası:', error);
    
    // Hata detaylarını kontrol et
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor' },
        { status: 409 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getKullaniciHandler);
export const PUT = withAuth(updateKullaniciHandler); 
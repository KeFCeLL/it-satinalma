import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../../../middleware';

// Talebin notlarını getir
async function getNotlarHandler(request, { params }) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Talep ID gereklidir' },
        { status: 400 }
      );
    }

    // Talebin var olup olmadığını kontrol et
    const talep = await prisma.talep.findUnique({
      where: { id },
    });

    if (!talep) {
      return NextResponse.json(
        { success: false, message: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı yetki kontrolü
    const { rol, id: kullaniciId, departmanId: kullaniciDepartmanId } = request.user;

    // Normal kullanıcılar sadece kendi taleplerini görebilir
    if (rol === 'KULLANICI' && talep.talepEdenId !== kullaniciId) {
      return NextResponse.json(
        { success: false, message: 'Bu talebin notlarını görüntüleme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Departman yöneticileri sadece kendi departmanlarının taleplerini görebilir
    if (rol === 'DEPARTMAN_YONETICISI' && talep.departmanId !== kullaniciDepartmanId) {
      return NextResponse.json(
        { success: false, message: 'Bu talebin notlarını görüntüleme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Notları getir
    const notlar = await prisma.talepNotu.findMany({
      where: {
        talepId: id,
      },
      include: {
        kullanici: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
            rol: true,
            departman: true,
          },
        },
      },
      orderBy: {
        tarih: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: notlar,
    });
  } catch (error) {
    console.error('Talep notları getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Talebe not ekle
async function createNotHandler(request, { params }) {
  try {
    const id = params.id;
    const { icerik } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Talep ID gereklidir' },
        { status: 400 }
      );
    }

    if (!icerik || icerik.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Not içeriği gereklidir' },
        { status: 400 }
      );
    }

    // Talebin var olup olmadığını kontrol et
    const talep = await prisma.talep.findUnique({
      where: { id },
    });

    if (!talep) {
      return NextResponse.json(
        { success: false, message: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı bilgilerini al
    const { id: kullaniciId, rol, departmanId: kullaniciDepartmanId } = request.user;

    // Yetki kontrolü - herkes kendi departmanıyla ilgili taleplere not ekleyebilir
    let yetkiliKullanici = false;
    
    if (rol === 'ADMIN') {
      yetkiliKullanici = true;
    } else if (rol === 'KULLANICI' && talep.talepEdenId === kullaniciId) {
      yetkiliKullanici = true;
    } else if (rol === 'DEPARTMAN_YONETICISI' && talep.departmanId === kullaniciDepartmanId) {
      yetkiliKullanici = true;
    } else if (rol === 'IT_ADMIN' || rol === 'FINANS_ADMIN' || rol === 'SATINALMA_ADMIN') {
      // İlgili departman yöneticileri süreçleri görüntüleyebiliyorlarsa not da yazabilirler
      yetkiliKullanici = true;
    }

    if (!yetkiliKullanici) {
      return NextResponse.json(
        { success: false, message: 'Bu talebe not ekleme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Not ekle
    const yeniNot = await prisma.talepNotu.create({
      data: {
        talepId: id,
        kullaniciId,
        icerik,
        tarih: new Date(),
      },
      include: {
        kullanici: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
            rol: true,
            departman: true,
          },
        },
      },
    });

    // Talep sahibine bildirim gönder (eğer notu ekleyen kişi talep sahibi değilse)
    if (kullaniciId !== talep.talepEdenId) {
      await prisma.bildirim.create({
        data: {
          kullaniciId: talep.talepEden.id,
          baslik: 'Yeni Talep Notu',
          mesaj: `${talep.id} numaralı talebinize yeni bir not eklendi.`,
          okundu: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Not başarıyla eklendi',
      data: yeniNot,
    }, { status: 201 });
  } catch (error) {
    console.error('Talep notu ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export handler'ları
export const GET = withAuth(getNotlarHandler);
export const POST = withAuth(createNotHandler); 
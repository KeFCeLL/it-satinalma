import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../../../middleware';

// Talepe yeni bir onay adımı ekleme
async function adimEkleHandler(request, { params }) {
  try {
    const id = params.id;
    const { adim, durum } = await request.json();

    if (!id || !adim) {
      return NextResponse.json(
        { success: false, message: 'Talep ID ve adım alanları zorunludur' },
        { status: 400 }
      );
    }

    // Geçerli adım değerleri
    const validAdimlar = ['DEPARTMAN_YONETICISI', 'IT_DEPARTMANI', 'FINANS_DEPARTMANI', 'SATINALMA_DEPARTMANI'];
    if (!validAdimlar.includes(adim)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz adım değeri' },
        { status: 400 }
      );
    }

    // Talep ve onay adımlarını getir
    const talep = await prisma.talep.findUnique({
      where: { id },
      include: {
        onaylar: true,
      },
    });

    if (!talep) {
      return NextResponse.json(
        { success: false, message: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Adım zaten eklenmiş mi kontrol et
    const adimVarMi = talep.onaylar.some(onay => onay.adim === adim);
    if (adimVarMi) {
      return NextResponse.json(
        { success: false, message: 'Bu onay adımı zaten eklenmiş' },
        { status: 400 }
      );
    }

    // Kullanıcı bilgilerini al
    const { rol } = request.user;

    // Sadece admin, IT_ADMIN veya SATINALMA_ADMIN kullanıcıları adım ekleyebilir
    const yetkiliKullanici = rol === 'ADMIN' || rol === 'IT_ADMIN' || rol === 'SATINALMA_ADMIN';
    if (!yetkiliKullanici) {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Talep ONAYLANDI durumunda değilse kontrol et
    if (talep.durum !== 'ONAYLANDI' && adim === 'SATINALMA_DEPARTMANI') {
      // Onaylanmış bir talep değilse, satınalma adımı eklenmeden önce 
      // finans departmanı onayı kontrol edilmeli
      const finansOnay = talep.onaylar.find(a => a.adim === 'FINANS_DEPARTMANI');
      if (!finansOnay || finansOnay.durum !== 'ONAYLANDI') {
        return NextResponse.json(
          { success: false, message: 'Satınalma adımı eklemek için önce finans departmanı onayı gereklidir' },
          { status: 400 }
        );
      }
    }

    // Yeni onay adımı ekle
    const yeniOnay = await prisma.onay.create({
      data: {
        talepId: id,
        adim,
        durum: durum || 'BEKLEMEDE',
        aciklama: null,
      },
    });

    // Güncellenmiş talebi getir
    const guncelTalep = await prisma.talep.findUnique({
      where: { id },
      include: {
        departman: true,
        talepEden: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
          },
        },
        urunTalepler: {
          include: {
            urun: true,
          },
        },
        onaylar: {
          include: {
            onaylayan: {
              select: {
                id: true,
                ad: true,
                soyad: true,
                email: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onay adımı başarıyla eklendi',
      talep: guncelTalep,
    });
  } catch (error) {
    console.error("Onay adımı ekleme hatası:", error);
    return NextResponse.json(
      { success: false, message: 'Onay adımı ekleme sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Admin ve IT_ADMIN kullanıcıları için endpoint
export const POST = withAuth(adimEkleHandler); // withRole ile kısıtlanabilir 
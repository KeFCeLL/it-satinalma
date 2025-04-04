import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../../middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Tek talep getir
async function getTalepHandler(request, { params }) {
  try {
    const { id } = params;

    const talep = await prisma.talep.findUnique({
      where: { id },
      include: {
        departman: {
          select: {
            ad: true,
          },
        },
        talepEden: {
          select: {
            ad: true,
            soyad: true,
            email: true,
          },
        },
        urunTalepler: {
          include: {
            urun: {
              select: {
                id: true,
                ad: true,
                birimFiyat: true,
              },
            },
          },
        },
        onaylar: {
          include: {
            onaylayan: {
              select: {
                ad: true,
                soyad: true,
                email: true,
              },
            },
          },
          orderBy: {
            adim: 'asc',
          },
        },
      },
    });

    if (!talep) {
      return NextResponse.json({ success: false, message: 'Talep bulunamadı' }, { status: 404 });
    }

    // Check if user has permission to view this request
    const { role, id: kullaniciId, departmanId: kullaniciDepartmanId } = request.user;

    // Normal kullanıcılar sadece kendi taleplerini görebilir
    if (role === 'KULLANICI' && talep.talepEdenId !== kullaniciId) {
      return NextResponse.json(
        { success: false, message: 'Bu talebi görüntüleme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Departman yöneticileri sadece kendi departmanlarının taleplerini görebilir
    if (role === 'DEPARTMAN_YONETICISI' && talep.departmanId !== kullaniciDepartmanId) {
      return NextResponse.json(
        { success: false, message: 'Bu talebi görüntüleme yetkiniz yok' },
        { status: 403 }
      );
    }

    // IT yöneticisi kontrol
    if (role === 'IT_ADMIN') {
      // Kendi departmanının talebi değilse ve IT onayı aşamasında değilse
      const itOnayAdimi = talep.onaylar.find(adim => adim.adim === 'IT_DEPARTMANI');
      if (talep.departmanId !== kullaniciDepartmanId && 
          (!itOnayAdimi || itOnayAdimi.durum === 'BEKLEMIYOR')) {
        return NextResponse.json(
          { success: false, message: 'Bu talebi görüntüleme yetkiniz yok' },
          { status: 403 }
        );
      }
    }

    // Finans yöneticisi kontrol
    if (role === 'FINANS_ADMIN') {
      // Kendi departmanının talebi değilse ve Finans onayı aşamasında değilse
      const finansOnayAdimi = talep.onaylar.find(adim => adim.adim === 'FINANS_DEPARTMANI');
      if (talep.departmanId !== kullaniciDepartmanId && 
          (!finansOnayAdimi || finansOnayAdimi.durum === 'BEKLEMIYOR')) {
        return NextResponse.json(
          { success: false, message: 'Bu talebi görüntüleme yetkiniz yok' },
          { status: 403 }
        );
      }
    }

    // Satınalma yöneticisi kontrol
    if (role === 'SATINALMA_ADMIN') {
      // Kendi departmanının talebi değilse ve satınalma aşamasında değilse
      if (talep.departmanId !== kullaniciDepartmanId && 
          !['ONAYLANDI', 'SATINALMA_SURECINDE', 'TAMAMLANDI'].includes(talep.durum)) {
        return NextResponse.json(
          { success: false, message: 'Bu talebi görüntüleme yetkiniz yok' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: talep,
    });
  } catch (error) {
    console.error('Talep getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  }
}

// Talep güncelle
async function updateTalepHandler(request, { params }) {
  try {
    const id = await params.id;
    const { baslik, aciklama, oncelik } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Talep ID gereklidir' },
        { status: 400 }
      );
    }

    // Talebin var olup olmadığını kontrol et
    const existingTalep = await prisma.talep.findUnique({
      where: { id },
      include: {
        onaylar: true,
      },
    });

    if (!existingTalep) {
      return NextResponse.json(
        { success: false, message: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı yetki kontrolü
    const { rol, id: kullaniciId } = request.user;
    
    // Sadece talep sahibi veya admin güncelleme yapabilir
    if (rol !== 'ADMIN' && existingTalep.talepEdenId !== kullaniciId) {
      return NextResponse.json(
        { success: false, message: 'Bu talebi güncelleme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Onay süreci başlamış talepleri güncellemeyi engelle
    const onayBasladi = existingTalep.onaylar.some(adim => 
      adim.durum !== 'BEKLEMEDE' && adim.durum !== 'BEKLEMIYOR'
    );
    
    if (onayBasladi && rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Onay süreci başlamış talepleri güncelleyemezsiniz' },
        { status: 400 }
      );
    }

    // Talebi güncelle
    const updatedTalep = await prisma.talep.update({
      where: { id },
      data: {
        baslik: baslik || existingTalep.baslik,
        aciklama: aciklama || existingTalep.aciklama,
        oncelik: oncelik || existingTalep.oncelik,
      },
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
        onaylar: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Talep başarıyla güncellendi',
      data: updatedTalep,
    });
  } catch (error) {
    console.error('Talep güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Talep iptal et / sil
async function deleteTalepHandler(request, { params }) {
  try {
    const id = await params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Talep ID gereklidir' },
        { status: 400 }
      );
    }

    // Talebin var olup olmadığını kontrol et
    const existingTalep = await prisma.talep.findUnique({
      where: { id },
      include: {
        onaylar: true,
      },
    });

    if (!existingTalep) {
      return NextResponse.json(
        { success: false, message: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı yetki kontrolü
    const { rol, id: kullaniciId } = request.user;
    const isAdmin = rol === 'ADMIN';
    
    // Sadece talep sahibi veya admin iptal edebilir
    if (!isAdmin && existingTalep.talepEdenId !== kullaniciId) {
      return NextResponse.json(
        { success: false, message: 'Bu talebi iptal etme/silme yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // Satınalma sürecinde olan talepleri iptal etmeyi engelle
    if (['SATINALMA_SURECINDE', 'TAMAMLANDI'].includes(existingTalep.durum) && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Satınalma sürecinde olan veya tamamlanmış talepleri iptal edemezsiniz' },
        { status: 400 }
      );
    }

    // ADMIN ise silme, değilse iptal etme işlemi yap
    if (isAdmin) {
      // Admin ise talebi tamamen sil
      console.log(`Talep tamamen siliniyor: ${id}, isteği yapan: ${kullaniciId} (${rol})`);
      
      // İlişkili tüm kayıtları silmek için cascading ilişkileri sırası ile silmek gerekiyor
      // Önce talebin onay adımlarını sil
      await prisma.onay.deleteMany({
        where: { talepId: id }
      });
      
      // Talebin notlarını sil
      await prisma.talepNotu.deleteMany({
        where: { talepId: id }
      });
      
      // Talep-ürün ilişkilerini sil
      await prisma.urunTalep.deleteMany({
        where: { talepId: id }
      });
      
      // Talebin dosyalarını sil
      await prisma.dosya.deleteMany({
        where: { talepId: id }
      });
      
      // Son olarak talebi sil
      await prisma.talep.delete({
        where: { id }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Talep başarıyla silindi',
      });
    } else {
      // Admin değilse talebi iptal et
      console.log(`Talep iptal ediliyor: ${id}, isteği yapan: ${kullaniciId} (${rol})`);
      
      // Talebi iptal et (silmek yerine durumunu güncelle)
      await prisma.talep.update({
        where: { id },
        data: {
          durum: 'IPTAL_EDILDI',
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Talep başarıyla iptal edildi',
      });
    }
  } catch (error) {
    console.error('Talep silme/iptal hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// İzin verilen roller
const adminRoles = ['ADMIN'];

// Export handler'ları
export const GET = withAuth(getTalepHandler);
export const PUT = withAuth(updateTalepHandler);
export const DELETE = withAuth(deleteTalepHandler); 
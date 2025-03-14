import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { unlink } from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const readFile = promisify(fs.readFile);

// API config - dosya indirme için boyut sınırlamasını artır
export const config = {
  api: {
    responseLimit: '50mb',
  },
};

// Dosya detaylarını getirme
async function getDosyaHandler(request, { params }) {
  try {
    const talepId = params.id;
    const dosyaId = params.dosyaId;
    console.log(`Dosya detayı getiriliyor, Talep ID: ${talepId}, Dosya ID: ${dosyaId}`);

    const dosya = await prisma.dosya.findFirst({
      where: {
        id: dosyaId,
        talepId: talepId,
      },
      include: {
        yukleyen: {
          select: {
            id: true,
            ad: true,
            soyad: true,
          },
        },
      },
    });

    if (!dosya) {
      console.warn(`Dosya bulunamadı, ID: ${dosyaId}`);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }

    console.log(`Dosya detayı başarıyla getirildi, ID: ${dosyaId}`);
    return NextResponse.json({ dosya });
  } catch (error) {
    console.error('Dosya detayları getirilirken bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Dosya detayları getirilirken bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Dosya indirme
async function downloadDosyaHandler(request, { params }) {
  try {
    const talepId = params.id;
    const dosyaId = params.dosyaId;
    console.log(`Dosya indirme isteği, Talep ID: ${talepId}, Dosya ID: ${dosyaId}`);

    const dosya = await prisma.dosya.findFirst({
      where: {
        id: dosyaId,
        talepId: talepId,
      },
    });

    if (!dosya) {
      console.warn(`İndirilmek istenen dosya bulunamadı, ID: ${dosyaId}`);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, dosya.yol);
    console.log(`Dosya okunuyor: ${filePath}`);
    
    try {
      const fileBuffer = await readFile(filePath);
      console.log(`Dosya okundu, boyut: ${fileBuffer.length} bytes`);

      // Dosya içeriği ile cevap ver
      const response = new NextResponse(fileBuffer);
      response.headers.set('Content-Type', dosya.mimeTipi);
      response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(dosya.ad)}"`);
      console.log('Dosya indirme yanıtı hazırlandı');
      return response;
    } catch (fileError) {
      console.error('Dosya okuma hatası:', fileError);
      return NextResponse.json(
        { error: 'Dosya okunamadı', message: fileError.message },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Dosya indirilirken bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Dosya indirilirken bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Dosya silme
async function deleteDosyaHandler(request, { params }) {
  try {
    const talepId = params.id;
    const dosyaId = params.dosyaId;
    const user = request.auth.user;
    console.log(`Dosya silme isteği, Talep ID: ${talepId}, Dosya ID: ${dosyaId}, Kullanıcı: ${user.id}`);

    // Dosya kaydını bul
    const dosya = await prisma.dosya.findFirst({
      where: {
        id: dosyaId,
        talepId: talepId,
      },
      include: {
        talep: {
          select: {
            talepEdenId: true,
          },
        },
      },
    });

    if (!dosya) {
      console.warn(`Silinmek istenen dosya bulunamadı, ID: ${dosyaId}`);
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }

    // Yetki kontrolü - sadece dosyayı yükleyen veya talebi oluşturan kişi ya da yöneticiler silebilir
    if (user.rol !== 'ADMIN' && user.rol !== 'IT_ADMIN' && 
        user.id !== dosya.yukleyenId && user.id !== dosya.talep.talepEdenId) {
      console.warn(`Yetki hatası: Kullanıcı ${user.id} bu dosyayı silme yetkisine sahip değil`);
      return NextResponse.json(
        { error: 'Bu dosyayı silmek için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Fiziksel dosyayı sil
    const filePath = path.join(UPLOAD_DIR, dosya.yol);
    try {
      await unlink(filePath);
      console.log(`Fiziksel dosya silindi: ${filePath}`);
    } catch (fileError) {
      console.warn('Dosya silinirken bir hata oluştu, veritabanı kaydı yine de silinecek:', fileError);
    }

    // Veritabanından dosya kaydını sil
    await prisma.dosya.delete({
      where: {
        id: dosyaId,
      },
    });
    console.log(`Dosya veritabanından silindi, ID: ${dosyaId}`);

    return NextResponse.json({ 
      message: 'Dosya başarıyla silindi' 
    });
  } catch (error) {
    console.error('Dosya silinirken bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Dosya silinirken bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Dosya açıklamasını güncelleme
async function updateDosyaHandler(request, { params }) {
  try {
    const talepId = params.id;
    const dosyaId = params.dosyaId;
    const { aciklama } = await request.json();
    const user = request.auth.user;

    // Dosya kaydını bul
    const dosya = await prisma.dosya.findFirst({
      where: {
        id: dosyaId,
        talepId: talepId,
      },
      include: {
        talep: {
          select: {
            talepEdenId: true,
          },
        },
      },
    });

    if (!dosya) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }

    // Yetki kontrolü - sadece dosyayı yükleyen veya talebi oluşturan kişi ya da yöneticiler güncelleyebilir
    if (user.rol !== 'ADMIN' && user.rol !== 'IT_ADMIN' && 
        user.id !== dosya.yukleyenId && user.id !== dosya.talep.talepEdenId) {
      return NextResponse.json(
        { error: 'Bu dosyayı güncellemek için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Dosya açıklamasını güncelle
    const updatedDosya = await prisma.dosya.update({
      where: {
        id: dosyaId,
      },
      data: {
        aciklama,
      },
    });

    return NextResponse.json({ 
      message: 'Dosya başarıyla güncellendi',
      dosya: updatedDosya
    });
  } catch (error) {
    console.error('Dosya güncellenirken bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Dosya güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Handler'ları auth kontrolü ile wrap et
export const GET = withAuth(getDosyaHandler);
export const DELETE = withAuth(deleteDosyaHandler);
export const PATCH = withAuth(updateDosyaHandler);

// Dosya indirme için ayrı bir yol
export async function POST(request, { params }) {
  const { searchParams } = new URL(request.url);
  const download = searchParams.get('download');
  
  if (download === 'true') {
    return await withAuth(downloadDosyaHandler)(request, { params });
  }
  
  return NextResponse.json(
    { error: 'Geçersiz işlem' },
    { status: 400 }
  );
} 
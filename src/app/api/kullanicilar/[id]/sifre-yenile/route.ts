import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';
import bcrypt from 'bcryptjs';

// Loglama işlevi
function logInfo(message: string, data: any = null) {
  const logMsg = `🔵 [API/Kullanicilar/SifreYenile] ${message}`;
  if (data) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
}

function logError(message: string, error: any = null) {
  const logMsg = `🔴 [API/Kullanicilar/SifreYenile] ${message}`;
  if (error) {
    console.error(logMsg, error);
  } else {
    console.error(logMsg);
  }
}

async function sifreYenileHandler(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { yeniSifre } = body;

    if (!yeniSifre) {
      return NextResponse.json(
        { success: false, error: 'Yeni şifre gereklidir' },
        { status: 400 }
      );
    }

    logInfo(`Şifre yenileme isteği:`, { id });

    try {
      // Kullanıcıyı bul
      const kullanici = await prisma.kullanici.findUnique({
        where: { id }
      });

      if (!kullanici) {
        return NextResponse.json(
          { success: false, error: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }

      // Şifreyi hash'le
      const hashedPassword = await bcrypt.hash(yeniSifre, 10);

      // Şifreyi güncelle
      await prisma.kullanici.update({
        where: { id },
        data: { sifre: hashedPassword }
      });

      logInfo(`Şifre başarıyla güncellendi: ${id}`);

      return NextResponse.json({
        success: true,
        message: 'Şifre başarıyla güncellendi'
      });

    } catch (error: any) {
      logError('Veritabanı hatası:', error);
      return NextResponse.json(
        { success: false, error: 'Şifre güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logError('İstek işlenirken bir hata oluştu:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Sadece ADMIN ve IT_ADMIN rollerine sahip kullanıcılar şifre yenileyebilir
export const POST = withAuth(withRole(['ADMIN', 'IT_ADMIN'], sifreYenileHandler)); 
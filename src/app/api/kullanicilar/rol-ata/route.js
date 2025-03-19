import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '../../middleware';

// Rol atama işleyicisi
async function assignRoleHandler(request) {
  try {
    const { userIds, rol } = await request.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli kullanıcı ID\'leri gerekli' },
        { status: 400 }
      );
    }

    if (!rol) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir rol gerekli' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Her kullanıcı için rol ata
    for (const userId of userIds) {
      try {
        // Kullanıcıyı kontrol et
        const user = await prisma.kullanici.findUnique({
          where: { id: userId },
          select: { id: true, email: true, ad: true, soyad: true }
        });

        if (!user) {
          errors.push({ userId, error: 'Kullanıcı bulunamadı' });
          continue;
        }

        // Rolü güncelle
        await prisma.kullanici.update({
          where: { id: userId },
          data: { rol }
        });

        results.push({
          userId,
          email: user.email,
          success: true,
          newRole: rol
        });
      } catch (error) {
        console.error(`Kullanıcı ${userId} için rol atama hatası:`, error);
        errors.push({ userId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} kullanıcının rolü başarıyla güncellendi`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Rol atama hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Rol atama işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

export const POST = withRole(assignRoleHandler, ['ADMIN']); 
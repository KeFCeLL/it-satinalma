import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../../middleware';

// Tek bir görevi sil
async function deleteGorevHandler(request, { params }) {
  try {
    const { id } = params;
    const { user } = request;
    
    // Görevin kullanıcıya ait olup olmadığını kontrol et
    const gorev = await prisma.gorev.findUnique({
      where: {
        id: id
      }
    });
    
    if (!gorev) {
      return NextResponse.json(
        { success: false, message: 'Görev bulunamadı' },
        { status: 404 }
      );
    }
    
    if (gorev.kullaniciId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Bu görevi silmek için yetkiniz yok' },
        { status: 403 }
      );
    }
    
    // Görevi sil
    await prisma.gorev.delete({
      where: {
        id: id
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Görev başarıyla silindi'
    });
  } catch (error) {
    console.error('Görev silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görev silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Export handlers
export const DELETE = withAuth(deleteGorevHandler); 
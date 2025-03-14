import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../middleware';

// Görevleri getir
async function getGorevlerHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tamamlandi = searchParams.get('tamamlandi');
    
    const { user } = request;
    
    // Filtreleri ayarla
    const where = {
      kullaniciId: user.id
    };
    
    // Tamamlanma durumu filtresi
    if (tamamlandi !== null && tamamlandi !== undefined) {
      where.tamamlandi = tamamlandi === 'true';
    }
    
    // Görevleri getir
    const gorevler = await prisma.gorev.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: gorevler
    });
  } catch (error) {
    console.error('Görevler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görevler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Görev oluştur
async function createGorevHandler(request) {
  try {
    const body = await request.json();
    const { user } = request;
    
    // Gerekli alanların kontrolü
    if (!body.metin) {
      return NextResponse.json(
        { success: false, message: 'Görev metni zorunludur' },
        { status: 400 }
      );
    }
    
    // Görev oluştur
    const gorev = await prisma.gorev.create({
      data: {
        metin: body.metin,
        tamamlandi: body.tamamlandi || false,
        sonTarih: body.sonTarih ? new Date(body.sonTarih) : null,
        kullaniciId: user.id
      }
    });
    
    return NextResponse.json({
      success: true,
      data: gorev
    });
  } catch (error) {
    console.error('Görev oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görev oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Görevleri güncelle
async function updateGorevlerHandler(request) {
  try {
    const body = await request.json();
    const { user } = request;
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Görev ID zorunludur' },
        { status: 400 }
      );
    }
    
    // Görevin kullanıcıya ait olup olmadığını kontrol et
    const gorev = await prisma.gorev.findUnique({
      where: {
        id: body.id
      }
    });
    
    if (!gorev || gorev.kullaniciId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Görev bulunamadı veya erişim izniniz yok' },
        { status: 404 }
      );
    }
    
    // Görevi güncelle
    const updatedGorev = await prisma.gorev.update({
      where: {
        id: body.id
      },
      data: {
        metin: body.metin !== undefined ? body.metin : gorev.metin,
        tamamlandi: body.tamamlandi !== undefined ? body.tamamlandi : gorev.tamamlandi,
        sonTarih: body.sonTarih !== undefined ? 
          (body.sonTarih ? new Date(body.sonTarih) : null) : 
          gorev.sonTarih
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedGorev
    });
  } catch (error) {
    console.error('Görev güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görev güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withAuth(getGorevlerHandler);
export const POST = withAuth(createGorevHandler);
export const PUT = withAuth(updateGorevlerHandler); 
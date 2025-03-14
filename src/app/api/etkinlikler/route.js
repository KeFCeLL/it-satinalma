import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../middleware';

// Etkinlikleri getir
async function getEtkinliklerHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const baslangic = searchParams.get('baslangic');
    const bitis = searchParams.get('bitis');
    
    const { user } = request;
    
    // Filtreleri ayarla
    const where = {
      kullaniciId: user.id
    };
    
    // Tarih aralığı filtreleri
    if (baslangic && bitis) {
      where.baslangic = {
        gte: new Date(baslangic)
      };
      where.bitis = {
        lte: new Date(bitis)
      };
    }
    
    // Etkinlikleri getir
    const etkinlikler = await prisma.etkinlik.findMany({
      where,
      orderBy: {
        baslangic: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: etkinlikler
    });
  } catch (error) {
    console.error('Etkinlikler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Etkinlikler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Etkinlik oluştur
async function createEtkinlikHandler(request) {
  try {
    const body = await request.json();
    const { user } = request;
    
    // Gerekli alanların kontrolü
    if (!body.baslik || !body.baslangic || !body.bitis) {
      return NextResponse.json(
        { success: false, message: 'Başlık, başlangıç ve bitiş alanları zorunludur' },
        { status: 400 }
      );
    }
    
    // Etkinlik oluştur
    const etkinlik = await prisma.etkinlik.create({
      data: {
        baslik: body.baslik,
        baslangic: new Date(body.baslangic),
        bitis: new Date(body.bitis),
        konum: body.konum || null,
        aciklama: body.aciklama || null,
        kullaniciId: user.id
      }
    });
    
    return NextResponse.json({
      success: true,
      data: etkinlik
    });
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Etkinlik oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withAuth(getEtkinliklerHandler);
export const POST = withAuth(createEtkinlikHandler); 
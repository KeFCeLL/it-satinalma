import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasina = parseInt(searchParams.get('sayfaBasi') || '10');

    // Geçerlilik kontrolü
    const gecerliSayfa = sayfa > 0 ? sayfa : 1;
    const gecerliSayfaBasina = sayfaBasina > 0 ? sayfaBasina : 10;
    const skip = (gecerliSayfa - 1) * gecerliSayfaBasina;

    // Toplam ürün sayısını al
    const toplamUrunSayisi = await prisma.urun.count();

    // Sayfalanmış ürünleri getir
    const urunler = await prisma.urun.findMany({
      skip,
      take: gecerliSayfaBasina,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Tutarlı bir API yanıtı formatı
    return NextResponse.json({
      success: true,
      data: urunler,
      meta: {
        toplam: toplamUrunSayisi,
        sayfa: gecerliSayfa,
        sayfaBasi: gecerliSayfaBasina,
        toplamSayfa: Math.ceil(toplamUrunSayisi / gecerliSayfaBasina)
      }
    });
  } catch (error) {
    console.error('Ürünler getirilirken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ürünler getirilirken bir hata oluştu',
        data: [],
        meta: {
          toplam: 0,
          sayfa: 1,
          sayfaBasi: 10,
          toplamSayfa: 0
        }
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasina = parseInt(searchParams.get('sayfaBasina') || '10');
    const skip = (sayfa - 1) * sayfaBasina;

    // Toplam ürün sayısını al
    const toplamUrunSayisi = await prisma.urun.count();

    // Sayfalanmış ürünleri getir
    const urunler = await prisma.urun.findMany({
      skip,
      take: sayfaBasina,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      urunler,
      toplamUrunSayisi,
      sayfa,
      sayfaBasina
    });
  } catch (error) {
    console.error('Ürünler getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Ürünler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
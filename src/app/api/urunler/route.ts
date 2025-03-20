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

export async function POST(request: Request) {
  try {
    // İstek gövdesini güvenli şekilde işle
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON çözümleme hatası:', jsonError);
      return NextResponse.json(
        { success: false, message: 'Geçersiz istek formatı' },
        { status: 400 }
      );
    }
    
    // Gerekli alanları kontrol et
    const { ad, kategori, birimFiyat, birim, aciklama } = body;
    
    if (!ad || typeof ad !== 'string' || ad.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Ürün adı zorunludur' },
        { status: 400 }
      );
    }
    
    if (!kategori || typeof kategori !== 'string' || kategori.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Kategori zorunludur' },
        { status: 400 }
      );
    }
    
    if (typeof birimFiyat !== 'number' || birimFiyat <= 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir birim fiyat gereklidir' },
        { status: 400 }
      );
    }
    
    // Ürünü oluştur
    try {
      const yeniUrun = await prisma.urun.create({
        data: {
          ad: ad.trim(),
          kategori: kategori.trim(),
          birimFiyat,
          birim: birim || 'Adet',
          aciklama: aciklama ? aciklama.trim() : null,
        }
      });
      
      console.log('Yeni ürün oluşturuldu:', yeniUrun);
      
      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla eklendi',
        data: yeniUrun
      });
    } catch (dbError) {
      console.error('Veritabanı hatası:', dbError);
      return NextResponse.json(
        { success: false, message: 'Ürün eklenirken veritabanı hatası oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ürün eklenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Ürün eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
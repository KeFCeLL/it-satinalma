import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');

    if (kategori) {
      // Belirli bir kategorideki ürün sayısını kontrol et
      const urunSayisi = await prisma.urun.count({
        where: {
          kategori: kategori
        }
      });

      return NextResponse.json({
        success: true,
        urunSayisi,
        message: `${kategori} kategorisinde ${urunSayisi} ürün bulunuyor.`
      });
    }

    // Tüm kategorileri getir
    const kategoriler = await prisma.urun.findMany({
      select: {
        kategori: true
      },
      distinct: ['kategori'],
      orderBy: {
        kategori: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: kategoriler.map((k: { kategori: string }) => k.kategori)
    });
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Kategoriler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // İstek gövdesi analizi için güvenli yaklaşım
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON çözümleme hatası:', parseError);
      return NextResponse.json(
        { success: false, message: 'Geçersiz istek formatı. JSON bekleniyor.' },
        { status: 400 }
      );
    }

    // Kategori değeri kontrolü
    const { kategori } = body;

    if (!kategori || typeof kategori !== 'string' || kategori.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir kategori adı gereklidir' },
        { status: 400 }
      );
    }

    // Kategori adını temizle ve düzenle
    const kategoriAdi = kategori.trim();

    // Kategori uzunluğu kontrolü
    if (kategoriAdi.length < 2 || kategoriAdi.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Kategori adı 2-50 karakter arasında olmalıdır' },
        { status: 400 }
      );
    }

    // Kategorinin zaten var olup olmadığını kontrol et
    const mevcutKategori = await prisma.urun.findFirst({
      where: {
        kategori: {
          equals: kategoriAdi,
          mode: 'insensitive' // Büyük-küçük harf duyarsız
        }
      }
    });

    if (mevcutKategori) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Bu kategori zaten mevcut',
          data: [] // Tutarlı yanıt yapısı
        },
        { status: 400 }
      );
    }

    try {
      // Yeni bir kategori oluşturmak için örnek bir ürün ekliyoruz
      await prisma.urun.create({
        data: {
          ad: `${kategoriAdi} - Örnek Ürün`,
          kategori: kategoriAdi,
          birimFiyat: 0,
          birim: 'Adet',
          aciklama: 'Bu ürün, yeni kategori oluşturmak için otomatik olarak eklenmiştir.'
        }
      });
    } catch (dbError) {
      console.error('Veritabanı işlemi hatası:', dbError);
      return NextResponse.json(
        { success: false, message: 'Kategori eklenirken veritabanı hatası oluştu' },
        { status: 500 }
      );
    }

    // Tüm kategorileri döndür
    try {
      const kategoriler = await prisma.urun.findMany({
        select: {
          kategori: true
        },
        distinct: ['kategori'],
        orderBy: {
          kategori: 'asc'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Kategori başarıyla eklendi',
        data: kategoriler.map((k: { kategori: string }) => k.kategori)
      });
    } catch (listError) {
      console.error('Kategori listesi alınırken hata:', listError);
      // Hata oluşsa bile ekleme başarılı olduğunu bildir
      return NextResponse.json({
        success: true,
        message: 'Kategori eklendi ancak güncel liste alınamadı',
        data: [] // Boş liste
      });
    }
  } catch (error) {
    console.error('Kategori eklenirken beklenmeyen hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Kategori eklenirken bir hata oluştu', 
        data: [] // Tutarlı yanıt yapısı
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');

    if (!kategori) {
      return NextResponse.json(
        { success: false, message: 'Kategori belirtilmedi' },
        { status: 400 }
      );
    }

    // Kategoriyi sil
    await prisma.urun.deleteMany({
      where: {
        kategori: kategori
      }
    });

    // Kalan kategorileri getir
    const kategoriler = await prisma.urun.findMany({
      select: {
        kategori: true
      },
      distinct: ['kategori'],
      orderBy: {
        kategori: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla silindi',
      data: kategoriler.map((k: { kategori: string }) => k.kategori)
    });
  } catch (error) {
    console.error('Kategori silinirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Kategori silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
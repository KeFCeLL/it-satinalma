import { NextResponse } from 'next/server';

// Mock ürün verileri
const mockUrunler = [
  {
    id: "urun-1",
    ad: "MacBook Pro 14\"",
    aciklama: "M3 Pro, 18GB RAM, 512GB SSD",
    stokKodu: "MB-PRO-14-M3",
    kategori: "Bilgisayar",
    birim: "Adet",
    fiyat: 72000,
    createdAt: new Date(2023, 1, 15).toISOString(),
    updatedAt: new Date(2023, 1, 15).toISOString()
  },
  {
    id: "urun-2",
    ad: "Dell XPS 15",
    aciklama: "Intel i9, 32GB RAM, 1TB SSD, RTX 3050",
    stokKodu: "DELL-XPS-15",
    kategori: "Bilgisayar",
    birim: "Adet",
    fiyat: 65000,
    createdAt: new Date(2023, 2, 10).toISOString(),
    updatedAt: new Date(2023, 2, 10).toISOString()
  },
  {
    id: "urun-3",
    ad: "Microsoft Office 365",
    aciklama: "E3 Lisansı, 1 yıllık",
    stokKodu: "MS-O365-E3",
    kategori: "Yazılım",
    birim: "Lisans",
    fiyat: 2500,
    createdAt: new Date(2023, 3, 5).toISOString(),
    updatedAt: new Date(2023, 3, 5).toISOString()
  },
  {
    id: "urun-4",
    ad: "Epson EB-L200F",
    aciklama: "Full HD Lazer Projektör",
    stokKodu: "EPSON-EB-L200F",
    kategori: "Elektronik",
    birim: "Adet",
    fiyat: 35000,
    createdAt: new Date(2023, 4, 20).toISOString(),
    updatedAt: new Date(2023, 4, 20).toISOString()
  },
  {
    id: "urun-5",
    ad: "Logitech MX Keys",
    aciklama: "Kablosuz Klavye",
    stokKodu: "LOG-MX-KEYS",
    kategori: "Aksesuar",
    birim: "Adet",
    fiyat: 3800,
    createdAt: new Date(2023, 5, 8).toISOString(),
    updatedAt: new Date(2023, 5, 8).toISOString()
  },
  {
    id: "urun-6",
    ad: "Daikin FVA140A",
    aciklama: "14.0 kW Tavana Asılı Klima",
    stokKodu: "DAIKIN-FVA140A",
    kategori: "Klima",
    birim: "Adet",
    fiyat: 120000,
    createdAt: new Date(2023, 4, 15).toISOString(),
    updatedAt: new Date(2023, 4, 15).toISOString()
  },
  {
    id: "urun-7",
    ad: "Samsung Odyssey G7",
    aciklama: "32\" 240Hz 1ms 1440p Kavisli Gaming Monitör",
    stokKodu: "SAM-ODYSSEY-G7",
    kategori: "Monitör",
    birim: "Adet",
    fiyat: 22000,
    createdAt: new Date(2023, 6, 12).toISOString(),
    updatedAt: new Date(2023, 6, 12).toISOString()
  },
  {
    id: "urun-8",
    ad: "Adobe Creative Cloud",
    aciklama: "Tüm Uygulamalar, 1 yıllık",
    stokKodu: "ADOBE-CC-ALL",
    kategori: "Yazılım",
    birim: "Lisans",
    fiyat: 18000,
    createdAt: new Date(2023, 3, 18).toISOString(),
    updatedAt: new Date(2023, 3, 18).toISOString()
  }
];

// Ürünleri getir
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    const arama = searchParams.get('arama');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '50');
    const siralamaAlani = searchParams.get('siralamaAlani') || 'createdAt';
    const siralamaYonu = searchParams.get('siralamaYonu') || 'desc';
    
    // Ürünleri filtrele
    let filteredUrunler = [...mockUrunler];
    
    if (kategori) {
      filteredUrunler = filteredUrunler.filter(urun => urun.kategori === kategori);
    }
    
    if (arama) {
      const aramaLower = arama.toLowerCase();
      filteredUrunler = filteredUrunler.filter(urun => 
        urun.ad.toLowerCase().includes(aramaLower) || 
        urun.aciklama.toLowerCase().includes(aramaLower) ||
        urun.stokKodu.toLowerCase().includes(aramaLower)
      );
    }
    
    // Sıralama
    filteredUrunler.sort((a, b) => {
      const direction = siralamaYonu === 'asc' ? 1 : -1;
      
      if (siralamaAlani === 'fiyat') {
        return direction * (a.fiyat - b.fiyat);
      }
      
      if (siralamaAlani === 'createdAt') {
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      
      // Diğer alanlar için string karşılaştırması
      return direction * a[siralamaAlani].localeCompare(b[siralamaAlani]);
    });
    
    // Toplam ürün sayısı
    const total = filteredUrunler.length;
    
    // Sayfalama uygula
    const paginatedUrunler = filteredUrunler.slice(
      (sayfa - 1) * sayfaBasi,
      sayfa * sayfaBasi
    );
    
    console.log('Mock ürün verileri hazırlanıyor');
    
    return NextResponse.json({
      success: true,
      data: paginatedUrunler,
      meta: {
        toplam: total,
        sayfaBasi,
        mevcutSayfa: sayfa,
        toplamSayfa: Math.ceil(total / sayfaBasi)
      }
    });
  } catch (error) {
    console.error('Ürünler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Ürünler alınamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Ürün oluştur
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.ad || !body.stokKodu) {
      return NextResponse.json(
        { success: false, message: 'Ürün adı ve stok kodu zorunludur' },
        { status: 400 }
      );
    }
    
    // Stok kodu kontrolü
    const stokKoduExists = mockUrunler.some(urun => urun.stokKodu === body.stokKodu);
    if (stokKoduExists) {
      return NextResponse.json(
        { success: false, message: 'Bu stok kodu zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    const yeniUrun = {
      id: `urun-${Date.now()}`,
      ad: body.ad,
      aciklama: body.aciklama || '',
      stokKodu: body.stokKodu,
      kategori: body.kategori || 'Diğer',
      birim: body.birim || 'Adet',
      fiyat: parseFloat(body.fiyat) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Mock listeye ekle
    mockUrunler.push(yeniUrun);
    
    return NextResponse.json({
      success: true,
      urun: yeniUrun
    });
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Ürün oluşturulamadı', error: error.message },
      { status: 500 }
    );
  }
} 
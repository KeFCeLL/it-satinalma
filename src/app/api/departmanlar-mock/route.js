import { NextResponse } from 'next/server';

// Mock departman verileri
const mockDepartmanlar = [
  {
    id: "dep-1",
    ad: "IT",
    aciklama: "Bilgi Teknolojileri Departmanı",
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date(2023, 0, 1).toISOString()
  },
  {
    id: "dep-2",
    ad: "Finans",
    aciklama: "Finans ve Muhasebe Departmanı",
    createdAt: new Date(2023, 0, 2).toISOString(),
    updatedAt: new Date(2023, 0, 2).toISOString()
  },
  {
    id: "dep-3",
    ad: "Satınalma",
    aciklama: "Satınalma ve Tedarik Departmanı",
    createdAt: new Date(2023, 0, 3).toISOString(),
    updatedAt: new Date(2023, 0, 3).toISOString()
  },
  {
    id: "dep-4",
    ad: "İnsan Kaynakları",
    aciklama: "İK ve İdari İşler Departmanı",
    createdAt: new Date(2023, 0, 4).toISOString(),
    updatedAt: new Date(2023, 0, 4).toISOString()
  },
  {
    id: "test-departman-id",
    ad: "Yönetim",
    aciklama: "Genel Yönetim",
    createdAt: new Date(2023, 0, 5).toISOString(),
    updatedAt: new Date(2023, 0, 5).toISOString()
  }
];

// Departmanları getir
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hepsi = searchParams.get('hepsi') === 'true';
    const arama = searchParams.get('arama');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '10');
    
    // Departmanları filtrele
    let filteredDepartmanlar = [...mockDepartmanlar];
    
    if (arama) {
      filteredDepartmanlar = filteredDepartmanlar.filter(dep => 
        dep.ad.toLowerCase().includes(arama.toLowerCase()) || 
        (dep.aciklama && dep.aciklama.toLowerCase().includes(arama.toLowerCase()))
      );
    }
    
    console.log('Mock departman verileri hazırlanıyor');
    
    // Tüm departmanları mı döndür
    if (hepsi) {
      return NextResponse.json({
        success: true,
        departmanlar: filteredDepartmanlar
      });
    }
    
    // Toplam departman sayısı
    const total = filteredDepartmanlar.length;
    
    // Sayfalama uygula
    const paginatedDepartmanlar = filteredDepartmanlar.slice(
      (sayfa - 1) * sayfaBasi,
      sayfa * sayfaBasi
    );
    
    return NextResponse.json({
      success: true,
      data: paginatedDepartmanlar,
      meta: {
        toplam: total,
        sayfaBasi,
        mevcutSayfa: sayfa,
        toplamSayfa: Math.ceil(total / sayfaBasi)
      }
    });
  } catch (error) {
    console.error('Departmanlar getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Departmanlar alınamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Departman oluştur
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.ad) {
      return NextResponse.json(
        { success: false, message: 'Departman adı zorunludur' },
        { status: 400 }
      );
    }
    
    const yeniDepartman = {
      id: `dep-${Date.now()}`,
      ad: body.ad,
      aciklama: body.aciklama || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Mock listeye ekle
    mockDepartmanlar.push(yeniDepartman);
    
    return NextResponse.json({
      success: true,
      departman: yeniDepartman
    });
  } catch (error) {
    console.error('Departman oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Departman oluşturulamadı', error: error.message },
      { status: 500 }
    );
  }
} 
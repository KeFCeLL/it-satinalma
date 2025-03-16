import { NextResponse } from 'next/server';

// Mock talep verileri
const mockTalepler = [
  {
    id: "tal-1",
    baslik: "Dizüstü Bilgisayar",
    aciklama: "Yazılım geliştirme ekibi için MacBook Pro",
    talepEdenId: "test-admin-id",
    talepEden: {
      id: "test-admin-id",
      ad: "Admin",
      soyad: "Kullanıcı",
      email: "admin@greenchem.com.tr"
    },
    departmanId: "dep-1",
    departman: {
      id: "dep-1",
      ad: "IT"
    },
    durum: "BEKLEMEDE",
    oncelik: "YUKSEK",
    onayAdimi: "DEPARTMAN_YONETICISI",
    createdAt: new Date(2023, 5, 15).toISOString(),
    updatedAt: new Date(2023, 5, 15).toISOString(),
    onaylar: [
      {
        id: "onay-1",
        talepId: "tal-1",
        adim: "DEPARTMAN_YONETICISI",
        durum: "BEKLEMEDE",
        onaylayanId: null,
        aciklama: null,
        createdAt: new Date(2023, 5, 15).toISOString(),
        updatedAt: new Date(2023, 5, 15).toISOString()
      }
    ]
  },
  {
    id: "tal-2",
    baslik: "Projektör",
    aciklama: "Toplantı odası için projektör",
    talepEdenId: "test-admin-id",
    talepEden: {
      id: "test-admin-id",
      ad: "Admin",
      soyad: "Kullanıcı",
      email: "admin@greenchem.com.tr"
    },
    departmanId: "dep-4",
    departman: {
      id: "dep-4",
      ad: "İnsan Kaynakları"
    },
    durum: "ONAYLANDI",
    oncelik: "ORTA",
    onayAdimi: "SATINALMA_DEPARTMANI",
    createdAt: new Date(2023, 5, 10).toISOString(),
    updatedAt: new Date(2023, 5, 12).toISOString(),
    onaylar: [
      {
        id: "onay-2-1",
        talepId: "tal-2",
        adim: "DEPARTMAN_YONETICISI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "Onaylandı",
        createdAt: new Date(2023, 5, 10).toISOString(),
        updatedAt: new Date(2023, 5, 11).toISOString()
      },
      {
        id: "onay-2-2",
        talepId: "tal-2",
        adim: "IT_DEPARTMANI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "IT tarafından onaylandı",
        createdAt: new Date(2023, 5, 11).toISOString(),
        updatedAt: new Date(2023, 5, 11).toISOString()
      },
      {
        id: "onay-2-3",
        talepId: "tal-2",
        adim: "FINANS_DEPARTMANI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "Finans tarafından onaylandı",
        createdAt: new Date(2023, 5, 11).toISOString(),
        updatedAt: new Date(2023, 5, 12).toISOString()
      },
      {
        id: "onay-2-4",
        talepId: "tal-2",
        adim: "SATINALMA_DEPARTMANI",
        durum: "BEKLEMEDE",
        onaylayanId: null,
        aciklama: null,
        createdAt: new Date(2023, 5, 12).toISOString(),
        updatedAt: new Date(2023, 5, 12).toISOString()
      }
    ]
  },
  {
    id: "tal-3",
    baslik: "Office Lisansları",
    aciklama: "Finans departmanı için 5 adet Office lisansı",
    talepEdenId: "test-admin-id",
    talepEden: {
      id: "test-admin-id",
      ad: "Admin",
      soyad: "Kullanıcı",
      email: "admin@greenchem.com.tr"
    },
    departmanId: "dep-2",
    departman: {
      id: "dep-2",
      ad: "Finans"
    },
    durum: "SATINALMA_SURECINDE",
    oncelik: "DUSUK",
    onayAdimi: "SATINALMA_DEPARTMANI",
    createdAt: new Date(2023, 5, 5).toISOString(),
    updatedAt: new Date(2023, 5, 9).toISOString(),
    onaylar: [
      {
        id: "onay-3-1",
        talepId: "tal-3",
        adim: "DEPARTMAN_YONETICISI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "Onaylandı",
        createdAt: new Date(2023, 5, 5).toISOString(),
        updatedAt: new Date(2023, 5, 6).toISOString()
      },
      {
        id: "onay-3-2",
        talepId: "tal-3",
        adim: "IT_DEPARTMANI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "IT tarafından onaylandı",
        createdAt: new Date(2023, 5, 6).toISOString(),
        updatedAt: new Date(2023, 5, 7).toISOString()
      },
      {
        id: "onay-3-3",
        talepId: "tal-3",
        adim: "FINANS_DEPARTMANI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "Finans tarafından onaylandı",
        createdAt: new Date(2023, 5, 7).toISOString(),
        updatedAt: new Date(2023, 5, 8).toISOString()
      },
      {
        id: "onay-3-4",
        talepId: "tal-3",
        adim: "SATINALMA_DEPARTMANI",
        durum: "SATINALMA_SURECINDE",
        onaylayanId: "test-admin-id",
        aciklama: "Satın alma süreci başlatıldı",
        createdAt: new Date(2023, 5, 8).toISOString(),
        updatedAt: new Date(2023, 5, 9).toISOString()
      }
    ]
  },
  {
    id: "tal-4",
    baslik: "Klima",
    aciklama: "Sunucu odası için klima",
    talepEdenId: "test-admin-id",
    talepEden: {
      id: "test-admin-id",
      ad: "Admin",
      soyad: "Kullanıcı",
      email: "admin@greenchem.com.tr"
    },
    departmanId: "dep-1",
    departman: {
      id: "dep-1",
      ad: "IT"
    },
    durum: "TAMAMLANDI",
    oncelik: "KRITIK",
    onayAdimi: "SATINALMA_DEPARTMANI",
    createdAt: new Date(2023, 4, 20).toISOString(),
    updatedAt: new Date(2023, 5, 2).toISOString(),
    onaylar: [
      {
        id: "onay-4-1",
        talepId: "tal-4",
        adim: "DEPARTMAN_YONETICISI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "Onaylandı",
        createdAt: new Date(2023, 4, 20).toISOString(),
        updatedAt: new Date(2023, 4, 21).toISOString()
      },
      {
        id: "onay-4-2",
        talepId: "tal-4",
        adim: "IT_DEPARTMANI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "IT tarafından onaylandı",
        createdAt: new Date(2023, 4, 21).toISOString(),
        updatedAt: new Date(2023, 4, 22).toISOString()
      },
      {
        id: "onay-4-3",
        talepId: "tal-4",
        adim: "FINANS_DEPARTMANI",
        durum: "ONAYLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "Finans tarafından onaylandı",
        createdAt: new Date(2023, 4, 22).toISOString(),
        updatedAt: new Date(2023, 4, 23).toISOString()
      },
      {
        id: "onay-4-4",
        talepId: "tal-4",
        adim: "SATINALMA_DEPARTMANI",
        durum: "TAMAMLANDI",
        onaylayanId: "test-admin-id",
        aciklama: "Satın alma tamamlandı",
        createdAt: new Date(2023, 4, 23).toISOString(),
        updatedAt: new Date(2023, 5, 2).toISOString()
      }
    ]
  }
];

// Talepleri getir
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const durum = searchParams.get('durum');
    const departmanId = searchParams.get('departmanId');
    const oncelik = searchParams.get('oncelik');
    const arama = searchParams.get('arama');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '50');
    const siralamaAlani = searchParams.get('siralamaAlani') || 'createdAt';
    const siralamaYonu = searchParams.get('siralamaYonu') || 'desc';
    const onaylandi = searchParams.get('onaylandi') === 'true';
    
    // Talepleri filtrele
    let filteredTalepler = [...mockTalepler];
    
    if (durum) {
      filteredTalepler = filteredTalepler.filter(talep => talep.durum === durum);
    }
    
    if (departmanId) {
      filteredTalepler = filteredTalepler.filter(talep => talep.departmanId === departmanId);
    }
    
    if (oncelik) {
      filteredTalepler = filteredTalepler.filter(talep => talep.oncelik === oncelik);
    }
    
    if (arama) {
      filteredTalepler = filteredTalepler.filter(talep => 
        talep.baslik.toLowerCase().includes(arama.toLowerCase()) || 
        talep.aciklama.toLowerCase().includes(arama.toLowerCase())
      );
    }
    
    if (onaylandi) {
      filteredTalepler = filteredTalepler.filter(talep => 
        talep.onaylar.some(onay => onay.durum === "ONAYLANDI" || onay.durum === "SATINALMA_SURECINDE" || onay.durum === "TAMAMLANDI")
      );
    }
    
    // Sıralama
    filteredTalepler.sort((a, b) => {
      const direction = siralamaYonu === 'asc' ? 1 : -1;
      
      if (siralamaAlani === 'createdAt') {
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      
      // Diğer alanlar için de sıralama eklenebilir
      return direction * a[siralamaAlani].localeCompare(b[siralamaAlani]);
    });
    
    // Toplam talep sayısı
    const total = filteredTalepler.length;
    
    // Sayfalama uygula
    const paginatedTalepler = filteredTalepler.slice(
      (sayfa - 1) * sayfaBasi,
      sayfa * sayfaBasi
    );
    
    console.log('Mock talep verileri hazırlanıyor');
    
    return NextResponse.json({
      success: true,
      data: paginatedTalepler,
      meta: {
        toplam: total,
        sayfaBasi,
        mevcutSayfa: sayfa,
        toplamSayfa: Math.ceil(total / sayfaBasi)
      }
    });
  } catch (error) {
    console.error('Talepler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Talepler alınamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Talep oluştur
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.baslik || !body.departmanId) {
      return NextResponse.json(
        { success: false, message: 'Başlık ve departman bilgileri zorunludur' },
        { status: 400 }
      );
    }
    
    const yeniTalep = {
      id: `tal-${Date.now()}`,
      baslik: body.baslik,
      aciklama: body.aciklama || '',
      talepEdenId: "test-admin-id",
      talepEden: {
        id: "test-admin-id",
        ad: "Admin",
        soyad: "Kullanıcı",
        email: "admin@greenchem.com.tr"
      },
      departmanId: body.departmanId,
      departman: mockTalepler.find(t => t.departmanId === body.departmanId)?.departman || {
        id: body.departmanId,
        ad: "Departman"
      },
      durum: "BEKLEMEDE",
      oncelik: body.oncelik || "ORTA",
      onayAdimi: "DEPARTMAN_YONETICISI",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      onaylar: [
        {
          id: `onay-${Date.now()}`,
          talepId: `tal-${Date.now()}`,
          adim: "DEPARTMAN_YONETICISI",
          durum: "BEKLEMEDE",
          onaylayanId: null,
          aciklama: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
    
    // Mock listeye ekle
    mockTalepler.push(yeniTalep);
    
    return NextResponse.json({
      success: true,
      talep: yeniTalep
    });
  } catch (error) {
    console.error('Talep oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Talep oluşturulamadı', error: error.message },
      { status: 500 }
    );
  }
} 
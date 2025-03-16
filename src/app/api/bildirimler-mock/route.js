import { NextResponse } from 'next/server';

// Mock bildirim verileri - mesaj alanı açıkça eklenmiş haliyle
const mockBildirimler = [
  {
    id: "bil-1",
    kullaniciId: "test-admin-id",
    mesaj: "Yeni bir talep oluşturuldu: Dizüstü Bilgisayar",
    icerik: {
      tip: "TALEP",
      talepId: "tal-1",
      islem: "OLUSTURULDU"
    },
    okundu: false,
    createdAt: new Date(2023, 5, 15).toISOString(),
    updatedAt: new Date(2023, 5, 15).toISOString()
  },
  {
    id: "bil-2",
    kullaniciId: "test-admin-id",
    mesaj: "Talep onaylandı: Projektör",
    icerik: {
      tip: "TALEP",
      talepId: "tal-2",
      islem: "ONAYLANDI"
    },
    okundu: true,
    createdAt: new Date(2023, 5, 12).toISOString(),
    updatedAt: new Date(2023, 5, 12).toISOString()
  },
  {
    id: "bil-3",
    kullaniciId: "test-admin-id",
    mesaj: "Talebiniz satın alma sürecinde: Office Lisansları",
    icerik: {
      tip: "TALEP",
      talepId: "tal-3",
      islem: "SATINALMA_SURECINDE"
    },
    okundu: false,
    createdAt: new Date(2023, 5, 9).toISOString(),
    updatedAt: new Date(2023, 5, 9).toISOString()
  },
  {
    id: "bil-4",
    kullaniciId: "test-admin-id",
    mesaj: "Satın alma işlemi tamamlandı: Klima",
    icerik: {
      tip: "TALEP",
      talepId: "tal-4",
      islem: "TAMAMLANDI"
    },
    okundu: true,
    createdAt: new Date(2023, 5, 2).toISOString(),
    updatedAt: new Date(2023, 5, 2).toISOString()
  },
  {
    id: "bil-5",
    kullaniciId: "kul-2",
    mesaj: "Onayınız bekleniyor: Dizüstü Bilgisayar",
    icerik: {
      tip: "ONAY",
      talepId: "tal-1",
      onayId: "onay-1",
      islem: "BEKLEMEDE"
    },
    okundu: false,
    createdAt: new Date(2023, 5, 15).toISOString(),
    updatedAt: new Date(2023, 5, 15).toISOString()
  },
  {
    id: "bil-6",
    kullaniciId: "kul-4",
    mesaj: "Onayınız bekleniyor: Projektör",
    icerik: {
      tip: "ONAY",
      talepId: "tal-2",
      onayId: "onay-2-4",
      islem: "BEKLEMEDE"
    },
    okundu: false,
    createdAt: new Date(2023, 5, 12).toISOString(),
    updatedAt: new Date(2023, 5, 12).toISOString()
  },
  {
    id: "bil-7",
    kullaniciId: "test-admin-id",
    mesaj: "Yeni bir kullanıcı oluşturuldu: Elif Doğan",
    icerik: {
      tip: "KULLANICI",
      kullaniciId: "kul-10",
      islem: "OLUSTURULDU"
    },
    okundu: true,
    createdAt: new Date(2023, 5, 1).toISOString(),
    updatedAt: new Date(2023, 5, 1).toISOString()
  },
  {
    id: "bil-8",
    kullaniciId: "test-admin-id",
    mesaj: "Yeni bir ürün eklendi: MacBook Pro 14\"",
    icerik: {
      tip: "URUN",
      urunId: "urun-1",
      islem: "EKLENDI"
    },
    okundu: true,
    createdAt: new Date(2023, 5, 1).toISOString(),
    updatedAt: new Date(2023, 5, 1).toISOString()
  }
];

// Bildirimler için GET API endpoint - kullanıcı için bildirimler getirir
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kullaniciId = searchParams.get('kullaniciId');
    const okundu = searchParams.get('okundu');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '10');
    
    console.log('Mock bildirimleri getiriliyor:', { kullaniciId, okundu });
    
    // Bildirimler filtreleniyor
    let filteredBildirimler = [...mockBildirimler];
    
    if (kullaniciId) {
      filteredBildirimler = filteredBildirimler.filter(bildirim => bildirim.kullaniciId === kullaniciId);
    }
    
    if (okundu !== null && okundu !== undefined) {
      const okunduDurum = okundu === 'true';
      filteredBildirimler = filteredBildirimler.filter(bildirim => bildirim.okundu === okunduDurum);
    }
    
    // Tarih sıralaması (en yeni en önce)
    filteredBildirimler.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Toplam bildirim sayısı
    const total = filteredBildirimler.length;
    
    // Okunmamış bildirim sayısı
    const okunmamisSayisi = mockBildirimler.filter(
      bildirim => (kullaniciId ? bildirim.kullaniciId === kullaniciId : true) && !bildirim.okundu
    ).length;
    
    // Sayfalama uygula
    const paginatedBildirimler = filteredBildirimler.slice(
      (sayfa - 1) * sayfaBasi,
      sayfa * sayfaBasi
    );
    
    return NextResponse.json({
      success: true,
      data: paginatedBildirimler,
      meta: {
        toplam: total,
        okunmamis: okunmamisSayisi,
        sayfaBasi,
        mevcutSayfa: sayfa,
        toplamSayfa: Math.ceil(total / sayfaBasi)
      }
    });
  } catch (error) {
    console.error('Bildirim getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Bildirimler alınamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Bildirim oluştur
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.kullaniciId || !body.mesaj) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı ID ve mesaj zorunludur' },
        { status: 400 }
      );
    }
    
    const yeniBildirim = {
      id: `bil-${Date.now()}`,
      kullaniciId: body.kullaniciId,
      mesaj: body.mesaj,
      icerik: body.icerik || {},
      okundu: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Mock listeye ekle
    mockBildirimler.push(yeniBildirim);
    
    return NextResponse.json({
      success: true,
      bildirim: yeniBildirim
    });
  } catch (error) {
    console.error('Bildirim oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Bildirim oluşturulamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Bildirimi okundu olarak işaretle
export async function PUT(request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Bildirim ID zorunludur' },
        { status: 400 }
      );
    }
    
    const bildirimIndex = mockBildirimler.findIndex(bildirim => bildirim.id === body.id);
    
    if (bildirimIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Bildirim bulunamadı' },
        { status: 404 }
      );
    }
    
    // Bildirimi güncelle
    mockBildirimler[bildirimIndex] = {
      ...mockBildirimler[bildirimIndex],
      okundu: true,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      bildirim: mockBildirimler[bildirimIndex]
    });
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Bildirim güncellenemedi', error: error.message },
      { status: 500 }
    );
  }
}

// Tüm bildirimleri okundu olarak işaretle
export async function PATCH(request) {
  try {
    const body = await request.json();
    
    if (!body.kullaniciId) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı ID zorunludur' },
        { status: 400 }
      );
    }
    
    // Kullanıcının bildirimlerini bul ve güncelle
    const kullaniciBildirimleri = mockBildirimler.filter(
      bildirim => bildirim.kullaniciId === body.kullaniciId && !bildirim.okundu
    );
    
    for (const bildirim of kullaniciBildirimleri) {
      const idx = mockBildirimler.findIndex(b => b.id === bildirim.id);
      mockBildirimler[idx] = {
        ...mockBildirimler[idx],
        okundu: true,
        updatedAt: new Date().toISOString()
      };
    }
    
    return NextResponse.json({
      success: true,
      message: `${kullaniciBildirimleri.length} bildirim okundu olarak işaretlendi`,
      guncellenenAdet: kullaniciBildirimleri.length
    });
  } catch (error) {
    console.error('Bildirim toplu güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Bildirimler güncellenemedi', error: error.message },
      { status: 500 }
    );
  }
}
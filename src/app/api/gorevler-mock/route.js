import { NextResponse } from 'next/server';

// Mock görev verileri
const mockGorevler = [
  {
    id: "mock-gorev-1",
    metin: "Frontend görsel düzenlemeleri yapılacak",
    tamamlandi: false,
    kullaniciId: "test-admin-id",
    sonTarih: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-gorev-2",
    metin: "Veritabanı optimizasyonu tamamlanacak",
    tamamlandi: true,
    kullaniciId: "test-admin-id",
    sonTarih: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: "mock-gorev-3",
    metin: "API endpoint'leri test edilecek",
    tamamlandi: false,
    kullaniciId: "test-admin-id",
    sonTarih: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 gün sonra
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Görevleri getir
async function getGorevlerHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tamamlandi = searchParams.get('tamamlandi');
    
    // Filtre uygula
    let filteredGorevler = [...mockGorevler];
    
    // Tamamlanma durumu filtresi
    if (tamamlandi !== null && tamamlandi !== undefined) {
      const isTamamlandi = tamamlandi === 'true';
      filteredGorevler = filteredGorevler.filter(gorev => gorev.tamamlandi === isTamamlandi);
    }
    
    console.log('Mock görevler gönderiliyor');
    return NextResponse.json({
      success: true,
      data: filteredGorevler
    });
  } catch (error) {
    console.error('Görevler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: "Görevler alınamadı", error: error.message },
      { status: 500 }
    );
  }
}

// Görev oluştur
async function createGorevHandler(request) {
  try {
    const body = await request.json();
    
    // Gerekli alanların kontrolü
    if (!body.metin) {
      return NextResponse.json(
        { success: false, message: 'Görev metni zorunludur' },
        { status: 400 }
      );
    }
    
    const yeniGorev = {
      id: `mock-gorev-${Date.now()}`,
      metin: body.metin,
      tamamlandi: body.tamamlandi || false,
      sonTarih: body.sonTarih ? new Date(body.sonTarih) : null,
      kullaniciId: "test-admin-id",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock listeye ekle
    mockGorevler.unshift(yeniGorev);
    
    return NextResponse.json({
      success: true,
      data: yeniGorev
    });
  } catch (error) {
    console.error('Görev oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: "Görev oluşturulamadı", error: error.message },
      { status: 500 }
    );
  }
}

// Görevleri güncelle
async function updateGorevlerHandler(request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Görev ID zorunludur' },
        { status: 400 }
      );
    }
    
    // Mock görev güncelleme
    const gorevIndex = mockGorevler.findIndex(g => g.id === body.id);
    
    if (gorevIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Görev bulunamadı' },
        { status: 404 }
      );
    }
    
    const eskiGorev = mockGorevler[gorevIndex];
    
    const guncelGorev = {
      ...eskiGorev,
      metin: body.metin !== undefined ? body.metin : eskiGorev.metin,
      tamamlandi: body.tamamlandi !== undefined ? body.tamamlandi : eskiGorev.tamamlandi,
      sonTarih: body.sonTarih !== undefined ? 
        (body.sonTarih ? new Date(body.sonTarih) : null) : 
        eskiGorev.sonTarih,
      updatedAt: new Date()
    };
    
    mockGorevler[gorevIndex] = guncelGorev;
    
    return NextResponse.json({
      success: true,
      data: guncelGorev
    });
  } catch (error) {
    console.error('Görev güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: "Görev güncellenemedi", error: error.message },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = getGorevlerHandler;
export const POST = createGorevHandler;
export const PUT = updateGorevlerHandler;
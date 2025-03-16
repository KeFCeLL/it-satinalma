import { NextResponse } from 'next/server';

// Mock etkinlik verileri
const mockEtkinlikler = [
  {
    id: "mock-etkinlik-1",
    baslik: "Proje Toplantısı",
    baslangic: new Date(new Date().setHours(10, 0, 0, 0)), // Bugün saat 10:00
    bitis: new Date(new Date().setHours(11, 30, 0, 0)),    // Bugün saat 11:30
    konum: "Toplantı Salonu A",
    aciklama: "IT Satınalma projesi ilerleme değerlendirmesi",
    kullaniciId: "test-admin-id",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-etkinlik-2",
    baslik: "Yazılım Eğitimi",
    baslangic: new Date(new Date().setDate(new Date().getDate() + 1)), // Yarın
    bitis: new Date(new Date().setDate(new Date().getDate() + 1)),     // Yarın
    konum: "Eğitim Salonu",
    aciklama: "Next.js ve React eğitimi",
    kullaniciId: "test-admin-id",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-etkinlik-3",
    baslik: "Sprint Retrospektif",
    baslangic: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 gün sonra
    bitis: new Date(new Date().setDate(new Date().getDate() + 3)),     // 3 gün sonra
    konum: "Çevrimiçi",
    aciklama: "Sprint değerlendirme ve planlama",
    kullaniciId: "test-admin-id",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Etkinlikleri getir
async function getEtkinliklerHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const baslangic = searchParams.get('baslangic');
    const bitis = searchParams.get('bitis');
    
    console.log('🔧 Geliştirme modu: Mock etkinlik verileri döndürülüyor');
    console.log('Tarih aralığı:', baslangic, bitis);
    
    // Tarih filtreleri
    let filteredEtkinlikler = [...mockEtkinlikler];
    
    if (baslangic && bitis) {
      const startDate = new Date(baslangic);
      const endDate = new Date(bitis);
      
      filteredEtkinlikler = filteredEtkinlikler.filter(etkinlik => 
        etkinlik.baslangic >= startDate && etkinlik.bitis <= endDate
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredEtkinlikler
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
    
    // Gerekli alanların kontrolü
    if (!body.baslik || !body.baslangic || !body.bitis) {
      return NextResponse.json(
        { success: false, message: 'Başlık, başlangıç ve bitiş alanları zorunludur' },
        { status: 400 }
      );
    }
    
    console.log('🔧 Geliştirme modu: Mock etkinlik oluşturma');
    
    const yeniEtkinlik = {
      id: `mock-etkinlik-${Date.now()}`,
      baslik: body.baslik,
      baslangic: new Date(body.baslangic),
      bitis: new Date(body.bitis),
      konum: body.konum || null,
      aciklama: body.aciklama || null,
      kullaniciId: "test-admin-id",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock listeye ekle
    mockEtkinlikler.push(yeniEtkinlik);
    
    return NextResponse.json({
      success: true,
      data: yeniEtkinlik
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
export const GET = getEtkinliklerHandler;
export const POST = createEtkinlikHandler;
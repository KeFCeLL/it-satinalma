import { NextResponse } from 'next/server';

// Mock roller verileri
const mockRoller = [
  {
    id: "rol-1",
    ad: "ADMIN",
    aciklama: "Sistem yöneticisi",
    izinler: ["SISTEM_YONETIMI", "KULLANICI_YONETIMI", "DEPARTMAN_YONETIMI", "URUN_YONETIMI", "TALEP_YONETIMI", "ONAY_YONETIMI", "SATINALMA_YONETIMI", "ROL_YONETIMI"],
    sistemRolu: true,
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date(2023, 0, 1).toISOString()
  },
  {
    id: "rol-2",
    ad: "DEPARTMAN_YONETICISI",
    aciklama: "Departman yöneticisi",
    izinler: ["DEPARTMAN_TALEP_YONETIMI", "DEPARTMAN_ONAY_YONETIMI", "DEPARTMAN_RAPORLAMA"],
    sistemRolu: true,
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date(2023, 0, 1).toISOString()
  },
  {
    id: "rol-3",
    ad: "KULLANICI",
    aciklama: "Standart kullanıcı",
    izinler: ["TALEP_OLUSTURMA", "TALEP_GORUNTULEME"],
    sistemRolu: true,
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date(2023, 0, 1).toISOString()
  },
  {
    id: "rol-4",
    ad: "SATINALMA_SORUMLUSU",
    aciklama: "Satın alma departmanı sorumlusu",
    izinler: ["SATINALMA_YONETIMI", "TEDARIKCI_YONETIMI", "URUN_YONETIMI", "TALEP_GORUNTULEME", "SATINALMA_RAPORLAMA"],
    sistemRolu: true,
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date(2023, 0, 1).toISOString()
  },
  {
    id: "rol-5",
    ad: "FINANS_SORUMLUSU",
    aciklama: "Finans departmanı sorumlusu",
    izinler: ["FINANS_ONAY_YONETIMI", "BUTCE_YONETIMI", "TALEP_GORUNTULEME", "FINANS_RAPORLAMA"],
    sistemRolu: true,
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date(2023, 0, 1).toISOString()
  },
  {
    id: "rol-6",
    ad: "IT_SORUMLUSU",
    aciklama: "IT departmanı sorumlusu",
    izinler: ["IT_ONAY_YONETIMI", "TEKNIK_DEGERLENDIR", "TALEP_GORUNTULEME", "IT_RAPORLAMA"],
    sistemRolu: false,
    createdAt: new Date(2023, 3, 15).toISOString(),
    updatedAt: new Date(2023, 3, 15).toISOString()
  },
  {
    id: "rol-7",
    ad: "DENETCI",
    aciklama: "Denetim sorumlusu",
    izinler: ["TALEP_GORUNTULEME", "SATINALMA_GORUNTULEME", "RAPOR_GORUNTULEME"],
    sistemRolu: false,
    createdAt: new Date(2023, 5, 20).toISOString(),
    updatedAt: new Date(2023, 5, 20).toISOString()
  }
];

// Tüm rolleri getir
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sistemRolu = searchParams.get('sistemRolu');
    const arama = searchParams.get('arama');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '50');
    
    // Rolleri filtrele
    let filteredRoller = [...mockRoller];
    
    if (sistemRolu !== null && sistemRolu !== undefined) {
      const sistemRoluDurum = sistemRolu === 'true';
      filteredRoller = filteredRoller.filter(rol => rol.sistemRolu === sistemRoluDurum);
    }
    
    if (arama) {
      const aramaLower = arama.toLowerCase();
      filteredRoller = filteredRoller.filter(rol => 
        rol.ad.toLowerCase().includes(aramaLower) || 
        rol.aciklama.toLowerCase().includes(aramaLower)
      );
    }
    
    // Toplam rol sayısı
    const total = filteredRoller.length;
    
    // Sayfalama uygula
    const paginatedRoller = filteredRoller.slice(
      (sayfa - 1) * sayfaBasi,
      sayfa * sayfaBasi
    );
    
    return NextResponse.json({
      success: true,
      data: paginatedRoller,
      meta: {
        toplam: total,
        sayfaBasi,
        mevcutSayfa: sayfa,
        toplamSayfa: Math.ceil(total / sayfaBasi)
      }
    });
  } catch (error) {
    console.error('Roller getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Roller alınamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Rol oluştur
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.ad) {
      return NextResponse.json(
        { success: false, message: 'Rol adı zorunludur' },
        { status: 400 }
      );
    }
    
    // Rol adı kontrolü
    const rolAdiExists = mockRoller.some(rol => rol.ad === body.ad);
    if (rolAdiExists) {
      return NextResponse.json(
        { success: false, message: 'Bu rol adı zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    const yeniRol = {
      id: `rol-${Date.now()}`,
      ad: body.ad,
      aciklama: body.aciklama || '',
      izinler: body.izinler || [],
      sistemRolu: body.sistemRolu || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Mock listeye ekle
    mockRoller.push(yeniRol);
    
    return NextResponse.json({
      success: true,
      rol: yeniRol
    });
  } catch (error) {
    console.error('Rol oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Rol oluşturulamadı', error: error.message },
      { status: 500 }
    );
  }
} 
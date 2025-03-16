import { NextResponse } from 'next/server';

// Mock kullanıcı verileri
const mockKullanicilar = [
  {
    id: "test-admin-id",
    email: "admin@greenchem.com.tr",
    ad: "Admin",
    soyad: "Kullanıcı",
    departmanId: "dep-1",
    departman: {
      id: "dep-1",
      ad: "IT"
    },
    rol: "ADMIN",
    aktif: true,
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date(2023, 0, 1).toISOString()
  },
  {
    id: "kul-2",
    email: "aysegul.yilmaz@greenchem.com.tr",
    ad: "Ayşegül",
    soyad: "Yılmaz",
    departmanId: "dep-1",
    departman: {
      id: "dep-1",
      ad: "IT"
    },
    rol: "DEPARTMAN_YONETICISI",
    aktif: true,
    createdAt: new Date(2023, 1, 15).toISOString(),
    updatedAt: new Date(2023, 1, 15).toISOString()
  },
  {
    id: "kul-3",
    email: "mehmet.kaya@greenchem.com.tr",
    ad: "Mehmet",
    soyad: "Kaya",
    departmanId: "dep-2",
    departman: {
      id: "dep-2",
      ad: "Finans"
    },
    rol: "DEPARTMAN_YONETICISI",
    aktif: true,
    createdAt: new Date(2023, 2, 10).toISOString(),
    updatedAt: new Date(2023, 2, 10).toISOString()
  },
  {
    id: "kul-4",
    email: "zeynep.celik@greenchem.com.tr",
    ad: "Zeynep",
    soyad: "Çelik",
    departmanId: "dep-3",
    departman: {
      id: "dep-3",
      ad: "Satın Alma"
    },
    rol: "DEPARTMAN_YONETICISI",
    aktif: true,
    createdAt: new Date(2023, 3, 5).toISOString(),
    updatedAt: new Date(2023, 3, 5).toISOString()
  },
  {
    id: "kul-5",
    email: "ahmet.demir@greenchem.com.tr",
    ad: "Ahmet",
    soyad: "Demir",
    departmanId: "dep-4",
    departman: {
      id: "dep-4",
      ad: "İnsan Kaynakları"
    },
    rol: "DEPARTMAN_YONETICISI",
    aktif: true,
    createdAt: new Date(2023, 4, 20).toISOString(),
    updatedAt: new Date(2023, 4, 20).toISOString()
  },
  {
    id: "kul-6",
    email: "fatma.sahin@greenchem.com.tr",
    ad: "Fatma",
    soyad: "Şahin",
    departmanId: "dep-5",
    departman: {
      id: "dep-5",
      ad: "Üretim"
    },
    rol: "DEPARTMAN_YONETICISI",
    aktif: true,
    createdAt: new Date(2023, 5, 8).toISOString(),
    updatedAt: new Date(2023, 5, 8).toISOString()
  },
  {
    id: "kul-7",
    email: "mustafa.yildirim@greenchem.com.tr",
    ad: "Mustafa",
    soyad: "Yıldırım",
    departmanId: "dep-1",
    departman: {
      id: "dep-1",
      ad: "IT"
    },
    rol: "KULLANICI",
    aktif: true,
    createdAt: new Date(2023, 6, 12).toISOString(),
    updatedAt: new Date(2023, 6, 12).toISOString()
  },
  {
    id: "kul-8",
    email: "ayse.ozturk@greenchem.com.tr",
    ad: "Ayşe",
    soyad: "Öztürk",
    departmanId: "dep-2",
    departman: {
      id: "dep-2",
      ad: "Finans"
    },
    rol: "KULLANICI",
    aktif: true,
    createdAt: new Date(2023, 7, 17).toISOString(),
    updatedAt: new Date(2023, 7, 17).toISOString()
  },
  {
    id: "kul-9",
    email: "hasan.arslan@greenchem.com.tr",
    ad: "Hasan",
    soyad: "Arslan",
    departmanId: "dep-3",
    departman: {
      id: "dep-3",
      ad: "Satın Alma"
    },
    rol: "KULLANICI",
    aktif: true,
    createdAt: new Date(2023, 8, 22).toISOString(),
    updatedAt: new Date(2023, 8, 22).toISOString()
  },
  {
    id: "kul-10",
    email: "elif.dogan@greenchem.com.tr",
    ad: "Elif",
    soyad: "Doğan",
    departmanId: "dep-4",
    departman: {
      id: "dep-4",
      ad: "İnsan Kaynakları"
    },
    rol: "KULLANICI",
    aktif: false,
    createdAt: new Date(2023, 9, 30).toISOString(),
    updatedAt: new Date(2023, 10, 5).toISOString()
  }
];

// Kullanıcıları getir
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmanId = searchParams.get('departmanId');
    const rol = searchParams.get('rol');
    const aktif = searchParams.get('aktif');
    const arama = searchParams.get('arama');
    const sayfa = parseInt(searchParams.get('sayfa') || '1');
    const sayfaBasi = parseInt(searchParams.get('sayfaBasi') || '50');
    const siralamaAlani = searchParams.get('siralamaAlani') || 'ad';
    const siralamaYonu = searchParams.get('siralamaYonu') || 'asc';
    
    // Kullanıcıları filtrele
    let filteredKullanicilar = [...mockKullanicilar];
    
    if (departmanId) {
      filteredKullanicilar = filteredKullanicilar.filter(kullanici => kullanici.departmanId === departmanId);
    }
    
    if (rol) {
      filteredKullanicilar = filteredKullanicilar.filter(kullanici => kullanici.rol === rol);
    }
    
    if (aktif !== null && aktif !== undefined) {
      const aktifDurum = aktif === 'true';
      filteredKullanicilar = filteredKullanicilar.filter(kullanici => kullanici.aktif === aktifDurum);
    }
    
    if (arama) {
      const aramaLower = arama.toLowerCase();
      filteredKullanicilar = filteredKullanicilar.filter(kullanici => 
        kullanici.ad.toLowerCase().includes(aramaLower) || 
        kullanici.soyad.toLowerCase().includes(aramaLower) || 
        kullanici.email.toLowerCase().includes(aramaLower)
      );
    }
    
    // Sıralama
    filteredKullanicilar.sort((a, b) => {
      const direction = siralamaYonu === 'asc' ? 1 : -1;
      
      if (siralamaAlani === 'createdAt') {
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      
      // Tam ad için sıralama özel durumu
      if (siralamaAlani === 'tamAd') {
        const tamAdA = `${a.ad} ${a.soyad}`;
        const tamAdB = `${b.ad} ${b.soyad}`;
        return direction * tamAdA.localeCompare(tamAdB);
      }
      
      // Diğer alanlar için string karşılaştırması
      return direction * String(a[siralamaAlani]).localeCompare(String(b[siralamaAlani]));
    });
    
    // Toplam kullanıcı sayısı
    const total = filteredKullanicilar.length;
    
    // Sayfalama uygula
    const paginatedKullanicilar = filteredKullanicilar.slice(
      (sayfa - 1) * sayfaBasi,
      sayfa * sayfaBasi
    );
    
    return NextResponse.json({
      success: true,
      data: paginatedKullanicilar,
      meta: {
        toplam: total,
        sayfaBasi,
        mevcutSayfa: sayfa,
        toplamSayfa: Math.ceil(total / sayfaBasi)
      }
    });
  } catch (error) {
    console.error('Kullanıcılar getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Kullanıcılar alınamadı', error: error.message },
      { status: 500 }
    );
  }
}

// Kullanıcı detayı getir
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.email) {
      return NextResponse.json(
        { success: false, message: 'Email bilgisi zorunludur' },
        { status: 400 }
      );
    }
    
    // Email kontrolü
    const emailExists = mockKullanicilar.some(kullanici => kullanici.email === body.email);
    if (emailExists) {
      return NextResponse.json(
        { success: false, message: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    const yeniKullanici = {
      id: `kul-${Date.now()}`,
      email: body.email,
      ad: body.ad || '',
      soyad: body.soyad || '',
      departmanId: body.departmanId,
      departman: mockKullanicilar.find(k => k.departmanId === body.departmanId)?.departman,
      rol: body.rol || 'KULLANICI',
      aktif: body.aktif !== undefined ? body.aktif : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Mock listeye ekle
    mockKullanicilar.push(yeniKullanici);
    
    return NextResponse.json({
      success: true,
      kullanici: yeniKullanici
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Kullanıcı oluşturulamadı', error: error.message },
      { status: 500 }
    );
  }
} 
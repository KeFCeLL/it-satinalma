import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../middleware';

// Mock görev verileri - geliştirme modu için
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

// Geliştirme modu kontrolü
const IS_DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_API === 'true';

// Görevleri getir
async function getGorevlerHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tamamlandi = searchParams.get('tamamlandi');
    const { user } = request;
    
    // Geliştirme modu ise mock veri dön
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock görev verileri döndürülüyor');
      
      // Filtre uygula
      let filteredGorevler = [...mockGorevler];
      
      // Tamamlanma durumu filtresi
      if (tamamlandi !== null && tamamlandi !== undefined) {
        const isTamamlandi = tamamlandi === 'true';
        filteredGorevler = filteredGorevler.filter(gorev => gorev.tamamlandi === isTamamlandi);
      }
      
      return NextResponse.json({
        success: true,
        data: filteredGorevler
      });
    }
    
    // Prodüksiyon modu - normal veritabanı sorgusu
    // Filtreleri ayarla
    const where = {
      kullaniciId: user.id
    };
    
    // Tamamlanma durumu filtresi
    if (tamamlandi !== null && tamamlandi !== undefined) {
      where.tamamlandi = tamamlandi === 'true';
    }
    
    // Görevleri getir
    const gorevler = await prisma.gorev.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: gorevler
    });
  } catch (error) {
    console.error('Görevler getirme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock veri döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock görev verileri döndürülüyor');
      return NextResponse.json({
        success: true,
        data: mockGorevler
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Görevler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Görev oluştur
async function createGorevHandler(request) {
  try {
    const body = await request.json();
    const { user } = request;
    
    // Gerekli alanların kontrolü
    if (!body.metin) {
      return NextResponse.json(
        { success: false, message: 'Görev metni zorunludur' },
        { status: 400 }
      );
    }
    
    // Geliştirme modu ise mock yanıt dön
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock görev oluşturma');
      
      const yeniGorev = {
        id: `mock-gorev-${Date.now()}`,
        metin: body.metin,
        tamamlandi: body.tamamlandi || false,
        sonTarih: body.sonTarih ? new Date(body.sonTarih) : null,
        kullaniciId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock listeye ekle
      mockGorevler.unshift(yeniGorev);
      
      return NextResponse.json({
        success: true,
        data: yeniGorev
      });
    }
    
    // Görev oluştur
    const gorev = await prisma.gorev.create({
      data: {
        metin: body.metin,
        tamamlandi: body.tamamlandi || false,
        sonTarih: body.sonTarih ? new Date(body.sonTarih) : null,
        kullaniciId: user.id
      }
    });
    
    return NextResponse.json({
      success: true,
      data: gorev
    });
  } catch (error) {
    console.error('Görev oluşturma hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock görev oluşturma yanıtı döndürülüyor');
      
      const yeniGorev = {
        id: `mock-gorev-${Date.now()}`,
        metin: "Yeni oluşturulan görev",
        tamamlandi: false,
        kullaniciId: "test-admin-id",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        data: yeniGorev
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Görev oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Görevleri güncelle
async function updateGorevlerHandler(request) {
  try {
    const body = await request.json();
    const { user } = request;
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Görev ID zorunludur' },
        { status: 400 }
      );
    }
    
    // Geliştirme modu ise mock güncelleme yap
    if (IS_DEV_MODE) {
      console.log('🔧 Geliştirme modu: Mock görev güncelleme');
      
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
    }
    
    // Görevin kullanıcıya ait olup olmadığını kontrol et
    const gorev = await prisma.gorev.findUnique({
      where: {
        id: body.id
      }
    });
    
    if (!gorev || gorev.kullaniciId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Görev bulunamadı veya erişim izniniz yok' },
        { status: 404 }
      );
    }
    
    // Görevi güncelle
    const updatedGorev = await prisma.gorev.update({
      where: {
        id: body.id
      },
      data: {
        metin: body.metin !== undefined ? body.metin : gorev.metin,
        tamamlandi: body.tamamlandi !== undefined ? body.tamamlandi : gorev.tamamlandi,
        sonTarih: body.sonTarih !== undefined ? 
          (body.sonTarih ? new Date(body.sonTarih) : null) : 
          gorev.sonTarih
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedGorev
    });
  } catch (error) {
    console.error('Görev güncelleme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock görev güncelleme yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        data: {
          id: body?.id || "mock-gorev-1",
          metin: body?.metin || "Güncellenmiş görev",
          tamamlandi: body?.tamamlandi || false,
          kullaniciId: "test-admin-id",
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Görev güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withAuth(getGorevlerHandler);
export const POST = withAuth(createGorevHandler);
export const PUT = withAuth(updateGorevlerHandler); 
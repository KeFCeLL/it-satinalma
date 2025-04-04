import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../middleware';

// Tüm talepleri getir
async function getTaleplerHandler(request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('arama');
    const status = searchParams.get('durum');
    const departmentId = searchParams.get('departmanId');
    const priority = searchParams.get('oncelik');
    const startDate = searchParams.get('baslangicTarihi');
    const endDate = searchParams.get('bitisTarihi');
    const sortBy = searchParams.get('siralamaAlani') || 'createdAt';
    const sortDir = searchParams.get('siralamaYonu') || 'desc';
    const page = parseInt(searchParams.get('sayfa') || '1');
    const pageSize = parseInt(searchParams.get('sayfaBasi') || '10');
    const onaylandi = searchParams.get('onaylandi') === 'true';

    // Kullanıcı bilgilerini al
    const { id, rol, departmanId: kullaniciDepartmanId } = request.user;

    // Filtreleme koşulları oluştur
    const where = {};
    
    // Arama filtresi
    if (search) {
      where.OR = [
        { baslik: { contains: search } },
        { aciklama: { contains: search } },
      ];
    }
    
    // Durum filtresi
    if (status) {
      where.durum = status;
      
      // Özel durum: onaylanmış ve satınalma süreci bekleyen talepleri getir
      if (status === 'ONAYLANDI' && onaylandi) {
        // Prisma sorgusunu düzeltiyorum, sorunu çözmek için
        // Daha basit bir sorgu ile onaylanmış ve satınalma sürecine alınmamış talepleri bulalım

        // NOT: some ve every filtreleriyle olan sorun, taleplerin onaylanmış olmasına rağmen 
        // satınalma sayfasında görünmemesine neden oluyordu
        // Yeni filtre: durum ONAYLANDI olan tüm talepleri getir
        
        // Bu kısmı tamamen sıfırdan yazıyoruz
        delete where.onaylar; // Önceki onaylar filtresini kaldıralım
        
        // Bölümler (Departman, IT, Finans) onaylamış olmalı
        where.durum = 'ONAYLANDI';
        
        // Log ile kontrol edelim
        console.log("Satınalma için onaylanmış talepleri filtreliyorum:", where);
      }
    }
    
    // Departman filtresi
    if (departmentId) {
      where.departmanId = departmentId;
    }
    
    // Öncelik filtresi
    if (priority) {
      where.oncelik = priority;
    }
    
    // Tarih aralığı filtresi
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate)
      };
    }
    
    // Rol bazlı erişim kısıtlamaları
    if (rol === 'KULLANICI') {
      // Normal kullanıcılar sadece kendi taleplerini görebilir
      where.talepEdenId = id;
    } else if (rol === 'DEPARTMAN_YONETICISI') {
      // Departman yöneticileri kendi departmanlarının taleplerini görebilir
      where.departmanId = kullaniciDepartmanId;
    } else if (rol === 'IT_ADMIN') {
      // IT yöneticileri IT onayı bekleyen veya onayladıkları talepleri görebilir
      if (!departmentId) { // Eğer departman filtresi yoksa
        where.OR = [
          {
            onaylar: {
              some: {
                adim: 'IT_DEPARTMANI',
                durum: {
                  in: ['BEKLEMEDE', 'ONAYLANDI', 'REDDEDILDI'],
                },
              },
            },
          },
          {
            departmanId: kullaniciDepartmanId
          }
        ];
      }
    } else if (rol === 'FINANS_ADMIN') {
      // Finans yöneticileri finans onayı bekleyen veya onayladıkları talepleri görebilir
      if (!departmentId) { // Eğer departman filtresi yoksa
        where.OR = [
          {
            onaylar: {
              some: {
                adim: 'FINANS_DEPARTMANI',
                durum: {
                  in: ['BEKLEMEDE', 'ONAYLANDI', 'REDDEDILDI'],
                },
              },
            },
          },
          {
            departmanId: kullaniciDepartmanId
          }
        ];
      }
    } else if (rol === 'SATINALMA_ADMIN') {
      // Satınalma yöneticileri satınalma aşamasındaki talepleri görebilir
      if (!departmentId) { // Eğer departman filtresi yoksa
        where.OR = [
          {
            durum: {
              in: ['ONAYLANDI', 'SATINALMA_SURECINDE', 'TAMAMLANDI'],
            },
          },
          {
            departmanId: kullaniciDepartmanId
          }
        ];
      }
    }
    // Adminler herşeyi görebilir, ek kısıtlama yok

    // Sıralama
    const orderBy = {};
    orderBy[sortBy === 'talepNo' ? 'id' : sortBy] = sortDir;

    // Toplam sayıyı al
    const total = await prisma.talep.count({ where });

    // Sayfalama ile talepleri getir
    const talepler = await prisma.talep.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        departman: true,
        talepEden: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
            departman: true,
          },
        },
        urun: true,
        onaylar: {
          include: {
            onaylayan: {
              select: {
                id: true,
                ad: true,
                soyad: true,
                email: true,
                rol: true,
              },
            },
          },
        },
      },
    });

    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: talepler,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Talepler getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Yeni talep oluştur
async function createTalepHandler(request) {
  try {
    const requestData = await request.json();
    console.log("Talep oluşturma isteği alındı:", requestData);
    
    const { 
      baslik, 
      aciklama, 
      gerekce, // Bu alan kullanılabilir ama veritabanına kaydedilmeyecek
      departmanId, 
      oncelik, 
      tahminiTutar,
      tahminiTeslimTarihi,
      urunTalepler 
    } = requestData;
    
    // Kullanıcı bilgilerini al
    const { id: kullaniciId, rol, departmanId: kullaniciDepartmanId } = request.user;
    console.log("İstek yapan kullanıcı ID:", kullaniciId, "Rol:", rol);

    // Kullanıcının var olup olmadığını kontrol et
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: kullaniciId },
    });

    if (!kullanici) {
      console.log("Kullanıcı bulunamadı:", kullaniciId);
      return NextResponse.json(
        { success: false, message: 'Geçersiz kullanıcı' },
        { status: 400 }
      );
    }

    // Zorunlu alanları kontrol et
    if (!baslik || !aciklama || !departmanId || !oncelik || !urunTalepler || urunTalepler.length === 0 || !tahminiTeslimTarihi) {
      console.log("Eksik alanlar:", { baslik, aciklama, departmanId, oncelik, urunTalepler, tahminiTeslimTarihi });
      return NextResponse.json(
        { success: false, message: 'Tüm zorunlu alanlar doldurulmalıdır. Tahmini teslim tarihi seçilmelidir.' },
        { status: 400 }
      );
    }

    // Tarih formatını kontrol et ve dönüştür
    let parsedDate;
    try {
      parsedDate = new Date(tahminiTeslimTarihi);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Geçersiz tarih formatı');
      }
    } catch (error) {
      console.error('Tarih dönüşüm hatası:', error);
      return NextResponse.json(
        { success: false, message: 'Geçersiz tarih formatı' },
        { status: 400 }
      );
    }

    // Departmanın var olup olmadığını kontrol et
    const departman = await prisma.departman.findUnique({
      where: { id: departmanId },
    });

    if (!departman) {
      console.log("Departman bulunamadı:", departmanId);
      return NextResponse.json(
        { success: false, message: 'Geçersiz departman' },
        { status: 400 }
      );
    }
    
    console.log("Departman bulundu:", departman);

    // Ürünleri kontrol et
    for (const urunTalep of urunTalepler) {
      if (!urunTalep.urunId || !urunTalep.miktar || urunTalep.miktar <= 0) {
        console.log("Geçersiz ürün talebi:", urunTalep);
        return NextResponse.json(
          { success: false, message: 'Tüm ürünler için geçerli ID ve miktar gereklidir' },
          { status: 400 }
        );
      }

      // Ürünün var olup olmadığını kontrol et
      const urun = await prisma.urun.findUnique({
        where: { id: urunTalep.urunId },
      });

      if (!urun) {
        console.log("Ürün bulunamadı:", urunTalep.urunId);
        return NextResponse.json(
          { success: false, message: `Ürün bulunamadı: ${urunTalep.urunId}` },
          { status: 400 }
        );
      }
      
      console.log("Ürün bulundu:", urun);
    }

    console.log("Talep oluşturuluyor...");
    
    // Kullanıcı rolünü kontrol et - eğer kullanıcı bir departman yöneticisi ve kendi departmanı için talep oluşturuyorsa
    const isDepartmentManager = rol === 'DEPARTMAN_YONETICISI' && kullaniciDepartmanId === departmanId;
    const isFinanceAdmin = rol === 'FINANS_ADMIN';
    const isITAdmin = rol === 'IT_ADMIN';
    const isSatinalmaAdmin = rol === 'SATINALMA_ADMIN';
    const isAdmin = rol === 'ADMIN';
    
    // Onay adımları oluştur
    let onaylarCreate = [];
    
    // Departman yöneticisi adımı
    onaylarCreate.push({
      adim: 'DEPARTMAN_YONETICISI',
      durum: isDepartmentManager || isAdmin ? 'ONAYLANDI' : 'BEKLEMEDE',
      onaylayanId: isDepartmentManager || isAdmin ? kullaniciId : null,
      tarih: isDepartmentManager || isAdmin ? new Date() : null
    });
    
    // IT departmanı adımı
    onaylarCreate.push({
      adim: 'IT_DEPARTMANI',
      durum: isITAdmin || isAdmin ? 'ONAYLANDI' : 'BEKLEMEDE',
      onaylayanId: isITAdmin || isAdmin ? kullaniciId : null,
      tarih: isITAdmin || isAdmin ? new Date() : null
    });
    
    // Finans departmanı adımı
    onaylarCreate.push({
      adim: 'FINANS_DEPARTMANI',
      durum: isFinanceAdmin || isAdmin ? 'ONAYLANDI' : 'BEKLEMEDE',
      onaylayanId: isFinanceAdmin || isAdmin ? kullaniciId : null,
      tarih: isFinanceAdmin || isAdmin ? new Date() : null
    });
    
    // Talep durumunu kontrol et
    let talepDurum = 'BEKLEMEDE';
    
    // Eğer tüm adımlar otomatik olarak onaylandıysa, talep durumunu da ONAYLANDI yap
    if ((isDepartmentManager || isAdmin) && (isITAdmin || isAdmin) && (isFinanceAdmin || isAdmin)) {
      talepDurum = 'ONAYLANDI';
    }
    
    // Talep oluştur
    const yeniTalep = await prisma.talep.create({
      data: {
        baslik,
        aciklama,
        departmanId,
        talepEdenId: kullaniciId,
        durum: talepDurum,
        oncelik,
        tahminiTeslimTarihi: parsedDate,
        createdAt: new Date(),
        urunTalepler: {
          create: urunTalepler.map(urunTalep => ({
            urunId: urunTalep.urunId,
            miktar: urunTalep.miktar,
            tutar: urunTalep.tutar,
          })),
        },
        onaylar: {
          create: onaylarCreate,
        },
      },
      include: {
        departman: true,
        talepEden: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
          },
        },
        urunTalepler: {
          include: {
            urun: true,
          },
        },
        onaylar: true,
      },
    });
    
    console.log("Talep başarıyla oluşturuldu:", yeniTalep.id);

    // Departman yöneticisine bildirim gönder - eğer oluşturan kişi departman yöneticisi değilse
    if (!isDepartmentManager) {
      const departmanYoneticileri = await prisma.kullanici.findMany({
        where: {
          departmanId: departmanId,
          rol: 'DEPARTMAN_YONETICISI',
        },
      });

      if (departmanYoneticileri.length > 0) {
        console.log("Departman yöneticilerine bildirim gönderiliyor:", departmanYoneticileri.map(y => y.id));
        await Promise.all(
          departmanYoneticileri.map(yonetici =>
            prisma.bildirim.create({
              data: {
                kullaniciId: yonetici.id,
                baslik: 'Yeni Talep Onayı',
                mesaj: 'Yeni talep onayınızı bekliyor.',
                okundu: false,
              },
            })
          )
        );
      }
    }
    
    // IT yöneticisine bildirim gönder - eğer departman yöneticisi otomatik onaylandıysa ve IT admin değilse
    if ((isDepartmentManager || isAdmin) && !isITAdmin) {
      const itYoneticileri = await prisma.kullanici.findMany({
        where: {
          rol: 'IT_ADMIN',
        },
      });

      if (itYoneticileri.length > 0) {
        console.log("IT yöneticilerine bildirim gönderiliyor");
        await Promise.all(
          itYoneticileri.map(yonetici =>
            prisma.bildirim.create({
              data: {
                kullaniciId: yonetici.id,
                baslik: 'Yeni Talep Onayı',
                mesaj: 'Yeni talep IT onayınızı bekliyor.',
                okundu: false,
              },
            })
          )
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Talep başarıyla oluşturuldu',
      data: yeniTalep,
    }, { status: 201 });
  } catch (error) {
    console.error('Talep oluşturma hatası:', error);
    console.error('Hata detayları:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export handler'ları
export const GET = withAuth(getTaleplerHandler);
export const POST = withAuth(createTalepHandler); 
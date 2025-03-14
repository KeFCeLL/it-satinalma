import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { withAuth, withRole } from '../../../middleware';

// Talep onaylama/reddetme
async function updateTalepOnayHandler(request, { params }) {
  try {
    const id = params.id;
    const { adim, durum, aciklama } = await request.json();

    if (!id || !adim || !durum) {
      return NextResponse.json(
        { success: false, message: 'Talep ID, adım ve durum alanları zorunludur' },
        { status: 400 }
      );
    }

    // Geçerli durum değerleri
    const validDurumlar = ['ONAYLANDI', 'REDDEDILDI', 'BEKLEMEDE', 'BEKLEMIYOR', 'TAMAMLANDI', 'SATINALMA_SURECINDE'];
    if (!validDurumlar.includes(durum)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz durum değeri' },
        { status: 400 }
      );
    }

    // Geçerli adım değerleri
    const validAdimlar = ['DEPARTMAN_YONETICISI', 'IT_DEPARTMANI', 'FINANS_DEPARTMANI', 'SATINALMA_DEPARTMANI'];
    if (!validAdimlar.includes(adim)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz adım değeri' },
        { status: 400 }
      );
    }

    // Talep ve onay adımlarını getir
    const talep = await prisma.talep.findUnique({
      where: { id },
      include: {
        departman: true,
        talepEden: true,
        onaylar: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!talep) {
      return NextResponse.json(
        { success: false, message: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı bilgilerini al
    const { id: kullaniciId, rol, departmanId: kullaniciDepartmanId } = request.user;

    // Yetki kontrolü
    let yetkiliKullanici = false;

    // Adıma göre yetki kontrolü
    if (adim === 'DEPARTMAN_YONETICISI') {
      // Departman yöneticisi veya admin
      yetkiliKullanici = rol === 'ADMIN' || 
        (rol === 'DEPARTMAN_YONETICISI' && kullaniciDepartmanId === talep.departmanId);
    } else if (adim === 'IT_DEPARTMANI') {
      // IT yöneticisi veya admin
      yetkiliKullanici = rol === 'ADMIN' || rol === 'IT_ADMIN';
    } else if (adim === 'FINANS_DEPARTMANI') {
      // Finans yöneticisi veya admin
      yetkiliKullanici = rol === 'ADMIN' || rol === 'FINANS_ADMIN';
    } else if (adim === 'SATINALMA_DEPARTMANI') {
      // Satınalma yöneticisi veya admin
      yetkiliKullanici = rol === 'ADMIN' || rol === 'SATINALMA_ADMIN';
    }

    if (!yetkiliKullanici) {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz bulunmuyor' },
        { status: 403 }
      );
    }

    // İlgili onay adımını bul
    const onayAdimi = talep.onaylar.find(a => a.adim === adim);
    if (!onayAdimi) {
      return NextResponse.json(
        { success: false, message: 'Onay adımı bulunamadı' },
        { status: 404 }
      );
    }

    // İptal edilmiş talepleri güncellemeyi engelle
    if (talep.durum === 'IPTAL_EDILDI') {
      return NextResponse.json(
        { success: false, message: 'İptal edilmiş taleplerin onay durumu güncellenemez' },
        { status: 400 }
      );
    }

    // Kullanıcı kendi talebini mi onaylıyor?
    const isSelfApproval = kullaniciId === talep.talepEdenId;

    // Onay akışı kontrolü - Kullanıcı kendi talebini onaylıyorsa sıra kontrolü yapma
    if (!isSelfApproval) {
      // Departman yöneticisi onayından sonra IT onayı gelir
      if (adim === 'IT_DEPARTMANI') {
        const departmanOnay = talep.onaylar.find(a => a.adim === 'DEPARTMAN_YONETICISI');
        if (!departmanOnay || departmanOnay.durum !== 'ONAYLANDI') {
          // Eğer onaylayan kişi ADMIN ise bu kontrolü bypass et
          if (rol === 'ADMIN') {
            console.log('Admin kullanıcı sıra kontrolünü atlıyor');
          }
          else {
            return NextResponse.json(
              { success: false, message: 'Bu adımı güncellemek için önce departman yöneticisi onayı gereklidir' },
              { status: 400 }
            );
          }
        }
      }
  
      // IT onayından sonra finans onayı gelir
      if (adim === 'FINANS_DEPARTMANI') {
        const itOnay = talep.onaylar.find(a => a.adim === 'IT_DEPARTMANI');
        if (!itOnay || itOnay.durum !== 'ONAYLANDI') {
          // Eğer onaylayan kişi ADMIN ise veya FINANS_ADMIN ve kendi talebi ise bu kontrolü bypass et
          if (rol === 'ADMIN' || (rol === 'FINANS_ADMIN' && talep.talepEdenId === kullaniciId)) {
            console.log('Admin veya Finans yöneticisi kendi talebinde sıra kontrolünü atlıyor');
          }
          else {
            return NextResponse.json(
              { success: false, message: 'Bu adımı güncellemek için önce IT departmanı onayı gereklidir' },
              { status: 400 }
            );
          }
        }
      }
  
      // Finans onayından sonra satınalma süreci başlar
      if (adim === 'SATINALMA_DEPARTMANI') {
        const finansOnay = talep.onaylar.find(a => a.adim === 'FINANS_DEPARTMANI');
        if (!finansOnay || finansOnay.durum !== 'ONAYLANDI') {
          // Eğer onaylayan kişi ADMIN ise veya SATINALMA_ADMIN ve kendi talebi ise bu kontrolü bypass et
          if (rol === 'ADMIN' || (rol === 'SATINALMA_ADMIN' && talep.talepEdenId === kullaniciId)) {
            console.log('Admin veya Satınalma yöneticisi kendi talebinde sıra kontrolünü atlıyor');
          }
          else {
            return NextResponse.json(
              { success: false, message: 'Bu adımı güncellemek için önce finans departmanı onayı gereklidir' },
              { status: 400 }
            );
          }
        }
      }
    } else {
      console.log('Kullanıcı kendi talebini onaylıyor, sıra kontrolü atlanıyor');
    }

    // Onay adımını güncelle
    await prisma.onay.update({
      where: { id: onayAdimi.id },
      data: {
        durum,
        aciklama: aciklama || null,
        onaylayanId: kullaniciId,
        tarih: new Date(),
      },
    });

    // Talep durumunu güncelle
    let yeniOnayDurumu = talep.durum;

    // Eğer bir adım reddedildiyse, talep de reddedilir
    if (durum === 'REDDEDILDI') {
      yeniOnayDurumu = 'REDDEDILDI';
    } 
    // Eğer satınalma adımı işlemdeyse
    else if (adim === 'SATINALMA_DEPARTMANI' && durum === 'SATINALMA_SURECINDE') {
      yeniOnayDurumu = 'SATINALMA_SURECINDE'; // Satınalma sürecinde olarak bırakıyoruz
    }
    // Eğer satınalma adımı tamamlandıysa
    else if (adim === 'SATINALMA_DEPARTMANI' && durum === 'TAMAMLANDI') {
      yeniOnayDurumu = 'TAMAMLANDI';
    }
    // Tüm adımların onay durumunu kontrol et ve talep durumunu güncelle
    else {
      // Finans onayı verildiğinde veya herhangi bir adımda onay verildiğinde tüm onayları kontrol et
      const tumOnaylarTamamlandi = talep.onaylar
        .filter(a => a.adim !== 'SATINALMA_DEPARTMANI') // Satınalma hariç
        .every(a => {
          // Mevcut adım için yeni durum veya mevcut durumu kontrol et
          const adimDurum = a.adim === adim ? durum : a.durum;
          return adimDurum === 'ONAYLANDI';
        });

      // Eğer tüm onaylar tamamlandıysa (Satınalma hariç)
      if (tumOnaylarTamamlandi) {
        console.log('Tüm onaylar tamamlandı, talep durumu ONAYLANDI yapılıyor');
        yeniOnayDurumu = 'ONAYLANDI';
        
        // Satınalma adımını otomatik olarak BEKLEMEDE yap
        const satinalmaAdimi = talep.onaylar.find(a => a.adim === 'SATINALMA_DEPARTMANI');
        if (satinalmaAdimi) {
          await prisma.onay.update({
            where: { id: satinalmaAdimi.id },
            data: { durum: 'BEKLEMEDE' }
          });
        }
      } else {
        // Tüm onaylar tamamlanmadıysa BEKLEMEDE durumunda kalmalı
        yeniOnayDurumu = 'BEKLEMEDE';
      }
    }

    // Talep durumunu güncelle
    const updatedTalep = await prisma.talep.update({
      where: { id },
      data: {
        durum: yeniOnayDurumu,
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

    // Talep sahibine bildirim gönder
    let bildirimBaslik = '';
    let bildirimMesaj = '';

    if (durum === 'ONAYLANDI') {
      bildirimBaslik = `${adim.replace('_', ' ')} Onaylandı`;
      bildirimMesaj = `${talep.id} numaralı talebiniz ${adim.replace('_', ' ')} tarafından onaylandı.`;
    } else if (durum === 'REDDEDILDI') {
      bildirimBaslik = `${adim.replace('_', ' ')} Reddetti`;
      bildirimMesaj = `${talep.id} numaralı talebiniz ${adim.replace('_', ' ')} tarafından reddedildi.`;
    } else if (durum === 'SATINALMA_SURECINDE') {
      bildirimBaslik = 'Satınalma Sürecinde';
      bildirimMesaj = `${talep.id} numaralı talebiniz satınalma sürecine alındı.`;
    } else if (durum === 'TAMAMLANDI') {
      bildirimBaslik = 'Talep Tamamlandı';
      bildirimMesaj = `${talep.id} numaralı talebiniz tamamlandı.`;
    }

    // Bildirim gönder
    if (bildirimBaslik && bildirimMesaj) {
      await prisma.bildirim.create({
        data: {
          kullaniciId: talep.talepEdenId,
          baslik: bildirimBaslik,
          mesaj: bildirimMesaj,
          okundu: false,
        },
      });
    }

    // Bir sonraki onay adımına bildirim gönder
    if (durum === 'ONAYLANDI') {
      let sonrakiAdim = null;
      
      if (adim === 'DEPARTMAN_YONETICISI') {
        sonrakiAdim = 'IT_DEPARTMANI';
      } else if (adim === 'IT_DEPARTMANI') {
        sonrakiAdim = 'FINANS_DEPARTMANI';
      } else if (adim === 'FINANS_DEPARTMANI') {
        sonrakiAdim = 'SATINALMA_DEPARTMANI';
      }

      if (sonrakiAdim) {
        let sonrakiRol = '';
        if (sonrakiAdim === 'IT_DEPARTMANI') sonrakiRol = 'IT_ADMIN';
        else if (sonrakiAdim === 'FINANS_DEPARTMANI') sonrakiRol = 'FINANS_ADMIN';
        else if (sonrakiAdim === 'SATINALMA_DEPARTMANI') sonrakiRol = 'SATINALMA_ADMIN';

        const sonrakiKullanicilar = await prisma.kullanici.findMany({
          where: {
            rol: sonrakiRol,
          },
        });

        if (sonrakiKullanicilar.length > 0) {
          await Promise.all(
            sonrakiKullanicilar.map(kullanici =>
              prisma.bildirim.create({
                data: {
                  kullaniciId: kullanici.id,
                  baslik: 'Yeni Talep Onayı',
                  mesaj: `${talep.id} numaralı talep onayınızı bekliyor.`,
                  okundu: false,
                },
              })
            )
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Talep onay durumu başarıyla güncellendi`,
      data: updatedTalep,
    });
  } catch (error) {
    console.error('Talep onay güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Export handler
export const PUT = withAuth(updateTalepOnayHandler);
export const POST = withAuth(updateTalepOnayHandler); 
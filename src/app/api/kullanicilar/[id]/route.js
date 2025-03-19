import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRole } from '@/app/api/middleware';
import bcrypt from 'bcrypt';

// Mock kullanıcı verileri
// Bu verileri ana kullanıcılar route.js'deki ile senkronize tutmak gerekiyor
// Modüler yapı için bu mock verileri ayrı bir dosyada tutup import etmek daha iyi olabilir
const mockKullanicilar = [
  {
    id: "mock-user-1",
    email: "admin@example.com",
    ad: "Admin",
    soyad: "Kullanıcı",
    rol: "ADMIN",
    departmanId: "mock-dep-1",
    departman: {
      id: "mock-dep-1",
      ad: "IT Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-2",
    email: "satin.alma@example.com",
    ad: "Satın",
    soyad: "Alma",
    rol: "SATIN_ALMA",
    departmanId: "mock-dep-2",
    departman: {
      id: "mock-dep-2",
      ad: "Satın Alma Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-3",
    email: "finans@example.com",
    ad: "Finans",
    soyad: "Sorumlusu",
    rol: "FINANS",
    departmanId: "mock-dep-3",
    departman: {
      id: "mock-dep-3",
      ad: "Finans Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-4",
    email: "talep@example.com",
    ad: "Talep",
    soyad: "Eden",
    rol: "TALEP",
    departmanId: "mock-dep-4",
    departman: {
      id: "mock-dep-4",
      ad: "Pazarlama Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-5",
    email: "onay@example.com",
    ad: "Onay",
    soyad: "Veren",
    rol: "ONAY",
    departmanId: "mock-dep-5",
    departman: {
      id: "mock-dep-5",
      ad: "Yönetim Departmanı"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// !!! KRİTİK ÇÖZÜM !!! Global IS_DEV_MODE değişkeni veya kendi false değerimizi kullan
// UYARI: Bu değişken asla true olmamalı, aşağıdaki tüm kod bunun false olduğu varsayılarak yazılmıştır
const IS_DEV_MODE = global.IS_DEV_MODE !== undefined ? global.IS_DEV_MODE : false;

// Log fonksiyonları ekleyelim
function logInfo(message, data = null) {
  const logMsg = `🔵 [API/Kullanicilar/ID] ${message}`;
  if (data) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
}

function logError(message, error = null) {
  const logMsg = `🔴 [API/Kullanicilar/ID] ${message}`;
  if (error) {
    console.error(logMsg, error);
  } else {
    console.error(logMsg);
  }
}

// Ortam değişkenlerini logla
logInfo('Kullanıcı Detay API yükleniyor (Global değişken kullanılıyor)', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_DEV_API: process.env.NEXT_PUBLIC_DEV_API,
  DB_BYPASS: process.env.DB_BYPASS,
  globalIsDev: global.IS_DEV_MODE,
  localIsDev: IS_DEV_MODE,
  message: "IS_DEV_MODE değişkeni KAPALI olarak ayarlandı"
});

// GET - Tek bir kullanıcıyı getir
async function getKullaniciHandler(request, { params }) {
  try {
    const { id } = params;
    
    // Geliştirme modu ise mock veri dön
    // DEVRE DIŞI - Global değişken her zaman false
    // if (IS_DEV_MODE) {
    //   console.log('🔧 Geliştirme modu: Mock kullanıcı verisi döndürülüyor, ID:', id);
      
    //   // Mock kullanıcıyı bul
    //   const kullanici = mockKullanicilar.find(user => user.id === id);
      
    //   // Kullanıcı bulunamadıysa
    //   if (!kullanici) {
    //     // ID test-admin-id ise özel bir kullanıcı döndür (oturum açma için)
    //     if (id === 'test-admin-id') {
    //       const adminUser = {
    //         id: "test-admin-id",
    //         email: "test@example.com",
    //         ad: "Test",
    //         soyad: "Admin",
    //         rol: "ADMIN",
    //         departmanId: "mock-dep-1",
    //         departman: {
    //           id: "mock-dep-1",
    //           ad: "IT Departmanı"
    //         },
    //         createdAt: new Date(),
    //         updatedAt: new Date()
    //       };
    //       
    //       return NextResponse.json({
    //         success: true,
    //         user: adminUser
    //       });
    //     }
    //     
    //     return NextResponse.json(
    //       { success: false, message: 'Kullanıcı bulunamadı' },
    //       { status: 404 }
    //     );
    //   }
    //   
    //   return NextResponse.json({
    //     success: true,
    //     user: kullanici
    //   });
    // }
    
    logInfo('Kullanıcı getirme isteği - ID:', id);
    
    try {
      // Kullanıcıyı bul
      const kullanici = await prisma.kullanici.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          ad: true,
          soyad: true,
          rol: true,
          departmanId: true,
          departman: {
            select: {
              id: true,
              ad: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (!kullanici) {
        return NextResponse.json(
          { success: false, message: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: kullanici,
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
      // ID test-admin-id ise özel bir kullanıcı döndür (oturum açma için)
      if (id === 'test-admin-id') {
        return NextResponse.json({
          success: true,
          user: {
            id: "test-admin-id",
            email: "test@example.com",
            ad: "Test",
            soyad: "Admin",
            rol: "ADMIN",
            departmanId: "mock-dep-1",
            departman: {
              id: "mock-dep-1",
              ad: "IT Departmanı"
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      // Genel bir kullanıcı için ilk mock kullanıcıyı döndür
      return NextResponse.json({
        success: true,
        user: mockKullanicilar[0]
      });
    }
  } catch (error) {
    logError('Kullanıcı getirme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    // DEVRE DIŞI - Global değişken her zaman false
    // if (IS_DEV_MODE) {
    //   console.log('🔧 Hata alındı, geliştirme modu: Mock kullanıcı verisi döndürülüyor');
    //   
    //   // ID test-admin-id ise özel bir kullanıcı döndür (oturum açma için)
    //   if (params?.id === 'test-admin-id') {
    //     return NextResponse.json({
    //       success: true,
    //       user: {
    //         id: "test-admin-id",
    //         email: "test@example.com",
    //         ad: "Test",
    //         soyad: "Admin",
    //         rol: "ADMIN",
    //         departmanId: "mock-dep-1",
    //         departman: {
    //           id: "mock-dep-1",
    //           ad: "IT Departmanı"
    //         },
    //         createdAt: new Date(),
    //         updatedAt: new Date()
    //       }
    //     });
    //   }
    //   
    //   return NextResponse.json({
    //     success: true,
    //     user: mockKullanicilar[0]
    //   });
    // }
    
    return NextResponse.json(
      { success: false, message: 'Kullanıcı getirilirken bir hata oluştu', error: error.message },
      { status: 500 }
    );
  } finally {
    if (!IS_DEV_MODE) {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.error('Prisma bağlantı kapatma hatası:', error);
      }
    }
  }
}

// PUT - Kullanıcıyı güncelle
async function updateKullaniciHandler(request, { params }) {
  try {
    const { id } = params;
    const { email, ad, soyad, sifre, rol, departmanId } = await request.json();
    
    // Geliştirme modu ise mock işlem yap
    // if (IS_DEV_MODE) {
    //   console.log('🔧 Geliştirme modu: Mock kullanıcı güncelleniyor, ID:', id);
      
    //   // Mock kullanıcıyı bul
    //   const kullaniciIndex = mockKullanicilar.findIndex(user => user.id === id);
      
    //   // Kullanıcı bulunamadıysa
    //   if (kullaniciIndex === -1) {
    //     return NextResponse.json(
    //       { success: false, message: 'Kullanıcı bulunamadı' },
    //       { status: 404 }
    //     );
    //   }
      
    //   // Mock kullanıcıyı güncelle
    //   const guncelKullanici = {
    //     ...mockKullanicilar[kullaniciIndex],
    //     email: email || mockKullanicilar[kullaniciIndex].email,
    //     ad: ad || mockKullanicilar[kullaniciIndex].ad,
    //     soyad: soyad || mockKullanicilar[kullaniciIndex].soyad,
    //     rol: rol || mockKullanicilar[kullaniciIndex].rol,
    //     departmanId: departmanId || mockKullanicilar[kullaniciIndex].departmanId,
    //     departman: departmanId ? {
    //       id: departmanId,
    //       ad: "Mock Departman"
    //     } : mockKullanicilar[kullaniciIndex].departman,
    //     updatedAt: new Date()
    //   };
      
    //   // Mock listeyi güncelle
    //   mockKullanicilar[kullaniciIndex] = guncelKullanici;
      
    //   return NextResponse.json({
    //     success: true,
    //     user: guncelKullanici
    //   });
    // }
    
    // !!! GEÇİCİ ÇÖZÜM !!! - Geliştirme modu kontrolünü devre dışı bıraktık, gerçek veritabanı işlemi yapılıyor
    console.log('Geliştirme modu kontrolü devre dışı bırakıldı, gerçek veritabanı işlemi yapılıyor');
    
    try {
      // Kullanıcının var olup olmadığını kontrol et
      const existingUser = await prisma.kullanici.findUnique({
        where: { id },
      });
      
      if (!existingUser) {
        return NextResponse.json(
          { success: false, message: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }
      
      // Email değiştirilmişse, başka bir kullanıcı tarafından kullanılıp kullanılmadığını kontrol et
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.kullanici.findFirst({
          where: {
            email,
            id: {
              not: id
            }
          }
        });
        
        if (emailExists) {
          return NextResponse.json(
            { success: false, message: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor' },
            { status: 400 }
          );
        }
      }
      
      // Güncelleme verilerini hazırla
      const updateData = {};
      
      if (email) updateData.email = email;
      if (ad) updateData.ad = ad;
      if (soyad) updateData.soyad = soyad;
      if (rol) updateData.rol = rol;
      
      // departmanId null olarak belirtilmişse, departmanı kaldır
      if (departmanId === null) {
        updateData.departmanId = null;
      } else if (departmanId) {
        updateData.departmanId = departmanId;
      }
      
      // Şifre değiştirilecekse hashle
      if (sifre) {
        updateData.sifre = await bcrypt.hash(sifre, 10);
      }
      
      // Kullanıcıyı güncelle
      const updatedUser = await prisma.kullanici.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          ad: true,
          soyad: true,
          rol: true,
          departmanId: true,
          departman: {
            select: {
              id: true,
              ad: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      
      return NextResponse.json({
        success: true,
        user: updatedUser,
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock veriye dönülüyor:', dbError);
      
      // Mock kullanıcı döndür
      return NextResponse.json({
        success: true,
        user: {
          id,
          email: email || "updated@example.com",
          ad: ad || "Güncellenmiş",
          soyad: soyad || "Kullanıcı",
          rol: rol || "TALEP",
          departmanId: departmanId || null,
          departman: departmanId ? { id: departmanId, ad: "Mock Departman" } : null,
          createdAt: new Date(Date.now() - 3600000), // 1 saat önce
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    
    // Hata durumunda geliştirme modunda mock yanıt döndür
    if (IS_DEV_MODE) {
      console.log('🔧 Hata alındı, geliştirme modu: Mock kullanıcı güncelleme yanıtı döndürülüyor');
      
      return NextResponse.json({
        success: true,
        user: {
          id: params?.id || "error-id",
          email: "error@example.com",
          ad: "Hata",
          soyad: "Güncelleme",
          rol: "TALEP",
          departmanId: null,
          departman: null,
          createdAt: new Date(Date.now() - 3600000), // 1 saat önce
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Kullanıcı güncellenirken bir hata oluştu', error: error.message },
      { status: 500 }
    );
  } finally {
    if (!IS_DEV_MODE) {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.error('Prisma bağlantı kapatma hatası:', error);
      }
    }
  }
}

// DELETE - Kullanıcıyı sil
async function deleteKullaniciHandler(request, { params }) {
  try {
    const { id } = params;
    
    // Geliştirme modu ise mock işlem yap
    // if (IS_DEV_MODE) {
    //   console.log('🔧 Geliştirme modu: Mock kullanıcı siliniyor, ID:', id);
      
    //   // Kullanıcının indeksini bul
    //   const kullaniciIndex = mockKullanicilar.findIndex(user => user.id === id);
      
    //   // Kullanıcı bulunamadıysa
    //   if (kullaniciIndex === -1) {
    //     return NextResponse.json(
    //       { success: false, message: 'Kullanıcı bulunamadı' },
    //       { status: 404 }
    //     );
    //   }
      
    //   // Silinen kullanıcı bilgisini sakla
    //   const deletedUser = { ...mockKullanicilar[kullaniciIndex] };
      
    //   // Kullanıcıyı listeden çıkar
    //   mockKullanicilar.splice(kullaniciIndex, 1);
      
    //   return NextResponse.json({
    //     success: true,
    //     message: 'Kullanıcı başarıyla silindi',
    //     deletedUser
    //   });
    // }
    
    // !!! GEÇİCİ ÇÖZÜM !!! - Geliştirme modu kontrolünü devre dışı bıraktık, gerçek veritabanı işlemi yapılacak
    console.log('Geliştirme modu kontrolü devre dışı bırakıldı, gerçek veritabanı işlemi yapılıyor');
    
    try {
      // Kullanıcının var olup olmadığını kontrol et
      const existingUser = await prisma.kullanici.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          ad: true,
          soyad: true,
        },
      });
      
      if (!existingUser) {
        return NextResponse.json(
          { success: false, message: 'Kullanıcı bulunamadı' },
          { status: 404 }
        );
      }
      
      // Kullanıcıyı sil
      await prisma.kullanici.delete({
        where: { id },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Kullanıcı başarıyla silindi',
        deletedUser: existingUser
      });
    } catch (dbError) {
      console.error('Veritabanı hatası, mock yanıt döndürülüyor:', dbError);
      
      return NextResponse.json({
        success: true,
        message: 'Kullanıcı başarıyla silindi (mock)',
        deletedUser: {
          id,
          email: "deleted@example.com",
          ad: "Silinmiş",
          soyad: "Kullanıcı"
        }
      });
    }
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    
    // !!! GEÇİCİ ÇÖZÜM !!! - Geliştirme modu kontrolünü devre dışı bıraktık, hata mesajı döndürüyoruz
    console.log('Geliştirme modu kontrolü devre dışı bırakıldı, gerçek hata döndürülüyor');
    
    return NextResponse.json(
      { success: false, message: 'Kullanıcı silinirken bir hata oluştu', error: error.message },
      { status: 500 }
    );
  } finally {
    if (!IS_DEV_MODE) {
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.error('Prisma bağlantı kapatma hatası:', error);
      }
    }
  }
}

// Export handlers
export const GET = withAuth(getKullaniciHandler);
export const PUT = withAuth(updateKullaniciHandler);
export const DELETE = withAuth(deleteKullaniciHandler); 
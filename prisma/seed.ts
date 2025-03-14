import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...')

  // Mevcut verileri temizle
  await prisma.bildirim.deleteMany()
  await prisma.talepNotu.deleteMany()
  await prisma.urunTalep.deleteMany()
  await prisma.onay.deleteMany()
  await prisma.talep.deleteMany()
  await prisma.kullanici.deleteMany()
  await prisma.urun.deleteMany()
  await prisma.departman.deleteMany()

  // Departmanları ekle
  const departmanlar = await Promise.all([
    prisma.departman.create({
      data: { ad: 'Yazılım Geliştirme' }
    }),
    prisma.departman.create({
      data: { ad: 'İnsan Kaynakları' }
    }),
    prisma.departman.create({
      data: { ad: 'Pazarlama' }
    }),
    prisma.departman.create({
      data: { ad: 'Finans' }
    }),
    prisma.departman.create({
      data: { ad: 'IT' }
    }),
    prisma.departman.create({
      data: { ad: 'Satınalma' }
    })
  ])

  console.log('Departmanlar oluşturuldu')

  // Şifre hashleme
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10)
  }

  // Kullanıcıları ekle
  const adminSifre = await hashPassword('123456')
  const kullaniciSifre = await hashPassword('123456')

  const kullanicilar = await Promise.all([
    // Admin
    prisma.kullanici.create({
      data: {
        email: 'admin@sirket.com',
        ad: 'Admin',
        soyad: 'Kullanıcı',
        sifre: adminSifre,
        rol: 'ADMIN',
        departmanId: departmanlar[4].id, // IT departmanı
      }
    }),
    // IT Yöneticisi
    prisma.kullanici.create({
      data: {
        email: 'it.yonetici@sirket.com',
        ad: 'Burak',
        soyad: 'Öztürk',
        sifre: kullaniciSifre,
        rol: 'IT_ADMIN',
        departmanId: departmanlar[4].id, // IT departmanı
      }
    }),
    // Finans Yöneticisi
    prisma.kullanici.create({
      data: {
        email: 'finans.yonetici@sirket.com',
        ad: 'Mehmet',
        soyad: 'Kaya',
        sifre: kullaniciSifre,
        rol: 'FINANS_ADMIN',
        departmanId: departmanlar[3].id, // Finans departmanı
      }
    }),
    // Satınalma Yöneticisi
    prisma.kullanici.create({
      data: {
        email: 'satinalma.yonetici@sirket.com',
        ad: 'Ayşe',
        soyad: 'Demir',
        sifre: kullaniciSifre,
        rol: 'SATINALMA_ADMIN',
        departmanId: departmanlar[5].id, // Satınalma departmanı
      }
    }),
    // Normal Kullanıcılar
    prisma.kullanici.create({
      data: {
        email: 'ahmet.yilmaz@sirket.com',
        ad: 'Ahmet',
        soyad: 'Yılmaz',
        sifre: kullaniciSifre,
        rol: 'KULLANICI',
        departmanId: departmanlar[0].id, // Yazılım Geliştirme
      }
    }),
    prisma.kullanici.create({
      data: {
        email: 'zeynep.aydin@sirket.com',
        ad: 'Zeynep',
        soyad: 'Aydın',
        sifre: kullaniciSifre,
        rol: 'KULLANICI',
        departmanId: departmanlar[2].id, // Pazarlama
      }
    })
  ])

  console.log('Kullanıcılar oluşturuldu')

  // Ürünler ekle
  const urunler = await Promise.all([
    prisma.urun.create({
      data: {
        ad: 'MacBook Pro M2',
        kategori: 'Bilgisayar',
        birimFiyat: 45000,
        birim: 'Adet',
        aciklama: 'M2 işlemci, 16GB RAM, 512GB SSD'
      }
    }),
    prisma.urun.create({
      data: {
        ad: '4K Projektör',
        kategori: 'Görüntüleme',
        birimFiyat: 15000,
        birim: 'Adet',
        aciklama: 'Ultra HD 4K çözünürlük, 3000 lümen'
      }
    }),
    prisma.urun.create({
      data: {
        ad: 'Microsoft Office 365 Lisansı',
        kategori: 'Yazılım',
        birimFiyat: 1500,
        birim: 'Lisans',
        aciklama: 'Business Premium, 1 yıllık lisans'
      }
    }),
    prisma.urun.create({
      data: {
        ad: 'Wacom Intuos Pro Tablet',
        kategori: 'Donanım',
        birimFiyat: 4000,
        birim: 'Adet',
        aciklama: 'Medium size, kablosuz kullanım'
      }
    }),
    prisma.urun.create({
      data: {
        ad: 'Server RAM',
        kategori: 'Donanım',
        birimFiyat: 5000,
        birim: 'Adet',
        aciklama: '32GB ECC RAM'
      }
    }),
    prisma.urun.create({
      data: {
        ad: 'Server SSD',
        kategori: 'Donanım',
        birimFiyat: 3000,
        birim: 'Adet',
        aciklama: '1TB NVMe SSD'
      }
    })
  ])

  console.log('Ürünler oluşturuldu')

  // Talepleri ekle
  const talepler = await Promise.all([
    // Talep 1: MacBook Pro
    prisma.talep.create({
      data: {
        talepNo: 'TAL-2023-001',
        baslik: 'Yazılım Geliştirme Ekibi için MacBook Pro',
        aciklama: 'Yazılım geliştirme ekibimiz için 5 adet MacBook Pro (M2 işlemci, 16GB RAM, 512GB SSD) talep ediyoruz. Bu bilgisayarlar, ekibimizin hem iOS hem de diğer platformlarda geliştirme yapmasını sağlayacak ve verimliliklerini artıracaktır.',
        gerekce: 'Mevcut donanımlar 4 yıllık ve yavaşlamaya başladı. Yeni projelerimiz için daha güçlü donanımlara ihtiyaç duyuyoruz.',
        departmanId: departmanlar[0].id, // Yazılım Geliştirme
        talepEdenId: kullanicilar[4].id, // Ahmet Yılmaz
        onayDurumu: 'BEKLEMEDE',
        oncelik: 'YUKSEK',
        tahminiTutar: 225000, // 5 adet * 45000 TL
        talepTarihi: new Date('2023-05-15'),
        urunler: {
          create: {
            urunId: urunler[0].id, // MacBook Pro
            miktar: 5,
            tutar: 225000 // 5 adet * 45000 TL
          }
        },
        onayAdımlari: {
          create: [
            {
              adim: 'DEPARTMAN_YONETICISI',
              durum: 'ONAYLANDI',
              aciklama: 'Ekibin geliştirilmesi için gerekli donanımlar.',
              tarih: new Date('2023-05-15T14:30:00')
            },
            {
              adim: 'IT_DEPARTMANI',
              durum: 'BEKLEMEDE'
            },
            {
              adim: 'FINANS_DEPARTMANI',
              durum: 'BEKLEMEDE'
            }
          ]
        }
      }
    }),
    // Talep 2: Projektör
    prisma.talep.create({
      data: {
        talepNo: 'TAL-2023-002',
        baslik: 'Toplantı Odası Projektör',
        aciklama: 'Ana toplantı odamız için yüksek çözünürlüklü (4K) bir projektör talep ediyoruz. Mevcut projektörümüz düşük çözünürlüklü ve sık sık arıza veriyor.',
        gerekce: 'Müşteri sunumları ve işe alım görüşmelerinde profesyonel görünüm sağlamak için gereklidir.',
        departmanId: departmanlar[1].id, // İnsan Kaynakları
        talepEdenId: kullanicilar[3].id, // Ayşe Demir
        onayDurumu: 'ONAYLANDI',
        oncelik: 'ORTA',
        tahminiTutar: 15000,
        talepTarihi: new Date('2023-05-14'),
        urunler: {
          create: {
            urunId: urunler[1].id, // 4K Projektör
            miktar: 1,
            tutar: 15000
          }
        },
        onayAdımlari: {
          create: [
            {
              adim: 'DEPARTMAN_YONETICISI',
              durum: 'ONAYLANDI',
              aciklama: 'Toplantılar için gerekli.',
              tarih: new Date('2023-05-14T11:15:00')
            },
            {
              adim: 'IT_DEPARTMANI',
              durum: 'ONAYLANDI',
              onaylayanId: kullanicilar[1].id, // IT Yöneticisi
              aciklama: 'Teknik özellikler uygun.',
              tarih: new Date('2023-05-16T09:15:00')
            },
            {
              adim: 'FINANS_DEPARTMANI',
              durum: 'ONAYLANDI',
              onaylayanId: kullanicilar[2].id, // Finans Yöneticisi
              aciklama: 'Bütçe onaylandı.',
              tarih: new Date('2023-05-17T11:40:00')
            },
            {
              adim: 'SATINALMA_DEPARTMANI',
              durum: 'BEKLEMEDE'
            }
          ]
        }
      }
    }),
    // Talep 3: Office Lisansları
    prisma.talep.create({
      data: {
        talepNo: 'TAL-2023-003',
        baslik: 'Microsoft Office Lisansları (10 Kullanıcı)',
        aciklama: 'Finans departmanı için 10 adet Microsoft Office 365 Business Premium lisansı talep ediyoruz. Bu lisanslar Excel, Word, PowerPoint ve diğer Office uygulamalarını içerecektir.',
        gerekce: 'Mevcut lisanslarımız süresi dolmak üzere ve yeni işe alınan personeller için ek lisanslara ihtiyacımız var.',
        departmanId: departmanlar[3].id, // Finans
        talepEdenId: kullanicilar[2].id, // Mehmet Kaya
        onayDurumu: 'TAMAMLANDI',
        oncelik: 'DUSUK',
        tahminiTutar: 15000, // 10 adet * 1500 TL
        talepTarihi: new Date('2023-05-12'),
        urunler: {
          create: {
            urunId: urunler[2].id, // Microsoft Office 365 Lisansı
            miktar: 10,
            tutar: 15000
          }
        },
        onayAdımlari: {
          create: [
            {
              adim: 'DEPARTMAN_YONETICISI',
              durum: 'ONAYLANDI',
              aciklama: 'Gerekli yazılımlar.',
              tarih: new Date('2023-05-12T10:20:00')
            },
            {
              adim: 'IT_DEPARTMANI',
              durum: 'ONAYLANDI',
              onaylayanId: kullanicilar[1].id, // IT Yöneticisi
              aciklama: 'Lisanslar uygun.',
              tarih: new Date('2023-05-13T14:30:00')
            },
            {
              adim: 'FINANS_DEPARTMANI',
              durum: 'ONAYLANDI',
              onaylayanId: kullanicilar[2].id, // Finans Yöneticisi
              aciklama: 'Onaylandı.',
              tarih: new Date('2023-05-14T09:15:00')
            },
            {
              adim: 'SATINALMA_DEPARTMANI',
              durum: 'TAMAMLANDI',
              onaylayanId: kullanicilar[3].id, // Satınalma Yöneticisi
              aciklama: 'Satın alma tamamlandı, lisanslar aktifleştirildi.',
              tarih: new Date('2023-05-18T15:45:00')
            }
          ]
        }
      }
    }),
    // Talep 4: Wacom Tabletleri
    prisma.talep.create({
      data: {
        talepNo: 'TAL-2023-004',
        baslik: 'Grafik Tasarım Ekibi için Wacom Tabletler',
        aciklama: 'Grafik tasarım ekibi için 3 adet Wacom Intuos Pro Medium dijital çizim tableti talep ediyoruz. Bu tabletler, tasarımcılarımızın daha hassas ve verimli çalışmasını sağlayacaktır.',
        gerekce: 'Mevcut mouse ile çalışmak zorunda kalan tasarımcılarımız için üretkenliği artıracak bir ihtiyaçtır.',
        departmanId: departmanlar[2].id, // Pazarlama
        talepEdenId: kullanicilar[5].id, // Zeynep Aydın
        onayDurumu: 'REDDEDILDI',
        oncelik: 'YUKSEK',
        tahminiTutar: 12000, // 3 adet * 4000 TL
        talepTarihi: new Date('2023-05-10'),
        urunler: {
          create: {
            urunId: urunler[3].id, // Wacom Tablet
            miktar: 3,
            tutar: 12000
          }
        },
        onayAdımlari: {
          create: [
            {
              adim: 'DEPARTMAN_YONETICISI',
              durum: 'ONAYLANDI',
              aciklama: 'Tasarımcılar için gerekli donanım.',
              tarih: new Date('2023-05-10T16:30:00')
            },
            {
              adim: 'IT_DEPARTMANI',
              durum: 'ONAYLANDI',
              onaylayanId: kullanicilar[1].id, // IT Yöneticisi
              aciklama: 'Teknik açıdan uygun.',
              tarih: new Date('2023-05-11T11:15:00')
            },
            {
              adim: 'FINANS_DEPARTMANI',
              durum: 'REDDEDILDI',
              onaylayanId: kullanicilar[2].id, // Finans Yöneticisi
              aciklama: 'Şu anki bütçe kısıtlamaları nedeniyle onaylanmadı. Bir sonraki çeyrekte tekrar değerlendirilebilir.',
              tarih: new Date('2023-05-12T14:20:00')
            }
          ]
        }
      }
    }),
    // Talep 5: Sunucu Donanım Yükseltmesi
    prisma.talep.create({
      data: {
        talepNo: 'TAL-2023-005',
        baslik: 'Sunucu Donanım Yükseltmesi',
        aciklama: 'Ana sunucumuz için RAM ve SSD yükseltmesi talep ediyoruz. 128GB ECC RAM (4 adet 32GB) ve 4TB NVMe SSD (4 adet 1TB) eklenmesi gerekiyor.',
        gerekce: 'Artan kullanıcı sayısı ve veri tabanı boyutu nedeniyle mevcut donanım yetersiz kalmaya başladı. Performans sorunları yaşıyoruz.',
        departmanId: departmanlar[4].id, // IT
        talepEdenId: kullanicilar[1].id, // IT Yöneticisi
        onayDurumu: 'SATINALMA_SURECINDE',
        oncelik: 'KRITIK',
        tahminiTutar: 32000, // (4 * 5000) + (4 * 3000)
        talepTarihi: new Date('2023-05-08'),
        urunler: {
          create: [
            {
              urunId: urunler[4].id, // Server RAM
              miktar: 4,
              tutar: 20000 // 4 adet * 5000 TL
            },
            {
              urunId: urunler[5].id, // Server SSD
              miktar: 4,
              tutar: 12000 // 4 adet * 3000 TL
            }
          ]
        },
        onayAdımlari: {
          create: [
            {
              adim: 'DEPARTMAN_YONETICISI',
              durum: 'ONAYLANDI',
              aciklama: 'Acil performans ihtiyacı.',
              tarih: new Date('2023-05-08T09:45:00')
            },
            {
              adim: 'IT_DEPARTMANI',
              durum: 'ONAYLANDI',
              onaylayanId: kullanicilar[0].id, // Admin
              aciklama: 'Teknik gereksinimler onaylandı.',
              tarih: new Date('2023-05-08T10:30:00')
            },
            {
              adim: 'FINANS_DEPARTMANI',
              durum: 'ONAYLANDI',
              onaylayanId: kullanicilar[2].id, // Finans Yöneticisi
              aciklama: 'Kritik ihtiyaç olarak değerlendirildi, onaylandı.',
              tarih: new Date('2023-05-09T11:15:00')
            },
            {
              adim: 'SATINALMA_DEPARTMANI',
              durum: 'SATINALMA_SURECINDE',
              onaylayanId: kullanicilar[3].id, // Satınalma Yöneticisi
              aciklama: 'Tedarikçilerden teklifler alınıyor.',
              tarih: new Date('2023-05-10T14:45:00')
            }
          ]
        }
      }
    })
  ])

  console.log('Talepler ve ilgili onay adımları oluşturuldu')

  // Bildirimler ekle
  await Promise.all([
    prisma.bildirim.create({
      data: {
        kullaniciId: kullanicilar[1].id, // IT Yöneticisi
        baslik: 'Yeni Talep Onayı Bekliyor',
        mesaj: 'TAL-2023-001 numaralı talep IT departmanı onayı bekliyor.',
        okundu: false,
        createdAt: new Date('2023-05-15T15:00:00')
      }
    }),
    prisma.bildirim.create({
      data: {
        kullaniciId: kullanicilar[4].id, // Ahmet Yılmaz
        baslik: 'Talebiniz İşlemde',
        mesaj: 'TAL-2023-001 numaralı talebiniz departman yöneticiniz tarafından onaylandı ve IT departmanına iletildi.',
        okundu: true,
        createdAt: new Date('2023-05-15T14:35:00')
      }
    }),
    prisma.bildirim.create({
      data: {
        kullaniciId: kullanicilar[5].id, // Zeynep Aydın
        baslik: 'Talebiniz Reddedildi',
        mesaj: 'TAL-2023-004 numaralı talebiniz finans departmanı tarafından reddedildi.',
        okundu: false,
        createdAt: new Date('2023-05-12T14:25:00')
      }
    })
  ])

  console.log('Bildirimler oluşturuldu')
  console.log('Seed işlemi başarıyla tamamlandı!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
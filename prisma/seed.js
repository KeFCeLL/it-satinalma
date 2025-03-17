const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...')

  try {
    // Veritabanı bağlantı testi
    console.log('Veritabanı bağlantısı test ediliyor...')
    await prisma.$queryRaw`SELECT 1+1 AS result`
    console.log('Veritabanı bağlantısı başarılı.')

    // Önce eksik verileri kontrol et ve tamamla
    console.log('Mevcut verileri kontrol etme...')
    
    // Departmanları kontrol et
    const departmanCount = await prisma.departman.count()
    console.log(`Mevcut departman sayısı: ${departmanCount}`)
    
    // Departmanlar yoksa ekle, varsa tamamla
    if (departmanCount === 0) {
      console.log('Departmanlar ekleniyor...')
      const departmanIsimleri = ['Yazılım Geliştirme', 'İnsan Kaynakları', 'Pazarlama', 'Finans', 'Satınalma']
      
      for (const ad of departmanIsimleri) {
        // Her bir departmanı ayrı ayrı ekle - toplu ekleme hata riskini azaltır
        try {
          await prisma.departman.create({
            data: { ad }
          })
          console.log(`Departman eklendi: ${ad}`)
        } catch (err) {
          if (err.code === 'P2002') {
            console.log(`Departman zaten var: ${ad}`)
          } else {
            console.error(`Departman eklenirken hata: ${ad}`, err)
          }
        }
      }
    } else {
      console.log('Departmanlar zaten var, geçiliyor.')
    }
    
    // Kullanıcıları kontrol et
    const kullaniciCount = await prisma.kullanici.count()
    console.log(`Mevcut kullanıcı sayısı: ${kullaniciCount}`)
    
    // Örnek kullanıcıları kontrol et ve ekle
    if (kullaniciCount === 0) {
      console.log('Kullanıcılar ekleniyor...')
      
      // Önce departmanları bul
      const departmanlar = await prisma.departman.findMany()
      if (departmanlar.length === 0) {
        throw new Error('Departmanlar bulunamadı')
      }
      
      // Admin kullanıcısını ekle
      try {
        const adminSifre = await bcrypt.hash('admin123', 10)
        
        await prisma.kullanici.create({
          data: {
            email: 'admin@example.com',
            ad: 'Admin',
            soyad: 'Kullanıcı',
            sifre: adminSifre,
            rol: 'ADMIN',
            departmanId: departmanlar[0].id,
          }
        })
        console.log('Admin kullanıcı eklendi')
      } catch (err) {
        if (err.code === 'P2002') {
          console.log('Admin kullanıcı zaten var')
        } else {
          console.error('Admin kullanıcı eklenirken hata:', err)
        }
      }
      
      // Diğer kullanıcıları da burada ekleyebilirsiniz...
    } else {
      console.log('Kullanıcılar zaten var, geçiliyor.')
    }
    
    // Diğer veri kontrolleri ve ekleme işlemleri burada yapılabilir
    
    console.log('Seed işlemi başarıyla tamamlandı!')
  } catch (error) {
    console.error('Seed işlemi sırasında hata:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 
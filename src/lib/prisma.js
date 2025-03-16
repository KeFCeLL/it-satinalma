/**
 * @file prisma.js
 * @description Singleton pattern ile PrismaClient instance'ı oluşturur ve export eder.
 * Bu yaklaşım, development sırasında hot reloading nedeniyle birden çok
 * PrismaClient bağlantısı oluşmasını engeller.
 * Ayrıca geliştirme modunda DB_BYPASS çevre değişkeni ile veritabanı bağlantısını atlayabilir.
 */

import { PrismaClient } from '@prisma/client';

// Mock PrismaClient - veritabanı bağlantısını atlama modu için
class MockPrismaClient {
  constructor() {
    // Tüm model adlarını içeren bir proxy döndürür
    return new Proxy(this, {
      get: (target, prop) => {
        // PrismaClient metotları
        if (prop === '_connect' || prop === '_disconnect' || prop === '$connect' || prop === '$disconnect') {
          return async () => { console.log(`MockPrisma: ${prop} çağrıldı`); };
        }
        
        // Model adı ise (örn: user, post vb.)
        return new Proxy({}, {
          get: (_, operation) => {
            return async (...args) => {
              console.log(`MockPrisma: ${prop}.${operation} çağrıldı`);
              console.log('Argümanlar:', JSON.stringify(args, null, 2));
              
              // Boş veri dön
              if (operation === 'findMany' || operation === 'findAll') return [];
              if (operation === 'count') return 0;
              if (operation === 'create' || operation === 'update' || operation === 'upsert') return {};
              if (operation === 'delete' || operation === 'deleteMany') return { count: 0 };
              return null;
            };
          }
        });
      }
    });
  }
}

// Geliştirme modunda bağlantıyı atla seçeneği
const shouldBypassDB = process.env.DB_BYPASS === 'true';
let prismaInstance;

// DB_BYPASS aktifse mock client kullan
if (shouldBypassDB) {
  console.log('⚠️ Veritabanı bağlantısı atlama modu aktif (DB_BYPASS=true)');
  prismaInstance = new MockPrismaClient();
} else {
  // Normal PrismaClient kullanımı - singleton pattern
  const globalForPrisma = global;
  
  // Debug modu seçeneği
  const options = {};
  if (process.env.PRISMA_DEBUG === 'true') {
    options.log = ['query', 'info', 'warn', 'error'];
  }
  
  // Singleton pattern ile PrismaClient oluştur
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(options);
    
    // Bağlantı havuzu yapılandırması
    if (globalForPrisma.prisma.$on) {
      globalForPrisma.prisma.$on('query', (e) => {
        console.log('Prisma Query: ' + e.query);
        console.log('Params: ' + e.params);
        console.log('Duration: ' + e.duration + 'ms');
      });
    }
  }
  
  prismaInstance = globalForPrisma.prisma;
}

export default prismaInstance; 
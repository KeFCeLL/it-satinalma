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

// Client tarafı mı kontrol et
const isClient = typeof window !== 'undefined';

// Mock modu aktif mi kontrol et
function shouldUseMockPrisma() {
  // 1. Çevre değişkeni kontrolü
  if (process.env.DB_BYPASS === 'true' || process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') {
    return true;
  }
  
  // 2. Client tarafında localStorage kontrolü
  if (isClient) {
    try {
      return window.localStorage.getItem('useMockApi') === 'true';
    } catch (e) {
      console.error('localStorage erişim hatası:', e);
    }
  }
  
  // 3. Vercel build ortamında otomatik mock
  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return true;
  }
  
  return false;
}

// Bağlantı havuzunu temizle
async function cleanupConnectionPool() {
  if (globalThis.prisma) {
    try {
      await globalThis.prisma.$disconnect();
      console.log('✅ Prisma bağlantı havuzu temizlendi');
    } catch (e) {
      console.error('❌ Prisma bağlantı havuzu temizlenirken hata:', e);
    }
  }
}

// SIGINT ve SIGTERM sinyallerini yakala
if (!isClient) {
  process.on('SIGINT', async () => {
    await cleanupConnectionPool();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await cleanupConnectionPool();
    process.exit(0);
  });
}

let prismaInstance;

// Mock client kullanılacak mı kontrol et
if (shouldUseMockPrisma()) {
  console.log('⚠️ Mock PrismaClient kullanılıyor - Veritabanı bağlantısı atlanıyor');
  prismaInstance = new MockPrismaClient();
} else {
  // Normal PrismaClient kullanımı - singleton pattern
  if (!globalThis.prisma) {
    // Debug modu seçeneği
    const options = {};
    if (process.env.PRISMA_DEBUG === 'true') {
      options.log = ['query', 'info', 'warn', 'error'];
    }
    
    // Yeni bir PrismaClient oluştur
    console.log('🔄 Yeni PrismaClient oluşturuluyor');
    const client = new PrismaClient(options);
    
    // Bağlantı havuzu yapılandırması ve loglama
    if (client.$on) {
      client.$on('query', (e) => {
        console.log(`Prisma Query (${e.duration}ms): ${e.query}`);
      });
      
      client.$on('error', (e) => {
        console.error('Prisma Error:', e);
      });
    }
    
    globalThis.prisma = client;
  }
  
  prismaInstance = globalThis.prisma;
}

export default prismaInstance; 
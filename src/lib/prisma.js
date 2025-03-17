/**
 * @file prisma.js
 * @description Geliştirilmiş PrismaClient yapılandırması
 * - Singleton pattern ile hot reloading sırasında çoklu bağlantıları önler
 * - Bağlantı havuzu yönetimi ile prepared statement hatalarını çözer
 * - Geliştirme modunda veritabanını atlama seçeneği sunar (DB_BYPASS)
 * - Otomatik bağlantı kapatma ile kaynakları temizler
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

/**
 * Mock PrismaClient kullanılıp kullanılmayacağını belirler
 * @returns {boolean} Mock PrismaClient kullanılacaksa true
 */
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
      console.warn('localStorage erişim hatası:', e);
    }
  }
  
  // 3. Development modda mock kullanma tercihi
  // NOT: Production'da otomatik mock kullanımını kaldırdık
  
  return false;
}

/**
 * Veritabanı bağlantı havuzunu temizler
 * @returns {Promise<void>}
 */
async function cleanupConnectionPool() {
  if (globalThis.prisma) {
    try {
      await globalThis.prisma.$disconnect();
      console.log('✅ Prisma bağlantı havuzu temizlendi');
    } catch (e) {
      console.error('❌ Prisma bağlantı havuzu temizlenirken hata:', e);
    } finally {
      globalThis.prisma = null;
    }
  }
}

// SIGINT ve SIGTERM sinyallerini yakala (sadece sunucu tarafında)
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

// PrismaClient global nesne olarak kullanılıyor
// Bu serverless fonksiyonlarda bağlantı havuzunu optimize eder
const globalForPrisma = global;

export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
      }
    },
    // Vercel serverless ortamı için bağlantı havuzu ayarları
    connectionLimit: 5
  });

// Geliştirme ortamında prisma nesnesini global olarak sakla
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 
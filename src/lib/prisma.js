/**
 * @file prisma.js
 * @description Prisma client için gelişmiş singleton yönetimi ve hata kontrolü
 */

import { PrismaClient } from '@prisma/client';

// Konsola hata / bilgi logları
function logInfo(message) {
  console.log(`🔵 [Prisma] ${message}`);
}

function logError(message, error) {
  console.error(`🔴 [Prisma] ${message}`, error);
}

function logWarning(message) {
  console.warn(`🟠 [Prisma] ${message}`);
}

// Ortam değişkenlerini kontrol et
function checkEnvironmentVariables() {
  const requiredVars = [
    { name: 'DATABASE_URL', fallback: 'POSTGRES_PRISMA_URL' },
    { name: 'POSTGRES_URL_NON_POOLING', fallback: 'DATABASE_URL_UNPOOLED' }
  ];
  
  const missing = [];
  
  for (const { name, fallback } of requiredVars) {
    if (!process.env[name] && !process.env[fallback]) {
      missing.push(`${name} (veya ${fallback})`);
    }
  }
  
  if (missing.length > 0) {
    logWarning(`Eksik ortam değişkenleri tespit edildi: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// Tarayıcı tarafında çalıştığımızı kontrol et
const isClient = typeof window !== 'undefined';
const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

let prisma;

// PrismaClient'ı başlat
if (isClient) {
  // Tarayıcı tarafında prisma kullanmıyoruz
  logInfo('Tarayıcı ortamında çalışılıyor, PrismaClient oluşturulmadı');
  prisma = null;
} else {
  // Sunucu tarafında
  
  // Ortam değişkenlerini kontrol et
  const envOk = checkEnvironmentVariables();
  
  try {
    // Global singleton pattern
    const globalForPrisma = global;
    
    // Prisma istemcisi options
    const prismaOptions = {
      log: isDev ? ['error', 'warn'] : ['error'],
      errorFormat: 'colorless',
    };
    
    // URL belirtilmişse datasource ekle
    const url = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
    if (url) {
      prismaOptions.datasources = {
        db: {
          url
        }
      };
    }
    
    if (globalForPrisma.prisma) {
      // Mevcut prisma singletonunu kullan
      logInfo('Mevcut PrismaClient kullanılıyor');
      prisma = globalForPrisma.prisma;
    } else {
      // Yeni prisma singletonunu oluştur
      logInfo('Yeni PrismaClient oluşturuluyor');
      
      // Test ortamında farklı bir veritabanı kullanabilirsiniz
      prisma = new PrismaClient(prismaOptions);
      
      // Global nesneye ata (Hot reloading'de çoklu bağlantıları önler)
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma;
      }
      
      // Uygulama kapatıldığında bağlantıyı kapat
      if (!isTest) {
        // Process kapanma olaylarını dinle
        process.on('beforeExit', async () => {
          await prisma.$disconnect();
          logInfo('Prisma bağlantısı kapatıldı (beforeExit)');
        });
        
        process.on('SIGINT', async () => {
          await prisma.$disconnect();
          logInfo('Prisma bağlantısı kapatıldı (SIGINT)');
          process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
          await prisma.$disconnect();
          logInfo('Prisma bağlantısı kapatıldı (SIGTERM)');
          process.exit(0);
        });
      }
    }
    
    // PrismaClient olay dinleyicileri
    prisma.$on('query', (e) => {
      if (process.env.DEBUG_PRISMA === 'true') {
        console.log('Sorgu: ' + e.query);
        console.log('Params: ' + e.params);
        console.log('Süre: ' + e.duration + 'ms');
      }
    });
    
    prisma.$on('error', (e) => {
      logError('Prisma hata olayı tetiklendi:', e);
    });
    
  } catch (error) {
    logError('PrismaClient başlatılırken hata oluştu:', error);
    throw error;
  }
}

export default prisma; 
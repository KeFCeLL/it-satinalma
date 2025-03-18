import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import os from 'os';

// Hassas bilgileri maskeler
function maskSensitiveInfo(obj, sensitiveKeys = ['SECRET', 'PASSWORD', 'KEY', 'TOKEN']) {
  if (!obj) return obj;
  
  // Eğer dize ise ve hassas içerik varsa maskele
  if (typeof obj === 'string') {
    let result = obj;
    sensitiveKeys.forEach(key => {
      // Büyük/küçük harf duyarsız arama
      if (result.toUpperCase().includes(key)) {
        // İlk 3 ve son 3 karakter dışındakileri maskele
        if (result.length > 8) {
          result = result.substring(0, 3) + '*'.repeat(result.length - 6) + result.substring(result.length - 3);
        } else {
          result = '*'.repeat(result.length);
        }
      }
    });
    return result;
  }
  
  // Obje ise recursive olarak tüm değerleri maskele
  if (typeof obj === 'object' && obj !== null) {
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key in result) {
      // Hassas anahtar kontrolü
      const isKeySensitive = sensitiveKeys.some(sensitive => key.toUpperCase().includes(sensitive));
      
      if (isKeySensitive) {
        // Hassas anahtarın değerini maskele
        if (typeof result[key] === 'string') {
          if (result[key].length > 8) {
            result[key] = result[key].substring(0, 3) + '*'.repeat(result[key].length - 6) + result[key].substring(result[key].length - 3);
          } else {
            result[key] = '*'.repeat(result[key].length);
          }
        } else if (result[key] !== null && result[key] !== undefined) {
          result[key] = '[MASKED]';
        }
      } else {
        // Değeri recursive olarak maskele
        result[key] = maskSensitiveInfo(result[key], sensitiveKeys);
      }
    }
    return result;
  }
  
  return obj;
}

export async function GET() {
  const startTime = Date.now();
  
  // Temel bilgileri topla
  const results = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: {
        status: 'ok',
        responseTime: 0
      },
      database: {
        status: 'unknown',
        connected: false,
        connectionTest: {
          success: false,
          error: null,
          duration: null
        },
        departmentCount: {
          success: false,
          count: null,
          error: null, 
          duration: null
        },
        departmentCreate: {
          success: false,
          id: null,
          error: null,
          duration: null
        },
        departmentList: {
          success: false,
          count: null,
          error: null,
          duration: null,
          data: null
        }
      }
    },
    system: {
      uptime: Math.floor(process.uptime()),
      memory: {
        free: Math.round(os.freemem() / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      platform: os.platform(),
      release: os.release(),
      hostname: os.hostname()
    },
    config: {
      isDev: process.env.NODE_ENV !== 'production',
      isDevApi: process.env.NEXT_PUBLIC_DEV_API === 'true',
      isDbBypass: process.env.DB_BYPASS === 'true',
      nextAuthConfigured: !!process.env.NEXTAUTH_SECRET && !!process.env.NEXTAUTH_URL
    },
    envVars: maskSensitiveInfo(
      Object.fromEntries(
        Object.entries(process.env)
          .filter(([key]) => 
            key.includes('DB_') || 
            key.includes('POSTGRES') || 
            key.includes('DATABASE') || 
            key.includes('NEXT') || 
            key.includes('VERCEL')
          )
      )
    )
  };

  // 1. Veritabanı Bağlantı Testi
  try {
    const connStartTime = Date.now();
    await prisma.$connect();
    results.services.database.connectionTest.duration = Date.now() - connStartTime;
    results.services.database.connectionTest.success = true;
    results.services.database.connected = true;
    results.services.database.status = 'ok';
  } catch (error) {
    results.services.database.connectionTest.error = error.message;
    results.services.database.connectionTest.stack = error.stack;
    results.services.database.status = 'error';
    results.status = 'degraded';
    
    // Hata durumunda hızlıca geri dön
    results.services.api.responseTime = Date.now() - startTime;
    return NextResponse.json(results, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache',
        'Content-Type': 'application/json'
      }
    });
  }

  // 2. Departman Sayısı Kontrolü
  try {
    const countStartTime = Date.now();
    const depCount = await prisma.departman.count();
    results.services.database.departmentCount.count = depCount;
    results.services.database.departmentCount.duration = Date.now() - countStartTime;
    results.services.database.departmentCount.success = true;
  } catch (error) {
    results.services.database.departmentCount.error = error.message;
    results.services.database.departmentCount.stack = error.stack;
    results.services.database.status = 'degraded';
    results.status = 'degraded';
  }

  // 3. Yeni Departman Oluşturma Testi
  try {
    const createStartTime = Date.now();
    // Rasgele ID oluştur
    const randomId = `test-${Math.random().toString(36).substring(2, 10)}`;
    
    const newDep = await prisma.departman.create({
      data: {
        ad: `Test Departmanı ${randomId}`,
        aciklama: 'Bu, debug API tarafından oluşturulmuş test departmanıdır'
      }
    });
    
    results.services.database.departmentCreate.id = newDep.id;
    results.services.database.departmentCreate.duration = Date.now() - createStartTime;
    results.services.database.departmentCreate.success = true;
    
    // Oluşturulan test departmanını sil
    await prisma.departman.delete({
      where: {
        id: newDep.id
      }
    });
  } catch (error) {
    results.services.database.departmentCreate.error = error.message;
    results.services.database.departmentCreate.stack = error.stack;
    results.services.database.status = 'degraded';
    results.status = 'degraded';
  }

  // 4. Departman Listesi Testi
  try {
    const listStartTime = Date.now();
    const departments = await prisma.departman.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    results.services.database.departmentList.count = departments.length;
    results.services.database.departmentList.data = departments;
    results.services.database.departmentList.duration = Date.now() - listStartTime;
    results.services.database.departmentList.success = true;
  } catch (error) {
    results.services.database.departmentList.error = error.message;
    results.services.database.departmentList.stack = error.stack;
    results.services.database.status = 'degraded';
    results.status = 'degraded';
  }

  // Veritabanı bağlantısını kapat
  try {
    await prisma.$disconnect();
  } catch (error) {
    results.services.database.disconnectError = error.message;
  }

  // Toplam API yanıt süresini hesapla
  results.services.api.responseTime = Date.now() - startTime;

  // CORS başlıkları ile yanıt ver
  return NextResponse.json(results, {
    status: results.status === 'ok' ? 200 : 207,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'Content-Type': 'application/json'
    }
  });
} 
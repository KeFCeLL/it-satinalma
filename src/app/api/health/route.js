import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const startTime = Date.now();
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
        responseTime: null,
        errorMessage: null
      }
    },
    system: {
      uptime: Math.floor(process.uptime()),
      memory: {
        free: Math.round(os.freemem() / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      loadAvg: os.loadavg(),
      hostname: os.hostname()
    },
    config: {
      isDev: process.env.NODE_ENV !== 'production',
      isDevApi: process.env.NEXT_PUBLIC_DEV_API === 'true',
      isDbBypass: process.env.DB_BYPASS === 'true',
      hasAuth: !!process.env.NEXTAUTH_SECRET,
      authUrl: process.env.NEXTAUTH_URL ? 'configured' : 'missing'
    }
  };

  // Veritabanı bağlantısını kontrol et
  const dbStartTime = Date.now();
  try {
    // Test bağlantısı oluştur
    await prisma.$queryRaw`SELECT 1`;
    results.services.database.status = 'ok';
    results.services.database.connected = true;
    
    // Veritabanı meta verileri
    try {
      // Departman sayısını al
      const depCount = await prisma.departman.count();
      results.services.database.departments = depCount;
      
      // Kullanıcı sayısını al
      const userCount = await prisma.kullanici.count();
      results.services.database.users = userCount;
    } catch (metaError) {
      results.services.database.metaError = metaError.message;
    }
  } catch (error) {
    results.services.database.status = 'error';
    results.services.database.errorMessage = error.message;
    results.status = 'degraded';
  } finally {
    results.services.database.responseTime = Date.now() - dbStartTime;
    await prisma.$disconnect();
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Content-Type': 'application/json'
    }
  });
} 
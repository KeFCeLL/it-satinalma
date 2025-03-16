import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Bu endpoint, düzenli olarak Prisma veritabanı bağlantılarını temizler
// Vercel üzerinde belirli aralıklarla çalıştırılması için vercel.json'da tanımlanmıştır

export async function GET() {
  console.log('🔄 Veritabanı bağlantı temizleme işlemi başlatıldı...');
  
  try {
    // Açık bağlantıları kapat
    await prisma.$disconnect();
    
    console.log('✅ Bağlantılar başarıyla temizlendi');
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Veritabanı bağlantıları temizlendi',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Bağlantı temizleme hatası:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Bağlantı temizleme sırasında hata oluştu',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
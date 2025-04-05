import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const API_KEY = process.env.EXCHANGERATE_API_KEY;

export async function GET() {
  try {
    // Son 30 günlük taleplerin toplam tutarını hesapla
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [currentMonthTotal, previousMonthTotal] = await Promise.all([
      // Bu ay
      prisma.talepDetay.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          birimFiyat: true
        }
      }),
      // Önceki ay
      prisma.talepDetay.aggregate({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
            gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          birimFiyat: true
        }
      })
    ]);

    // Toplam bütçe (sabit değer)
    const totalBudget = 1000000;
    
    // Bu ayki toplam harcama
    const totalSpent = currentMonthTotal._sum.birimFiyat || 0;
    
    // Değişim yüzdesi hesapla
    const previousTotal = previousMonthTotal._sum.birimFiyat || 0;
    const percentageChange = previousTotal === 0 
      ? 0 
      : Math.round(((totalSpent - previousTotal) / previousTotal) * 100);

    return NextResponse.json({
      totalBudget,
      totalSpent,
      percentageChange
    });
  } catch (error) {
    console.error('Finance API Error:', error);
    return NextResponse.json(
      { error: 'Finans bilgileri alınamadı' },
      { status: 500 }
    );
  }
} 
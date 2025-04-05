import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching finance data...');
    
    // Son 30 günlük taleplerin toplam tutarını hesapla
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log('Calculating totals for the last 30 days from:', thirtyDaysAgo.toISOString());

    const [currentMonthTotal, previousMonthTotal] = await Promise.all([
      // Bu ay
      prisma.urunTalep.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          },
          talep: {
            durum: 'ONAYLANDI'
          }
        },
        _sum: {
          tutar: true
        }
      }),
      // Önceki ay
      prisma.urunTalep.aggregate({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
            gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
          },
          talep: {
            durum: 'ONAYLANDI'
          }
        },
        _sum: {
          tutar: true
        }
      })
    ]);

    console.log('Database query results:', {
      currentMonthTotal,
      previousMonthTotal
    });

    // Toplam bütçe (sabit değer)
    const totalBudget = 1000000;
    
    // Bu ayki toplam harcama
    const totalSpent = currentMonthTotal._sum.tutar || 0;
    
    // Değişim yüzdesi hesapla
    const previousTotal = previousMonthTotal._sum.tutar || 0;
    const percentageChange = previousTotal === 0 
      ? 0 
      : Math.round(((totalSpent - previousTotal) / previousTotal) * 100);

    const financeResponse = {
      totalBudget,
      totalSpent,
      percentageChange
    };

    console.log('Formatted finance response:', financeResponse);
    return NextResponse.json(financeResponse);
  } catch (error) {
    console.error('Finance API Error:', error);
    return NextResponse.json(
      { error: 'Finans bilgileri alınamadı' },
      { status: 500 }
    );
  }
} 
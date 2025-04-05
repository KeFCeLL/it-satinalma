import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      bekleyenTalepler,
      bekleyenTaleplerSonYediGun,
      onaylananTaleplerSonOtuzGun,
      tamamlananTaleplerSonOtuzGun,
      toplamTalepler
    ] = await Promise.all([
      // Bekleyen talepler (toplam)
      prisma.talep.count({
        where: {
          durum: 'BEKLEMEDE'
        }
      }),
      // Son 7 gündeki bekleyen talepler
      prisma.talep.count({
        where: {
          durum: 'BEKLEMEDE',
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      // Son 30 gündeki onaylanan talepler
      prisma.talep.count({
        where: {
          durum: 'ONAYLANDI',
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      // Son 30 gündeki tamamlanan talepler
      prisma.talep.count({
        where: {
          durum: 'TAMAMLANDI',
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      // Toplam talepler
      prisma.talep.count()
    ]);

    return NextResponse.json({
      bekleyenTalepler,
      bekleyenTaleplerSonYediGun,
      onaylananTaleplerSonOtuzGun,
      tamamlananTaleplerSonOtuzGun,
      toplamTalepler
    });
  } catch (error) {
    console.error('Dashboard istatistikleri alınamadı:', error);
    return NextResponse.json(
      { error: 'İstatistikler alınamadı' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Son 5 talebi getir
    const activities = await prisma.talep.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        baslik: true,
        durum: true,
        updatedAt: true,
        departman: {
          select: {
            ad: true
          }
        },
        talepEden: {
          select: {
            ad: true,
            soyad: true
          }
        },
        onaylar: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            durum: true,
            onaylayan: {
              select: {
                departman: {
                  select: {
                    ad: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Son aktiviteler alınamadı:', error);
    return NextResponse.json(
      { error: 'Son aktiviteler alınamadı' },
      { status: 500 }
    );
  }
} 
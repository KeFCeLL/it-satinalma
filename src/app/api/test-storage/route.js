import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Alınan LocalStorage verileri:', data);
    
    return NextResponse.json({
      success: true,
      received: data,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      config: {
        isDev: process.env.NODE_ENV !== 'production',
        isDevApi: process.env.NEXT_PUBLIC_DEV_API === 'true',
        isDbBypass: process.env.DB_BYPASS === 'true',
      }
    });
  } catch (error) {
    console.error('Test Storage API hatası:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true, 
    message: 'Bu endpoint çalışıyor. LocalStorage verilerinizi POST metodu ile gönderin.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      isDev: process.env.NODE_ENV !== 'production',
      isDevApi: process.env.NEXT_PUBLIC_DEV_API === 'true',
      isDbBypass: process.env.DB_BYPASS === 'true',
    }
  });
} 
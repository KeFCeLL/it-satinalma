import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Korumalı rotaları tanımla (kimlik doğrulama gerektirir)
const protectedRoutes = [
  '/dashboard-all',
  '/dashboard-all/talepler',
  '/dashboard-all/urunler',
  '/dashboard-all/bildirimler',
  '/dashboard-all/ayarlar',
  '/dashboard-all/kullanicilar',
  '/dashboard-all/departmanlar',
  '/dashboard-all/kullanici-yonetimi',
  '/dashboard-all/urun-yonetimi'
];

// Admin rolü gerektiren rotalar
const adminRoutes = [
  '/dashboard-all/kullanicilar',
  '/dashboard-all/departmanlar',
  '/dashboard-all/urun-yonetimi',
  '/dashboard-all/kullanici-yonetimi'
];

// JWT doğrulama fonksiyonu
async function verifyToken(token: string) {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Token geçersiz veya süresi dolmuş');
  }
}

// Korumalı rota kontrolü
function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Admin rotası kontrolü
function isAdminRoute(pathname: string) {
  return adminRoutes.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // API rotaları için kontrolü atla (API'ler kendi kimlik doğrulama middleware'ini kullanır)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Ana sayfa kontrolü - page.tsx'te zaten yönlendirme yapıldığı için bu adım skip edilebilir
  if (pathname === '/' || pathname === '') {
    return NextResponse.next();
  }
  
  // Dashboard sayfa kontrolü
  if (pathname === '/dashboard-all' || pathname.startsWith('/dashboard-all')) {
    const token = request.cookies.get('token')?.value;
    
    // Token yoksa giriş sayfasına yönlendir
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    try {
      // Token doğrulama
      await verifyToken(token);
      // Token geçerliyse devam et
      return NextResponse.next();
    } catch (error) {
      // Token geçersizse giriş sayfasına yönlendir
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }
  
  // Login sayfası kontrolü
  if (pathname === '/auth/login') {
    const token = request.cookies.get('token')?.value;
    
    // Token varsa ve geçerliyse doğrudan dashboard'a yönlendir
    if (token) {
      try {
        await verifyToken(token);
        return NextResponse.redirect(new URL('/dashboard-all', request.url));
      } catch (error) {
        // Token geçersizse cookie'yi temizle ve login sayfasında kal
        const response = NextResponse.next();
        response.cookies.delete('token');
        return response;
      }
    }
    // Token yoksa login sayfasında kal
    return NextResponse.next();
  }
  
  // Korumalı rota kontrolü
  if (isProtectedRoute(pathname)) {
    const token = request.cookies.get('token')?.value;
    
    // Token yoksa giriş sayfasına yönlendir
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    try {
      // Token doğrulama
      const payload = await verifyToken(token);
      
      // Admin rotası kontrolü
      if (isAdminRoute(pathname)) {
        // @ts-ignore - payload tipini tam olarak belirtmek gerekir gerçek uygulamada
        if (payload.rol !== 'ADMIN') {
          // Sadece ADMIN rolü olan kullanıcılara izin ver
          console.log(`Yetkisiz erişim denemesi: ${pathname} - Rol: ${payload.rol}`);
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
      
      return NextResponse.next();
    } catch (error) {
      // Token geçersizse giriş sayfasına yönlendir
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }
  
  // Korumalı bir rota değilse, devam et
  return NextResponse.next();
} 
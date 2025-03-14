import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export function withAuth(handler) {
  return async (request, params) => {
    try {
      // Cookie'den token al
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { error: "Yetkilendirme başarısız: Token bulunamadı" },
          { status: 401 }
        );
      }

      try {
        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Request nesnesine kullanıcı bilgilerini ekle
        request.user = decoded;
        
        // Orijinal handler'ı çağır
        return handler(request, params);
      } catch (error) {
        console.error("Token doğrulama hatası:", error);
        
        return NextResponse.json(
          { error: "Yetkilendirme başarısız: Geçersiz token" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("withAuth middleware hatası:", error);
      
      return NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      );
    }
  };
}

// Belirli rollere sahip kullanıcılar için yetkilendirme
export function withRole(handler, allowedRoles) {
  return async (request, params) => {
    try {
      // Önce withAuth ile yetkilendirme yap
      const authMiddleware = withAuth(async (req) => {
        // Kullanıcının rolünü kontrol et
        const userRole = req.user.rol;
        
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { error: "Erişim reddedildi: Yetkiniz yok" },
            { status: 403 }
          );
        }
        
        // Orijinal handler'ı çağır
        return handler(req, params);
      });
      
      // Middleware'i çalıştır
      return authMiddleware(request, params);
    } catch (error) {
      console.error("withRole middleware hatası:", error);
      
      return NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      );
    }
  };
} 
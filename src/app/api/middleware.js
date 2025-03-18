import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Loglama işlevleri
function logInfo(message, data = null) {
  const logMsg = `🔵 [Middleware] ${message}`;
  if (data) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
}

function logError(message, error = null) {
  const logMsg = `🔴 [Middleware] ${message}`;
  if (error) {
    console.error(logMsg, error);
  } else {
    console.error(logMsg);
  }
}

// Geliştirme modu kontrolü
const IS_DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_API === 'true' || process.env.DB_BYPASS === 'true';

// Ortam değişkenlerini logla
logInfo('Middleware yükleniyor', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_DEV_API: process.env.NEXT_PUBLIC_DEV_API,
  DB_BYPASS: process.env.DB_BYPASS,
  IS_DEV_MODE
});

export function withAuth(handler) {
  return async (request, params) => {
    try {
      // Geliştirme modunda yetkilendirmeyi bypass et
      if (IS_DEV_MODE) {
        logInfo('🔧 Geliştirme modu: Yetkilendirme bypass ediliyor');
        
        // Geliştirme için sahte kullanıcı oluştur
        request.user = {
          id: 'dev-user',
          email: 'dev@example.com',
          ad: 'Geliştirme',
          soyad: 'Kullanıcısı',
          rol: 'ADMIN',
          departmanId: 'dev-dep-1'
        };
        
        logInfo('Dev kullanıcısı oluşturuldu:', request.user);
        return handler(request, params);
      }
      
      // Cookie'den token al
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      if (!token) {
        logError('Token bulunamadı');
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
        
        logInfo('Token doğrulandı ve kullanıcı bilgisi eklendi:', decoded);
        
        // Orijinal handler'ı çağır
        return handler(request, params);
      } catch (error) {
        logError("Token doğrulama hatası:", error);
        
        return NextResponse.json(
          { error: "Yetkilendirme başarısız: Geçersiz token" },
          { status: 401 }
        );
      }
    } catch (error) {
      logError("withAuth middleware hatası:", error);
      
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
      // Geliştirme modunda yetkilendirmeyi bypass et
      if (IS_DEV_MODE) {
        logInfo(`🔧 Geliştirme modu: Rol kontrolü bypass ediliyor (İstenen roller: ${allowedRoles.join(', ')})`);
        
        // Geliştirme için sahte kullanıcı oluştur (ADMIN rolüyle)
        request.user = {
          id: 'dev-user',
          email: 'dev@example.com',
          ad: 'Geliştirme',
          soyad: 'Kullanıcısı',
          rol: 'ADMIN',
          departmanId: 'dev-dep-1'
        };
        
        logInfo('Dev kullanıcısı oluşturuldu (rol kontrolü):', request.user);
        return handler(request, params);
      }
      
      // Önce withAuth ile yetkilendirme yap
      const authMiddleware = withAuth(async (req) => {
        // Kullanıcının rolünü kontrol et
        const userRole = req.user.rol;
        
        if (!allowedRoles.includes(userRole)) {
          logError(`Erişim reddedildi: Kullanıcı rolü "${userRole}", istenen roller: ${allowedRoles.join(', ')}`);
          return NextResponse.json(
            { error: "Erişim reddedildi: Yetkiniz yok" },
            { status: 403 }
          );
        }
        
        logInfo(`Rol kontrolü başarılı: "${userRole}"`);
        
        // Orijinal handler'ı çağır
        return handler(req, params);
      });
      
      // Middleware'i çalıştır
      return authMiddleware(request, params);
    } catch (error) {
      logError("withRole middleware hatası:", error);
      
      return NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      );
    }
  };
} 
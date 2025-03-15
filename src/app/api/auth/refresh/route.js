import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(request) {
  console.log("Refresh token isteği alındı");
  
  try {
    // Cookie'den refresh token'ı al
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // Refresh token yoksa hata döndür
    if (!refreshToken) {
      console.log("Refresh token bulunamadı");
      return NextResponse.json(
        { error: "Refresh token bulunamadı" },
        { status: 401 }
      );
    }

    // Refresh token'ı doğrula - Önce refresh token secret ile, olmazsa JWT secret ile dene
    let userId;
    try {
      try {
        // Önce yeni REFRESH_TOKEN_SECRET ile dene
        if (process.env.REFRESH_TOKEN_SECRET) {
          const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
          userId = decoded.id;
          console.log("Refresh token doğrulandı (REFRESH_TOKEN_SECRET ile), kullanıcı ID:", userId);
        } else {
          throw new Error("REFRESH_TOKEN_SECRET tanımlanmamış");
        }
      } catch (firstError) {
        console.log("REFRESH_TOKEN_SECRET ile doğrulama başarısız, JWT_SECRET ile deneniyor:", firstError.message);
        
        // Alternatif olarak JWT_SECRET ile dene (eski token'lar için)
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        userId = decoded.id;
        console.log("Refresh token doğrulandı (JWT_SECRET ile), kullanıcı ID:", userId);
      }
    } catch (error) {
      console.error("Refresh token doğrulama hatası:", error);
      return NextResponse.json(
        { error: "Geçersiz refresh token" },
        { status: 401 }
      );
    }

    // Basitleştirilmiş kullanıcı - veritabanı sorgusu yapmadan
    console.log("Basitleştirilmiş refresh token kullanılıyor");
    
    // Test kullanıcısı bilgileri - gerçek ortamda kullanmayın
    const testUser = {
      id: userId || "test-admin-id",
      email: "admin@greenchem.com.tr",
      ad: "Admin",
      soyad: "Kullanıcı",
      rol: "ADMIN",
      departmanId: "test-departman-id",
      departman: {
        id: "test-departman-id",
        ad: "Yönetim"
      }
    };

    // Token oluştur
    const token = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
        ad: testUser.ad,
        soyad: testUser.soyad,
        rol: testUser.rol,
        departmanId: testUser.departmanId,
        departman: testUser.departman
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Yeni refresh token oluştur (7 gün geçerli)
    const newRefreshToken = jwt.sign(
      { id: testUser.id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Cookie'leri ayarla
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });
    
    // Yeni refresh token'ı ayarla
    cookieStore.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Kullanıcı bilgilerini döndür
    console.log("Test kullanıcısı için yeni token oluşturuldu");
    return NextResponse.json({
      success: true,
      user: {
        id: testUser.id,
        email: testUser.email,
        ad: testUser.ad,
        soyad: testUser.soyad,
        rol: testUser.rol,
        departmanId: testUser.departmanId,
        departman: testUser.departman
      }
    });
  } catch (error) {
    console.error("Refresh token işlemi sırasında hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
} 
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

    // Kullanıcıyı bul
    const user = await prisma.kullanici.findUnique({
      where: { id: userId },
      include: {
        departman: {
          select: {
            id: true,
            ad: true,
          },
        },
      },
    });

    if (!user) {
      console.log("Kullanıcı bulunamadı, ID:", userId);
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 401 }
      );
    }

    // Token oluştur
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        ad: user.ad,
        soyad: user.soyad,
        rol: user.rol,
        departmanId: user.departmanId,
        departman: user.departman
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Yeni refresh token oluştur (7 gün geçerli) - artık hep REFRESH_TOKEN_SECRET kullan
    const newRefreshToken = jwt.sign(
      { id: user.id },
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
    console.log("Yeni token oluşturuldu, başarılı yanıt gönderildi");
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ad: user.ad,
        soyad: user.soyad,
        rol: user.rol,
        departmanId: user.departmanId,
        departman: user.departman
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
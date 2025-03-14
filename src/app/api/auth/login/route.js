import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const jwtSecret = process.env.JWT_SECRET;

export async function POST(request) {
  console.log("Login isteği alındı");
  
  try {
    // Request body'den verileri al
    const body = await request.json();
    console.log("Login verileri:", JSON.stringify(body, null, 2));
    
    const { email, password } = body;

    // Email ve şifre kontrolü
    if (!email || !password) {
      console.log("Email veya şifre eksik");
      return NextResponse.json(
        { error: "Email ve şifre gereklidir" },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.kullanici.findUnique({
      where: { email },
      include: {
        departman: {
          select: {
            id: true,
            ad: true,
          },
        },
      },
    });

    // Kullanıcı bulunamadı veya şifre yanlış
    if (!user) {
      console.log("Kullanıcı bulunamadı:", email);
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    // Şifre doğrulama
    const isPasswordValid = await bcrypt.compare(password, user.sifre);
    
    if (!isPasswordValid) {
      console.log("Şifre doğrulaması başarısız:", email);
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    // Hesap kilitleme özelliği şemada olmadığı için devre dışı bırakıldı
    // Gerçek uygulamada bu kısımda hesap kilitleme mantığı olabilir
    // if (user.hesapKilitli) { ... }

    // Token oluştur (1 saat geçerli)
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

    // Refresh token oluştur (7 gün geçerli)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Cookie store'u al
    const cookieStore = await cookies();
    
    // Token'ları cookie'lere kaydet
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 saat
      path: "/",
    });

    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 gün
      path: "/",
    });

    // Başarılı yanıt
    console.log("Giriş başarılı:", email);
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
    console.error("Login işlemi sırasında hata:", error);
    return NextResponse.json(
      { error: "Giriş yapılırken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
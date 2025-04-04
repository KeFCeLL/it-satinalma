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

    // Kullanıcıyı veritabanında ara
    const user = await prisma.kullanici.findUnique({
      where: { email },
      include: {
        departman: true
      }
    });

    if (!user) {
      console.log("Kullanıcı bulunamadı:", email);
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    // Şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(password, user.sifre);
    if (!isValidPassword) {
      console.log("Geçersiz şifre");
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

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
    const cookieStore = cookies();
    
    // Token'ları cookie'lere kaydet
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Başarılı yanıt
    console.log("Kullanıcı için giriş başarılı:", email);
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
    console.error("Login hatası:", error);
    return NextResponse.json(
      { error: "Giriş sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
} 
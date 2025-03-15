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

    // Basitleştirilmiş login - veritabanı sorgusu yapmadan token oluştur
    console.log("Basitleştirilmiş login kullanılıyor");
    
    // Test kullanıcısı bilgileri - gerçek ortamda kullanmayın
    const testUser = {
      id: "test-admin-id",
      email: email,
      ad: "Admin",
      soyad: "Kullanıcı",
      rol: "ADMIN",
      departmanId: "test-departman-id",
      departman: {
        id: "test-departman-id",
        ad: "Yönetim"
      }
    };
    
    // Token oluştur (1 saat geçerli)
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

    // Refresh token oluştur (7 gün geçerli)
    const refreshToken = jwt.sign(
      { id: testUser.id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Cookie store'u al
    const cookieStore = await cookies();
    
    // Token'ları cookie'lere kaydet
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Başarılı yanıt
    console.log("Test kullanıcısı için giriş başarılı:", email);
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
    console.error("Login işlemi sırasında hata:", error);
    return NextResponse.json(
      { error: "Giriş yapılırken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
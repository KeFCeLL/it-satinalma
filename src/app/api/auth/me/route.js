import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request) {
  console.log("Kullanıcı bilgileri isteği alındı");
  
  try {
    // Cookie'den token al
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Token yoksa hata döndür
    if (!token) {
      console.log("Token bulunamadı");
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

    // Token'ı doğrula
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token doğrulandı, kullanıcı ID:", decoded.id);
    } catch (error) {
      console.error("Token doğrulama hatası:", error);
      
      // Token geçersiz veya süresi dolmuş
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş token" },
        { status: 401 }
      );
    }

    // Basitleştirilmiş kullanıcı bilgileri - veritabanı sorgusu yapmadan
    console.log("Basitleştirilmiş kullanıcı bilgileri elde ediliyor");
    
    // Token içindeki bilgilerden kullanıcı oluştur
    const testUser = {
      id: decoded.id,
      email: decoded.email,
      ad: decoded.ad,
      soyad: decoded.soyad,
      rol: decoded.rol,
      departmanId: decoded.departmanId,
      departman: decoded.departman || {
        id: "test-departman-id",
        ad: "Yönetim"
      },
      durum: "AKTIF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log("Test kullanıcısı bilgileri gönderildi");
    return NextResponse.json({
      success: true,
      user: testUser
    });
  } catch (error) {
    console.error("Kullanıcı bilgileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
} 
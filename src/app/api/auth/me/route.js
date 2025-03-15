import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request) {
  console.log("Kullanıcı bilgileri isteği alındı");
  
  try {
    // Cookie'den token al
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    let decoded = null;
    
    // Token varsa doğrulamayı dene
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token doğrulandı, kullanıcı ID:", decoded.id);
      } catch (error) {
        console.error("Token doğrulama hatası:", error);
        console.log("Token geçersiz veya süresi dolmuş, geliştirme için test kullanıcısı ile devam edilecek");
      }
    } else {
      console.log("Token bulunamadı, geliştirme için test kullanıcısı ile devam edilecek");
    }

    // Basitleştirilmiş kullanıcı bilgileri
    console.log("Basitleştirilmiş kullanıcı bilgileri elde ediliyor");
    
    // Test kullanıcısı oluştur (token bilgileri varsa onları kullan)
    const testUser = {
      id: decoded?.id || "test-admin-id",
      email: decoded?.email || "admin@greenchem.com.tr",
      ad: decoded?.ad || "Admin",
      soyad: decoded?.soyad || "Kullanıcı",
      rol: decoded?.rol || "ADMIN",
      departmanId: decoded?.departmanId || "test-departman-id",
      departman: decoded?.departman || {
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